import { MikroORM } from "@mikro-orm/postgresql";
import { CommandBus, CqrsModule, QueryBus } from "@nestjs/cqrs";
import { Test, TestingModule } from "@nestjs/testing";
import { TestMikroOrmDatabaseModule } from "../../shared/testing/test-mikro-orm-database.module";
import { DriverLicenseCategory } from "./domain/driver-license-category.enum";
import { VehicleStatus } from "./domain/vehicle-status.enum";
import { RouteStatus } from "./domain/route-status.enum";
import { JourneyStatus } from "./domain/journey-status.enum";
import { CrewMemberRole } from "./domain/crew-member-role.enum";
import { ScheduleType } from "./domain/route-schedule.value-object";
import { VehicleAlreadyActiveError, VehicleAlreadyInactiveError, VehicleNotFoundError } from "./domain/vehicle.errors";
import {
    RouteAlreadyArchivedError,
    RouteArchivedCannotBeModifiedError,
    RouteNotFoundError,
} from "./domain/route.errors";
import {
    JourneyAlreadyCompletedError,
    JourneyCannotStartError,
    JourneyNotInProgressError,
    JourneyNotAwaitingLoadingError,
} from "./domain/journey.errors";

// Vehicle commands & queries
import { CreateVehicleCommand } from "./commands/create-vehicle/create-vehicle.command";
import { EditVehicleCommand } from "./commands/edit-vehicle/edit-vehicle.command";
import {
    ActivateVehicleCommand,
    DeactivateVehicleCommand,
} from "./commands/change-vehicle-status/change-vehicle-status.command";
import { ListVehiclesQuery } from "./queries/list-vehicles/list-vehicles.query";
import { GetVehicleQuery } from "./queries/get-vehicle/get-vehicle.query";

// Route commands & queries
import { CreateRouteCommand } from "./commands/create-route/create-route.command";
import { EditRouteCommand } from "./commands/edit-route/edit-route.command";
import { ArchiveRouteCommand } from "./commands/archive-route/archive-route.command";
import {
    ActivateRouteCommand,
    DeactivateRouteCommand,
} from "./commands/change-route-status/change-route-status.command";
import { ListRoutesQuery } from "./queries/list-routes/list-routes.query";
import { GetRouteQuery } from "./queries/get-route/get-route.query";

// Journey commands & queries
import { CreateJourneyCommand } from "./commands/create-journey/create-journey.command";
import { StartJourneyCommand } from "./commands/start-journey/start-journey.command";
import { CompleteJourneyCommand } from "./commands/complete-journey/complete-journey.command";
import { CancelJourneyCommand } from "./commands/cancel-journey/cancel-journey.command";
import { RequestJourneyLoadingCommand } from "./commands/request-journey-loading/request-journey-loading.command";
import { CancelJourneyLoadingCommand } from "./commands/cancel-journey-loading/cancel-journey-loading.command";
import { ListJourneysQuery } from "./queries/list-journeys/list-journeys.query";
import { GetJourneyQuery } from "./queries/get-journey/get-journey.query";

import { FreightModule } from "./freight.module";
import { PermissionRegistryModule } from "../../shared/infrastructure/permission-registry.module";

describe("Freight Module — Integration Tests", () => {
    let moduleRef: TestingModule;
    let commandBus: CommandBus;
    let queryBus: QueryBus;
    let orm: MikroORM;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [TestMikroOrmDatabaseModule(), CqrsModule.forRoot(), PermissionRegistryModule, FreightModule],
        }).compile();

        await moduleRef.init();

        commandBus = moduleRef.get(CommandBus);
        queryBus = moduleRef.get(QueryBus);
        orm = moduleRef.get(MikroORM);

        await orm.schema.refresh();
    });

    afterAll(async () => {
        await orm.close(true);
        await moduleRef.close();
    });

    // ─── Helpers ───────────────────────────────────────────────

    async function createVehicle(overrides: Partial<CreateVehicleCommand> = {}): Promise<string> {
        return commandBus.execute(
            new CreateVehicleCommand({
                name: overrides.name ?? "Test Vehicle",
                requiredLicenseCategory: overrides.requiredLicenseCategory ?? DriverLicenseCategory.C,
                attributes: overrides.attributes,
                note: overrides.note,
                warehouseId: overrides.warehouseId,
            }),
        );
    }

    async function createRoute(name = "Test Route"): Promise<string> {
        return commandBus.execute(new CreateRouteCommand({ name }));
    }

    async function createRouteWithCrew(name = "Test Route"): Promise<string> {
        const routeId = await createRoute(name);
        await commandBus.execute(
            new EditRouteCommand({
                routeId,
                crewMembers: [
                    { employeeId: "d1", employeeName: "Adam Nowak", role: CrewMemberRole.DRIVER },
                    { employeeId: "r1", employeeName: "Jan Kowalski", role: CrewMemberRole.RSR },
                ],
            }),
        );
        return routeId;
    }

    async function createJourney(routeId: string, scheduledDate = "2026-04-01"): Promise<string> {
        return commandBus.execute(new CreateJourneyCommand({ routeId, scheduledDate }));
    }

    // ─── Vehicles ─────────────────────────────────────────────

    describe("Vehicles", () => {
        it("creates a vehicle and retrieves it", async () => {
            const vehicleId = await createVehicle({ name: "Truck Alpha" });

            const vehicle = await queryBus.execute(new GetVehicleQuery(vehicleId));

            expect(vehicle.id).toBe(vehicleId);
            expect(vehicle.name).toBe("Truck Alpha");
            expect(vehicle.status).toBe(VehicleStatus.ACTIVE);
            expect(vehicle.requiredLicenseCategory).toBe(DriverLicenseCategory.C);
        });

        it("creates a vehicle with attributes", async () => {
            const vehicleId = await createVehicle({
                name: "Fridge Truck",
                attributes: [{ name: "has-fridge", value: "true" }],
            });

            const vehicle = await queryBus.execute(new GetVehicleQuery(vehicleId));

            expect(vehicle.attributes).toHaveLength(1);
            expect(vehicle.attributes[0]).toEqual({ name: "has-fridge", value: "true" });
        });

        it("lists all vehicles", async () => {
            const vehicles = await queryBus.execute(new ListVehiclesQuery());
            expect(vehicles.length).toBeGreaterThanOrEqual(1);
        });

        it("edits a vehicle", async () => {
            const vehicleId = await createVehicle({ name: "Old Name" });

            await commandBus.execute(
                new EditVehicleCommand({
                    vehicleId,
                    name: "New Name",
                    note: "Updated",
                    requiredLicenseCategory: DriverLicenseCategory.B,
                }),
            );

            const vehicle = await queryBus.execute(new GetVehicleQuery(vehicleId));
            expect(vehicle.name).toBe("New Name");
            expect(vehicle.note).toBe("Updated");
            expect(vehicle.requiredLicenseCategory).toBe(DriverLicenseCategory.B);
        });

        it("deactivates and activates a vehicle", async () => {
            const vehicleId = await createVehicle();

            await commandBus.execute(new DeactivateVehicleCommand({ vehicleId }));
            let vehicle = await queryBus.execute(new GetVehicleQuery(vehicleId));
            expect(vehicle.status).toBe(VehicleStatus.INACTIVE);

            await commandBus.execute(new ActivateVehicleCommand({ vehicleId }));
            vehicle = await queryBus.execute(new GetVehicleQuery(vehicleId));
            expect(vehicle.status).toBe(VehicleStatus.ACTIVE);
        });

        it("throws when activating an already active vehicle", async () => {
            const vehicleId = await createVehicle();

            await expect(commandBus.execute(new ActivateVehicleCommand({ vehicleId }))).rejects.toThrow(
                VehicleAlreadyActiveError,
            );
        });

        it("throws when deactivating an already inactive vehicle", async () => {
            const vehicleId = await createVehicle();
            await commandBus.execute(new DeactivateVehicleCommand({ vehicleId }));

            await expect(commandBus.execute(new DeactivateVehicleCommand({ vehicleId }))).rejects.toThrow(
                VehicleAlreadyInactiveError,
            );
        });

        it("throws when editing a non-existent vehicle", async () => {
            await expect(
                commandBus.execute(
                    new EditVehicleCommand({ vehicleId: "00000000-0000-0000-0000-000000000000", name: "X" }),
                ),
            ).rejects.toThrow(VehicleNotFoundError);
        });
    });

    // ─── Routes ───────────────────────────────────────────────

    describe("Routes", () => {
        it("creates a route and retrieves it", async () => {
            const routeId = await createRoute("Route North");

            const route = await queryBus.execute(new GetRouteQuery(routeId));

            expect(route.id).toBe(routeId);
            expect(route.name).toBe("Route North");
            expect(route.status).toBe(RouteStatus.ACTIVE);
            expect(route.vehicleIds).toEqual([]);
            expect(route.crewMembers).toEqual([]);
            expect(route.stops).toEqual([]);
            expect(route.schedule).toBeUndefined();
        });

        it("lists all routes", async () => {
            const routes = await queryBus.execute(new ListRoutesQuery());
            expect(routes.length).toBeGreaterThanOrEqual(1);
        });

        it("edits route with vehicles, representatives, visit points, and schedule", async () => {
            const routeId = await createRoute("Route Edit Test");
            const vehicleId = await createVehicle({ name: "Route Vehicle" });

            await commandBus.execute(
                new EditRouteCommand({
                    routeId,
                    name: "Route Edited",
                    vehicleIds: [vehicleId],
                    crewMembers: [
                        { employeeId: "d1", employeeName: "Adam Nowak", role: CrewMemberRole.DRIVER },
                        { employeeId: "r1", employeeName: "Jan Kowalski", role: CrewMemberRole.RSR },
                    ],
                    stops: [
                        {
                            customerId: "c1",
                            customerName: "Sklep ABC",
                            address: {
                                country: "PL",
                                postalCode: "00-001",
                                state: "Mazowieckie",
                                city: "Warszawa",
                                street: "Marszałkowska 1",
                            },
                            sequence: 0,
                        },
                        {
                            customerId: "c2",
                            customerName: "Sklep XYZ",
                            address: {
                                country: "PL",
                                postalCode: "00-002",
                                state: "Mazowieckie",
                                city: "Warszawa",
                                street: "Nowy Świat 5",
                            },
                            sequence: 1,
                        },
                    ],
                    schedule: {
                        type: ScheduleType.DAYS_OF_WEEK,
                        daysOfWeek: [1, 3, 5],
                    },
                }),
            );

            const route = await queryBus.execute(new GetRouteQuery(routeId));
            expect(route.name).toBe("Route Edited");
            expect(route.vehicleIds).toEqual([vehicleId]);
            expect(route.crewMembers).toHaveLength(2);
            expect(route.crewMembers[0].role).toBe(CrewMemberRole.DRIVER);
            expect(route.crewMembers[1].role).toBe(CrewMemberRole.RSR);
            expect(route.stops).toHaveLength(2);
            expect(route.stops[0].customerId).toBe("c1");
            expect(route.stops[1].customerId).toBe("c2");
            expect(route.schedule).toEqual({
                type: ScheduleType.DAYS_OF_WEEK,
                daysOfWeek: [1, 3, 5],
                daysOfMonth: undefined,
                specificDates: undefined,
            });
        });

        it("deactivates and activates a route", async () => {
            const routeId = await createRoute();

            await commandBus.execute(new DeactivateRouteCommand({ routeId }));
            let route = await queryBus.execute(new GetRouteQuery(routeId));
            expect(route.status).toBe(RouteStatus.INACTIVE);

            await commandBus.execute(new ActivateRouteCommand({ routeId }));
            route = await queryBus.execute(new GetRouteQuery(routeId));
            expect(route.status).toBe(RouteStatus.ACTIVE);
        });

        it("archives a route", async () => {
            const routeId = await createRoute("Route to Archive");

            await commandBus.execute(new ArchiveRouteCommand({ routeId }));

            const route = await queryBus.execute(new GetRouteQuery(routeId));
            expect(route.status).toBe(RouteStatus.ARCHIVED);
        });

        it("throws when archiving an already archived route", async () => {
            const routeId = await createRoute();
            await commandBus.execute(new ArchiveRouteCommand({ routeId }));

            await expect(commandBus.execute(new ArchiveRouteCommand({ routeId }))).rejects.toThrow(
                RouteAlreadyArchivedError,
            );
        });

        it("throws when editing an archived route", async () => {
            const routeId = await createRoute();
            await commandBus.execute(new ArchiveRouteCommand({ routeId }));

            await expect(commandBus.execute(new EditRouteCommand({ routeId, name: "Should Fail" }))).rejects.toThrow(
                RouteArchivedCannotBeModifiedError,
            );
        });

        it("throws when getting a non-existent route", async () => {
            await expect(queryBus.execute(new GetRouteQuery("00000000-0000-0000-0000-000000000000"))).rejects.toThrow(
                RouteNotFoundError,
            );
        });
    });

    // ─── Journeys ─────────────────────────────────────────────

    describe("Journeys", () => {
        it("creates a journey from a route template", async () => {
            const routeId = await createRoute("Journey Route");
            await commandBus.execute(
                new EditRouteCommand({
                    routeId,
                    vehicleIds: ["v1"],
                    crewMembers: [
                        { employeeId: "d1", employeeName: "Adam Nowak", role: CrewMemberRole.DRIVER },
                        { employeeId: "r1", employeeName: "Jan Kowalski", role: CrewMemberRole.RSR },
                    ],
                    stops: [
                        {
                            customerId: "c1",
                            customerName: "Sklep ABC",
                            address: {
                                country: "PL",
                                postalCode: "00-001",
                                state: "Mazowieckie",
                                city: "Warszawa",
                                street: "Marszałkowska 1",
                            },
                            sequence: 0,
                        },
                    ],
                }),
            );

            const journeyId = await createJourney(routeId, "2026-04-15");

            const journey = await queryBus.execute(new GetJourneyQuery(journeyId));
            expect(journey.routeId).toBe(routeId);
            expect(journey.routeName).toBe("Journey Route");
            expect(journey.status).toBe(JourneyStatus.PLANNED);
            expect(journey.scheduledDate).toBe("2026-04-15");
            expect(journey.vehicleIds).toEqual(["v1"]);
            expect(journey.crewMembers).toHaveLength(2);
            expect(journey.crewMembers[0].role).toBe(CrewMemberRole.DRIVER);
            expect(journey.crewMembers[1].role).toBe(CrewMemberRole.RSR);
            expect(journey.stops).toHaveLength(1);
            expect(journey.stops[0].customerId).toBe("c1");
            expect(journey.stops[0].orderIds).toEqual([]);
        });

        it("lists all journeys", async () => {
            const journeys = await queryBus.execute(new ListJourneysQuery());
            expect(journeys.length).toBeGreaterThanOrEqual(1);
        });

        it("requests loading for a planned journey", async () => {
            const routeId = await createRoute();
            const journeyId = await createJourney(routeId);

            await commandBus.execute(
                new RequestJourneyLoadingCommand({
                    journeyId,
                    loadingDeadline: "2026-04-01T08:00:00.000Z",
                    fromWarehouseId: "00000000-0000-0000-0000-000000000001",
                }),
            );

            const journey = await queryBus.execute(new GetJourneyQuery(journeyId));
            expect(journey.status).toBe(JourneyStatus.AWAITING_LOADING);
            expect(journey.loadingDeadline).toBe("2026-04-01T08:00:00.000Z");
        });

        it("cancels loading and returns to PLANNED", async () => {
            const routeId = await createRoute();
            const journeyId = await createJourney(routeId);
            await commandBus.execute(
                new RequestJourneyLoadingCommand({
                    journeyId,
                    loadingDeadline: "2026-04-01T08:00:00.000Z",
                    fromWarehouseId: "00000000-0000-0000-0000-000000000001",
                }),
            );

            await commandBus.execute(new CancelJourneyLoadingCommand({ journeyId }));

            const journey = await queryBus.execute(new GetJourneyQuery(journeyId));
            expect(journey.status).toBe(JourneyStatus.PLANNED);
            expect(journey.loadingDeadline).toBeUndefined();
        });

        it("throws when canceling loading on a non-awaiting journey", async () => {
            const routeId = await createRoute();
            const journeyId = await createJourney(routeId);

            await expect(commandBus.execute(new CancelJourneyLoadingCommand({ journeyId }))).rejects.toThrow(
                JourneyNotAwaitingLoadingError,
            );
        });

        it("starts an awaiting-loading journey", async () => {
            const routeId = await createRouteWithCrew();
            const journeyId = await createJourney(routeId);
            await commandBus.execute(
                new RequestJourneyLoadingCommand({
                    journeyId,
                    loadingDeadline: "2026-04-01T08:00:00.000Z",
                    fromWarehouseId: "00000000-0000-0000-0000-000000000001",
                }),
            );

            await commandBus.execute(new StartJourneyCommand({ journeyId }));

            const journey = await queryBus.execute(new GetJourneyQuery(journeyId));
            expect(journey.status).toBe(JourneyStatus.IN_PROGRESS);
        });

        it("completes an in-progress journey", async () => {
            const routeId = await createRouteWithCrew();
            const journeyId = await createJourney(routeId);
            await commandBus.execute(
                new RequestJourneyLoadingCommand({
                    journeyId,
                    loadingDeadline: "2026-04-01T08:00:00.000Z",
                    fromWarehouseId: "00000000-0000-0000-0000-000000000001",
                }),
            );
            await commandBus.execute(new StartJourneyCommand({ journeyId }));

            await commandBus.execute(new CompleteJourneyCommand({ journeyId }));

            const journey = await queryBus.execute(new GetJourneyQuery(journeyId));
            expect(journey.status).toBe(JourneyStatus.COMPLETED);
        });

        it("cancels a planned journey", async () => {
            const routeId = await createRoute();
            const journeyId = await createJourney(routeId);

            await commandBus.execute(new CancelJourneyCommand({ journeyId }));

            const journey = await queryBus.execute(new GetJourneyQuery(journeyId));
            expect(journey.status).toBe(JourneyStatus.CANCELLED);
        });

        it("throws when starting a PLANNED journey (must request loading first)", async () => {
            const routeId = await createRoute();
            const journeyId = await createJourney(routeId);

            await expect(commandBus.execute(new StartJourneyCommand({ journeyId }))).rejects.toThrow(
                JourneyCannotStartError,
            );
        });

        it("throws when completing a planned journey (not started)", async () => {
            const routeId = await createRoute();
            const journeyId = await createJourney(routeId);

            await expect(commandBus.execute(new CompleteJourneyCommand({ journeyId }))).rejects.toThrow(
                JourneyNotInProgressError,
            );
        });

        it("throws when completing an already completed journey", async () => {
            const routeId = await createRouteWithCrew();
            const journeyId = await createJourney(routeId);
            await commandBus.execute(
                new RequestJourneyLoadingCommand({
                    journeyId,
                    loadingDeadline: "2026-04-01T08:00:00.000Z",
                    fromWarehouseId: "00000000-0000-0000-0000-000000000001",
                }),
            );
            await commandBus.execute(new StartJourneyCommand({ journeyId }));
            await commandBus.execute(new CompleteJourneyCommand({ journeyId }));

            await expect(commandBus.execute(new CompleteJourneyCommand({ journeyId }))).rejects.toThrow(
                JourneyAlreadyCompletedError,
            );
        });

        it("throws when creating a journey from a non-existent route", async () => {
            await expect(
                commandBus.execute(
                    new CreateJourneyCommand({
                        routeId: "00000000-0000-0000-0000-000000000000",
                        scheduledDate: "2026-04-01",
                    }),
                ),
            ).rejects.toThrow(RouteNotFoundError);
        });
    });
});
