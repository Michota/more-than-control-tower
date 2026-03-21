import { Body, Controller, Post } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { DraftOrderCommand } from "./commands/draft-order/draft-order.command.js";
import { DraftOrderRequest } from "./commands/draft-order/draft-order.request.dto.js";

@Controller("order")
export class SalesHttpController {
    constructor(private readonly commandBus: CommandBus) {}

    @Post("draft")
    async draftOrder(@Body() body: DraftOrderRequest): Promise<{ orderId: string }> {
        const orderId = await this.commandBus.execute(
            new DraftOrderCommand({
                customerId: body.customerId,
                lines: body.lines,
                currency: body.currency,
                buyerPriceTypeId: body.buyerPriceTypeId,
            }),
        );
        return { orderId };
    }
}
