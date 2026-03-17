import { Body, Controller, Post } from "@nestjs/common";
import { OrderService } from "../../application/services/order.service.js";
import { DraftOrderRequest } from "./dto/draft-order.dto.js";

@Controller("order")
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Post("draft")
    async draftOrder(@Body() body: DraftOrderRequest): Promise<{ orderId: string }> {
        // TODO: make it use ResponseDTO or RO
        const result = await this.orderService.draftOrder(body);
        return { orderId: result };
    }
}
