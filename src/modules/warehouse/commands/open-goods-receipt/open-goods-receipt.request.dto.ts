import { IsOptional, IsString, IsUUID } from "class-validator";

export class OpenGoodsReceiptRequestDto {
    @IsUUID()
    targetWarehouseId!: string;

    @IsString()
    @IsOptional()
    note?: string;
}
