import { Type } from "class-transformer";
import {
    ArrayMinSize,
    IsArray,
    IsInt,
    IsOptional,
    IsPositive,
    IsString,
    IsUUID,
    ValidateNested,
} from "class-validator";

export class GoodsReceiptLineDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    goodId!: string;

    /** @example 50 */
    @IsInt()
    @IsPositive()
    quantity!: number;

    /** @example "880e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    @IsOptional()
    sectorId?: string;

    /** @example "2 bottles had minor dents" */
    @IsString()
    @IsOptional()
    note?: string;
}

export class SetGoodsReceiptLinesRequestDto {
    @IsArray()
    @ArrayMinSize(0)
    @ValidateNested({ each: true })
    @Type(() => GoodsReceiptLineDto)
    lines!: GoodsReceiptLineDto[];
}
