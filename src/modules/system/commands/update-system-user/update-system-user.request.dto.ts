import { IsEmail, IsOptional, IsString } from "class-validator";

export class UpdateSystemUserRequest {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;
}
