import { randomUUID } from "crypto";
import { EntityManager, MikroORM } from "@mikro-orm/postgresql";
import { CommandBus, CqrsModule } from "@nestjs/cqrs";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TestMikroOrmDatabaseModule } from "../../shared/testing/test-mikro-orm-database.module";
import { DraftOrderCommand } from "./commands/draft-order/draft-order.command";
import { PlaceOrderCommand } from "./commands/place-order/place-order.command";
import { CancelOrderCommand } from "./commands/cancel-order/cancel-order.command";
import { CompleteOrderCommand } from "./commands/complete-order/complete-order.command";
import { AddProductToOrderCommand } from "./commands/add-product-to-order/add-product-to-order.command";
import { AssignGoodCommand } from "./commands/assign-good/assign-good.command";
import { AssignStockEntryCommand } from "./commands/assign-stock-entry/assign-stock-entry.command";
import { ChangeProductQuantityCommand } from "./commands/change-product-quantity/change-product-quantity.command";
import { OrderSource } from "./domain/order-source.enum";
import { OrderStatus } from "./domain/order-status.enum";
import {
    CustomerNotFoundForOrderError,
    OrderCannotBePlacedError,
    OrderCannotBeCancelledError,
    OrderCannotBeCompletedError,
    OrderIsNotEditableError,
    OrderLineNotFoundError,
    OrderNotFoundError,
    PriceNotFoundForOrderLineError,
    GoodNotFoundForAssignmentError,
} from "./domain/order.errors";
import { Order } from "./database/order.entity";
import { Product } from "./database/product.entity";
import { Price } from "./database/price.entity";
import { ItemCategory } from "./database/item-category.entity";
import { PermissionRegistryModule } from "../../shared/infrastructure/permission-registry.module";
import { SalesModule } from "./sales.module";
import { CrmModule } from "../crm/crm.module";
import { WarehouseModule } from "../warehouse/warehouse.module";
import { Customer } from "../crm/database/customer.entity";
import { CustomerType } from "../crm/domain/customer-type.enum";
import { CreateGoodCommand } from "../warehouse/commands/create-good/create-good.command";
import { CreateWarehouseCommand } from "../warehouse/commands/create-warehouse/create-warehouse.command";
import { OpenGoodsReceiptCommand } from "../warehouse/commands/open-goods-receipt/open-goods-receipt.command";
import { SetGoodsReceiptLinesCommand } from "../warehouse/commands/set-goods-receipt-lines/set-goods-receipt-lines.command";
import { ConfirmGoodsReceiptCommand } from "../warehouse/commands/confirm-goods-receipt/confirm-goods-receipt.command";
import { DimensionUnit } from "../warehouse/domain/good-dimensions.value-object";
import { WeightUnit } from "../warehouse/domain/good-weight.value-object";
import { StockEntry } from "../warehouse/database/stock-entry.entity";
import { QueryBus } from "@nestjs/cqrs";
import { GetOrderQuery, type OrderResponse } from "./queries/get-order/get-order.query";
import { ListOrdersQuery } from "./queries/list-orders/list-orders.query";
import {
    CannotAssignStockEntryError,
    StockEntryAlreadyAssignedError,
    StockEntryGoodMismatchError,
    StockEntryNotFoundForAssignmentError,
    CannotChangeQuantityOfPlacedOrderError,
} from "./domain/order.errors";
import { RemoveProductFromOrderCommand } from "./commands/remove-product-from-order/remove-product-from-order.command";
import { GetCustomerOrdersQuery, type GetCustomerOrdersResponse } from "../../shared/queries/get-customer-orders.query";
import { PERMISSION_REGISTRY, PermissionRegistry } from "../../shared/infrastructure/permission-registry";

describe("Sales Module — Integration Tests", () => {
    let moduleRef: TestingModule;
    let commandBus: CommandBus;
    let queryBus: QueryBus;
    let orm: MikroORM;
    let em: EntityManager;

    // Seeded test data IDs
    let categoryId: string;
    let productId: string;
    let priceId: string;
    const customerId = randomUUID();

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ isGlobal: true }),
                TestMikroOrmDatabaseModule(),
                CqrsModule.forRoot(),
                PermissionRegistryModule,
                SalesModule,
                CrmModule,
                WarehouseModule,
            ],
        }).compile();

        await moduleRef.init();

        commandBus = moduleRef.get(CommandBus);
        queryBus = moduleRef.get(QueryBus);
        orm = moduleRef.get(MikroORM);
        em = orm.em.fork();

        await orm.schema.refresh();

        // Seed: category → product → price
        categoryId = randomUUID();
        productId = randomUUID();
        priceId = randomUUID();

        // Seed CRM customer
        await em.insert(Customer, {
            id: customerId,
            name: "Test Customer",
            customerType: CustomerType.B2C,
            firstName: "Jan",
            lastName: "Kowalski",
        });

        await em.insertMany(ItemCategory, [{ id: categoryId, name: "Test Category" }]);
        await em.insert(Product, {
            id: productId,
            name: "Test Product",
            category: categoryId,
            vatRate: "23",
            availableFrom: new Date(),
            availableTo: null,
        });
        await em.insert(Price, {
            id: priceId,
            amount: "10.00",
            currency: "PLN",
            validFrom: new Date("2020-01-01"),
            validTo: null,
            product: productId,
            priceType: null,
        });
    });

    afterAll(async () => {
        await orm.close(true);
        await moduleRef.close();
    });

    // ─── Helpers ───────────────────────────────────────────────

    async function draftOrder(
        overrides: Partial<{ customerId: string; productId: string; priceId: string; quantity: number }> = {},
    ): Promise<string> {
        const id: string = await commandBus.execute(
            new DraftOrderCommand({
                customerId: overrides.customerId ?? customerId,
                actorId: customerId,
                source: OrderSource.SR,
                lines: [
                    {
                        itemId: overrides.productId ?? productId,
                        quantity: overrides.quantity ?? 1,
                        priceId: overrides.priceId ?? priceId,
                    },
                ],
                currency: "PLN",
            }),
        );
        // EntityId is a branded string — strip the brand for raw DB queries
        return String(id);
    }

    async function findOrder(orderId: string) {
        return em.fork().findOne(Order, { id: orderId });
    }

    // ─── Draft Order ──────────────────────────────────────────

    describe("Draft Order", () => {
        it("creates an order in DRAFTED status", async () => {
            const orderId = await draftOrder();

            const order = await findOrder(orderId);

            expect(order).not.toBeNull();
            expect(order!.status).toBe(OrderStatus.DRAFTED);
            expect(order!.customerId).toBe(customerId);
            expect(order!.orderLines).toHaveLength(1);
        });

        it("throws PriceNotFoundForOrderLineError when price doesn't exist", async () => {
            await expect(draftOrder({ priceId: randomUUID() })).rejects.toThrow(PriceNotFoundForOrderLineError);
        });

        it("throws CustomerNotFoundForOrderError when customer doesn't exist in CRM", async () => {
            await expect(draftOrder({ customerId: randomUUID() })).rejects.toThrow(CustomerNotFoundForOrderError);
        });
    });

    // ─── Place Order ──────────────────────────────────────────

    describe("Place Order", () => {
        it("transitions order from DRAFTED to PLACED", async () => {
            const orderId = await draftOrder();

            await commandBus.execute(new PlaceOrderCommand({ orderId }));

            const order = await findOrder(orderId);
            expect(order!.status).toBe(OrderStatus.PLACED);
        });

        it("throws OrderNotFoundError for non-existent order", async () => {
            await expect(commandBus.execute(new PlaceOrderCommand({ orderId: randomUUID() }))).rejects.toThrow(
                OrderNotFoundError,
            );
        });

        it("throws OrderCannotBePlacedError when already placed", async () => {
            const orderId = await draftOrder();
            await commandBus.execute(new PlaceOrderCommand({ orderId }));

            await expect(commandBus.execute(new PlaceOrderCommand({ orderId }))).rejects.toThrow(
                OrderCannotBePlacedError,
            );
        });
    });

    // ─── Cancel Order ─────────────────────────────────────────

    describe("Cancel Order", () => {
        it("cancels a DRAFTED order", async () => {
            const orderId = await draftOrder();

            await commandBus.execute(new CancelOrderCommand({ orderId }));

            const order = await findOrder(orderId);
            expect(order!.status).toBe(OrderStatus.CANCELLED);
        });

        it("cancels a PLACED order", async () => {
            const orderId = await draftOrder();
            await commandBus.execute(new PlaceOrderCommand({ orderId }));

            await commandBus.execute(new CancelOrderCommand({ orderId }));

            const order = await findOrder(orderId);
            expect(order!.status).toBe(OrderStatus.CANCELLED);
        });

        it("throws OrderCannotBeCancelledError when already cancelled", async () => {
            const orderId = await draftOrder();
            await commandBus.execute(new CancelOrderCommand({ orderId }));

            await expect(commandBus.execute(new CancelOrderCommand({ orderId }))).rejects.toThrow(
                OrderCannotBeCancelledError,
            );
        });

        it("throws OrderCannotBeCancelledError when completed", async () => {
            const orderId = await draftOrder();
            await commandBus.execute(new PlaceOrderCommand({ orderId }));
            await commandBus.execute(new CompleteOrderCommand({ orderId }));

            await expect(commandBus.execute(new CancelOrderCommand({ orderId }))).rejects.toThrow(
                OrderCannotBeCancelledError,
            );
        });
    });

    // ─── Complete Order ───────────────────────────────────────

    describe("Complete Order", () => {
        it("completes a PLACED order", async () => {
            const orderId = await draftOrder();
            await commandBus.execute(new PlaceOrderCommand({ orderId }));

            await commandBus.execute(new CompleteOrderCommand({ orderId }));

            const order = await findOrder(orderId);
            expect(order!.status).toBe(OrderStatus.COMPLETED);
        });

        it("throws OrderCannotBeCompletedError when DRAFTED", async () => {
            const orderId = await draftOrder();

            await expect(commandBus.execute(new CompleteOrderCommand({ orderId }))).rejects.toThrow(
                OrderCannotBeCompletedError,
            );
        });

        it("throws OrderCannotBeCompletedError when CANCELLED", async () => {
            const orderId = await draftOrder();
            await commandBus.execute(new CancelOrderCommand({ orderId }));

            await expect(commandBus.execute(new CompleteOrderCommand({ orderId }))).rejects.toThrow(
                OrderCannotBeCompletedError,
            );
        });
    });

    // ─── Full lifecycle ───────────────────────────────────────

    describe("Full order lifecycle", () => {
        it("DRAFTED → PLACED → COMPLETED", async () => {
            const orderId = await draftOrder();

            await commandBus.execute(new PlaceOrderCommand({ orderId }));
            await commandBus.execute(new CompleteOrderCommand({ orderId }));

            const order = await findOrder(orderId);
            expect(order!.status).toBe(OrderStatus.COMPLETED);
        });

        it("DRAFTED → PLACED → CANCELLED", async () => {
            const orderId = await draftOrder();

            await commandBus.execute(new PlaceOrderCommand({ orderId }));
            await commandBus.execute(new CancelOrderCommand({ orderId }));

            const order = await findOrder(orderId);
            expect(order!.status).toBe(OrderStatus.CANCELLED);
        });

        it("DRAFTED → CANCELLED", async () => {
            const orderId = await draftOrder();

            await commandBus.execute(new CancelOrderCommand({ orderId }));

            const order = await findOrder(orderId);
            expect(order!.status).toBe(OrderStatus.CANCELLED);
        });
    });

    // ─── Assign Good ────────────────────────────────────────────

    describe("Assign Good", () => {
        async function createGood(): Promise<string> {
            return commandBus.execute(
                new CreateGoodCommand({
                    name: `Good ${randomUUID().slice(0, 8)}`,
                    weightValue: 1,
                    weightUnit: WeightUnit.KG,
                    dimensionLength: 10,
                    dimensionWidth: 10,
                    dimensionHeight: 10,
                    dimensionUnit: DimensionUnit.CM,
                }),
            );
        }

        it("assigns a good to a DRAFTED order line", async () => {
            const orderId = await draftOrder();
            const goodId = await createGood();

            await commandBus.execute(new AssignGoodCommand({ orderId, productId, goodId }));

            const order = await findOrder(orderId);
            expect(order!.orderLines[0].goodId).toBe(goodId);
        });

        it("assigns a good to a PLACED order line", async () => {
            const orderId = await draftOrder();
            await commandBus.execute(new PlaceOrderCommand({ orderId }));
            const goodId = await createGood();

            await commandBus.execute(new AssignGoodCommand({ orderId, productId, goodId }));

            const order = await findOrder(orderId);
            expect(order!.orderLines[0].goodId).toBe(goodId);
        });

        it("allows multiple orders to reference the same good", async () => {
            const goodId = await createGood();
            const orderId1 = await draftOrder();
            const orderId2 = await draftOrder();

            await commandBus.execute(new AssignGoodCommand({ orderId: orderId1, productId, goodId }));
            await commandBus.execute(new AssignGoodCommand({ orderId: orderId2, productId, goodId }));

            const order1 = await findOrder(orderId1);
            const order2 = await findOrder(orderId2);
            expect(order1!.orderLines[0].goodId).toBe(goodId);
            expect(order2!.orderLines[0].goodId).toBe(goodId);
        });

        it("throws GoodNotFoundForAssignmentError for non-existent good", async () => {
            const orderId = await draftOrder();

            await expect(
                commandBus.execute(new AssignGoodCommand({ orderId, productId, goodId: randomUUID() })),
            ).rejects.toThrow(GoodNotFoundForAssignmentError);
        });

        it("throws OrderIsNotEditableError when order is COMPLETED", async () => {
            const orderId = await draftOrder();
            await commandBus.execute(new PlaceOrderCommand({ orderId }));
            await commandBus.execute(new CompleteOrderCommand({ orderId }));
            const goodId = await createGood();

            await expect(commandBus.execute(new AssignGoodCommand({ orderId, productId, goodId }))).rejects.toThrow(
                OrderIsNotEditableError,
            );
        });

        it("throws OrderIsNotEditableError when order is CANCELLED", async () => {
            const orderId = await draftOrder();
            await commandBus.execute(new CancelOrderCommand({ orderId }));
            const goodId = await createGood();

            await expect(commandBus.execute(new AssignGoodCommand({ orderId, productId, goodId }))).rejects.toThrow(
                OrderIsNotEditableError,
            );
        });

        it("throws OrderLineNotFoundError for wrong productId", async () => {
            const orderId = await draftOrder();
            const goodId = await createGood();

            await expect(
                commandBus.execute(
                    new AssignGoodCommand({
                        orderId,
                        productId: randomUUID(),
                        goodId,
                    }),
                ),
            ).rejects.toThrow(OrderLineNotFoundError);
        });
    });

    // ─── Draft Editing ────────────────────────────────────────

    describe("Draft Editing", () => {
        let secondProductId: string;
        let secondPriceId: string;

        beforeAll(async () => {
            secondProductId = randomUUID();
            secondPriceId = randomUUID();

            await em.insert(Product, {
                id: secondProductId,
                name: "Second Product",
                category: categoryId,
                vatRate: "23",
                availableFrom: new Date(),
                availableTo: null,
            });
            await em.insert(Price, {
                id: secondPriceId,
                amount: "20.00",
                currency: "PLN",
                validFrom: new Date("2020-01-01"),
                validTo: null,
                product: secondProductId,
                priceType: null,
            });
        });

        it("adds a product to a draft order", async () => {
            const orderId = await draftOrder();

            await commandBus.execute(
                new AddProductToOrderCommand({
                    orderId,
                    itemId: secondProductId,
                    quantity: 2,
                    priceId: secondPriceId,
                }),
            );

            const order = await findOrder(orderId);
            expect(order!.orderLines).toHaveLength(2);
        });

        it("changes product quantity on a draft order", async () => {
            const orderId = await draftOrder();

            await commandBus.execute(
                new ChangeProductQuantityCommand({
                    orderId,
                    itemId: productId,
                    quantity: 5,
                    priceId,
                }),
            );

            const order = await findOrder(orderId);
            expect(order!.orderLines[0].quantity).toBe(5);
        });

        it("throws when editing a placed order", async () => {
            const orderId = await draftOrder();
            await commandBus.execute(new PlaceOrderCommand({ orderId }));

            await expect(
                commandBus.execute(
                    new AddProductToOrderCommand({
                        orderId,
                        itemId: secondProductId,
                        quantity: 1,
                        priceId: secondPriceId,
                    }),
                ),
            ).rejects.toThrow(CannotChangeQuantityOfPlacedOrderError);
        });
    });

    // ─── Stock Entry Assignment + IN_PROGRESS ─────────────────

    describe("Assign Stock Entry", () => {
        async function createGood(): Promise<string> {
            return commandBus.execute(
                new CreateGoodCommand({
                    name: `Good ${randomUUID().slice(0, 8)}`,
                    weightValue: 1,
                    weightUnit: WeightUnit.KG,
                    dimensionLength: 10,
                    dimensionWidth: 10,
                    dimensionHeight: 10,
                    dimensionUnit: DimensionUnit.CM,
                }),
            );
        }

        async function createStockEntry(goodId: string): Promise<string> {
            const warehouseId: string = await commandBus.execute(
                new CreateWarehouseCommand({
                    name: `WH ${randomUUID().slice(0, 8)}`,
                    address: { country: "PL", postalCode: "00-001", state: "Maz", city: "Warszawa", street: "Test 1" },
                }),
            );

            const receiptId: string = await commandBus.execute(
                new OpenGoodsReceiptCommand({ targetWarehouseId: warehouseId }),
            );

            await commandBus.execute(new SetGoodsReceiptLinesCommand({ receiptId, lines: [{ goodId, quantity: 10 }] }));

            await commandBus.execute(new ConfirmGoodsReceiptCommand({ receiptId }));

            const stockEntryEm = em.fork();
            const entry = await stockEntryEm.findOne(StockEntry, { goodId });
            return entry!.id;
        }

        it("assigns stock entry and auto-transitions to IN_PROGRESS", async () => {
            const orderId = await draftOrder();
            const goodId = await createGood();

            await commandBus.execute(new PlaceOrderCommand({ orderId }));
            await commandBus.execute(new AssignGoodCommand({ orderId, productId, goodId }));

            const stockEntryId = await createStockEntry(goodId);
            await commandBus.execute(new AssignStockEntryCommand({ orderId, productId, stockEntryId }));

            const order = await findOrder(orderId);
            expect(order!.status).toBe(OrderStatus.IN_PROGRESS);
            expect(order!.orderLines[0].stockEntryId).toBe(stockEntryId);
        });

        it("throws StockEntryAlreadyAssignedError when entry is taken", async () => {
            const goodId = await createGood();
            const stockEntryId = await createStockEntry(goodId);

            const orderId1 = await draftOrder();
            const orderId2 = await draftOrder();

            await commandBus.execute(new PlaceOrderCommand({ orderId: orderId1 }));
            await commandBus.execute(new AssignGoodCommand({ orderId: orderId1, productId, goodId }));
            await commandBus.execute(new AssignStockEntryCommand({ orderId: orderId1, productId, stockEntryId }));

            await commandBus.execute(new PlaceOrderCommand({ orderId: orderId2 }));
            await commandBus.execute(new AssignGoodCommand({ orderId: orderId2, productId, goodId }));

            await expect(
                commandBus.execute(new AssignStockEntryCommand({ orderId: orderId2, productId, stockEntryId })),
            ).rejects.toThrow(StockEntryAlreadyAssignedError);
        });

        it("throws CannotAssignStockEntryError on DRAFTED order", async () => {
            const orderId = await draftOrder();
            const goodId = await createGood();
            await commandBus.execute(new AssignGoodCommand({ orderId, productId, goodId }));
            const stockEntryId = await createStockEntry(goodId);

            await expect(
                commandBus.execute(new AssignStockEntryCommand({ orderId, productId, stockEntryId })),
            ).rejects.toThrow(CannotAssignStockEntryError);
        });

        it("throws StockEntryNotFoundForAssignmentError for non-existent entry", async () => {
            const orderId = await draftOrder();
            const goodId = await createGood();
            await commandBus.execute(new PlaceOrderCommand({ orderId }));
            await commandBus.execute(new AssignGoodCommand({ orderId, productId, goodId }));

            await expect(
                commandBus.execute(new AssignStockEntryCommand({ orderId, productId, stockEntryId: randomUUID() })),
            ).rejects.toThrow(StockEntryNotFoundForAssignmentError);
        });

        it("IN_PROGRESS order cannot be cancelled", async () => {
            const orderId = await draftOrder();
            const goodId = await createGood();

            await commandBus.execute(new PlaceOrderCommand({ orderId }));
            await commandBus.execute(new AssignGoodCommand({ orderId, productId, goodId }));
            const stockEntryId = await createStockEntry(goodId);
            await commandBus.execute(new AssignStockEntryCommand({ orderId, productId, stockEntryId }));

            await expect(commandBus.execute(new CancelOrderCommand({ orderId }))).rejects.toThrow(
                OrderCannotBeCancelledError,
            );
        });

        it("IN_PROGRESS order can be completed", async () => {
            const orderId = await draftOrder();
            const goodId = await createGood();

            await commandBus.execute(new PlaceOrderCommand({ orderId }));
            await commandBus.execute(new AssignGoodCommand({ orderId, productId, goodId }));
            const stockEntryId = await createStockEntry(goodId);
            await commandBus.execute(new AssignStockEntryCommand({ orderId, productId, stockEntryId }));

            await commandBus.execute(new CompleteOrderCommand({ orderId }));

            const order = await findOrder(orderId);
            expect(order!.status).toBe(OrderStatus.COMPLETED);
        });
    });

    // ─── Order Queries ────────────────────────────────────────

    describe("Order Queries", () => {
        it("gets order by ID with full details", async () => {
            const orderId = await draftOrder();

            const order: OrderResponse = await queryBus.execute(new GetOrderQuery(orderId));

            expect(order.id).toBe(orderId);
            expect(order.customerId).toBe(customerId);
            expect(order.actorId).toBe(customerId);
            expect(order.source).toBe(OrderSource.SR);
            expect(order.status).toBe(OrderStatus.DRAFTED);
            expect(order.orderLines).toHaveLength(1);
        });

        it("lists orders with pagination", async () => {
            await draftOrder();
            await draftOrder();

            const result = await queryBus.execute(new ListOrdersQuery(1, 50));

            expect(result.data.length).toBeGreaterThanOrEqual(2);
        });

        it("filters orders by customerId", async () => {
            const result = await queryBus.execute(new ListOrdersQuery(1, 50, customerId));

            expect(result.data.every((o: { customerId: string }) => o.customerId === customerId)).toBe(true);
        });

        it("filters orders by status", async () => {
            const result = await queryBus.execute(new ListOrdersQuery(1, 50, undefined, OrderStatus.DRAFTED));

            expect(result.data.every((o: { status: string }) => o.status === (OrderStatus.DRAFTED as string))).toBe(
                true,
            );
        });
    });

    // ─── Remove Product from Draft ────────────────────────────

    describe("Remove Product from Draft", () => {
        let secondProductId: string;
        let secondPriceId: string;

        beforeAll(async () => {
            secondProductId = randomUUID();
            secondPriceId = randomUUID();

            await em.insert(Product, {
                id: secondProductId,
                name: "Removable Product",
                category: categoryId,
                vatRate: "23",
                availableFrom: new Date(),
                availableTo: null,
            });
            await em.insert(Price, {
                id: secondPriceId,
                amount: "5.00",
                currency: "PLN",
                validFrom: new Date("2020-01-01"),
                validTo: null,
                product: secondProductId,
                priceType: null,
            });
        });

        it("removes a product from a draft order", async () => {
            const orderId = await draftOrder();

            // Add second product so we can remove the first without emptying the order
            await commandBus.execute(
                new AddProductToOrderCommand({ orderId, itemId: secondProductId, quantity: 1, priceId: secondPriceId }),
            );

            await commandBus.execute(new RemoveProductFromOrderCommand({ orderId, itemId: productId, priceId }));

            const order = await findOrder(orderId);
            expect(order!.orderLines).toHaveLength(1);
        });

        it("throws when removing from a placed order", async () => {
            const orderId = await draftOrder();
            await commandBus.execute(new PlaceOrderCommand({ orderId }));

            await expect(
                commandBus.execute(new RemoveProductFromOrderCommand({ orderId, itemId: productId, priceId })),
            ).rejects.toThrow(CannotChangeQuantityOfPlacedOrderError);
        });
    });

    // ─── Stock Entry Good Mismatch ────────────────────────────

    describe("Stock Entry Good Mismatch", () => {
        async function createGoodAndEntry(): Promise<{ goodId: string; stockEntryId: string }> {
            const goodId: string = await commandBus.execute(
                new CreateGoodCommand({
                    name: `Good ${randomUUID().slice(0, 8)}`,
                    weightValue: 1,
                    weightUnit: WeightUnit.KG,
                    dimensionLength: 10,
                    dimensionWidth: 10,
                    dimensionHeight: 10,
                    dimensionUnit: DimensionUnit.CM,
                }),
            );

            const warehouseId: string = await commandBus.execute(
                new CreateWarehouseCommand({
                    name: `WH ${randomUUID().slice(0, 8)}`,
                    address: { country: "PL", postalCode: "00-001", state: "Maz", city: "Warszawa", street: "Test 1" },
                }),
            );

            const receiptId: string = await commandBus.execute(
                new OpenGoodsReceiptCommand({ targetWarehouseId: warehouseId }),
            );

            await commandBus.execute(new SetGoodsReceiptLinesCommand({ receiptId, lines: [{ goodId, quantity: 10 }] }));

            await commandBus.execute(new ConfirmGoodsReceiptCommand({ receiptId }));

            const stockEntryEm = em.fork();
            const entry = await stockEntryEm.findOne(StockEntry, { goodId });

            return { goodId, stockEntryId: entry!.id };
        }

        it("throws StockEntryGoodMismatchError when stock entry good differs from order line good", async () => {
            const orderId = await draftOrder();
            const { goodId: goodA } = await createGoodAndEntry();
            const { stockEntryId: entryFromB } = await createGoodAndEntry();

            await commandBus.execute(new PlaceOrderCommand({ orderId }));
            await commandBus.execute(new AssignGoodCommand({ orderId, productId, goodId: goodA }));

            // Assign stock entry from good B to a line that has good A
            await expect(
                commandBus.execute(new AssignStockEntryCommand({ orderId, productId, stockEntryId: entryFromB })),
            ).rejects.toThrow(StockEntryGoodMismatchError);
        });
    });

    // ─── GetCustomerOrders (shared query contract) ────────────

    describe("GetCustomerOrders", () => {
        it("returns orders for a customer via shared query", async () => {
            const orderId = await draftOrder();

            const orders: GetCustomerOrdersResponse = await queryBus.execute(new GetCustomerOrdersQuery(customerId));

            expect(orders.length).toBeGreaterThanOrEqual(1);
            const found = orders.find((o) => o.id === orderId);
            expect(found).toBeDefined();
            expect(found!.status).toBe(OrderStatus.DRAFTED);
            expect(found!.currency).toBe("PLN");
        });

        it("returns empty array for customer with no orders", async () => {
            const orders: GetCustomerOrdersResponse = await queryBus.execute(new GetCustomerOrdersQuery(randomUUID()));

            expect(orders).toEqual([]);
        });
    });

    // ─── Permissions Registration ─────────────────────────────

    describe("Permissions", () => {
        it("registers sales permissions in the registry", () => {
            const registry = moduleRef.get<PermissionRegistry>(PERMISSION_REGISTRY);
            const salesPermissions = registry.getByModule("sales");

            expect(salesPermissions).toBeDefined();
            expect(salesPermissions.length).toBe(8);

            const keys = salesPermissions.map((p) => p.fullKey);
            expect(keys).toContain("sales:draft-order");
            expect(keys).toContain("sales:edit-draft");
            expect(keys).toContain("sales:place-order");
            expect(keys).toContain("sales:cancel-order");
            expect(keys).toContain("sales:complete-order");
            expect(keys).toContain("sales:assign-good");
            expect(keys).toContain("sales:assign-stock-entry");
            expect(keys).toContain("sales:view-orders");
        });
    });
});
