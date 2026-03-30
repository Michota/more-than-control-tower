import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { WalletRepositoryPort } from "../../database/wallet.repository.port.js";
import { WALLET_REPOSITORY_PORT } from "../../erp.di-tokens.js";
import { ListWalletsQuery, type ListWalletsResponse } from "./list-wallets.query.js";

@QueryHandler(ListWalletsQuery)
export class ListWalletsQueryHandler implements IQueryHandler<ListWalletsQuery, ListWalletsResponse> {
    constructor(
        @Inject(WALLET_REPOSITORY_PORT)
        private readonly walletRepo: WalletRepositoryPort,
    ) {}

    async execute(query: ListWalletsQuery): Promise<ListWalletsResponse> {
        return this.walletRepo.findAllPaginated(query.page, query.limit, query.search);
    }
}
