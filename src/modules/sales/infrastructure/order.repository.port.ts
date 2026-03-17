import { RepositoryPort } from "@src/libs/ports/repository.port.js";
import { OrderAggregate } from "../domain/order.aggregate.js";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface OrderRepositoryPort extends RepositoryPort<OrderAggregate> {}
