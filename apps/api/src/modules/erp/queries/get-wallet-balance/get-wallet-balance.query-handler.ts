import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryBus, QueryHandler } from "@nestjs/cqrs";
import {
    GetEmployeePermissionsQuery,
    GetEmployeePermissionsResponse,
} from "../../../../shared/queries/get-employee-permissions.query.js";
import { GetEmployeeQuery, GetEmployeeResponse } from "../../../../shared/queries/get-employee.query.js";
import { WalletNotOwnedError } from "../../domain/wallet.errors.js";
import type { WalletRepositoryPort } from "../../database/wallet.repository.port.js";
import { WALLET_REPOSITORY_PORT } from "../../erp.di-tokens.js";
import { ErpPermission } from "../../../../libs/permissions/index.js";
import { GetWalletBalanceQuery, type WalletBalanceResponse } from "./get-wallet-balance.query.js";

@QueryHandler(GetWalletBalanceQuery)
export class GetWalletBalanceQueryHandler implements IQueryHandler<
    GetWalletBalanceQuery,
    WalletBalanceResponse | null
> {
    constructor(
        @Inject(WALLET_REPOSITORY_PORT)
        private readonly walletRepo: WalletRepositoryPort,

        private readonly queryBus: QueryBus,
    ) {}

    async execute(query: GetWalletBalanceQuery): Promise<WalletBalanceResponse | null> {
        const isOwner = await this.isOwner(query.actorId, query.employeeId);

        if (!isOwner) {
            const canManage = await this.hasManagePermission(query.actorId);
            if (!canManage) {
                throw new WalletNotOwnedError(query.employeeId);
            }
        }

        const wallet = await this.walletRepo.findByEmployeeId(query.employeeId);

        if (!wallet) {
            return null;
        }

        return {
            employeeId: wallet.properties.employeeId,
            currency: wallet.properties.currency,
            balance: wallet.balance.toFixed(2),
        };
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
