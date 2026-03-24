import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { IdOfEntity } from "../../../../libs/ddd/aggregate-root.abstract.js";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { GoodRepositoryPort } from "../../database/good.repository.port.js";
import { GoodAggregate } from "../../domain/good.aggregate.js";
import { GoodDimensions } from "../../domain/good-dimensions.value-object.js";
import { GoodWeight } from "../../domain/good-weight.value-object.js";
import { ParentGoodNotFoundError } from "../../domain/good.errors.js";
import { GOOD_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { CreateGoodCommand } from "./create-good.command.js";

@CommandHandler(CreateGoodCommand)
export class CreateGoodCommandHandler implements ICommandHandler<CreateGoodCommand> {
    constructor(
        @Inject(GOOD_REPOSITORY_PORT)
        private readonly goodRepo: GoodRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: CreateGoodCommand): Promise<IdOfEntity<GoodAggregate>> {
        if (cmd.parentId) {
            const parent = await this.goodRepo.findOneById(cmd.parentId);
            if (!parent) {
                throw new ParentGoodNotFoundError(cmd.parentId);
            }
        }

        const good = GoodAggregate.create({
            name: cmd.name,
            description: cmd.description,
            weight: new GoodWeight({ value: cmd.weightValue, unit: cmd.weightUnit }),
            dimensions: new GoodDimensions({
                length: cmd.dimensionLength,
                width: cmd.dimensionWidth,
                height: cmd.dimensionHeight,
                unit: cmd.dimensionUnit,
            }),
            parentId: cmd.parentId,
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
