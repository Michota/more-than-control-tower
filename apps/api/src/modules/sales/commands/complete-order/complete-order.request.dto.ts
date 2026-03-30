import { IsUUID } from "class-validator";

export class CompleteOrderParams {
    @IsUUID()
    id!: string;
}
