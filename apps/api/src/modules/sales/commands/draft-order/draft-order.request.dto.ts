import { Type } from "class-transformer";
import { IsArray, IsEnum, IsOptional, IsNumber, IsString, IsUUID, Min, ValidateNested } from "class-validator";
import { OrderSource } from "../../domain/order-source.enum.js";

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

    @IsUUID()
    actorId!: string;

    @IsEnum(OrderSource)
    source!: OrderSource;

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
