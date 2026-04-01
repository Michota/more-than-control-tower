import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler, QueryBus } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import {
    GetEmployeePermissionsQuery,
    GetEmployeePermissionsResponse,
} from "../../../../shared/queries/get-employee-permissions.query.js";
import { GetEmployeeQuery, GetEmployeeResponse } from "../../../../shared/queries/get-employee.query.js";
import { WorkingHoursEntryNotFoundError, WorkingHoursNotOwnedError } from "../../domain/working-hours-entry.errors.js";
import type { WorkingHoursEntryRepositoryPort } from "../../database/working-hours-entry.repository.port.js";
import { WORKING_HOURS_ENTRY_REPOSITORY_PORT } from "../../erp.di-tokens.js";
import { ErpPermission } from "../../../../libs/permissions/index.js";
import { DeleteWorkingHoursCommand } from "./delete-working-hours.command.js";

@CommandHandler(DeleteWorkingHoursCommand)
export class DeleteWorkingHoursCommandHandler implements ICommandHandler<DeleteWorkingHoursCommand> {
    constructor(
        @Inject(WORKING_HOURS_ENTRY_REPOSITORY_PORT)
        private readonly workingHoursRepo: WorkingHoursEntryRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly queryBus: QueryBus,
    ) {}

    async execute(cmd: DeleteWorkingHoursCommand): Promise<void> {
        const entry = await this.workingHoursRepo.findOneById(cmd.entryId);

        if (!entry) {
            throw new WorkingHoursEntryNotFoundError(cmd.entryId);
        }

        const canManage = await this.hasManagePermission(cmd.actorId);
        const isOwner = await this.isOwner(cmd.actorId, entry.properties.employeeId);

        if (!isOwner && !canManage) {
            throw new WorkingHoursNotOwnedError(entry.properties.employeeId);
        }

        if (!canManage) {
            entry.ensureDeletable();
        }

        await this.workingHoursRepo.delete(entry);
        await this.uow.commit();
    }

    private async isOwner(actorUserId: string, employeeId: string): Promise<boolean> {
        const employee = await this.queryBus.execute<GetEmployeeQuery, GetEmployeeResponse | null>(
            new GetEmployeeQuery(employeeId),
        );
        return employee?.userId === actorUserId;
    }

    private async hasManagePermission(userId: string): Promise<boolean> {
        const permissions = await this.queryBus.execute<
            GetEmployeePermissionsQuery,
            GetEmployeePermissionsResponse | null
        >(new GetEmployeePermissionsQuery(userId));
        return permissions?.effectivePermissions.includes(ErpPermission.MANAGE_WORKING_HOURS) ?? false;
    }
}
