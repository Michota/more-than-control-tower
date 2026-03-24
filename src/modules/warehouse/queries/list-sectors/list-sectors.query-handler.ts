import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { SectorRepositoryPort } from "../../database/sector.repository.port.js";
import { SECTOR_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { ListSectorsQuery, ListSectorsResponse } from "./list-sectors.query.js";

@QueryHandler(ListSectorsQuery)
export class ListSectorsQueryHandler implements IQueryHandler<ListSectorsQuery, ListSectorsResponse> {
    constructor(
        @Inject(SECTOR_REPOSITORY_PORT)
        private readonly sectorRepo: SectorRepositoryPort,
    ) {}

    async execute(query: ListSectorsQuery): Promise<ListSectorsResponse> {
        const sectors = await this.sectorRepo.findByWarehouseId(query.warehouseId);

        return sectors.map((s) => ({
            id: s.id as string,
            name: s.name,
            description: s.description,
            warehouseId: s.warehouseId,
            dimensions: {
                length: s.dimensions.length,
                width: s.dimensions.width,
                height: s.dimensions.height,
                unit: s.dimensions.unit,
            },
            capabilities: s.capabilities,
            status: s.status,
        }));
    }
}
