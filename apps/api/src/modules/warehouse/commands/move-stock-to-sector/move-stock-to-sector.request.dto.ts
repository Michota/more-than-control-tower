import { IsOptional, IsString, IsUUID } from "class-validator";

export class MoveStockToSectorRequestDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    goodId!: string;

    /** @example "660e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    warehouseId!: string;

    /** @example "770e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    @IsOptional()
    sectorId?: string;

    /** @example "Moving to cold storage" */
    @IsString()
    @IsOptional()
    note?: string;
}
