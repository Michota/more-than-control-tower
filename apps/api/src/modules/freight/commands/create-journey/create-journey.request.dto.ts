import { IsDateString, IsNotEmpty, IsUUID } from "class-validator";

export class CreateJourneyRequestDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    @IsNotEmpty()
    routeId!: string;

    /** @example "2026-04-01" */
    @IsDateString()
    @IsNotEmpty()
    scheduledDate!: string;
}
