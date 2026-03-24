import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { SectorRepositoryPort } from "../../database/sector.repository.port.js";
import { SectorDimensions } from "../../domain/sector-dimensions.value-object.js";
import { SectorNotFoundError } from "../../domain/good.errors.js";
import { SECTOR_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { EditSectorCommand } from "./edit-sector.command.js";

@CommandHandler(EditSectorCommand)
export class EditSectorCommandHandler implements ICommandHandler<EditSectorCommand> {
    constructor(
        @Inject(SECTOR_REPOSITORY_PORT)
        private readonly sectorRepo: SectorRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: EditSectorCommand): Promise<void> {
        const sector = await this.sectorRepo.findOneById(cmd.sectorId);
        if (!sector) {
            throw new SectorNotFoundError(cmd.sectorId);
        }

        const updates: Parameters<typeof sector.update>[0] = {};

        if (cmd.name !== undefined) {
            updates.name = cmd.name;
        }
        if (cmd.description !== undefined) {
            updates.description = cmd.description;
        }
        if (cmd.capabilities !== undefined) {
            updates.capabilities = cmd.capabilities;
        }
        if (
            cmd.dimensionLength !== undefined ||
            cmd.dimensionWidth !== undefined ||
            cmd.dimensionHeight !== undefined ||
            cmd.dimensionUnit !== undefined
        ) {
            updates.dimensions = new SectorDimensions({
                length: cmd.dimensionLength ?? sector.dimensions.length,
                width: cmd.dimensionWidth ?? sector.dimensions.width,
                height: cmd.dimensionHeight ?? sector.dimensions.height,
                unit: cmd.dimensionUnit ?? sector.dimensions.unit,
            });
        }

        sector.update(updates);

        await this.sectorRepo.save(sector);
        await this.uow.commit();
    }
}
