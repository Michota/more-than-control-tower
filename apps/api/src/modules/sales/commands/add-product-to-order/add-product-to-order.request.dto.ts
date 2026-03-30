import { IsNumber, IsOptional, IsUUID, Min } from "class-validator";

export class AddProductToOrderParams {
    @IsUUID()
    id!: string;
}

export class AddProductToOrderBody {
    @IsUUID()
    itemId!: string;

    @IsNumber()
    @Min(1)
    quantity!: number;

    @IsOptional()
    @IsUUID()
    priceId?: string;

    @IsOptional()
    @IsUUID()
    buyerPriceTypeId?: string;
}
