import { IsUUID } from "class-validator";

export class GenerateActivationTokenRequestDto {
    @IsUUID()
    userId!: string;
}
