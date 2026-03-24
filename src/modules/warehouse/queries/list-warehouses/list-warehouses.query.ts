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

export class ListWarehousesQuery {}

export type ListWarehousesResponse = WarehouseListItem[];
