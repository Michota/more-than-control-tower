import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { ScanCodeQuery, type ScanCodeResponse } from "../../../../shared/queries/scan-code.query.js";
import type { CodeRepositoryPort } from "../../database/code.repository.port.js";
import type { GoodRepositoryPort } from "../../database/good.repository.port.js";
import type { StockEntryRepositoryPort } from "../../database/stock-entry.repository.port.js";
import { CodeNotFoundError } from "../../domain/code.errors.js";
import { GoodNotFoundError } from "../../domain/good.errors.js";
import { StockEntryNotFoundError } from "../../domain/good.errors.js";
import { CODE_REPOSITORY_PORT, GOOD_REPOSITORY_PORT, STOCK_ENTRY_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";

@QueryHandler(ScanCodeQuery)
export class ScanCodeQueryHandler implements IQueryHandler<ScanCodeQuery, ScanCodeResponse> {
    constructor(
        @Inject(CODE_REPOSITORY_PORT)
        private readonly codeRepo: CodeRepositoryPort,

        @Inject(GOOD_REPOSITORY_PORT)
        private readonly goodRepo: GoodRepositoryPort,

        @Inject(STOCK_ENTRY_REPOSITORY_PORT)
        private readonly stockEntryRepo: StockEntryRepositoryPort,
    ) {}

    async execute(query: ScanCodeQuery): Promise<ScanCodeResponse> {
        const code = await this.codeRepo.findByValue(query.value);
        if (!code) {
            throw new CodeNotFoundError(query.value);
        }

        const good = await this.goodRepo.findOneById(code.goodId);
        if (!good) {
            throw new GoodNotFoundError(code.goodId);
        }

        const stockEntry = await this.stockEntryRepo.findByGoodAndWarehouse(code.goodId, query.warehouseId);
        if (!stockEntry) {
            throw new StockEntryNotFoundError(code.goodId, query.warehouseId);
        }

        return {
            stockEntryId: stockEntry.id as string,
            goodId: good.id as string,
            goodName: good.name,
            warehouseId: query.warehouseId,
            quantity: stockEntry.quantity,
            codeType: code.type,
            codeValue: code.value,
        };
    }
}
