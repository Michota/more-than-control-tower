import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class TransferGoodRequestDto {
    @IsUUID()
    toWarehouseId!: string;

    @IsString()
    @IsNotEmpty()
    locationDescription!: string;

    @IsString()
    @IsOptional()
    note?: string;
}
