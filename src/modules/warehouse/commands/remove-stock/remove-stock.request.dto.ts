import { IsEnum, IsInt, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";
import { StockRemovalReason } from "../../domain/stock-removal-reason.enum.js";

export class RemoveStockRequestDto {
    @IsUUID()
    goodId!: string;

    @IsUUID()
    warehouseId!: string;

    @IsInt()
    @IsPositive()
    quantity!: number;

    @IsEnum(StockRemovalReason)
    reason!: StockRemovalReason;

    @IsString()
    @IsOptional()
    note?: string;
}
