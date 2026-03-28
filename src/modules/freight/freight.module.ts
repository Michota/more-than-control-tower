import { EntityManager } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Inject, Module, OnModuleInit } from "@nestjs/common";
import { MikroOrmUnitOfWork } from "../../shared/infrastructure/mikro-orm-unit-of-work.js";
import { NestJsLoggerAdapter } from "../../shared/infrastructure/nestjs-logger.adapter.js";
import { LOGGER_PORT, UNIT_OF_WORK_PORT } from "../../shared/ports/tokens.js";
import { PERMISSION_REGISTRY, PermissionRegistry } from "../../shared/infrastructure/permission-registry.js";

// Vehicle
import { CreateVehicleCommandHandler } from "./commands/create-vehicle/create-vehicle.command-handler.js";
import { EditVehicleCommandHandler } from "./commands/edit-vehicle/edit-vehicle.command-handler.js";
import {
    ActivateVehicleCommandHandler,
    DeactivateVehicleCommandHandler,
} from "./commands/change-vehicle-status/change-vehicle-status.command-handler.js";
import { ListVehiclesQueryHandler } from "./queries/list-vehicles/list-vehicles.query-handler.js";
import { GetVehicleQueryHandler } from "./queries/get-vehicle/get-vehicle.query-handler.js";

// Route
import { CreateRouteCommandHandler } from "./commands/create-route/create-route.command-handler.js";
import { EditRouteCommandHandler } from "./commands/edit-route/edit-route.command-handler.js";
import { ArchiveRouteCommandHandler } from "./commands/archive-route/archive-route.command-handler.js";
import {
    ActivateRouteCommandHandler,
    DeactivateRouteCommandHandler,
} from "./commands/change-route-status/change-route-status.command-handler.js";
import { ListRoutesQueryHandler } from "./queries/list-routes/list-routes.query-handler.js";
import { GetRouteQueryHandler } from "./queries/get-route/get-route.query-handler.js";

// Journey
import { CreateJourneyCommandHandler } from "./commands/create-journey/create-journey.command-handler.js";
import { StartJourneyCommandHandler } from "./commands/start-journey/start-journey.command-handler.js";
import { CompleteJourneyCommandHandler } from "./commands/complete-journey/complete-journey.command-handler.js";
import { CancelJourneyCommandHandler } from "./commands/cancel-journey/cancel-journey.command-handler.js";
import { ListJourneysQueryHandler } from "./queries/list-journeys/list-journeys.query-handler.js";
import { GetJourneyQueryHandler } from "./queries/get-journey/get-journey.query-handler.js";
import { ListEligibleDriversQueryHandler } from "./queries/list-eligible-drivers/list-eligible-drivers.query-handler.js";
import { AddJourneyStopCommandHandler } from "./commands/add-journey-stop/add-journey-stop.command-handler.js";
import { RemoveJourneyStopCommandHandler } from "./commands/remove-journey-stop/remove-journey-stop.command-handler.js";
import { AssignOrderToStopCommandHandler } from "./commands/assign-order-to-stop/assign-order-to-stop.command-handler.js";
import { UnassignOrderFromStopCommandHandler } from "./commands/unassign-order-from-stop/unassign-order-from-stop.command-handler.js";
import { ReorderJourneyStopsCommandHandler } from "./commands/reorder-journey-stops/reorder-journey-stops.command-handler.js";
import { CheckJourneyAvailabilityQueryHandler } from "./queries/check-journey-availability/check-journey-availability.query-handler.js";
import { RequestJourneyLoadingCommandHandler } from "./commands/request-journey-loading/request-journey-loading.command-handler.js";
import { CancelJourneyLoadingCommandHandler } from "./commands/cancel-journey-loading/cancel-journey-loading.command-handler.js";

// Database
import { Vehicle } from "./database/vehicle.entity.js";
import { VehicleRepository } from "./database/vehicle.repository.js";
import { Route } from "./database/route.entity.js";
import { RouteRepository } from "./database/route.repository.js";
import { Journey } from "./database/journey.entity.js";
import { JourneyRepository } from "./database/journey.repository.js";
import { VEHICLE_REPOSITORY_PORT, ROUTE_REPOSITORY_PORT, JOURNEY_REPOSITORY_PORT } from "./freight.di-tokens.js";
import { FreightHttpController } from "./freight.http.controller.js";

@Module({
    imports: [MikroOrmModule.forFeature([Vehicle, Route, Journey])],
    controllers: [FreightHttpController],
    providers: [
        // Vehicle
        CreateVehicleCommandHandler,
        EditVehicleCommandHandler,
        ActivateVehicleCommandHandler,
        DeactivateVehicleCommandHandler,
        ListVehiclesQueryHandler,
        GetVehicleQueryHandler,
        ListEligibleDriversQueryHandler,

        // Route
        CreateRouteCommandHandler,
        EditRouteCommandHandler,
        ArchiveRouteCommandHandler,
        ActivateRouteCommandHandler,
        DeactivateRouteCommandHandler,
        ListRoutesQueryHandler,
        GetRouteQueryHandler,

        // Journey
        CreateJourneyCommandHandler,
        StartJourneyCommandHandler,
        CompleteJourneyCommandHandler,
        CancelJourneyCommandHandler,
        AddJourneyStopCommandHandler,
        RemoveJourneyStopCommandHandler,
        AssignOrderToStopCommandHandler,
        UnassignOrderFromStopCommandHandler,
        ReorderJourneyStopsCommandHandler,
        RequestJourneyLoadingCommandHandler,
        CancelJourneyLoadingCommandHandler,
        ListJourneysQueryHandler,
        GetJourneyQueryHandler,
        CheckJourneyAvailabilityQueryHandler,

        // Repositories
        {
            provide: VEHICLE_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new VehicleRepository(em),
            inject: [EntityManager],
        },
        {
            provide: ROUTE_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new RouteRepository(em),
            inject: [EntityManager],
        },
        {
            provide: JOURNEY_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new JourneyRepository(em),
            inject: [EntityManager],
        },
        {
            provide: UNIT_OF_WORK_PORT,
            useFactory: (em: EntityManager) => new MikroOrmUnitOfWork(em),
            inject: [EntityManager],
        },
        {
            provide: LOGGER_PORT,
            useClass: NestJsLoggerAdapter,
        },
    ],
})
export class FreightModule implements OnModuleInit {
    constructor(
        @Inject(PERMISSION_REGISTRY)
        private readonly permissionRegistry: PermissionRegistry,
    ) {}

    onModuleInit(): void {
        this.permissionRegistry.registerForModule("freight", [
            // Vehicles
            { key: "create-vehicle", name: "Create Vehicle" },
            { key: "edit-vehicle", name: "Edit Vehicle" },
            { key: "change-vehicle-status", name: "Change Vehicle Status" },
            { key: "view-vehicles", name: "View Vehicles" },

            // Routes
            { key: "create-route", name: "Create Route" },
            { key: "edit-route", name: "Edit Route" },
            { key: "archive-route", name: "Archive Route" },
            { key: "change-route-status", name: "Change Route Status" },
            { key: "view-routes", name: "View Routes" },

            // Journeys
            { key: "create-journey", name: "Create Journey" },
            { key: "start-journey", name: "Start Journey" },
            { key: "complete-journey", name: "Complete Journey" },
            { key: "cancel-journey", name: "Cancel Journey" },
            { key: "view-journeys", name: "View Journeys" },

            // Driver License Categories
            { key: "driver-license-b", name: "Driver License Category B", description: "Vehicles up to 3.5t" },
            { key: "driver-license-c", name: "Driver License Category C", description: "Vehicles over 3.5t" },
            {
                key: "driver-license-c-e",
                name: "Driver License Category C+E",
                description: "Vehicles over 3.5t with trailer",
            },
        ]);
    }
}
