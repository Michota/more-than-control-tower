import { IsUUID } from "class-validator";

export class PlaceOrderParams {
    @IsUUID()
    id!: string;
}
