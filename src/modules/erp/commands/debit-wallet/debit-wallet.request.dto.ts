import { IsEnum, IsNumberString, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { WalletTransactionMethod } from "../../domain/wallet-transaction-method.enum.js";

export class DebitWalletRequest {
    @IsUUID()
    employeeId!: string;

    @IsNumberString()
    amount!: string;

    @IsEnum(WalletTransactionMethod)
    method!: WalletTransactionMethod;

    @IsString()
    @MinLength(1)
    @MaxLength(500)
    reason!: string;
}
