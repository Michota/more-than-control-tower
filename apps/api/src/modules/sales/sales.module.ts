import { EntityManager } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Inject, Module, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MikroOrmUnitOfWork } from "../../shared/infrastructure/mikro-orm-unit-of-work.js";
import { PERMISSION_REGISTRY, PermissionRegistry } from "../../shared/infrastructure/permission-registry.js";
import { STOCK_RESERVATION_CHECKERS } from "../../shared/infrastructure/stock-reservation-checker.js";
import { UNIT_OF_WORK_PORT } from "../../shared/ports/tokens.js";
import { OrderStockReservationChecker } from "./infrastructure/order-stock-reservation-checker.js";
import { AddProductToOrderCommandHandler } from "./commands/add-product-to-order/add-product-to-order.command-handler.js";
import { AssignGoodCommandHandler } from "./commands/assign-good/assign-good.command-handler.js";
import { AssignStockEntryCommandHandler } from "./commands/assign-stock-entry/assign-stock-entry.command-handler.js";
import { CancelOrderCommandHandler } from "./commands/cancel-order/cancel-order.command-handler.js";
import { ChangeProductQuantityCommandHandler } from "./commands/change-product-quantity/change-product-quantity.command-handler.js";
import { CompleteOrderCommandHandler } from "./commands/complete-order/complete-order.command-handler.js";
import { DraftOrderCommandHandler } from "./commands/draft-order/draft-order.command-handler.js";
import { PlaceOrderCommandHandler } from "./commands/place-order/place-order.command-handler.js";
import { RemoveProductFromOrderCommandHandler } from "./commands/remove-product-from-order/remove-product-from-order.command-handler.js";
import { GetCustomerOrdersQueryHandler } from "./queries/get-customer-orders/get-customer-orders.query-handler.js";
import { GetOrdersByIdsQueryHandler } from "./queries/get-orders-by-ids/get-orders-by-ids.query-handler.js";
import { GetOrderQueryHandler } from "./queries/get-order/get-order.query-handler.js";
import { ListOrdersQueryHandler } from "./queries/list-orders/list-orders.query-handler.js";
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
        AddProductToOrderCommandHandler,
        ChangeProductQuantityCommandHandler,
        RemoveProductFromOrderCommandHandler,
        PlaceOrderCommandHandler,
        CancelOrderCommandHandler,
        CompleteOrderCommandHandler,
        AssignGoodCommandHandler,
        AssignStockEntryCommandHandler,
        GetOrderQueryHandler,
        ListOrdersQueryHandler,
        GetCustomerOrdersQueryHandler,
        GetOrdersByIdsQueryHandler,
        {
            provide: STOCK_RESERVATION_CHECKERS,
            useClass: OrderStockReservationChecker,
        },
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
export class SalesModule implements OnModuleInit {
    constructor(
        @Inject(PERMISSION_REGISTRY)
        private readonly permissionRegistry: PermissionRegistry,
    ) {}

    onModuleInit(): void {
        this.permissionRegistry.registerForModule("sales", [
            { key: "draft-order", name: "Draft Order" },
            { key: "edit-draft", name: "Edit Draft Order" },
            { key: "place-order", name: "Place Order" },
            { key: "cancel-order", name: "Cancel Order" },
            { key: "complete-order", name: "Complete Order" },
            { key: "assign-good", name: "Assign Good to Order" },
            { key: "assign-stock-entry", name: "Assign Stock Entry to Order" },
            { key: "view-orders", name: "View Orders" },
        ]);
    }
}
