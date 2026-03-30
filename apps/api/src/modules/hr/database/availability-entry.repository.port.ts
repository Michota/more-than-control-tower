import { AvailabilityEntryAggregate } from "../domain/availability-entry.aggregate.js";

export interface AvailabilityEntryRepositoryPort {
    save(entity: AvailabilityEntryAggregate | AvailabilityEntryAggregate[]): Promise<void>;
    findOneById(id: string): Promise<AvailabilityEntryAggregate | null>;
    findByEmployeeId(employeeId: string): Promise<AvailabilityEntryAggregate[]>;
    findByEmployeeIdAndDates(employeeId: string, dates: string[]): Promise<AvailabilityEntryAggregate[]>;
    findByEmployeeIdAndDateRange(
        employeeId: string,
        fromDate: string,
        toDate: string,
    ): Promise<AvailabilityEntryAggregate[]>;
    deleteByEmployeeIdAndDates(employeeId: string, dates: string[]): Promise<void>;
    delete(entity: AvailabilityEntryAggregate): Promise<boolean>;
}
