import { IsArray, IsEmail, IsEnum, IsString } from "class-validator";
import { SystemUserRole } from "../../domain/system-user-role.enum.js";

export class CreateSystemUserRequest {
    @IsEmail()
    email!: string;

    @IsString()
    firstName!: string;

    @IsString()
    lastName!: string;

    @IsArray()
    @IsEnum(SystemUserRole, { each: true })
    roles!: SystemUserRole[];
}
