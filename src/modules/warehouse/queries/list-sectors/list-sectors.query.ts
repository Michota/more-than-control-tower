import { Query } from "@nestjs/cqrs";

export interface SectorListItem {
    id: string;
    name: string;
    description?: string;
    warehouseId: string;
    dimensions: { length: number; width: number; height: number; unit: string };
    capabilities: string[];
    weightCapacityGrams: number;
    status: string;
}

export type ListSectorsResponse = SectorListItem[];

export class ListSectorsQuery extends Query<ListSectorsResponse> {
    constructor(public readonly warehouseId: string) {
        super();
    }
}
