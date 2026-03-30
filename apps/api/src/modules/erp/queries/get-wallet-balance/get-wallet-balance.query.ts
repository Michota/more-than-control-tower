import { Query } from "@nestjs/cqrs";

export interface WalletBalanceResponse {
    employeeId: string;
    currency: string;
    balance: string;
}

export class GetWalletBalanceQuery extends Query<WalletBalanceResponse | null> {
    constructor(
        public readonly employeeId: string,
        public readonly actorId: string,
    ) {
        super();
    }
}
