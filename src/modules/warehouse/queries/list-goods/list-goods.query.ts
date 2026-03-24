import { Paginated } from "../../../../libs/ports/repository.port.js";

export interface GoodListItem {
    id: string;
    name: string;
    description?: string;
    weight: { value: number; unit: string };
    dimensions: { length: number; width: number; height: number; unit: string };
    parentId?: string;
}

export class ListGoodsQuery {
    constructor(
        public readonly name: string | undefined,
        public readonly page: number,
        public readonly limit: number,
    ) {}
}

export type ListGoodsResponse = Paginated<GoodListItem>;
