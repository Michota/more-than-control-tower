export class EligibleDriverResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    employeeId!: string;
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    userId?: string;
    /** @example "Jan" */
    firstName!: string;
    /** @example "Kowalski" */
    lastName!: string;
}
