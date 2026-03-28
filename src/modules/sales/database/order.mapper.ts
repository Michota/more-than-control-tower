import { RequiredEntityData } from "@mikro-orm/core";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { Currency } from "../../../shared/value-objects/currency.js";
import { Money } from "../../../shared/value-objects/money.js";
import Decimal from "decimal.js";
import { OrderLine as DomainOrderLine } from "../domain/order-line.value-object.js";
import { OrderLines } from "../domain/order-lines.value-object.js";
import { OrderItemEntity } from "../domain/order-item.entity.js";
import { OrderAggregate } from "../domain/order.aggregate.js";
import { OrderSource } from "../domain/order-source.enum.js";
import { OrderStatus } from "../domain/order-status.enum.js";
import { OrderLine as OrmOrderLine } from "./order-line.embeddable.js";
import { Order } from "./order.entity.js";

export class OrderMapper implements Mapper<OrderAggregate, RequiredEntityData<Order>> {
    toDomain(record: Order): OrderAggregate {
        const currency = new Currency(record.currency);

        const lines = new Map(
            record.orderLines.map((line) => {
                const itemId = line.product.id as EntityId;
                const activePrice = line.product.prices.getItems().find((p) => p.validTo === null);
                const money = new Money(new Decimal(String(activePrice?.amount ?? 0)), currency);

                const orderItem = OrderItemEntity.reconstitute({
                    id: itemId,
                    properties: { price: money },
                });

                return [
                    itemId,
                    new DomainOrderLine({
                        product: orderItem,
                        quantity: line.quantity,
                        goodId: line.goodId ?? undefined,
                    }),
                ];
            }),
        );

        return OrderAggregate.reconstitute({
            id: record.id as EntityId,
            createdAt: new Date(),
            properties: {
                cost: new Money(new Decimal(String(record.cost ?? 0)), currency),
                status: record.status as unknown as OrderStatus,
                orderLines: new OrderLines(lines),
                customerId: record.customerId,
                actorId: record.actorId,
                source: record.source as OrderSource,
            },
        });
    }

    toPersistence(domain: OrderAggregate): RequiredEntityData<Order> {
        const props = domain.properties;

        const orderLines = Array.from(props.orderLines.getLines().entries()).map(([itemId, line]) => ({
            product: { id: itemId as string },
            quantity: line.quantity,
            goodId: line.goodId ?? null,
        })) as unknown as OrmOrderLine[];

        return {
            id: domain.id as string,
            cost: domain.cost.amount.toFixed(2),
            currency: domain.cost.currency.code,
            status: props.status,
            customerId: props.customerId,
            actorId: props.actorId,
            source: props.source,
            orderLines,
        };
    }

    toResponse(entity: OrderAggregate) {
        return entity.toJSON();
    }
}
