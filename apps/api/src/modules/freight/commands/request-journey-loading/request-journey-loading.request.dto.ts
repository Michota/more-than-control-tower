import { IsDateString, IsNotEmpty, IsUUID } from "class-validator";

export class RequestJourneyLoadingRequestDto {
    /** @example "2026-04-01T08:00:00.000Z" */
    @IsDateString()
    @IsNotEmpty()
    loadingDeadline!: string;

    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    @IsNotEmpty()
    fromWarehouseId!: string;
}
