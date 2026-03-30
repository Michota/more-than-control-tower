import { Inject, Injectable } from "@nestjs/common";
import { ActivityLogEntryEntity } from "../domain/activity-log-entry.entity.js";
import type { ActivityLogEntryRepositoryPort } from "../database/activity-log-entry.repository.port.js";
import { ACTIVITY_LOG_ENTRY_REPOSITORY_PORT } from "../erp.di-tokens.js";
import { UNIT_OF_WORK_PORT } from "../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../shared/ports/unit-of-work.port.js";

@Injectable()
export class ActivityLogService {
    constructor(
        @Inject(ACTIVITY_LOG_ENTRY_REPOSITORY_PORT)
        private readonly activityLogRepo: ActivityLogEntryRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async log(employeeId: string, action: string, details?: string): Promise<void> {
        const entry = ActivityLogEntryEntity.create({
            employeeId,
            action,
            details,
            occurredAt: new Date(),
        });

        await this.activityLogRepo.save(entry);
        await this.uow.commit();
    }
}
