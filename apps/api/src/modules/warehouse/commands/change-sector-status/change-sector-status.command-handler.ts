import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { SectorRepositoryPort } from "../../database/sector.repository.port.js";
import { SectorNotFoundError } from "../../domain/good.errors.js";
import { SECTOR_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { ActivateSectorCommand, DeactivateSectorCommand } from "./change-sector-status.command.js";

@CommandHandler(ActivateSectorCommand)
export class ActivateSectorCommandHandler implements ICommandHandler<ActivateSectorCommand> {
    constructor(
        @Inject(SECTOR_REPOSITORY_PORT)
        private readonly sectorRepo: SectorRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: ActivateSectorCommand): Promise<void> {
        const sector = await this.sectorRepo.findOneById(cmd.sectorId);
        if (!sector) {
            throw new SectorNotFoundError(cmd.sectorId);
        }

        sector.activate();

        await this.sectorRepo.save(sector);
        await this.uow.commit();
    }
}

@CommandHandler(DeactivateSectorCommand)
export class DeactivateSectorCommandHandler implements ICommandHandler<DeactivateSectorCommand> {
    constructor(
        @Inject(SECTOR_REPOSITORY_PORT)
        private readonly sectorRepo: SectorRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: DeactivateSectorCommand): Promise<void> {
        const sector = await this.sectorRepo.findOneById(cmd.sectorId);
        if (!sector) {
            throw new SectorNotFoundError(cmd.sectorId);
        }

        sector.deactivate();

        await this.sectorRepo.save(sector);
        await this.uow.commit();
    }
}
