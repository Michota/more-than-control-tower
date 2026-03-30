import { defineEntity, p } from "@mikro-orm/core";
import { OrderLine } from "./order-line.embeddable";
import { currency } from "../../../shared/persistence/currency.property";
import { OrderStatus } from "./order-status.enum";

const OrderSchema = defineEntity({
    name: "Order",
    tableName: "order",
    properties: {
        id: p.uuid().primary(),
        cost: p.decimal().nullable(),
        currency,
        status: p.enum(() => OrderStatus),
        orderLines: p.embedded(OrderLine).array().default([]),
        customerId: p.uuid(),
        actorId: p.uuid(),
        source: p.string(),
    },
});

class Order extends OrderSchema.class {}

OrderSchema.setClass(Order);

export { Order, OrderSchema };
