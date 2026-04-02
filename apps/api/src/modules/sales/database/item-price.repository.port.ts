import { Decimal } from "decimal.js";

export interface ResolvedPrice {
    id: string;
    amount: Decimal;
    currency: string;
}

export interface ItemPriceRepositoryPort {
    findById(priceId: string): Promise<ResolvedPrice | null>;
    findActiveByItemAndType(itemId: string, priceTypeId: string): Promise<ResolvedPrice | null>;
}
