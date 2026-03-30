import { IsNumberString, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class ChargeWalletRequest {
    @IsUUID()
    employeeId!: string;

    @IsNumberString()
    amount!: string;

    @IsString()
    @MinLength(1)
    @MaxLength(500)
    reason!: string;
}
