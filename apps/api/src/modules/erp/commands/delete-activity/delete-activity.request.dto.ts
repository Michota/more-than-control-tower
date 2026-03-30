import { IsUUID } from "class-validator";

export class DeleteActivityParams {
    @IsUUID()
    id!: string;
}
