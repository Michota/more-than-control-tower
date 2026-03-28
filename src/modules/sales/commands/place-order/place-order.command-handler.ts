import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { OrderNotFoundError } from "../../domain/order.errors.js";
import type { OrderRepositoryPort } from "../../database/order.repository.port.js";
import { ORDER_REPOSITORY_PORT } from "../../sales.di-tokens.js";
import { PlaceOrderCommand } from "./place-order.command.js";

@CommandHandler(PlaceOrderCommand)
export class PlaceOrderCommandHandler implements ICommandHandler<PlaceOrderCommand> {
    constructor(
        @Inject(ORDER_REPOSITORY_PORT)
        private readonly orderRepo: OrderRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: PlaceOrderCommand): Promise<void> {
        const order = await this.orderRepo.findOneById(cmd.orderId);

        if (!order) {
            throw new OrderNotFoundError(cmd.orderId);
        }

        order.place();

        await this.orderRepo.save(order);
        await this.uow.commit();

        this.eventBus.publishAll(order.domainEvents);
        order.clearEvents();
    }
}
