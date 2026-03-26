export class ListEmployeesQuery {
    constructor(
        public readonly page: number = 1,
        public readonly limit: number = 20,
        public readonly positionKey?: string,
        public readonly status?: string,
    ) {}
}
