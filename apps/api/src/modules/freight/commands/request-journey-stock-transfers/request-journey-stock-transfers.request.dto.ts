import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from "class-validator";

export class JourneyStockTransferItemDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    goodId!: string;

    /** @example 10 */
    @IsNumber()
    @Min(1)
    quantity!: number;

    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    fromWarehouseId!: string;

    /** @example "Extra stock for promotions" */
    @IsString()
    @IsOptional()
    note?: string;
}

export class RequestJourneyStockTransfersRequestDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => JourneyStockTransferItemDto)
    @IsNotEmpty()
    items!: JourneyStockTransferItemDto[];
}
