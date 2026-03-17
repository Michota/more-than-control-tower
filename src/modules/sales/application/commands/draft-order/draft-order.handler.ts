import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { IdOfEntity } from "@src/libs/ddd/aggregate-root.abstract.js";
import { UNIT_OF_WORK_PORT } from "@src/shared/ports/tokens.js";
import type { UnitOfWorkPort } from "@src/shared/ports/unit-of-work.port.js";
import { OrderAggregate } from "../../../domain/order.aggregate.js";
import type { OrderRepositoryPort } from "../../../infrastructure/order.repository.port.js";
import { ORDER_REPOSITORY_PORT } from "../../ports/tokens.js";
import { DraftOrderCommand } from "./draft-order.command.js";

// TODO: not tested - might not work really.

@CommandHandler(DraftOrderCommand)
export class DraftOrderHandler implements ICommandHandler<DraftOrderCommand> {
    constructor(
        @Inject(ORDER_REPOSITORY_PORT)
        private readonly orderRepo: OrderRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: DraftOrderCommand): Promise<IdOfEntity<OrderAggregate>> {
        const order = OrderAggregate.draft({
            customer: cmd.customer,
            orderLines: cmd.orderLines,
        });

        await this.orderRepo.save(order);

        await this.uow.commit();

        for (const event of order.domainEvents) {
            await this.eventBus.publish(event);
        }

        order.clearEvents();

        return order.id;
    }
}
