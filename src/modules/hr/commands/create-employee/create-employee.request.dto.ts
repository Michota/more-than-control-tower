import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";

export class CreateEmployeeRequest {
    @IsString()
    firstName!: string;

    @IsString()
    lastName!: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsBoolean()
    skipUniquenessCheck?: boolean;
}
