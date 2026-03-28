import { Paginated, RepositoryPort } from "../../../libs/ports/repository.port.js";
import { OrderAggregate } from "../domain/order.aggregate.js";

export interface FindFilteredParams {
    page: number;
    limit: number;
    customerId?: string;
    status?: string;
    search?: string;
}

export interface OrderRepositoryPort extends RepositoryPort<OrderAggregate> {
    isStockEntryAssigned(stockEntryId: string): Promise<boolean>;
    findByCustomerId(customerId: string): Promise<OrderAggregate[]>;
    findFilteredPaginated(params: FindFilteredParams): Promise<Paginated<OrderAggregate>>;
}
