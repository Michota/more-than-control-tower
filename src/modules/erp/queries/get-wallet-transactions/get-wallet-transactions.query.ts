import { Query } from "@nestjs/cqrs";

export interface WalletTransactionItem {
    id: string;
    type: string;
    amount: string;
    currency: string;
    method: string;
    reason: string;
    initiatedBy: string;
    occurredAt: string;
}

export type GetWalletTransactionsResponse = WalletTransactionItem[];

export class GetWalletTransactionsQuery extends Query<GetWalletTransactionsResponse> {
    constructor(
        public readonly employeeId: string,
        public readonly dateFrom?: string,
        public readonly dateTo?: string,
    ) {
        super();
    }
}
