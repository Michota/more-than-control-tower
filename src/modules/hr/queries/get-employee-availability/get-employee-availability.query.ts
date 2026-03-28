export class GetEmployeeAvailabilityQuery {
    constructor(
        public readonly employeeId: string,
        public readonly fromDate?: string,
        public readonly toDate?: string,
    ) {}
}
