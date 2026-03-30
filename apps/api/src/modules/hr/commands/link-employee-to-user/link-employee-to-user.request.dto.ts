import { IsString } from "class-validator";

export class LinkEmployeeToUserRequest {
    @IsString()
    userId!: string;
}
