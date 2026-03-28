import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { WorkingHoursEntryAggregate } from "../domain/working-hours-entry.aggregate.js";

export interface FindByEmployeeAndDateRangeParams {
    employeeId: string;
    dateFrom: string;
    dateTo: string;
}

export interface WorkingHoursEntryRepositoryPort extends RepositoryPort<WorkingHoursEntryAggregate> {
    findByEmployeeAndDateRange(params: FindByEmployeeAndDateRangeParams): Promise<WorkingHoursEntryAggregate[]>;
    findOpenByEmployeeAndDateRange(params: FindByEmployeeAndDateRangeParams): Promise<WorkingHoursEntryAggregate[]>;
}
