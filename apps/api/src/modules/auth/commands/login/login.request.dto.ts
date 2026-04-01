import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class LoginRequestDto {
    @IsEmail()
    @MaxLength(255)
    email!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(128)
    password!: string;
}
