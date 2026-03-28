import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RequirePermission } from "../../shared/auth/decorators/require-permission.decorator.js";
import { FreightPermission } from "./freight.permissions.js";
import type { UUID } from "crypto";

// Vehicle imports
import { CreateVehicleCommand } from "./commands/create-vehicle/create-vehicle.command.js";
import { CreateVehicleRequestDto } from "./commands/create-vehicle/create-vehicle.request.dto.js";
import { EditVehicleCommand } from "./commands/edit-vehicle/edit-vehicle.command.js";
import { EditVehicleRequestDto } from "./commands/edit-vehicle/edit-vehicle.request.dto.js";
import {
    ActivateVehicleCommand,
    DeactivateVehicleCommand,
} from "./commands/change-vehicle-status/change-vehicle-status.command.js";
import { VehicleIdResponseDto, VehicleResponseDto } from "./dtos/vehicle.response.dto.js";
import { EligibleDriverResponseDto } from "./dtos/eligible-driver.response.dto.js";
import { ListVehiclesQuery } from "./queries/list-vehicles/list-vehicles.query.js";
import { GetVehicleQuery } from "./queries/get-vehicle/get-vehicle.query.js";
import { ListEligibleDriversQuery } from "./queries/list-eligible-drivers/list-eligible-drivers.query.js";

// Route imports
import { CreateRouteCommand } from "./commands/create-route/create-route.command.js";
import { CreateRouteRequestDto } from "./commands/create-route/create-route.request.dto.js";
import { EditRouteCommand } from "./commands/edit-route/edit-route.command.js";
import { EditRouteRequestDto } from "./commands/edit-route/edit-route.request.dto.js";
import { ArchiveRouteCommand } from "./commands/archive-route/archive-route.command.js";
import {
    ActivateRouteCommand,
    DeactivateRouteCommand,
} from "./commands/change-route-status/change-route-status.command.js";
import { RouteIdResponseDto, RouteResponseDto } from "./dtos/route.response.dto.js";
import { ListRoutesQuery } from "./queries/list-routes/list-routes.query.js";
import { GetRouteQuery } from "./queries/get-route/get-route.query.js";

// Journey imports
import { CreateJourneyCommand } from "./commands/create-journey/create-journey.command.js";
import { CreateJourneyRequestDto } from "./commands/create-journey/create-journey.request.dto.js";
import { StartJourneyCommand } from "./commands/start-journey/start-journey.command.js";
import { CompleteJourneyCommand } from "./commands/complete-journey/complete-journey.command.js";
import { CancelJourneyCommand } from "./commands/cancel-journey/cancel-journey.command.js";
import { RequestJourneyLoadingCommand } from "./commands/request-journey-loading/request-journey-loading.command.js";
import { RequestJourneyLoadingRequestDto } from "./commands/request-journey-loading/request-journey-loading.request.dto.js";
import { CancelJourneyLoadingCommand } from "./commands/cancel-journey-loading/cancel-journey-loading.command.js";
import { AddJourneyStopCommand } from "./commands/add-journey-stop/add-journey-stop.command.js";
import { AddJourneyStopRequestDto } from "./commands/add-journey-stop/add-journey-stop.request.dto.js";
import { RemoveJourneyStopCommand } from "./commands/remove-journey-stop/remove-journey-stop.command.js";
import { AssignOrderToStopCommand } from "./commands/assign-order-to-stop/assign-order-to-stop.command.js";
import { UnassignOrderFromStopCommand } from "./commands/unassign-order-from-stop/unassign-order-from-stop.command.js";
import { ReorderJourneyStopsCommand } from "./commands/reorder-journey-stops/reorder-journey-stops.command.js";
import { ReorderJourneyStopsRequestDto } from "./commands/reorder-journey-stops/reorder-journey-stops.request.dto.js";
import { JourneyIdResponseDto, JourneyResponseDto } from "./dtos/journey.response.dto.js";
import { ListJourneysQuery } from "./queries/list-journeys/list-journeys.query.js";
import { GetJourneyQuery } from "./queries/get-journey/get-journey.query.js";
import { CheckJourneyAvailabilityQuery } from "./queries/check-journey-availability/check-journey-availability.query.js";

@ApiTags("Freight")
@Controller("freight")
export class FreightHttpController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    // ─── Vehicles ───────────────────────────────────────────

    @Get("vehicles")
    @RequirePermission(FreightPermission.VIEW_VEHICLES)
    @ApiOperation({ summary: "List all vehicles" })
    @ApiResponse({ status: 200, type: [VehicleResponseDto] })
    async listVehicles(): Promise<VehicleResponseDto[]> {
        return this.queryBus.execute(new ListVehiclesQuery());
    }

    @Get("vehicles/:id")
    @RequirePermission(FreightPermission.VIEW_VEHICLES)
    @ApiOperation({ summary: "Get vehicle details" })
    @ApiResponse({ status: 200, type: VehicleResponseDto })
    async getVehicle(@Param("id", ParseUUIDPipe) id: UUID): Promise<VehicleResponseDto> {
        return this.queryBus.execute(new GetVehicleQuery(id));
    }

    @Post("vehicles")
    @RequirePermission(FreightPermission.CREATE_VEHICLE)
    @ApiOperation({ summary: "Create a new vehicle" })
    @ApiResponse({ status: 201, type: VehicleIdResponseDto })
    async createVehicle(@Body() body: CreateVehicleRequestDto): Promise<VehicleIdResponseDto> {
        const vehicleId = await this.commandBus.execute(
            new CreateVehicleCommand({
                name: body.name,
                requiredLicenseCategory: body.requiredLicenseCategory,
                attributes: body.attributes,
                vin: body.vin,
                licensePlate: body.licensePlate,
                note: body.note,
                warehouseId: body.warehouseId,
            }),
        );
        return { vehicleId };
    }

    @Patch("vehicles/:id")
    @RequirePermission(FreightPermission.EDIT_VEHICLE)
    @ApiOperation({ summary: "Edit vehicle properties (partial update)" })
    @ApiResponse({ status: 200 })
    async editVehicle(@Param("id", ParseUUIDPipe) id: UUID, @Body() body: EditVehicleRequestDto): Promise<void> {
        await this.commandBus.execute(
            new EditVehicleCommand({
                vehicleId: id,
                name: body.name,
                requiredLicenseCategory: body.requiredLicenseCategory,
                attributes: body.attributes,
                vin: body.vin,
                licensePlate: body.licensePlate,
                note: body.note,
                warehouseId: body.warehouseId,
            }),
        );
    }

    @Get("vehicles/:id/eligible-drivers")
    @RequirePermission(FreightPermission.VIEW_VEHICLES)
    @ApiOperation({ summary: "List drivers eligible to operate this vehicle (based on license category)" })
    @ApiResponse({ status: 200, type: [EligibleDriverResponseDto] })
    async listEligibleDrivers(@Param("id", ParseUUIDPipe) id: UUID): Promise<EligibleDriverResponseDto[]> {
        return this.queryBus.execute(new ListEligibleDriversQuery(id));
    }

    @Post("vehicles/:id/activate")
    @RequirePermission(FreightPermission.CHANGE_VEHICLE_STATUS)
    @ApiOperation({ summary: "Activate a vehicle" })
    @ApiResponse({ status: 200 })
    async activateVehicle(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new ActivateVehicleCommand({ vehicleId: id }));
    }

    @Post("vehicles/:id/deactivate")
    @RequirePermission(FreightPermission.CHANGE_VEHICLE_STATUS)
    @ApiOperation({ summary: "Deactivate a vehicle" })
    @ApiResponse({ status: 200 })
    async deactivateVehicle(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new DeactivateVehicleCommand({ vehicleId: id }));
    }

    // ─── Routes ─────────────────────────────────────────────

    @Get("routes")
    @RequirePermission(FreightPermission.VIEW_ROUTES)
    @ApiOperation({ summary: "List all routes" })
    @ApiResponse({ status: 200, type: [RouteResponseDto] })
    async listRoutes(): Promise<RouteResponseDto[]> {
        return this.queryBus.execute(new ListRoutesQuery());
    }

    @Get("routes/:id")
    @RequirePermission(FreightPermission.VIEW_ROUTES)
    @ApiOperation({ summary: "Get route details" })
    @ApiResponse({ status: 200, type: RouteResponseDto })
    async getRoute(@Param("id", ParseUUIDPipe) id: UUID): Promise<RouteResponseDto> {
        return this.queryBus.execute(new GetRouteQuery(id));
    }

    @Post("routes")
    @RequirePermission(FreightPermission.CREATE_ROUTE)
    @ApiOperation({ summary: "Create a new route (minimal — redirects to edit view)" })
    @ApiResponse({ status: 201, type: RouteIdResponseDto })
    async createRoute(@Body() body: CreateRouteRequestDto): Promise<RouteIdResponseDto> {
        const routeId = await this.commandBus.execute(new CreateRouteCommand({ name: body.name }));
        return { routeId };
    }

    @Patch("routes/:id")
    @RequirePermission(FreightPermission.EDIT_ROUTE)
    @ApiOperation({ summary: "Edit route properties (partial update)" })
    @ApiResponse({ status: 200 })
    async editRoute(@Param("id", ParseUUIDPipe) id: UUID, @Body() body: EditRouteRequestDto): Promise<void> {
        await this.commandBus.execute(
            new EditRouteCommand({
                routeId: id,
                name: body.name,
                vehicleIds: body.vehicleIds,
                representativeIds: body.representativeIds,
                stops: body.stops,
                schedule: body.schedule,
            }),
        );
    }

    @Post("routes/:id/activate")
    @RequirePermission(FreightPermission.CHANGE_ROUTE_STATUS)
    @ApiOperation({ summary: "Activate a route" })
    @ApiResponse({ status: 200 })
    async activateRoute(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new ActivateRouteCommand({ routeId: id }));
    }

    @Post("routes/:id/deactivate")
    @RequirePermission(FreightPermission.CHANGE_ROUTE_STATUS)
    @ApiOperation({ summary: "Deactivate a route" })
    @ApiResponse({ status: 200 })
    async deactivateRoute(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new DeactivateRouteCommand({ routeId: id }));
    }

    @Post("routes/:id/archive")
    @RequirePermission(FreightPermission.ARCHIVE_ROUTE)
    @ApiOperation({ summary: "Archive a route (irreversible)" })
    @ApiResponse({ status: 200 })
    async archiveRoute(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new ArchiveRouteCommand({ routeId: id }));
    }

    // ─── Journeys ───────────────────────────────────────────

    @Get("journeys/availability")
    @RequirePermission(FreightPermission.VIEW_JOURNEYS)
    @ApiOperation({ summary: "Check vehicle and representative availability for a date" })
    @ApiResponse({ status: 200 })
    async checkAvailability(
        @Query("date") date: string,
        @Query("vehicleIds") vehicleIds?: string,
        @Query("representativeIds") representativeIds?: string,
        @Query("excludeJourneyId") excludeJourneyId?: string,
    ) {
        return this.queryBus.execute(
            new CheckJourneyAvailabilityQuery(
                date,
                vehicleIds ? vehicleIds.split(",") : [],
                representativeIds ? representativeIds.split(",") : [],
                excludeJourneyId,
            ),
        );
    }

    @Get("journeys")
    @RequirePermission(FreightPermission.VIEW_JOURNEYS)
    @ApiOperation({ summary: "List all journeys" })
    @ApiResponse({ status: 200, type: [JourneyResponseDto] })
    async listJourneys(): Promise<JourneyResponseDto[]> {
        return this.queryBus.execute(new ListJourneysQuery());
    }

    @Get("journeys/:id")
    @RequirePermission(FreightPermission.VIEW_JOURNEYS)
    @ApiOperation({ summary: "Get journey details" })
    @ApiResponse({ status: 200, type: JourneyResponseDto })
    async getJourney(@Param("id", ParseUUIDPipe) id: UUID): Promise<JourneyResponseDto> {
        return this.queryBus.execute(new GetJourneyQuery(id));
    }

    @Post("journeys")
    @RequirePermission(FreightPermission.CREATE_JOURNEY)
    @ApiOperation({ summary: "Create a journey from a route template" })
    @ApiResponse({ status: 201, type: JourneyIdResponseDto })
    async createJourney(@Body() body: CreateJourneyRequestDto): Promise<JourneyIdResponseDto> {
        const journeyId = await this.commandBus.execute(
            new CreateJourneyCommand({
                routeId: body.routeId,
                scheduledDate: body.scheduledDate,
            }),
        );
        return { journeyId };
    }

    @Post("journeys/:id/request-loading")
    @RequirePermission(FreightPermission.CREATE_JOURNEY)
    @ApiOperation({ summary: "Request vehicle loading for a planned journey (PLANNED → AWAITING_LOADING)" })
    @ApiResponse({ status: 200 })
    async requestLoading(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Body() body: RequestJourneyLoadingRequestDto,
    ): Promise<void> {
        await this.commandBus.execute(
            new RequestJourneyLoadingCommand({
                journeyId: id,
                loadingDeadline: body.loadingDeadline,
                fromWarehouseId: body.fromWarehouseId,
            }),
        );
    }

    @Post("journeys/:id/cancel-loading")
    @RequirePermission(FreightPermission.CREATE_JOURNEY)
    @ApiOperation({ summary: "Cancel loading request (AWAITING_LOADING → PLANNED)" })
    @ApiResponse({ status: 200 })
    async cancelLoading(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new CancelJourneyLoadingCommand({ journeyId: id }));
    }

    @Post("journeys/:id/start")
    @RequirePermission(FreightPermission.START_JOURNEY)
    @ApiOperation({ summary: "Start a journey (AWAITING_LOADING → IN_PROGRESS)" })
    @ApiResponse({ status: 200 })
    async startJourney(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new StartJourneyCommand({ journeyId: id }));
    }

    @Post("journeys/:id/complete")
    @RequirePermission(FreightPermission.COMPLETE_JOURNEY)
    @ApiOperation({ summary: "Complete an in-progress journey" })
    @ApiResponse({ status: 200 })
    async completeJourney(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new CompleteJourneyCommand({ journeyId: id }));
    }

    @Post("journeys/:id/cancel")
    @RequirePermission(FreightPermission.CANCEL_JOURNEY)
    @ApiOperation({ summary: "Cancel a journey" })
    @ApiResponse({ status: 200 })
    async cancelJourney(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new CancelJourneyCommand({ journeyId: id }));
    }

    // ─── Journey Stop Management ────────────────────────────

    @Post("journeys/:id/stops")
    @RequirePermission(FreightPermission.CREATE_JOURNEY)
    @ApiOperation({ summary: "Add a stop to a planned journey" })
    @ApiResponse({ status: 200 })
    async addJourneyStop(@Param("id", ParseUUIDPipe) id: UUID, @Body() body: AddJourneyStopRequestDto): Promise<void> {
        await this.commandBus.execute(
            new AddJourneyStopCommand({
                journeyId: id,
                customerId: body.customerId,
                customerName: body.customerName,
                address: body.address,
                sequence: body.sequence,
            }),
        );
    }

    @Delete("journeys/:id/stops/:customerId")
    @RequirePermission(FreightPermission.CREATE_JOURNEY)
    @ApiOperation({ summary: "Remove a stop from a planned journey" })
    @ApiResponse({ status: 200 })
    async removeJourneyStop(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Param("customerId", ParseUUIDPipe) customerId: UUID,
    ): Promise<void> {
        await this.commandBus.execute(new RemoveJourneyStopCommand({ journeyId: id, customerId }));
    }

    @Post("journeys/:id/stops/:customerId/orders/:orderId")
    @RequirePermission(FreightPermission.CREATE_JOURNEY)
    @ApiOperation({ summary: "Assign an order to a journey stop" })
    @ApiResponse({ status: 200 })
    async assignOrderToStop(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Param("customerId", ParseUUIDPipe) customerId: UUID,
        @Param("orderId", ParseUUIDPipe) orderId: UUID,
    ): Promise<void> {
        await this.commandBus.execute(new AssignOrderToStopCommand({ journeyId: id, customerId, orderId }));
    }

    @Delete("journeys/:id/stops/:customerId/orders/:orderId")
    @RequirePermission(FreightPermission.CREATE_JOURNEY)
    @ApiOperation({ summary: "Unassign an order from a journey stop" })
    @ApiResponse({ status: 200 })
    async unassignOrderFromStop(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Param("customerId", ParseUUIDPipe) customerId: UUID,
        @Param("orderId", ParseUUIDPipe) orderId: UUID,
    ): Promise<void> {
        await this.commandBus.execute(new UnassignOrderFromStopCommand({ journeyId: id, customerId, orderId }));
    }

    @Put("journeys/:id/stops/reorder")
    @RequirePermission(FreightPermission.CREATE_JOURNEY)
    @ApiOperation({ summary: "Reorder stops on a planned journey" })
    @ApiResponse({ status: 200 })
    async reorderJourneyStops(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Body() body: ReorderJourneyStopsRequestDto,
    ): Promise<void> {
        await this.commandBus.execute(
            new ReorderJourneyStopsCommand({ journeyId: id, stopSequences: body.stopSequences }),
        );
    }
}
