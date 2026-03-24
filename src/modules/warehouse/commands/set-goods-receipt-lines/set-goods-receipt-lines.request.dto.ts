import { Type } from "class-transformer";
import {
    ArrayMinSize,
    IsArray,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsPositive,
    IsString,
    IsUUID,
    ValidateNested,
} from "class-validator";

export class GoodsReceiptLineDto {
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

export class SetGoodsReceiptLinesRequestDto {
    @IsArray()
    @ArrayMinSize(0)
    @ValidateNested({ each: true })
    @Type(() => GoodsReceiptLineDto)
    lines!: GoodsReceiptLineDto[];
}
