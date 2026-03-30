import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryBus, QueryHandler } from "@nestjs/cqrs";
import { GetEmployeeQuery, GetEmployeeResponse } from "../../../../shared/queries/get-employee.query.js";
import {
    GetEmployeePermissionsQuery,
    GetEmployeePermissionsResponse,
} from "../../../../shared/queries/get-employee-permissions.query.js";
import {
    CheckEmployeeAvailabilityQuery,
    CheckEmployeeAvailabilityResponse,
} from "../../../../shared/queries/check-employee-availability.query.js";
import type { JourneyRepositoryPort } from "../../database/journey.repository.port.js";
import type { VehicleRepositoryPort } from "../../database/vehicle.repository.port.js";
import { CrewMemberRole } from "../../domain/crew-member-role.enum.js";
import { licenseToPermissionKey } from "../../domain/driver-license-permission.map.js";
import { JourneyNotFoundError } from "../../domain/journey.errors.js";
import { JOURNEY_REPOSITORY_PORT, VEHICLE_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { VehicleStatus } from "../../domain/vehicle-status.enum.js";
import {
    CheckJourneyReadinessQuery,
    CheckJourneyReadinessResponse,
    ReadinessCheckItem,
} from "./check-journey-readiness.query.js";

const RSR_REQUIRED_PERMISSIONS = ["sales:complete-order", "sales:view-orders"];

@QueryHandler(CheckJourneyReadinessQuery)
export class CheckJourneyReadinessQueryHandler implements IQueryHandler<
    CheckJourneyReadinessQuery,
    CheckJourneyReadinessResponse
> {
    constructor(
        @Inject(JOURNEY_REPOSITORY_PORT)
        private readonly journeyRepo: JourneyRepositoryPort,

        @Inject(VEHICLE_REPOSITORY_PORT)
        private readonly vehicleRepo: VehicleRepositoryPort,

        private readonly queryBus: QueryBus,
    ) {}

    async execute(query: CheckJourneyReadinessQuery): Promise<CheckJourneyReadinessResponse> {
        const journey = await this.journeyRepo.findOneById(query.journeyId);
        if (!journey) {
            throw new JourneyNotFoundError(query.journeyId);
        }

        const checks: ReadinessCheckItem[] = [];

        // ─── Crew completeness ──────────────────────────────
        const hasDriver = journey.crewMembers.some((m) => m.role === CrewMemberRole.DRIVER);
        checks.push({
            check: "crew:has-driver",
            passed: hasDriver,
            reason: hasDriver ? undefined : "No crew member with DRIVER role assigned",
        });

        const hasRsr = journey.crewMembers.some((m) => m.role === CrewMemberRole.RSR);
        checks.push({
            check: "crew:has-rsr",
            passed: hasRsr,
            reason: hasRsr ? undefined : "No crew member with RSR role assigned",
        });

        // ─── Vehicle assigned and active ────────────────────
        const vehicleId = journey.vehicleIds[0];
        const vehicle = vehicleId ? await this.vehicleRepo.findOneById(vehicleId) : null;

        checks.push({
            check: "vehicle:assigned",
            passed: !!vehicle,
            reason: vehicle ? undefined : "No vehicle assigned to this journey",
        });

        if (vehicle) {
            checks.push({
                check: "vehicle:active",
                passed: vehicle.status === VehicleStatus.ACTIVE,
                reason: vehicle.status === VehicleStatus.ACTIVE ? undefined : `Vehicle is ${vehicle.status}`,
            });
        }

        // ─── Crew permissions ───────────────────────────────
        const requiredLicensePermission = vehicle ? licenseToPermissionKey(vehicle.requiredLicenseCategory) : undefined;

        for (const member of journey.crewMembers) {
            let effectivePermissions: string[] = [];
            try {
                const employee = await this.queryBus.execute<GetEmployeeQuery, GetEmployeeResponse | null>(
                    new GetEmployeeQuery(member.employeeId),
                );
                if (employee?.userId) {
                    const result = await this.queryBus.execute<
                        GetEmployeePermissionsQuery,
                        GetEmployeePermissionsResponse
                    >(new GetEmployeePermissionsQuery(employee.userId));
                    effectivePermissions = result.effectivePermissions;
                } else {
                    checks.push({
                        check: `crew:${member.employeeId}:linked`,
                        passed: false,
                        reason: "Employee not found or not linked to a user account",
                    });
                    continue;
                }
            } catch {
                checks.push({
                    check: `crew:${member.employeeId}:permissions`,
                    passed: false,
                    reason: "Could not resolve employee permissions",
                });
                continue;
            }

            if (member.role === CrewMemberRole.DRIVER && requiredLicensePermission) {
                const has = effectivePermissions.includes(requiredLicensePermission);
                checks.push({
                    check: `crew:${member.employeeId}:driver-license`,
                    passed: has,
                    reason: has ? undefined : `Missing permission: ${requiredLicensePermission}`,
                });
            }

            if (member.role === CrewMemberRole.RSR) {
                for (const perm of RSR_REQUIRED_PERMISSIONS) {
                    const has = effectivePermissions.includes(perm);
                    checks.push({
                        check: `crew:${member.employeeId}:${perm}`,
                        passed: has,
                        reason: has ? undefined : `Missing permission: ${perm}`,
                    });
                }
            }

            // ─── Crew availability ──────────────────────────
            try {
                const availability = await this.queryBus.execute<
                    CheckEmployeeAvailabilityQuery,
                    CheckEmployeeAvailabilityResponse
                >(new CheckEmployeeAvailabilityQuery(member.employeeId, journey.scheduledDate));
                checks.push({
                    check: `crew:${member.employeeId}:available`,
                    passed: availability.available,
                    reason: availability.available ? undefined : (availability.reason ?? "Not available on this date"),
                });
            } catch {
                // HR availability handler may not be registered
            }
        }

        return {
            journeyId: query.journeyId,
            ready: checks.every((c) => c.passed),
            checks,
        };
    }
}
