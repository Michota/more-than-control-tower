import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler, QueryBus } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { GetStockEntryQuery, type GetStockEntryResponse } from "../../../../shared/queries/get-stock-entry.query.js";
import { OrderNotFoundError, StockEntryAlreadyAssignedError } from "../../domain/order.errors.js";
import { StockEntryNotFoundForAssignmentError } from "../../domain/order.errors.js";
import type { OrderRepositoryPort } from "../../database/order.repository.port.js";
import { ORDER_REPOSITORY_PORT } from "../../sales.di-tokens.js";
import { AssignStockEntryCommand } from "./assign-stock-entry.command.js";

@CommandHandler(AssignStockEntryCommand)
export class AssignStockEntryCommandHandler implements ICommandHandler<AssignStockEntryCommand> {
    constructor(
        @Inject(ORDER_REPOSITORY_PORT)
        private readonly orderRepo: OrderRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly queryBus: QueryBus,
        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: AssignStockEntryCommand): Promise<void> {
        const order = await this.orderRepo.findOneById(cmd.orderId);

        if (!order) {
            throw new OrderNotFoundError(cmd.orderId);
        }

        const stockEntry: GetStockEntryResponse = await this.queryBus.execute(new GetStockEntryQuery(cmd.stockEntryId));

        if (!stockEntry) {
            throw new StockEntryNotFoundForAssignmentError(cmd.stockEntryId);
        }

        const alreadyAssigned = await this.orderRepo.isStockEntryAssigned(cmd.stockEntryId);

        if (alreadyAssigned) {
            throw new StockEntryAlreadyAssignedError(cmd.stockEntryId);
        }

        order.assignStockEntry(cmd.productId, cmd.stockEntryId);

        await this.orderRepo.save(order);
        await this.uow.commit();

        this.eventBus.publishAll(order.domainEvents);
        order.clearEvents();
    }
}
