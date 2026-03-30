import { Query } from "@nestjs/cqrs";
import { RouteListItem } from "../list-routes/list-routes.query.js";

export type GetRouteResponse = RouteListItem;

export class GetRouteQuery extends Query<GetRouteResponse> {
    constructor(public readonly routeId: string) {
        super();
    }
}
