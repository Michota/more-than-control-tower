import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { PERMISSION_REGISTRY, PermissionRegistry } from "../../../../shared/infrastructure/permission-registry.js";
import { PositionNotFoundError, UnknownPermissionError } from "../../domain/employee.errors.js";
import type { PositionRepositoryPort } from "../../database/position.repository.port.js";
import { POSITION_REPOSITORY_PORT } from "../../hr.di-tokens.js";
import { UpdatePositionCommand } from "./update-position.command.js";

@CommandHandler(UpdatePositionCommand)
export class UpdatePositionCommandHandler implements ICommandHandler<UpdatePositionCommand> {
    constructor(
        @Inject(POSITION_REPOSITORY_PORT)
        private readonly positionRepo: PositionRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        @Inject(PERMISSION_REGISTRY)
        private readonly permissionRegistry: PermissionRegistry,
    ) {}

    async execute(cmd: UpdatePositionCommand): Promise<void> {
        const position = await this.positionRepo.findOneById(cmd.positionId);
        if (!position) {
            throw new PositionNotFoundError(cmd.positionId);
        }

        if (cmd.permissionKeys) {
            for (const permKey of cmd.permissionKeys) {
                if (!this.permissionRegistry.has(permKey)) {
                    throw new UnknownPermissionError(permKey);
                }
            }
        }

        position.update({
            displayName: cmd.displayName,
            permissionKeys: cmd.permissionKeys,
        });

        await this.positionRepo.save(position);
        await this.uow.commit();
    }
}
