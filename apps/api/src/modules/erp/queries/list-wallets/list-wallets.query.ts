import { Query } from "@nestjs/cqrs";
import { Paginated } from "../../../../libs/ports/repository.port.js";

export interface WalletListItem {
    employeeId: string;
    currency: string;
    balance: string;
}

export type ListWalletsResponse = Paginated<WalletListItem>;

export class ListWalletsQuery extends Query<ListWalletsResponse> {
    constructor(
        public readonly page: number,
        public readonly limit: number,
        public readonly search?: string,
    ) {
        super();
    }
}
