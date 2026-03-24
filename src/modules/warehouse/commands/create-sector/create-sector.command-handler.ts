import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { IdOfEntity } from "../../../../libs/ddd/aggregate-root.abstract.js";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { SectorRepositoryPort } from "../../database/sector.repository.port.js";
import type { WarehouseRepositoryPort } from "../../database/warehouse.repository.port.js";
import { SectorDimensions } from "../../domain/sector-dimensions.value-object.js";
import { SectorAggregate } from "../../domain/sector.aggregate.js";
import { WarehouseNotFoundError } from "../../domain/good.errors.js";
import { SECTOR_REPOSITORY_PORT, WAREHOUSE_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { CreateSectorCommand } from "./create-sector.command.js";

@CommandHandler(CreateSectorCommand)
export class CreateSectorCommandHandler implements ICommandHandler<CreateSectorCommand> {
    constructor(
        @Inject(SECTOR_REPOSITORY_PORT)
        private readonly sectorRepo: SectorRepositoryPort,

        @Inject(WAREHOUSE_REPOSITORY_PORT)
        private readonly warehouseRepo: WarehouseRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: CreateSectorCommand): Promise<IdOfEntity<SectorAggregate>> {
        const warehouse = await this.warehouseRepo.findOneById(cmd.warehouseId);
        if (!warehouse) {
            throw new WarehouseNotFoundError(cmd.warehouseId);
        }

        const sector = SectorAggregate.create({
            warehouseId: cmd.warehouseId,
            name: cmd.name,
            description: cmd.description,
            dimensions: new SectorDimensions({
                length: cmd.dimensionLength,
                width: cmd.dimensionWidth,
                height: cmd.dimensionHeight,
                unit: cmd.dimensionUnit,
            }),
            capabilities: cmd.capabilities,
            weightCapacityGrams: cmd.weightCapacityGrams,
        });

        await this.sectorRepo.save(sector);
        await this.uow.commit();

        for (const event of sector.domainEvents) {
            await this.eventBus.publish(event);
        }
        sector.clearEvents();

        return sector.id;
    }
}
