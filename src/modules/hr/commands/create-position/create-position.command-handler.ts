import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { IdOfEntity } from "../../../../libs/ddd/aggregate-root.abstract.js";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { PERMISSION_REGISTRY, PermissionRegistry } from "../../../../shared/infrastructure/permission-registry.js";
import { PositionAggregate } from "../../domain/position.aggregate.js";
import { PositionKeyAlreadyExistsError, UnknownPermissionError } from "../../domain/employee.errors.js";
import type { PositionRepositoryPort } from "../../database/position.repository.port.js";
import { POSITION_REPOSITORY_PORT } from "../../hr.di-tokens.js";
import { CreatePositionCommand } from "./create-position.command.js";

@CommandHandler(CreatePositionCommand)
export class CreatePositionCommandHandler implements ICommandHandler<CreatePositionCommand> {
    constructor(
        @Inject(POSITION_REPOSITORY_PORT)
        private readonly positionRepo: PositionRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        @Inject(PERMISSION_REGISTRY)
        private readonly permissionRegistry: PermissionRegistry,
    ) {}

    async execute(cmd: CreatePositionCommand): Promise<IdOfEntity<PositionAggregate>> {
        const exists = await this.positionRepo.existsByKey(cmd.key);
        if (exists) {
            throw new PositionKeyAlreadyExistsError(cmd.key);
        }

        for (const permKey of cmd.permissionKeys) {
            if (!this.permissionRegistry.has(permKey)) {
                throw new UnknownPermissionError(permKey);
            }
        }

        const position = PositionAggregate.create({
            key: cmd.key,
            displayName: cmd.displayName,
            qualificationSchema: cmd.qualificationSchema,
            permissionKeys: cmd.permissionKeys,
        });

        await this.positionRepo.save(position);
        await this.uow.commit();

        return position.id;
    }
}
