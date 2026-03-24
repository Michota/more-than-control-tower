import { IsOptional, IsString, IsUUID } from "class-validator";

export class OpenGoodsReceiptRequestDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    targetWarehouseId!: string;

    /** @example "Truck delivery from supplier XYZ" */
    @IsString()
    @IsOptional()
    note?: string;
}
