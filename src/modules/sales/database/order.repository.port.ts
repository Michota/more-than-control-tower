import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { OrderAggregate } from "../domain/order.aggregate.js";

export interface OrderRepositoryPort extends RepositoryPort<OrderAggregate> {
    isStockEntryAssigned(stockEntryId: string): Promise<boolean>;
}
