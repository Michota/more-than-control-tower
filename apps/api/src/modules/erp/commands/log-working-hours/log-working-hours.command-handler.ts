import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler, QueryBus } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import {
    GetEmployeePermissionsQuery,
    GetEmployeePermissionsResponse,
} from "../../../../shared/queries/get-employee-permissions.query.js";
import { GetEmployeeQuery, GetEmployeeResponse } from "../../../../shared/queries/get-employee.query.js";
import { WorkingHoursEntryAggregate } from "../../domain/working-hours-entry.aggregate.js";
import { WorkingHoursNotOwnedError } from "../../domain/working-hours-entry.errors.js";
import { ActivityNotFoundError } from "../../domain/activity.errors.js";
import type { ActivityRepositoryPort } from "../../database/activity.repository.port.js";
import type { WorkingHoursEntryRepositoryPort } from "../../database/working-hours-entry.repository.port.js";
import { ACTIVITY_REPOSITORY_PORT, WORKING_HOURS_ENTRY_REPOSITORY_PORT } from "../../erp.di-tokens.js";
import { ErpPermission } from "../../../../libs/permissions/index.js";
import { LogWorkingHoursCommand } from "./log-working-hours.command.js";

@CommandHandler(LogWorkingHoursCommand)
export class LogWorkingHoursCommandHandler implements ICommandHandler<LogWorkingHoursCommand> {
    constructor(
        @Inject(WORKING_HOURS_ENTRY_REPOSITORY_PORT)
        private readonly workingHoursRepo: WorkingHoursEntryRepositoryPort,

        @Inject(ACTIVITY_REPOSITORY_PORT)
        private readonly activityRepo: ActivityRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
        private readonly queryBus: QueryBus,
    ) {}

    async execute(cmd: LogWorkingHoursCommand): Promise<string> {
        const isOwner = await this.isOwner(cmd.actorId, cmd.employeeId);

        if (!isOwner) {
            const canManage = await this.hasManagePermission(cmd.actorId);
            if (!canManage) {
                throw new WorkingHoursNotOwnedError(cmd.employeeId);
            }
        }

        if (cmd.activityId) {
            const activity = await this.activityRepo.findOneById(cmd.activityId);
            if (!activity) {
                throw new ActivityNotFoundError(cmd.activityId);
            }
        }

        const entry = WorkingHoursEntryAggregate.log({
            employeeId: cmd.employeeId,
            date: cmd.date,
            hours: cmd.hours,
            note: cmd.note,
            activityId: cmd.activityId,
        });

        await this.workingHoursRepo.save(entry);
        await this.uow.commit();

        this.eventBus.publishAll(entry.domainEvents);
        entry.clearEvents();

        return entry.id as string;
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
