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
import { AssignStockEntryCommand } from "./commands/assign-stock-entry/assign-stock-entry.command";
import { OrderStatus } from "./domain/order-status.enum";
import {
    OrderCannotBePlacedError,
    OrderCannotBeCancelledError,
    OrderCannotBeCompletedError,
    OrderIsNotEditableError,
    OrderLineNotFoundError,
    OrderNotFoundError,
    PriceNotFoundForOrderLineError,
    StockEntryAlreadyAssignedError,
    StockEntryNotFoundForAssignmentError,
} from "./domain/order.errors";
import { Order } from "./database/order.entity";
import { Product } from "./database/product.entity";
import { Price } from "./database/price.entity";
import { ItemCategory } from "./database/item-category.entity";
import { PermissionRegistryModule } from "../../shared/infrastructure/permission-registry.module";
import { SalesModule } from "./sales.module";
import { WarehouseModule } from "../warehouse/warehouse.module";
import { CreateGoodCommand } from "../warehouse/commands/create-good/create-good.command";
import { CreateWarehouseCommand } from "../warehouse/commands/create-warehouse/create-warehouse.command";
import { OpenGoodsReceiptCommand } from "../warehouse/commands/open-goods-receipt/open-goods-receipt.command";
import { SetGoodsReceiptLinesCommand } from "../warehouse/commands/set-goods-receipt-lines/set-goods-receipt-lines.command";
import { ConfirmGoodsReceiptCommand } from "../warehouse/commands/confirm-goods-receipt/confirm-goods-receipt.command";
import { DimensionUnit } from "../warehouse/domain/good-dimensions.value-object";
import { WeightUnit } from "../warehouse/domain/good-weight.value-object";
import { StockEntry } from "../warehouse/database/stock-entry.entity";

describe("Sales Module — Integration Tests", () => {
    let moduleRef: TestingModule;
    let commandBus: CommandBus;
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
                WarehouseModule,
            ],
        }).compile();

        await moduleRef.init();

        commandBus = moduleRef.get(CommandBus);
        orm = moduleRef.get(MikroORM);
        em = orm.em.fork();

        await orm.schema.refresh();

        // Seed: category → product → price
        categoryId = randomUUID();
        productId = randomUUID();
        priceId = randomUUID();

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

    // ─── Assign Stock Entry ───────────────────────────────────

    describe("Assign Stock Entry", () => {
        async function createStockEntry(): Promise<string> {
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
                    address: {
                        country: "PL",
                        postalCode: "00-001",
                        state: "Mazowieckie",
                        city: "Warszawa",
                        street: "Test 1",
                    },
                }),
            );

            const receiptId: string = await commandBus.execute(
                new OpenGoodsReceiptCommand({ targetWarehouseId: warehouseId }),
            );

            await commandBus.execute(
                new SetGoodsReceiptLinesCommand({
                    receiptId,
                    lines: [{ goodId, quantity: 10 }],
                }),
            );

            await commandBus.execute(new ConfirmGoodsReceiptCommand({ receiptId }));

            // Find the created stock entry ID
            const stockEntryEm = em.fork();
            const entry = await stockEntryEm.findOne(StockEntry, { goodId });
            return entry!.id;
        }

        it("assigns a stock entry to a DRAFTED order line", async () => {
            const orderId = await draftOrder();
            const stockEntryId = await createStockEntry();

            await commandBus.execute(new AssignStockEntryCommand({ orderId, productId, stockEntryId }));

            const order = await findOrder(orderId);
            const line = order!.orderLines[0];
            expect(line.stockEntryId).toBe(stockEntryId);
        });

        it("assigns a stock entry to a PLACED order line", async () => {
            const orderId = await draftOrder();
            await commandBus.execute(new PlaceOrderCommand({ orderId }));
            const stockEntryId = await createStockEntry();

            await commandBus.execute(new AssignStockEntryCommand({ orderId, productId, stockEntryId }));

            const order = await findOrder(orderId);
            expect(order!.orderLines[0].stockEntryId).toBe(stockEntryId);
        });

        it("throws StockEntryAlreadyAssignedError when entry is taken by another active order", async () => {
            const stockEntryId = await createStockEntry();
            const orderId1 = await draftOrder();
            const orderId2 = await draftOrder();

            await commandBus.execute(new AssignStockEntryCommand({ orderId: orderId1, productId, stockEntryId }));

            await expect(
                commandBus.execute(new AssignStockEntryCommand({ orderId: orderId2, productId, stockEntryId })),
            ).rejects.toThrow(StockEntryAlreadyAssignedError);
        });

        it("allows assigning stock entry freed by cancelled order", async () => {
            const stockEntryId = await createStockEntry();
            const orderId1 = await draftOrder();
            const orderId2 = await draftOrder();

            await commandBus.execute(new AssignStockEntryCommand({ orderId: orderId1, productId, stockEntryId }));
            await commandBus.execute(new CancelOrderCommand({ orderId: orderId1 }));

            await commandBus.execute(new AssignStockEntryCommand({ orderId: orderId2, productId, stockEntryId }));

            const order = await findOrder(orderId2);
            expect(order!.orderLines[0].stockEntryId).toBe(stockEntryId);
        });

        it("throws StockEntryNotFoundForAssignmentError for non-existent stock entry", async () => {
            const orderId = await draftOrder();

            await expect(
                commandBus.execute(new AssignStockEntryCommand({ orderId, productId, stockEntryId: randomUUID() })),
            ).rejects.toThrow(StockEntryNotFoundForAssignmentError);
        });

        it("throws OrderIsNotEditableError when order is COMPLETED", async () => {
            const orderId = await draftOrder();
            await commandBus.execute(new PlaceOrderCommand({ orderId }));
            await commandBus.execute(new CompleteOrderCommand({ orderId }));
            const stockEntryId = await createStockEntry();

            await expect(
                commandBus.execute(new AssignStockEntryCommand({ orderId, productId, stockEntryId })),
            ).rejects.toThrow(OrderIsNotEditableError);
        });

        it("throws OrderIsNotEditableError when order is CANCELLED", async () => {
            const orderId = await draftOrder();
            await commandBus.execute(new CancelOrderCommand({ orderId }));
            const stockEntryId = await createStockEntry();

            await expect(
                commandBus.execute(new AssignStockEntryCommand({ orderId, productId, stockEntryId })),
            ).rejects.toThrow(OrderIsNotEditableError);
        });

        it("throws OrderLineNotFoundError for wrong productId", async () => {
            const orderId = await draftOrder();
            const stockEntryId = await createStockEntry();

            await expect(
                commandBus.execute(
                    new AssignStockEntryCommand({
                        orderId,
                        productId: randomUUID(),
                        stockEntryId,
                    }),
                ),
            ).rejects.toThrow(OrderLineNotFoundError);
        });
    });
});
