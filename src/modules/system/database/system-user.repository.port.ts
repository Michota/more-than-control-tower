import { PaginationParameters } from "src/libs/types/pagination.js";
import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { SystemUserAggregate } from "../domain/system-user.aggregate.js";

export interface SystemUserRepositoryPort extends RepositoryPort<SystemUserAggregate> {
    findByEmail(email: string): Promise<SystemUserAggregate | null>;

    search(term: string, pagination?: PaginationParameters): Promise<{ data: SystemUserAggregate[]; count: number }>;

    countActiveAdmins(): Promise<number>;
}
