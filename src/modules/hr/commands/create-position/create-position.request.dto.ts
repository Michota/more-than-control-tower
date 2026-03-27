import { IsArray, IsString } from "class-validator";

export class CreatePositionRequest {
    @IsString()
    key!: string;

    @IsString()
    displayName!: string;

    @IsArray()
    @IsString({ each: true })
    permissionKeys!: string[];
}
