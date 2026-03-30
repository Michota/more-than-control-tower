import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler, QueryBus } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import {
    GetEmployeePermissionsQuery,
    GetEmployeePermissionsResponse,
} from "../../../../shared/queries/get-employee-permissions.query.js";
import type { JourneyRepositoryPort } from "../../database/journey.repository.port.js";
import type { VehicleRepositoryPort } from "../../database/vehicle.repository.port.js";
import { CrewMemberRole } from "../../domain/crew-member-role.enum.js";
import { licenseToPermissionKey } from "../../domain/driver-license-permission.map.js";
import { CrewMemberMissingPermissionError, JourneyNotFoundError } from "../../domain/journey.errors.js";
import { VehicleNotFoundError } from "../../domain/vehicle.errors.js";
import { JOURNEY_REPOSITORY_PORT, VEHICLE_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { StartJourneyCommand } from "./start-journey.command.js";

const RSR_REQUIRED_PERMISSIONS = ["sales:complete-order", "sales:view-orders"];

@CommandHandler(StartJourneyCommand)
export class StartJourneyCommandHandler implements ICommandHandler<StartJourneyCommand> {
    constructor(
        @Inject(JOURNEY_REPOSITORY_PORT)
        private readonly journeyRepo: JourneyRepositoryPort,

        @Inject(VEHICLE_REPOSITORY_PORT)
        private readonly vehicleRepo: VehicleRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
        private readonly queryBus: QueryBus,
    ) {}

    async execute(cmd: StartJourneyCommand): Promise<void> {
        const journey = await this.journeyRepo.findOneById(cmd.journeyId);
        if (!journey) {
            throw new JourneyNotFoundError(cmd.journeyId);
        }

        // Resolve required driver license permission from the vehicle
        let requiredLicensePermission: string | undefined;
        if (journey.vehicleIds.length > 0) {
            const vehicle = await this.vehicleRepo.findOneById(journey.vehicleIds[0]);
            if (!vehicle) {
                throw new VehicleNotFoundError(journey.vehicleIds[0]);
            }
            requiredLicensePermission = licenseToPermissionKey(vehicle.requiredLicenseCategory);
        }

        // Validate crew permissions before starting
        for (const member of journey.crewMembers) {
            const { effectivePermissions } = await this.queryBus.execute<
                GetEmployeePermissionsQuery,
                GetEmployeePermissionsResponse
            >(new GetEmployeePermissionsQuery(member.employeeId));

            if (member.role === CrewMemberRole.DRIVER && requiredLicensePermission) {
                if (!effectivePermissions.includes(requiredLicensePermission)) {
                    throw new CrewMemberMissingPermissionError(
                        member.employeeId,
                        CrewMemberRole.DRIVER,
                        requiredLicensePermission,
                    );
                }
            }

            if (member.role === CrewMemberRole.RSR) {
                for (const perm of RSR_REQUIRED_PERMISSIONS) {
                    if (!effectivePermissions.includes(perm)) {
                        throw new CrewMemberMissingPermissionError(member.employeeId, CrewMemberRole.RSR, perm);
                    }
                }
            }
        }

        // Domain validates crew completeness (at least one DRIVER + one RSR)
        journey.start();

        await this.journeyRepo.save(journey);
        await this.uow.commit();

        for (const event of journey.domainEvents) {
            await this.eventBus.publish(event);
        }
        journey.clearEvents();
    }
}
