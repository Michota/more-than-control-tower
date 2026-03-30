import { Query } from "@nestjs/cqrs";
import { VehicleListItem } from "../list-vehicles/list-vehicles.query.js";

export type GetVehicleResponse = VehicleListItem;

export class GetVehicleQuery extends Query<GetVehicleResponse> {
    constructor(public readonly vehicleId: string) {
        super();
    }
}
