import { IsUUID } from "class-validator";

export class CancelOrderParams {
    @IsUUID()
    id!: string;
}
