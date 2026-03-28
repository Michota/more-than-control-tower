import { Body, Controller, Param, Post } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { DraftOrderCommand } from "./commands/draft-order/draft-order.command.js";
import { DraftOrderRequest } from "./commands/draft-order/draft-order.request.dto.js";
import { PlaceOrderCommand } from "./commands/place-order/place-order.command.js";
import { PlaceOrderParams } from "./commands/place-order/place-order.request.dto.js";
import { CancelOrderCommand } from "./commands/cancel-order/cancel-order.command.js";
import { CancelOrderParams } from "./commands/cancel-order/cancel-order.request.dto.js";
import { CompleteOrderCommand } from "./commands/complete-order/complete-order.command.js";
import { CompleteOrderParams } from "./commands/complete-order/complete-order.request.dto.js";
import { AssignStockEntryCommand } from "./commands/assign-stock-entry/assign-stock-entry.command.js";
import {
    AssignStockEntryBody,
    AssignStockEntryParams,
} from "./commands/assign-stock-entry/assign-stock-entry.request.dto.js";

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

    @Post(":id/place")
    async placeOrder(@Param() params: PlaceOrderParams): Promise<void> {
        await this.commandBus.execute(new PlaceOrderCommand({ orderId: params.id }));
    }

    @Post(":id/cancel")
    async cancelOrder(@Param() params: CancelOrderParams): Promise<void> {
        await this.commandBus.execute(new CancelOrderCommand({ orderId: params.id }));
    }

    @Post(":id/complete")
    async completeOrder(@Param() params: CompleteOrderParams): Promise<void> {
        await this.commandBus.execute(new CompleteOrderCommand({ orderId: params.id }));
    }

    @Post(":id/lines/:productId/assign-stock-entry")
    async assignStockEntry(@Param() params: AssignStockEntryParams, @Body() body: AssignStockEntryBody): Promise<void> {
        await this.commandBus.execute(
            new AssignStockEntryCommand({
                orderId: params.id,
                productId: params.productId,
                stockEntryId: body.stockEntryId,
            }),
        );
    }
}
