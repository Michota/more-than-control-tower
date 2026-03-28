import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { ActivityAggregate } from "../domain/activity.aggregate.js";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ActivityRepositoryPort extends RepositoryPort<ActivityAggregate> {}
