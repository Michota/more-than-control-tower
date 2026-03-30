import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { GoodRepositoryPort } from "../../database/good.repository.port.js";
import { GoodDimensions } from "../../domain/good-dimensions.value-object.js";
import { GoodWeight } from "../../domain/good-weight.value-object.js";
import { GoodNotFoundError } from "../../domain/good.errors.js";
import { GOOD_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { EditGoodCommand } from "./edit-good.command.js";

@CommandHandler(EditGoodCommand)
export class EditGoodCommandHandler implements ICommandHandler<EditGoodCommand> {
    constructor(
        @Inject(GOOD_REPOSITORY_PORT)
        private readonly goodRepo: GoodRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: EditGoodCommand): Promise<void> {
        const good = await this.goodRepo.findOneById(cmd.goodId);
        if (!good) {
            throw new GoodNotFoundError(cmd.goodId);
        }

        const updates: Parameters<typeof good.update>[0] = {};

        if (cmd.name !== undefined) {
            updates.name = cmd.name;
        }
        if (cmd.description !== undefined) {
            updates.description = cmd.description;
        }
        if (cmd.weightValue !== undefined || cmd.weightUnit !== undefined) {
            updates.weight = new GoodWeight({
                value: cmd.weightValue ?? good.weight.value,
                unit: cmd.weightUnit ?? good.weight.unit,
            });
        }
        if (
            cmd.dimensionLength !== undefined ||
            cmd.dimensionWidth !== undefined ||
            cmd.dimensionHeight !== undefined ||
            cmd.dimensionUnit !== undefined
        ) {
            updates.dimensions = new GoodDimensions({
                length: cmd.dimensionLength ?? good.dimensions.length,
                width: cmd.dimensionWidth ?? good.dimensions.width,
                height: cmd.dimensionHeight ?? good.dimensions.height,
                unit: cmd.dimensionUnit ?? good.dimensions.unit,
            });
        }

        good.update(updates);

        await this.goodRepo.save(good);
        await this.uow.commit();
    }
}
