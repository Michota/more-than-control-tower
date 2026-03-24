import { Query } from "@nestjs/cqrs";

export interface GoodChildResponse {
    id: string;
    name: string;
    description?: string;
}

export interface GoodResponse {
    id: string;
    name: string;
    description?: string;
    weight: { value: number; unit: string };
    dimensions: { length: number; width: number; height: number; unit: string };
    parentId?: string;
    children: GoodChildResponse[];
}

export class GetGoodQuery extends Query<GoodResponse> {
    constructor(public readonly goodId: string) {
        super();
    }
}
