import { EntityManager } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MikroOrmUnitOfWork } from "../../shared/infrastructure/mikro-orm-unit-of-work.js";
import { UNIT_OF_WORK_PORT } from "../../shared/ports/tokens.js";
import { DraftOrderCommandHandler } from "./commands/draft-order/draft-order.command-handler.js";
import { SalesHttpController } from "./sales.http.controller.js";
import { ITEM_PRICE_REPOSITORY_PORT, ORDER_REPOSITORY_PORT } from "./sales.di-tokens.js";
import { ItemPriceRepository } from "./database/item-price.repository.js";
import { OrderLine } from "./database/order-line.embeddable.js";
import { Order } from "./database/order.entity.js";
import { OrderRepository } from "./database/order.repository.js";
import { Price } from "./database/price.entity.js";
import { PriceType } from "./database/price-type.entity.js";
import { Product } from "./database/product.entity.js";

/**
 * Sales module — product catalog and order management.
 *
 * Data source is controlled by the SALES_SOURCE environment variable:
 *   SALES_SOURCE=internal    → internal PostgreSQL DB (default)
 *   SALES_SOURCE=fakturownia → Fakturownia external invoicing API
 *
 * CommandHandlers and QueryHandlers inject only the Symbol tokens
 * ORDER_REPOSITORY_PORT and UNIT_OF_WORK_PORT — they are blind to which
 * adapter is bound.
 *
 * *"Fakturownia" is a name of accountancy-SaaS; it's just an example.
 */
@Module({
    imports: [MikroOrmModule.forFeature([Order, Product, OrderLine, Price, PriceType])],
    controllers: [SalesHttpController],
    providers: [
        DraftOrderCommandHandler,
        {
            provide: ORDER_REPOSITORY_PORT,
            useFactory: (config: ConfigService, em: EntityManager) => {
                return new OrderRepository(em);
                // return config.get("SALES_SOURCE") === "fakturownia"
                //     ? new FakturowniaOrderRepository(config)
                //     : new OrderRepository(em);
            },
            inject: [ConfigService, EntityManager],
        },
        {
            provide: ITEM_PRICE_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new ItemPriceRepository(em),
            inject: [EntityManager],
        },
        {
            provide: UNIT_OF_WORK_PORT,
            useFactory: (config: ConfigService, em: EntityManager) => {
                return new MikroOrmUnitOfWork(em);
                // return config.get("SALES_SOURCE") === "fakturownia" ? new NoOpUnitOfWork() : new MikroOrmUnitOfWork(em);
            },
            inject: [ConfigService, EntityManager],
        },
    ],
    exports: [ORDER_REPOSITORY_PORT, UNIT_OF_WORK_PORT],
})
export class SalesModule {}
