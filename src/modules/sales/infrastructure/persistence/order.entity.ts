import { defineEntity, p } from "@mikro-orm/core";
import { OrderStatus } from "../../domain/order.status";
import { OrderLine } from "./order-line.embeddable";

const Order = defineEntity({
    name: "Order",
    tableName: "orders",
    properties: {
        id: p.uuid().primary(),
        cost: p.decimal().nullable(),
        costCurrency: p.string().length(3).nullable(),
        status: p.enum(() => OrderStatus),
        orderLines: p.embedded(OrderLine).array().default([]),
        customer: p.json(),
    },
});

export { Order };
