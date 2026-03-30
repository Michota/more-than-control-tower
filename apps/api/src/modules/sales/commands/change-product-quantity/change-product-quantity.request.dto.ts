import { IsNumber, IsOptional, IsUUID, Min } from "class-validator";

export class ChangeProductQuantityParams {
    @IsUUID()
    id!: string;

    @IsUUID()
    productId!: string;
}

export class ChangeProductQuantityBody {
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
