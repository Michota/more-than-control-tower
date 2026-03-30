import { Query } from "@nestjs/cqrs";

export interface WorkingHoursEntryItem {
    id: string;
    employeeId: string;
    date: string;
    hours: number;
    note?: string;
    activityId?: string;
    status: string;
    lockedBy?: string;
}

export type GetEmployeeWorkingHoursResponse = WorkingHoursEntryItem[];

export class GetEmployeeWorkingHoursQuery extends Query<GetEmployeeWorkingHoursResponse> {
    constructor(
        public readonly employeeId: string,
        public readonly dateFrom: string,
        public readonly dateTo: string,
        public readonly actorId: string,
    ) {
        super();
    }
}
