import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { GoodRepositoryPort } from "../../database/good.repository.port.js";
import type { SectorRepositoryPort } from "../../database/sector.repository.port.js";
import type { StockEntryRepositoryPort } from "../../database/stock-entry.repository.port.js";
import { WeightUnit } from "../../domain/good-weight.value-object.js";
import { SectorNotFoundError } from "../../domain/good.errors.js";
import {
    GOOD_REPOSITORY_PORT,
    SECTOR_REPOSITORY_PORT,
    STOCK_ENTRY_REPOSITORY_PORT,
} from "../../warehouse.di-tokens.js";
import { GetSectorLoadQuery, SectorLoadResponse } from "./get-sector-load.query.js";

function toGrams(value: number, unit: WeightUnit): number {
    switch (unit) {
        case WeightUnit.G:
            return value;
        case WeightUnit.KG:
            return value * 1000;
        case WeightUnit.LB:
            return value * 453.592;
    }
}

@QueryHandler(GetSectorLoadQuery)
export class GetSectorLoadQueryHandler implements IQueryHandler<GetSectorLoadQuery, SectorLoadResponse> {
    constructor(
        @Inject(SECTOR_REPOSITORY_PORT)
        private readonly sectorRepo: SectorRepositoryPort,

        @Inject(STOCK_ENTRY_REPOSITORY_PORT)
        private readonly stockRepo: StockEntryRepositoryPort,

        @Inject(GOOD_REPOSITORY_PORT)
        private readonly goodRepo: GoodRepositoryPort,
    ) {}

    async execute(query: GetSectorLoadQuery): Promise<SectorLoadResponse> {
        const sector = await this.sectorRepo.findOneById(query.sectorId);
        if (!sector) {
            throw new SectorNotFoundError(query.sectorId);
        }

        const entries = await this.stockRepo.findBySector(query.sectorId);

        let currentLoadGrams = 0;
        for (const entry of entries) {
            const good = await this.goodRepo.findOneById(entry.goodId);
            if (good) {
                currentLoadGrams += entry.quantity * toGrams(good.weight.value, good.weight.unit);
            }
        }

        currentLoadGrams = Math.round(currentLoadGrams);

        const loadPercentage =
            sector.weightCapacityGrams > 0
                ? Math.round((currentLoadGrams / sector.weightCapacityGrams) * 10000) / 100
                : 0;

        return {
            sectorId: sector.id as string,
            name: sector.name,
            capabilities: sector.capabilities,
            weightCapacityGrams: sector.weightCapacityGrams,
            currentLoadGrams,
            loadPercentage,
        };
    }
}
