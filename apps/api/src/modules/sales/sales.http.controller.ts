import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiTags } from "@nestjs/swagger";
import { RequirePermission } from "../../shared/auth/decorators/require-permission.decorator.js";
import { AddProductToOrderCommand } from "./commands/add-product-to-order/add-product-to-order.command.js";
import {
    AddProductToOrderBody,
    AddProductToOrderParams,
} from "./commands/add-product-to-order/add-product-to-order.request.dto.js";
import { ChangeProductQuantityCommand } from "./commands/change-product-quantity/change-product-quantity.command.js";
import {
    ChangeProductQuantityBody,
    ChangeProductQuantityParams,
} from "./commands/change-product-quantity/change-product-quantity.request.dto.js";
import { RemoveProductFromOrderCommand } from "./commands/remove-product-from-order/remove-product-from-order.command.js";
import { RemoveProductFromOrderParams } from "./commands/remove-product-from-order/remove-product-from-order.request.dto.js";
import { DraftOrderCommand } from "./commands/draft-order/draft-order.command.js";
import { DraftOrderRequest } from "./commands/draft-order/draft-order.request.dto.js";
import { PlaceOrderCommand } from "./commands/place-order/place-order.command.js";
import { PlaceOrderParams } from "./commands/place-order/place-order.request.dto.js";
import { CancelOrderCommand } from "./commands/cancel-order/cancel-order.command.js";
import { CancelOrderParams } from "./commands/cancel-order/cancel-order.request.dto.js";
import { CompleteOrderCommand } from "./commands/complete-order/complete-order.command.js";
import { CompleteOrderParams } from "./commands/complete-order/complete-order.request.dto.js";
import { AssignGoodCommand } from "./commands/assign-good/assign-good.command.js";
import { AssignGoodBody, AssignGoodParams } from "./commands/assign-good/assign-good.request.dto.js";
import { AssignStockEntryCommand } from "./commands/assign-stock-entry/assign-stock-entry.command.js";
import {
    AssignStockEntryBody,
    AssignStockEntryParams,
} from "./commands/assign-stock-entry/assign-stock-entry.request.dto.js";
import { GetOrderQuery, type OrderResponse } from "./queries/get-order/get-order.query.js";
import { ListOrdersQuery, type ListOrdersResponse } from "./queries/list-orders/list-orders.query.js";
import { ListOrdersRequestDto } from "./queries/list-orders/list-orders.request.dto.js";
import { SalesPermission } from "./sales.permissions.js";

@ApiTags("Sales")
@Controller("order")
export class SalesHttpController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @RequirePermission(SalesPermission.VIEW_ORDERS)
    @Get()
    async listOrders(@Query() query: ListOrdersRequestDto): Promise<ListOrdersResponse> {
        return this.queryBus.execute(
            new ListOrdersQuery(query.page ?? 1, query.limit ?? 20, query.customerId, query.status, query.search),
        );
    }

    @RequirePermission(SalesPermission.VIEW_ORDERS)
    @Get(":id")
    async getOrder(@Param("id", ParseUUIDPipe) id: string): Promise<OrderResponse> {
        return this.queryBus.execute(new GetOrderQuery(id));
    }

    @RequirePermission(SalesPermission.DRAFT_ORDER)
    @Post("draft")
    async draftOrder(@Body() body: DraftOrderRequest): Promise<{ orderId: string }> {
        const orderId = await this.commandBus.execute(
            new DraftOrderCommand({
                customerId: body.customerId,
                actorId: body.actorId,
                source: body.source,
                lines: body.lines,
                currency: body.currency,
                buyerPriceTypeId: body.buyerPriceTypeId,
            }),
        );
        return { orderId };
    }

    @RequirePermission(SalesPermission.PLACE_ORDER)
    @Post(":id/place")
    async placeOrder(@Param() params: PlaceOrderParams): Promise<void> {
        await this.commandBus.execute(new PlaceOrderCommand({ orderId: params.id }));
    }

    @RequirePermission(SalesPermission.CANCEL_ORDER)
    @Post(":id/cancel")
    async cancelOrder(@Param() params: CancelOrderParams): Promise<void> {
        await this.commandBus.execute(new CancelOrderCommand({ orderId: params.id }));
    }

    @RequirePermission(SalesPermission.COMPLETE_ORDER)
    @Post(":id/complete")
    async completeOrder(@Param() params: CompleteOrderParams): Promise<void> {
        await this.commandBus.execute(new CompleteOrderCommand({ orderId: params.id }));
    }

    @RequirePermission(SalesPermission.EDIT_DRAFT)
    @Post(":id/lines")
    async addProduct(@Param() params: AddProductToOrderParams, @Body() body: AddProductToOrderBody): Promise<void> {
        await this.commandBus.execute(
            new AddProductToOrderCommand({
                orderId: params.id,
                itemId: body.itemId,
                quantity: body.quantity,
                priceId: body.priceId,
                buyerPriceTypeId: body.buyerPriceTypeId,
            }),
        );
    }

    @RequirePermission(SalesPermission.EDIT_DRAFT)
    @Patch(":id/lines/:productId")
    async changeProductQuantity(
        @Param() params: ChangeProductQuantityParams,
        @Body() body: ChangeProductQuantityBody,
    ): Promise<void> {
        await this.commandBus.execute(
            new ChangeProductQuantityCommand({
                orderId: params.id,
                itemId: params.productId,
                quantity: body.quantity,
                priceId: body.priceId,
                buyerPriceTypeId: body.buyerPriceTypeId,
            }),
        );
    }

    @RequirePermission(SalesPermission.EDIT_DRAFT)
    @Delete(":id/lines/:productId")
    async removeProduct(@Param() params: RemoveProductFromOrderParams): Promise<void> {
        await this.commandBus.execute(
            new RemoveProductFromOrderCommand({
                orderId: params.id,
                itemId: params.productId,
            }),
        );
    }

    @RequirePermission(SalesPermission.ASSIGN_GOOD)
    @Post(":id/lines/:productId/assign-good")
    async assignGood(@Param() params: AssignGoodParams, @Body() body: AssignGoodBody): Promise<void> {
        await this.commandBus.execute(
            new AssignGoodCommand({
                orderId: params.id,
                productId: params.productId,
                goodId: body.goodId,
            }),
        );
    }

    @RequirePermission(SalesPermission.ASSIGN_STOCK_ENTRY)
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
