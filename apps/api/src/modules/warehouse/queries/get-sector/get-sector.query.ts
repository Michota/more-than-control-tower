import { Query } from "@nestjs/cqrs";
import { SectorListItem } from "../list-sectors/list-sectors.query.js";

export type SectorResponse = SectorListItem;

export class GetSectorQuery extends Query<SectorResponse> {
    constructor(public readonly sectorId: string) {
        super();
    }
}
