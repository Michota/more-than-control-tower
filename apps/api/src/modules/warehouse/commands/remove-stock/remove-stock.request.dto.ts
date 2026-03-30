import { IsEnum, IsInt, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";
import { StockRemovalReason } from "../../domain/stock-removal-reason.enum.js";

export class RemoveStockRequestDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    goodId!: string;

    /** @example "660e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    warehouseId!: string;

    /** @example 30 */
    @IsInt()
    @IsPositive()
    quantity!: number;

    /** @example "SALE" */
    @IsEnum(StockRemovalReason)
    reason!: StockRemovalReason;

    /** @example "Delivered to client ABC" */
    @IsString()
    @IsOptional()
    note?: string;
}
