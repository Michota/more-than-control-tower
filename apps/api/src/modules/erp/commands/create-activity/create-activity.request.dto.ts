import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateActivityRequest {
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;
}
