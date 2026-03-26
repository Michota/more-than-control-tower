import { Paginated } from "../../../../libs/ports/repository.port.js";
import { GetSystemUserResponse } from "../../../../shared/queries/get-system-user.query.js";

export class ListSystemUsersQuery {
    constructor(
        public readonly term?: string,
        public readonly page: number = 1,
        public readonly limit: number = 20,
    ) {}
}

export type ListSystemUsersResponse = Paginated<GetSystemUserResponse>;
