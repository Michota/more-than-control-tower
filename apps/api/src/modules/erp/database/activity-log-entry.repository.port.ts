import { ActivityLogEntryEntity } from "../domain/activity-log-entry.entity.js";

export interface ActivityLogEntryRepositoryPort {
    save(entity: ActivityLogEntryEntity): Promise<void>;
    findByEmployeeAndDateRange(employeeId: string, from: Date, to: Date): Promise<ActivityLogEntryEntity[]>;
    deleteOlderThan(date: Date): Promise<number>;
}
