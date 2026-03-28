import { IsEnum, IsOptional, IsUUID } from "class-validator";
import { Type } from "class-transformer";
import { StockTransferRequestStatus } from "../../domain/stock-transfer-request-status.enum.js";

export class ListStockTransferRequestsRequestDto {
    @IsEnum(StockTransferRequestStatus)
    @IsOptional()
    status?: StockTransferRequestStatus;

    @IsUUID()
    @IsOptional()
    fromWarehouseId?: string;

    @IsUUID()
    @IsOptional()
    toWarehouseId?: string;

    @Type(() => Number)
    @IsOptional()
    page?: number;

    @Type(() => Number)
    @IsOptional()
    limit?: number;
}
