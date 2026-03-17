import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { EntityId } from "@src/libs/ddd/entities/entity-id.js";
import { Address } from "@src/shared/value-objects/address.value-object.js";
import { Currency } from "@src/shared/value-objects/currency.js";
import { Money } from "@src/shared/value-objects/money.js";
import { Product } from "@src/shared/value-objects/product.js";
import Decimal from "decimal.js";
import { randomUUID } from "crypto";
import { OrderCustomer } from "../../domain/order-customer.entity.js";
import { OrderLines } from "../../domain/order-lines.value-object.js";
import { DraftOrderCommand } from "../commands/draft-order/draft-order.command.js";
import { DraftOrderRequest } from "../../infrastructure/http/dto/draft-order.dto.js";

@Injectable()
export class OrderService {
    constructor(private readonly commandBus: CommandBus) {}

    async draftOrder(req: DraftOrderRequest): Promise<string> {
        // ! THIS shouldn't be done this way. The request shouldn't be passed there (?), but only already parsed body, that matches `draftOrder` method of the service.
        const customer = new OrderCustomer({
            id: (req.customer.id ?? randomUUID()) as EntityId,
            createdAt: new Date(),
            properties: {
                firstName: req.customer.firstName,
                secondName: req.customer.secondName,
                email: req.customer.email,
                phoneNumber: req.customer.phoneNumber,
                address: new Address({
                    country: req.customer.address.country,
                    state: req.customer.address.state,
                    city: req.customer.address.city,
                    postalCode: req.customer.address.postalCode,
                    street: req.customer.address.street,
                    buildingNumber: req.customer.address.buildingNumber,
                }),
            },
        });

        const orderLines = req.lines.reduce((acc, line) => {
            const product = Product.create({
                id: line.productId as EntityId,
                createdAt: new Date(),
                properties: {
                    price: new Money(new Decimal(line.price), new Currency(line.currency)),
                },
            });
            return acc.addProduct(product, line.quantity);
        }, new OrderLines());

        return this.commandBus.execute(
            new DraftOrderCommand({
                orderId: req.orderId as EntityId | undefined,
                customer,
                orderLines,
            }),
        );
    }
}
