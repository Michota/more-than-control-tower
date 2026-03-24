import { Query } from "@nestjs/cqrs";

export interface WarehouseListItem {
    id: string;
    name: string;
    status: string;
    latitude: number;
    longitude: number;
    address: {
        country: string;
        postalCode: string;
        state: string;
        city: string;
        street: string;
    };
}

export type ListWarehousesResponse = WarehouseListItem[];

export class ListWarehousesQuery extends Query<ListWarehousesResponse> {
    constructor() {
        super();
    }
}
