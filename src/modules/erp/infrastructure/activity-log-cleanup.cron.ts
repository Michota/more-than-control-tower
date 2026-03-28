import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import type { ActivityLogEntryRepositoryPort } from "../database/activity-log-entry.repository.port.js";
import { ACTIVITY_LOG_ENTRY_REPOSITORY_PORT } from "../erp.di-tokens.js";

const RETENTION_DAYS = 7;

@Injectable()
export class ActivityLogCleanupCron {
    private readonly logger = new Logger(ActivityLogCleanupCron.name);

    constructor(
        @Inject(ACTIVITY_LOG_ENTRY_REPOSITORY_PORT)
        private readonly activityLogRepo: ActivityLogEntryRepositoryPort,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async cleanup(): Promise<void> {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

        const deleted = await this.activityLogRepo.deleteOlderThan(cutoff);
        this.logger.log(`Activity log cleanup: deleted ${deleted} entries older than ${cutoff.toISOString()}`);
    }
}
