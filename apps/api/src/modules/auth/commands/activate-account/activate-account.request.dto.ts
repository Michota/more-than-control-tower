import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class ActivateAccountRequestDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2048)
    activationToken!: string;

    @IsString()
    @MinLength(10)
    @MaxLength(128)
    password!: string;
}
