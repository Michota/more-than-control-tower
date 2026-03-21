import { Type } from "class-transformer";
import { IsArray, IsOptional, IsNumber, IsString, IsUUID, Min, ValidateNested } from "class-validator";

export class OrderLineRequestDto {
    @IsUUID()
    itemId!: string;

    @IsNumber()
    @Min(1)
    quantity!: number;

    @IsOptional()
    @IsUUID()
    priceId?: string;
}

export class DraftOrderRequest {
    @IsUUID()
    customerId!: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderLineRequestDto)
    lines!: OrderLineRequestDto[];

    @IsString()
    currency!: string;

    @IsOptional()
    @IsUUID()
    buyerPriceTypeId?: string;
}
