import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ActivateAccountRequestDto {
    @IsString()
    @IsNotEmpty()
    activationToken!: string;

    @IsString()
    @MinLength(10)
    password!: string;
}
