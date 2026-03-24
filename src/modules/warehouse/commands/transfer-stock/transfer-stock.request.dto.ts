import { IsInt, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";

export class TransferStockRequestDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    goodId!: string;

    /** @example "660e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    fromWarehouseId!: string;

    /** @example "770e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    toWarehouseId!: string;

    /** @example 40 */
    @IsInt()
    @IsPositive()
    quantity!: number;

    /** @example "880e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    @IsOptional()
    sectorId?: string;

    /** @example "Planned restock for Monday delivery" */
    @IsString()
    @IsOptional()
    note?: string;
}
