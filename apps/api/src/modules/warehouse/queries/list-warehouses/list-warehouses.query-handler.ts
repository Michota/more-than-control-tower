import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { WarehouseRepositoryPort } from "../../database/warehouse.repository.port.js";
import { WAREHOUSE_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { ListWarehousesQuery, ListWarehousesResponse } from "./list-warehouses.query.js";

@QueryHandler(ListWarehousesQuery)
export class ListWarehousesQueryHandler implements IQueryHandler<ListWarehousesQuery, ListWarehousesResponse> {
    constructor(
        @Inject(WAREHOUSE_REPOSITORY_PORT)
        private readonly warehouseRepo: WarehouseRepositoryPort,
    ) {}

    async execute(): Promise<ListWarehousesResponse> {
        const warehouses = await this.warehouseRepo.findAll();

        return warehouses.map((w) => ({
            id: w.id as string,
            name: w.name,
            status: w.status,
            type: w.type,
            address: {
                country: w.address.country,
                postalCode: w.address.postalCode,
                state: w.address.state,
                city: w.address.city,
                street: w.address.street,
            },
        }));
    }
}
