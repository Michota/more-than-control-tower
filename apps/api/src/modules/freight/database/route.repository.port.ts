import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { RouteAggregate } from "../domain/route.aggregate.js";

export interface RouteRepositoryPort extends RepositoryPort<RouteAggregate> {}
