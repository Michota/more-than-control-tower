import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { GoodsReceiptAggregate } from "../domain/goods-receipt.aggregate.js";

export interface GoodsReceiptRepositoryPort extends RepositoryPort<GoodsReceiptAggregate> {}
