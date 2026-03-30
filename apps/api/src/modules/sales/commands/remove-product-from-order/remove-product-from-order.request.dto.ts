import { IsUUID } from "class-validator";

export class RemoveProductFromOrderParams {
    @IsUUID()
    id!: string;

    @IsUUID()
    productId!: string;
}
