import { EntityManager } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MikroOrmUnitOfWork } from "@src/shared/infrastructure/mikro-orm-unit-of-work.js";
import { UNIT_OF_WORK_PORT } from "@src/shared/ports/tokens.js";
import { DraftOrderHandler } from "./application/commands/draft-order/draft-order.handler.js";
import { ORDER_REPOSITORY_PORT } from "./application/ports/tokens.js";
import { OrderService } from "./application/services/order.service.js";
import { OrderController } from "./infrastructure/http/order.controller.js";
import { OrderLine } from "./infrastructure/persistence/order-line.embeddable.js";
import { Order } from "./infrastructure/persistence/order.entity.js";
import { OrderRepository } from "./infrastructure/persistence/order.repository.js";
import { Price } from "./infrastructure/persistence/price.entity.js";
import { Product } from "./infrastructure/persistence/product.entity.js";

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
    imports: [MikroOrmModule.forFeature([Order, Product, OrderLine, Price])],
    controllers: [OrderController],
    providers: [
        OrderService,
        DraftOrderHandler,
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
