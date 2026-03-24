import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { SectorRepositoryPort } from "../../database/sector.repository.port.js";
import type { StockEntryRepositoryPort } from "../../database/stock-entry.repository.port.js";
import { SectorNotFoundError, SectorNotInWarehouseError, StockEntryNotFoundError } from "../../domain/good.errors.js";
import { SECTOR_REPOSITORY_PORT, STOCK_ENTRY_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { MoveStockToSectorCommand } from "./move-stock-to-sector.command.js";

@CommandHandler(MoveStockToSectorCommand)
export class MoveStockToSectorCommandHandler implements ICommandHandler<MoveStockToSectorCommand> {
    constructor(
        @Inject(STOCK_ENTRY_REPOSITORY_PORT)
        private readonly stockRepo: StockEntryRepositoryPort,

        @Inject(SECTOR_REPOSITORY_PORT)
        private readonly sectorRepo: SectorRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: MoveStockToSectorCommand): Promise<void> {
        const entry = await this.stockRepo.findByGoodAndWarehouse(cmd.goodId, cmd.warehouseId);
        if (!entry) {
            throw new StockEntryNotFoundError(cmd.goodId, cmd.warehouseId);
        }

        if (cmd.sectorId) {
            const sector = await this.sectorRepo.findOneById(cmd.sectorId);
            if (!sector) {
                throw new SectorNotFoundError(cmd.sectorId);
            }
            if (sector.warehouseId !== cmd.warehouseId) {
                throw new SectorNotInWarehouseError(cmd.sectorId, cmd.warehouseId);
            }
        }

        entry.moveToSector(cmd.sectorId, cmd.note);

        await this.stockRepo.save(entry);
        await this.uow.commit();
    }
}
