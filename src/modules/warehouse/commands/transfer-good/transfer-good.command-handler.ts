import { Inject, NotFoundException } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { GoodRepositoryPort } from "../../database/good.repository.port.js";
import { WarehouseLocation } from "../../domain/warehouse-location.value-object.js";
import { GOOD_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { TransferGoodCommand } from "./transfer-good.command.js";

@CommandHandler(TransferGoodCommand)
export class TransferGoodCommandHandler implements ICommandHandler<TransferGoodCommand> {
    constructor(
        @Inject(GOOD_REPOSITORY_PORT)
        private readonly goodRepo: GoodRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: TransferGoodCommand): Promise<void> {
        const good = await this.goodRepo.findOneById(cmd.goodId);
        if (!good) {
            throw new NotFoundException(`Good ${cmd.goodId} not found`);
        }

        good.transfer(cmd.toWarehouseId, new WarehouseLocation({ description: cmd.locationDescription }), cmd.note);

        await this.goodRepo.save(good);
        await this.uow.commit();

        for (const event of good.domainEvents) {
            await this.eventBus.publish(event);
        }
        good.clearEvents();
    }
}
