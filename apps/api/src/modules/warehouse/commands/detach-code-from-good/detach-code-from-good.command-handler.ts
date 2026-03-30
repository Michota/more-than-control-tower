import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { CodeRepositoryPort } from "../../database/code.repository.port.js";
import { CodeNotFoundError } from "../../domain/code.errors.js";
import { CODE_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { DetachCodeFromGoodCommand } from "./detach-code-from-good.command.js";

@CommandHandler(DetachCodeFromGoodCommand)
export class DetachCodeFromGoodCommandHandler implements ICommandHandler<DetachCodeFromGoodCommand> {
    constructor(
        @Inject(CODE_REPOSITORY_PORT)
        private readonly codeRepo: CodeRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: DetachCodeFromGoodCommand): Promise<void> {
        const code = await this.codeRepo.findOneById(cmd.codeId);
        if (!code) {
            throw new CodeNotFoundError(cmd.codeId);
        }

        await this.codeRepo.delete(code);
        await this.uow.commit();
    }
}
