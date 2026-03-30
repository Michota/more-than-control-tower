import { Query } from "@nestjs/cqrs";

export interface VehicleListItem {
    id: string;
    name: string;
    status: string;
    requiredLicenseCategory: string;
    attributes: { name: string; value: string }[];
    vin?: string;
    licensePlate?: string;
    note?: string;
    warehouseId?: string;
}

export type ListVehiclesResponse = VehicleListItem[];

export class ListVehiclesQuery extends Query<ListVehiclesResponse> {
    constructor() {
        super();
    }
}
