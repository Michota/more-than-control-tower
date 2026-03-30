import { IsDateString, IsOptional, IsUUID } from "class-validator";

export class GetWalletTransactionsParams {
    @IsUUID()
    employeeId!: string;
}

export class GetWalletTransactionsQueryDto {
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @IsOptional()
    @IsDateString()
    dateTo?: string;
}
