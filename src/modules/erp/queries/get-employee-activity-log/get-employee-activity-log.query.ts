import { Query } from "@nestjs/cqrs";

export interface ActivityLogItem {
    id: string;
    employeeId: string;
    action: string;
    details?: string;
    occurredAt: string;
}

export type GetEmployeeActivityLogResponse = ActivityLogItem[];

export class GetEmployeeActivityLogQuery extends Query<GetEmployeeActivityLogResponse> {
    constructor(
        public readonly employeeId: string,
        public readonly dateFrom: string,
        public readonly dateTo: string,
    ) {
        super();
    }
}
