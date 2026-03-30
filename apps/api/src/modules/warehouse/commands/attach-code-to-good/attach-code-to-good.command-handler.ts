import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { IdOfEntity } from "../../../../libs/ddd/aggregate-root.abstract.js";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { CodeRepositoryPort } from "../../database/code.repository.port.js";
import type { GoodRepositoryPort } from "../../database/good.repository.port.js";
import { CodeAggregate } from "../../domain/code.aggregate.js";
import { CodeValueAlreadyExistsError } from "../../domain/code.errors.js";
import { GoodNotFoundError } from "../../domain/good.errors.js";
import { CODE_REPOSITORY_PORT, GOOD_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { AttachCodeToGoodCommand } from "./attach-code-to-good.command.js";

@CommandHandler(AttachCodeToGoodCommand)
export class AttachCodeToGoodCommandHandler implements ICommandHandler<AttachCodeToGoodCommand> {
    constructor(
        @Inject(CODE_REPOSITORY_PORT)
        private readonly codeRepo: CodeRepositoryPort,

        @Inject(GOOD_REPOSITORY_PORT)
        private readonly goodRepo: GoodRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: AttachCodeToGoodCommand): Promise<IdOfEntity<CodeAggregate>> {
        const good = await this.goodRepo.findOneById(cmd.goodId);
        if (!good) {
            throw new GoodNotFoundError(cmd.goodId);
        }

        const existing = await this.codeRepo.findByValue(cmd.value);
        if (existing) {
            throw new CodeValueAlreadyExistsError(cmd.value);
        }

        const code = CodeAggregate.create({
            goodId: cmd.goodId,
            type: cmd.type,
            value: cmd.value,
        });

        await this.codeRepo.save(code);
        await this.uow.commit();

        return code.id;
    }
}
