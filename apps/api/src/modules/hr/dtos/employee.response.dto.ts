import { ApiProperty } from "@nestjs/swagger";

export class PositionAssignmentResponseDto {
    /** @example "dispatcher" */
    positionKey!: string;
    /** @example "2026-03-15T10:00:00.000Z" */
    assignedAt!: string;
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    assignedBy!: string;
}

export class EmployeeResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    id!: string;
    /** @example "660e8400-e29b-41d4-a716-446655440000" */
    userId?: string;
    /** @example "Jan" */
    firstName!: string;
    /** @example "Kowalski" */
    lastName!: string;
    /** @example "jan.kowalski@example.com" */
    email?: string;
    /** @example "+48123456789" */
    phone?: string;
    /** @example "ACTIVE" */
    status!: string;

    @ApiProperty({ type: [PositionAssignmentResponseDto] })
    positionAssignments!: PositionAssignmentResponseDto[];
}

export class EmployeeIdResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    employeeId!: string;
}

export class PaginatedEmployeesResponseDto {
    @ApiProperty({ type: [EmployeeResponseDto] })
    data!: readonly EmployeeResponseDto[];
    /** @example 42 */
    count!: number;
    /** @example 1 */
    page!: number;
    /** @example 20 */
    limit!: number;
}
