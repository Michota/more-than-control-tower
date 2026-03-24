import { Query } from "@nestjs/cqrs";

export interface SectorLoadResponse {
    sectorId: string;
    name: string;
    capabilities: string[];
    weightCapacityGrams: number;
    currentLoadGrams: number;
    loadPercentage: number;
}

export class GetSectorLoadQuery extends Query<SectorLoadResponse> {
    constructor(public readonly sectorId: string) {
        super();
    }
}
