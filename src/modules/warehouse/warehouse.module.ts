import { EntityManager } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { MikroOrmUnitOfWork } from "../../shared/infrastructure/mikro-orm-unit-of-work.js";
import { UNIT_OF_WORK_PORT } from "../../shared/ports/tokens.js";
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
import { GetGoodQueryHandler } from "./queries/get-good/get-good.query-handler.js";
import { GetGoodsReceiptQueryHandler } from "./queries/get-goods-receipt/get-goods-receipt.query-handler.js";
import { ListGoodsReceiptsQueryHandler } from "./queries/list-goods-receipts/list-goods-receipts.query-handler.js";
import { ListGoodsQueryHandler } from "./queries/list-goods/list-goods.query-handler.js";
import { ListWarehouseStockQueryHandler } from "./queries/list-warehouse-stock/list-warehouse-stock.query-handler.js";
import { ListWarehousesQueryHandler } from "./queries/list-warehouses/list-warehouses.query-handler.js";
import { ListSectorsQueryHandler } from "./queries/list-sectors/list-sectors.query-handler.js";
import { GetSectorQueryHandler } from "./queries/get-sector/get-sector.query-handler.js";
import { GetSectorLoadQueryHandler } from "./queries/get-sector-load/get-sector-load.query-handler.js";
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
    GOOD_REPOSITORY_PORT,
    GOODS_RECEIPT_REPOSITORY_PORT,
    SECTOR_REPOSITORY_PORT,
    STOCK_ENTRY_REPOSITORY_PORT,
    WAREHOUSE_REPOSITORY_PORT,
} from "./warehouse.di-tokens.js";
import { WarehouseHttpController } from "./warehouse.http.controller.js";

@Module({
    imports: [MikroOrmModule.forFeature([Good, Warehouse, GoodsReceipt, StockEntry, Sector])],
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
        GetGoodQueryHandler,
        GetGoodsReceiptQueryHandler,
        ListGoodsReceiptsQueryHandler,
        ListGoodsQueryHandler,
        ListWarehouseStockQueryHandler,
        ListWarehousesQueryHandler,
        ListSectorsQueryHandler,
        GetSectorQueryHandler,
        GetSectorLoadQueryHandler,
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
            useFactory: (em: EntityManager) => new StockEntryRepository(em),
            inject: [EntityManager],
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
    ],
})
export class WarehouseModule {}
