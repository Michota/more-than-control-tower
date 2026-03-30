import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { CodeAggregate } from "../domain/code.aggregate.js";

export interface CodeRepositoryPort extends RepositoryPort<CodeAggregate> {
    findByValue(value: string): Promise<CodeAggregate | null>;
    findByGoodId(goodId: string): Promise<CodeAggregate[]>;
}
