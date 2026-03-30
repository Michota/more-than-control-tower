import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryBus, QueryHandler } from "@nestjs/cqrs";
import {
    GetEmployeePermissionsQuery,
    GetEmployeePermissionsResponse,
} from "../../../../shared/queries/get-employee-permissions.query.js";
import { GetEmployeeQuery, GetEmployeeResponse } from "../../../../shared/queries/get-employee.query.js";
import { WalletNotFoundError, WalletNotOwnedError } from "../../domain/wallet.errors.js";
import type { WalletRepositoryPort } from "../../database/wallet.repository.port.js";
import { WALLET_REPOSITORY_PORT } from "../../erp.di-tokens.js";
import { ErpPermission } from "../../erp.permissions.js";
import {
    GetWalletTransactionsQuery,
    type GetWalletTransactionsResponse,
    type WalletTransactionItem,
} from "./get-wallet-transactions.query.js";

@QueryHandler(GetWalletTransactionsQuery)
export class GetWalletTransactionsQueryHandler implements IQueryHandler<
    GetWalletTransactionsQuery,
    GetWalletTransactionsResponse
> {
    constructor(
        @Inject(WALLET_REPOSITORY_PORT)
        private readonly walletRepo: WalletRepositoryPort,

        private readonly queryBus: QueryBus,
    ) {}

    async execute(query: GetWalletTransactionsQuery): Promise<GetWalletTransactionsResponse> {
        const isOwner = await this.isOwner(query.actorId, query.employeeId);

        if (!isOwner) {
            const canManage = await this.hasManagePermission(query.actorId);
            if (!canManage) {
                throw new WalletNotOwnedError(query.employeeId);
            }
        }

        const wallet = await this.walletRepo.findByEmployeeId(query.employeeId);

        if (!wallet) {
            throw new WalletNotFoundError(query.employeeId);
        }

        const from = query.dateFrom ? new Date(query.dateFrom) : undefined;
        const to = query.dateTo ? new Date(query.dateTo + "T23:59:59.999Z") : undefined;

        const transactions = await this.walletRepo.findTransactions(wallet.id as string, from, to);

        return transactions.map(
            (tx): WalletTransactionItem => ({
                id: tx.id as string,
                type: tx.properties.type,
                amount: tx.properties.amount,
                currency: tx.properties.currency,
                method: tx.properties.method,
                reason: tx.properties.reason,
                initiatedBy: tx.properties.initiatedBy,
                occurredAt: tx.properties.occurredAt.toISOString(),
            }),
        );
    }

    private async isOwner(actorUserId: string, employeeId: string): Promise<boolean> {
        const employee = await this.queryBus.execute<GetEmployeeQuery, GetEmployeeResponse | null>(
            new GetEmployeeQuery(employeeId),
        );
        return employee?.userId === actorUserId;
    }

    private async hasManagePermission(userId: string): Promise<boolean> {
        const permissions = await this.queryBus.execute<
            GetEmployeePermissionsQuery,
            GetEmployeePermissionsResponse | null
        >(new GetEmployeePermissionsQuery(userId));
        return permissions?.effectivePermissions.includes(ErpPermission.MANAGE_WALLET) ?? false;
    }
}
