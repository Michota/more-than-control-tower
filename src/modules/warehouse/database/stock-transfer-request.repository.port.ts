import { Paginated, RepositoryPort } from "../../../libs/ports/repository.port.js";
import { StockTransferRequestStatus } from "../domain/stock-transfer-request-status.enum.js";
import { StockTransferRequestAggregate } from "../domain/stock-transfer-request.aggregate.js";

export interface FindTransferRequestsParams {
    status?: StockTransferRequestStatus;
    fromWarehouseId?: string;
    toWarehouseId?: string;
    page: number;
    limit: number;
}

export interface StockTransferRequestRepositoryPort extends RepositoryPort<StockTransferRequestAggregate> {
    findFiltered(params: FindTransferRequestsParams): Promise<Paginated<StockTransferRequestAggregate>>;
}
