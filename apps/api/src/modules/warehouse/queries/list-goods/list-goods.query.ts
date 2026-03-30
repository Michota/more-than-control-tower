import { Query } from "@nestjs/cqrs";
import { Paginated } from "../../../../libs/ports/repository.port.js";

export interface GoodListItem {
    id: string;
    name: string;
    description?: string;
    weight: { value: number; unit: string };
    dimensions: { length: number; width: number; height: number; unit: string };
    parentId?: string;
}

export type ListGoodsResponse = Paginated<GoodListItem>;

export class ListGoodsQuery extends Query<ListGoodsResponse> {
    constructor(
        public readonly name: string | undefined,
        public readonly page: number,
        public readonly limit: number,
    ) {
        super();
    }
}
