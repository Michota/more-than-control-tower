import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { ItemPriceRepositoryPort, ResolvedPrice } from "./item-price.repository.port.js";
import { Price } from "./price.entity.js";
import Decimal from "decimal.js";

@Injectable()
export class ItemPriceRepository implements ItemPriceRepositoryPort {
    constructor(private readonly em: EntityManager) {}

    async findById(priceId: string): Promise<ResolvedPrice | null> {
        const record = await this.em.findOne(Price, { id: priceId });
        if (!record) return null;
        return { id: record.id, amount: Decimal(record.amount), currency: record.currency };
    }

    async findActiveByItemAndType(itemId: string, priceTypeId: string): Promise<ResolvedPrice | null> {
        const now = new Date();
        const record = await this.em.findOne(Price, {
            product: itemId,
            priceType: priceTypeId,
            validFrom: { $lte: now },
            $or: [{ validTo: null }, { validTo: { $gte: now } }],
        });
        if (!record) return null;
        return { id: record.id, amount: Decimal(record.amount), currency: record.currency };
    }
}
