import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { GoodRepositoryPort } from "../../database/good.repository.port.js";
import type { StockEntryRepositoryPort } from "../../database/stock-entry.repository.port.js";
import { StockAttributeType } from "../../domain/stock-entry-attribute.value-object.js";
import { StockEventType } from "../../domain/stock-event-type.enum.js";
import { GOOD_REPOSITORY_PORT, STOCK_ENTRY_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import {
    ListWarehouseStockQuery,
    ListWarehouseStockResponse,
    WarehouseStockItem,
} from "./list-warehouse-stock.query.js";

@QueryHandler(ListWarehouseStockQuery)
export class ListWarehouseStockQueryHandler implements IQueryHandler<
    ListWarehouseStockQuery,
    ListWarehouseStockResponse
> {
    constructor(
        @Inject(STOCK_ENTRY_REPOSITORY_PORT)
        private readonly stockRepo: StockEntryRepositoryPort,

        @Inject(GOOD_REPOSITORY_PORT)
        private readonly goodRepo: GoodRepositoryPort,
    ) {}

    async execute(query: ListWarehouseStockQuery): Promise<ListWarehouseStockResponse> {
        const { params } = query;

        const entries = params.sectorId
            ? await this.stockRepo.findBySector(params.sectorId)
            : await this.stockRepo.findByWarehouse(params.warehouseId);

        const goodIds = [...new Set(entries.map((e) => e.goodId))];
        const goodsMap = new Map<string, { name: string; description?: string }>();
        for (const goodId of goodIds) {
            const good = await this.goodRepo.findOneById(goodId);
            if (good) {
                goodsMap.set(goodId, { name: good.name, description: good.description });
            }
        }

        let items: WarehouseStockItem[] = entries.map((e) => {
            const good = goodsMap.get(e.goodId);
            const firstReceived = e.history.find((h) => h.eventType === StockEventType.RECEIVED);
            const receivedAt = firstReceived?.occurredAt ?? new Date();

            const item: WarehouseStockItem = {
                id: e.id as string,
                goodId: e.goodId,
                goodName: good?.name ?? "Unknown",
                goodDescription: good?.description,
                quantity: e.quantity,
                sectorId: e.sectorId,
                attributes: e.attributes.map((a) => ({ name: a.name, type: a.type, value: a.value })),
                receivedAt: receivedAt.toISOString(),
            };

            if (params.includeHistory) {
                item.history = e.history.map((h) => ({
                    eventType: h.eventType,
                    quantityDelta: h.quantityDelta,
                    quantityAfter: h.quantityAfter,
                    note: h.note,
                    removalReason: h.removalReason,
                    relatedWarehouseId: h.relatedWarehouseId,
                    relatedSectorId: h.relatedSectorId,
                    occurredAt: h.occurredAt.toISOString(),
                }));
            }

            return item;
        });

        if (params.goodName) {
            const search = params.goodName.toLowerCase();
            items = items.filter((i) => i.goodName.toLowerCase().includes(search));
        }
        if (params.goodDescription) {
            const search = params.goodDescription.toLowerCase();
            items = items.filter((i) => i.goodDescription?.toLowerCase().includes(search));
        }

        if (params.attributeName) {
            const attrName = params.attributeName;
            items = items.filter((i) => {
                const attr = i.attributes.find((a) => a.name === attrName);
                if (!attr) {
                    return false;
                }
                if (params.attributeValue) {
                    return attr.value === params.attributeValue;
                }
                if (params.attributeDateBefore && attr.type === String(StockAttributeType.DATE)) {
                    return new Date(attr.value) < new Date(params.attributeDateBefore);
                }
                return true;
            });
        }

        const sortBy = params.sortBy ?? "name";
        const dir = params.sortDirection === "desc" ? -1 : 1;
        items.sort((a, b) => {
            if (sortBy === "receivedAt") {
                return dir * (new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
            }
            return dir * a.goodName.localeCompare(b.goodName);
        });

        return items;
    }
}
