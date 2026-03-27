import { IsString } from "class-validator";

export class AssignPositionRequest {
    @IsString()
    positionKey!: string;

    @IsString()
    assignedBy!: string;
}
