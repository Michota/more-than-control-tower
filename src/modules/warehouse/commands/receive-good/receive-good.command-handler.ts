import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { IdOfEntity } from "../../../../libs/ddd/aggregate-root.abstract.js";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { GoodRepositoryPort } from "../../database/good.repository.port.js";
import { GoodAggregate } from "../../domain/good.aggregate.js";
import { GoodDimensions } from "../../domain/good-dimensions.value-object.js";
import { GoodWeight } from "../../domain/good-weight.value-object.js";
import { WarehouseLocation } from "../../domain/warehouse-location.value-object.js";
import { GOOD_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { ReceiveGoodCommand } from "./receive-good.command.js";

@CommandHandler(ReceiveGoodCommand)
export class ReceiveGoodCommandHandler implements ICommandHandler<ReceiveGoodCommand> {
    constructor(
        @Inject(GOOD_REPOSITORY_PORT)
        private readonly goodRepo: GoodRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: ReceiveGoodCommand): Promise<IdOfEntity<GoodAggregate>> {
        const good = GoodAggregate.receive({
            name: cmd.name,
            description: cmd.description,
            weight: new GoodWeight({ value: cmd.weightValue, unit: cmd.weightUnit }),
            dimensions: new GoodDimensions({
                length: cmd.dimensionLength,
                width: cmd.dimensionWidth,
                height: cmd.dimensionHeight,
                unit: cmd.dimensionUnit,
            }),
            warehouseId: cmd.warehouseId,
            locationInWarehouse: new WarehouseLocation({ description: cmd.locationDescription }),
            note: cmd.note,
        });

        await this.goodRepo.save(good);
        await this.uow.commit();

        for (const event of good.domainEvents) {
            await this.eventBus.publish(event);
        }
        good.clearEvents();

        return good.id;
    }
}
