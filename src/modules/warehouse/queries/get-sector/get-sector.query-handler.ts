import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { SectorRepositoryPort } from "../../database/sector.repository.port.js";
import { SectorNotFoundError } from "../../domain/good.errors.js";
import { SECTOR_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { GetSectorQuery, SectorResponse } from "./get-sector.query.js";

@QueryHandler(GetSectorQuery)
export class GetSectorQueryHandler implements IQueryHandler<GetSectorQuery, SectorResponse> {
    constructor(
        @Inject(SECTOR_REPOSITORY_PORT)
        private readonly sectorRepo: SectorRepositoryPort,
    ) {}

    async execute(query: GetSectorQuery): Promise<SectorResponse> {
        const sector = await this.sectorRepo.findOneById(query.sectorId);
        if (!sector) {
            throw new SectorNotFoundError(query.sectorId);
        }

        return {
            id: sector.id as string,
            name: sector.name,
            description: sector.description,
            warehouseId: sector.warehouseId,
            dimensions: {
                length: sector.dimensions.length,
                width: sector.dimensions.width,
                height: sector.dimensions.height,
                unit: sector.dimensions.unit,
            },
            capabilities: sector.capabilities,
            status: sector.status,
        };
    }
}
