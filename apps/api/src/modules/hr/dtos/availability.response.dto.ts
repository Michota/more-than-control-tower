import { ApiProperty } from "@nestjs/swagger";

export class AvailabilityEntryResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    id!: string;
    /** @example "660e8400-e29b-41d4-a716-446655440000" */
    employeeId!: string;
    /** @example "2026-04-01" */
    date!: string;
    /** @example "08:00" */
    startTime!: string;
    /** @example "16:00" */
    endTime!: string;
    /** @example "CONFIRMED" */
    status!: string;
    /** @example false */
    locked!: boolean;
}

export class GetEmployeeAvailabilityResponseDto {
    @ApiProperty({ type: [AvailabilityEntryResponseDto] })
    entries!: AvailabilityEntryResponseDto[];
}
