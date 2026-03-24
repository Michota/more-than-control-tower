import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";

export class TransferStockRequestDto {
    @IsUUID()
    goodId!: string;

    @IsUUID()
    fromWarehouseId!: string;

    @IsUUID()
    toWarehouseId!: string;

    @IsInt()
    @IsPositive()
    quantity!: number;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    locationDescription?: string;

    @IsString()
    @IsOptional()
    note?: string;
}
