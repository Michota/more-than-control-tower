import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler, QueryBus } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { GetGoodExistsQuery, type GetGoodExistsResponse } from "../../../../shared/queries/get-good-exists.query.js";
import { GoodNotFoundForAssignmentError, OrderNotFoundError } from "../../domain/order.errors.js";
import type { OrderRepositoryPort } from "../../database/order.repository.port.js";
import { ORDER_REPOSITORY_PORT } from "../../sales.di-tokens.js";
import { AssignGoodCommand } from "./assign-good.command.js";

@CommandHandler(AssignGoodCommand)
export class AssignGoodCommandHandler implements ICommandHandler<AssignGoodCommand> {
    constructor(
        @Inject(ORDER_REPOSITORY_PORT)
        private readonly orderRepo: OrderRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly queryBus: QueryBus,
        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: AssignGoodCommand): Promise<void> {
        const order = await this.orderRepo.findOneById(cmd.orderId);

        if (!order) {
            throw new OrderNotFoundError(cmd.orderId);
        }

        const goodExists: GetGoodExistsResponse = await this.queryBus.execute(new GetGoodExistsQuery(cmd.goodId));

        if (!goodExists) {
            throw new GoodNotFoundForAssignmentError(cmd.goodId);
        }

        order.assignGood(cmd.productId, cmd.goodId);

        await this.orderRepo.save(order);
        await this.uow.commit();

        this.eventBus.publishAll(order.domainEvents);
        order.clearEvents();
    }
}
