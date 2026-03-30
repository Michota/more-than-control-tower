import { IsUUID } from "class-validator";

export class DeleteWorkingHoursParams {
    @IsUUID()
    id!: string;
}
