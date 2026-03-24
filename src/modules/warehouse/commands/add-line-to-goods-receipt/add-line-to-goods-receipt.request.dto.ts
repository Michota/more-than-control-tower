import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";

export class AddLineToGoodsReceiptRequestDto {
    @IsUUID()
    goodId!: string;

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
