import { RepositoryPort } from "@src/libs/ports/repository.port";
import { OrderAggregate } from "../domain/order.aggregate";

export type OrderRepositoryPort = RepositoryPort<OrderAggregate>;
