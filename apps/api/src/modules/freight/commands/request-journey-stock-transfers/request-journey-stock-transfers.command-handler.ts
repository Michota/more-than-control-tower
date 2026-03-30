import { Inject } from "@nestjs/common";
import { CommandBus, CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { RequestStockTransferCommand } from "../../../../shared/commands/request-stock-transfer.command.js";
import type { JourneyRepositoryPort } from "../../database/journey.repository.port.js";
import type { VehicleRepositoryPort } from "../../database/vehicle.repository.port.js";
import { JourneyNotFoundError, JourneyNotAwaitingLoadingError } from "../../domain/journey.errors.js";
import { VehicleNotFoundError } from "../../domain/vehicle.errors.js";
import { JourneyStatus } from "../../domain/journey-status.enum.js";
import { JOURNEY_REPOSITORY_PORT, VEHICLE_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { RequestJourneyStockTransfersCommand } from "./request-journey-stock-transfers.command.js";

@CommandHandler(RequestJourneyStockTransfersCommand)
export class RequestJourneyStockTransfersCommandHandler implements ICommandHandler<RequestJourneyStockTransfersCommand> {
    constructor(
        @Inject(JOURNEY_REPOSITORY_PORT)
        private readonly journeyRepo: JourneyRepositoryPort,

        @Inject(VEHICLE_REPOSITORY_PORT)
        private readonly vehicleRepo: VehicleRepositoryPort,

        private readonly commandBus: CommandBus,
    ) {}

    async execute(cmd: RequestJourneyStockTransfersCommand): Promise<string[]> {
        const journey = await this.journeyRepo.findOneById(cmd.journeyId);
        if (!journey) {
            throw new JourneyNotFoundError(cmd.journeyId);
        }
        if (journey.status !== JourneyStatus.AWAITING_LOADING) {
            throw new JourneyNotAwaitingLoadingError(cmd.journeyId);
        }

        // Resolve target warehouse from vehicle
        const vehicle =
            journey.vehicleIds.length > 0 ? await this.vehicleRepo.findOneById(journey.vehicleIds[0]) : null;
        if (!vehicle?.warehouseId) {
            throw new VehicleNotFoundError(journey.vehicleIds[0] ?? "none");
        }
        const toWarehouseId = vehicle.warehouseId;

        const transferRequestIds: string[] = [];

        for (const item of cmd.items) {
            const requestId: string = await this.commandBus.execute(
                new RequestStockTransferCommand({
                    goodId: item.goodId,
                    quantity: item.quantity,
                    fromWarehouseId: item.fromWarehouseId,
                    toWarehouseId,
                    note: item.note ?? `Loading for journey ${journey.id}`,
                    requestedBy: `freight:journey:${journey.id}`,
                }),
            );
            transferRequestIds.push(requestId);
        }

        return transferRequestIds;
    }
}
