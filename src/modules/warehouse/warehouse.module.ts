import { EntityManager } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Inject, Module, OnModuleInit } from "@nestjs/common";
import type { LoggerPort } from "../../libs/ports/logger.port.js";
import { MikroOrmUnitOfWork } from "../../shared/infrastructure/mikro-orm-unit-of-work.js";
import { NestJsLoggerAdapter } from "../../shared/infrastructure/nestjs-logger.adapter.js";
import { LOGGER_PORT, UNIT_OF_WORK_PORT } from "../../shared/ports/tokens.js";
import { PERMISSION_REGISTRY, PermissionRegistry } from "../../shared/infrastructure/permission-registry.js";
import { SetGoodsReceiptLinesCommandHandler } from "./commands/set-goods-receipt-lines/set-goods-receipt-lines.command-handler.js";
import { ConfirmGoodsReceiptCommandHandler } from "./commands/confirm-goods-receipt/confirm-goods-receipt.command-handler.js";
import { CreateGoodCommandHandler } from "./commands/create-good/create-good.command-handler.js";
import { DeleteGoodsCommandHandler } from "./commands/delete-goods/delete-goods.command-handler.js";
import { DeleteGoodsReceiptCommandHandler } from "./commands/delete-goods-receipt/delete-goods-receipt.command-handler.js";
import { EditGoodCommandHandler } from "./commands/edit-good/edit-good.command-handler.js";
import { EditWarehouseCommandHandler } from "./commands/edit-warehouse/edit-warehouse.command-handler.js";
import { CreateWarehouseCommandHandler } from "./commands/create-warehouse/create-warehouse.command-handler.js";
import { OpenGoodsReceiptCommandHandler } from "./commands/open-goods-receipt/open-goods-receipt.command-handler.js";
import { RemoveStockCommandHandler } from "./commands/remove-stock/remove-stock.command-handler.js";
import { TransferStockCommandHandler } from "./commands/transfer-stock/transfer-stock.command-handler.js";
import { CreateSectorCommandHandler } from "./commands/create-sector/create-sector.command-handler.js";
import { EditSectorCommandHandler } from "./commands/edit-sector/edit-sector.command-handler.js";
import { MoveStockToSectorCommandHandler } from "./commands/move-stock-to-sector/move-stock-to-sector.command-handler.js";
import {
    ActivateWarehouseCommandHandler,
    DeactivateWarehouseCommandHandler,
} from "./commands/change-warehouse-status/change-warehouse-status.command-handler.js";
import {
    ActivateSectorCommandHandler,
    DeactivateSectorCommandHandler,
} from "./commands/change-sector-status/change-sector-status.command-handler.js";
import { AttachCodeToGoodCommandHandler } from "./commands/attach-code-to-good/attach-code-to-good.command-handler.js";
import { DetachCodeFromGoodCommandHandler } from "./commands/detach-code-from-good/detach-code-from-good.command-handler.js";
import { GetGoodQueryHandler } from "./queries/get-good/get-good.query-handler.js";
import { GetGoodsReceiptQueryHandler } from "./queries/get-goods-receipt/get-goods-receipt.query-handler.js";
import { ListGoodsReceiptsQueryHandler } from "./queries/list-goods-receipts/list-goods-receipts.query-handler.js";
import { ListGoodsQueryHandler } from "./queries/list-goods/list-goods.query-handler.js";
import { ListWarehouseStockQueryHandler } from "./queries/list-warehouse-stock/list-warehouse-stock.query-handler.js";
import { ListWarehousesQueryHandler } from "./queries/list-warehouses/list-warehouses.query-handler.js";
import { ListSectorsQueryHandler } from "./queries/list-sectors/list-sectors.query-handler.js";
import { GetSectorQueryHandler } from "./queries/get-sector/get-sector.query-handler.js";
import { GetSectorLoadQueryHandler } from "./queries/get-sector-load/get-sector-load.query-handler.js";
import { GetGoodExistsQueryHandler } from "./queries/get-good-exists/get-good-exists.query-handler.js";
import { GetStockEntryQueryHandler } from "./queries/get-stock-entry/get-stock-entry.query-handler.js";
import { FindGoodByCodeQueryHandler } from "./queries/find-good-by-code/find-good-by-code.query-handler.js";
import { ListCodesForGoodQueryHandler } from "./queries/list-codes-for-good/list-codes-for-good.query-handler.js";
import { Code } from "./database/code.entity.js";
import { CodeRepository } from "./database/code.repository.js";
import { Good } from "./database/good.entity.js";
import { GoodRepository } from "./database/good.repository.js";
import { GoodsReceipt } from "./database/goods-receipt.entity.js";
import { GoodsReceiptRepository } from "./database/goods-receipt.repository.js";
import { StockEntry } from "./database/stock-entry.entity.js";
import { StockEntryRepository } from "./database/stock-entry.repository.js";
import { Sector } from "./database/sector.entity.js";
import { SectorRepository } from "./database/sector.repository.js";
import { Warehouse } from "./database/warehouse.entity.js";
import { WarehouseRepository } from "./database/warehouse.repository.js";
import {
    CODE_REPOSITORY_PORT,
    GOOD_REPOSITORY_PORT,
    GOODS_RECEIPT_REPOSITORY_PORT,
    SECTOR_REPOSITORY_PORT,
    STOCK_ENTRY_REPOSITORY_PORT,
    WAREHOUSE_REPOSITORY_PORT,
} from "./warehouse.di-tokens.js";
import { WarehouseHttpController } from "./warehouse.http.controller.js";

@Module({
    imports: [MikroOrmModule.forFeature([Good, Warehouse, GoodsReceipt, StockEntry, Sector, Code])],
    controllers: [WarehouseHttpController],
    providers: [
        CreateGoodCommandHandler,
        DeleteGoodsCommandHandler,
        DeleteGoodsReceiptCommandHandler,
        EditGoodCommandHandler,
        EditWarehouseCommandHandler,
        CreateWarehouseCommandHandler,
        OpenGoodsReceiptCommandHandler,
        SetGoodsReceiptLinesCommandHandler,
        ConfirmGoodsReceiptCommandHandler,
        TransferStockCommandHandler,
        RemoveStockCommandHandler,
        CreateSectorCommandHandler,
        EditSectorCommandHandler,
        MoveStockToSectorCommandHandler,
        ActivateWarehouseCommandHandler,
        DeactivateWarehouseCommandHandler,
        ActivateSectorCommandHandler,
        DeactivateSectorCommandHandler,
        AttachCodeToGoodCommandHandler,
        DetachCodeFromGoodCommandHandler,
        GetGoodQueryHandler,
        GetGoodsReceiptQueryHandler,
        ListGoodsReceiptsQueryHandler,
        ListGoodsQueryHandler,
        ListWarehouseStockQueryHandler,
        ListWarehousesQueryHandler,
        ListSectorsQueryHandler,
        GetSectorQueryHandler,
        GetSectorLoadQueryHandler,
        GetGoodExistsQueryHandler,
        GetStockEntryQueryHandler,
        FindGoodByCodeQueryHandler,
        ListCodesForGoodQueryHandler,
        {
            provide: CODE_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new CodeRepository(em),
            inject: [EntityManager],
        },
        {
            provide: GOOD_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new GoodRepository(em),
            inject: [EntityManager],
        },
        {
            provide: WAREHOUSE_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new WarehouseRepository(em),
            inject: [EntityManager],
        },
        {
            provide: GOODS_RECEIPT_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new GoodsReceiptRepository(em),
            inject: [EntityManager],
        },
        {
            provide: STOCK_ENTRY_REPOSITORY_PORT,
            useFactory: (em: EntityManager, logger: LoggerPort) => new StockEntryRepository(em, logger),
            inject: [EntityManager, LOGGER_PORT],
        },
        {
            provide: SECTOR_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new SectorRepository(em),
            inject: [EntityManager],
        },
        {
            provide: UNIT_OF_WORK_PORT,
            useFactory: (em: EntityManager) => new MikroOrmUnitOfWork(em),
            inject: [EntityManager],
        },
        {
            provide: LOGGER_PORT,
            useClass: NestJsLoggerAdapter,
        },
    ],
})
export class WarehouseModule implements OnModuleInit {
    constructor(
        @Inject(PERMISSION_REGISTRY)
        private readonly permissionRegistry: PermissionRegistry,
    ) {}

    onModuleInit(): void {
        this.permissionRegistry.registerForModule("warehouse", [
            { key: "create-good", name: "Create Good" },
            { key: "edit-good", name: "Edit Good" },
            { key: "delete-goods", name: "Delete Goods" },
            { key: "view-goods", name: "View Goods" },
            { key: "attach-code", name: "Attach Code to Good" },
            { key: "detach-code", name: "Detach Code from Good" },
            { key: "view-codes", name: "View Codes" },
            { key: "create-warehouse", name: "Create Warehouse" },
            { key: "edit-warehouse", name: "Edit Warehouse" },
            { key: "change-warehouse-status", name: "Change Warehouse Status" },
            { key: "view-warehouses", name: "View Warehouses" },
            { key: "create-sector", name: "Create Sector" },
            { key: "edit-sector", name: "Edit Sector" },
            { key: "change-sector-status", name: "Change Sector Status" },
            { key: "move-stock-to-sector", name: "Move Stock to Sector" },
            { key: "view-sectors", name: "View Sectors" },
            { key: "open-goods-receipt", name: "Open Goods Receipt" },
            { key: "set-goods-receipt-lines", name: "Set Goods Receipt Lines" },
            { key: "confirm-goods-receipt", name: "Confirm Goods Receipt" },
            { key: "delete-goods-receipt", name: "Delete Goods Receipt" },
            { key: "view-goods-receipts", name: "View Goods Receipts" },
            { key: "transfer-stock", name: "Transfer Stock" },
            { key: "remove-stock", name: "Remove Stock" },
            { key: "view-stock", name: "View Stock" },
        ]);
    }
}
