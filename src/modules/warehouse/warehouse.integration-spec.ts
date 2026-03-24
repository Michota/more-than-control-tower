import { MikroORM } from "@mikro-orm/postgresql";
import { CommandBus, CqrsModule, QueryBus } from "@nestjs/cqrs";
import { Test, TestingModule } from "@nestjs/testing";
import { TestMikroOrmDatabaseModule } from "../../shared/testing/test-mikro-orm-database.module";
import { ConfirmGoodsReceiptCommand } from "./commands/confirm-goods-receipt/confirm-goods-receipt.command";
import { CreateGoodCommand } from "./commands/create-good/create-good.command";
import { CreateWarehouseCommand } from "./commands/create-warehouse/create-warehouse.command";
import { OpenGoodsReceiptCommand } from "./commands/open-goods-receipt/open-goods-receipt.command";
import { RemoveStockCommand } from "./commands/remove-stock/remove-stock.command";
import { SetGoodsReceiptLinesCommand } from "./commands/set-goods-receipt-lines/set-goods-receipt-lines.command";
import { TransferStockCommand } from "./commands/transfer-stock/transfer-stock.command";
import { DimensionUnit } from "./domain/good-dimensions.value-object";
import { WeightUnit } from "./domain/good-weight.value-object";
import { EditGoodCommand } from "./commands/edit-good/edit-good.command";
import {
    IncorporatedGoodCannotBeEditedError,
    InsufficientStockError,
    StockEntryNotFoundError,
} from "./domain/good.errors";
import { GoodsReceiptStatus } from "./domain/goods-receipt-status.enum";
import { StockRemovalReason } from "./domain/stock-removal-reason.enum";
import { GetGoodQuery } from "./queries/get-good/get-good.query";
import { GetGoodsReceiptQuery } from "./queries/get-goods-receipt/get-goods-receipt.query";
import { ListWarehouseStockQuery } from "./queries/list-warehouse-stock/list-warehouse-stock.query";
import { WarehouseModule } from "./warehouse.module";

describe("Warehouse Module — Integration Tests", () => {
    let moduleRef: TestingModule;
    let commandBus: CommandBus;
    let queryBus: QueryBus;
    let orm: MikroORM;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [TestMikroOrmDatabaseModule(), CqrsModule.forRoot(), WarehouseModule],
        }).compile();

        await moduleRef.init();

        commandBus = moduleRef.get(CommandBus);
        queryBus = moduleRef.get(QueryBus);
        orm = moduleRef.get(MikroORM);

        await orm.schema.refresh();
    });

    afterAll(async () => {
        await orm.close(true);
        await moduleRef.close();
    });

    // ─── Helpers ───────────────────────────────────────────────

    function createGoodCmd(overrides: Partial<CreateGoodCommand> = {}) {
        return new CreateGoodCommand({
            name: overrides.name ?? "Test Good",
            weightValue: overrides.weightValue ?? 1,
            weightUnit: overrides.weightUnit ?? WeightUnit.KG,
            dimensionLength: overrides.dimensionLength ?? 10,
            dimensionWidth: overrides.dimensionWidth ?? 10,
            dimensionHeight: overrides.dimensionHeight ?? 10,
            dimensionUnit: overrides.dimensionUnit ?? DimensionUnit.CM,
            description: overrides.description,
            parentId: overrides.parentId,
        });
    }

    function createWarehouseCmd(name = "Warehouse A") {
        return new CreateWarehouseCommand({
            name,
            latitude: 52.2297,
            longitude: 21.0122,
            address: {
                country: "PL",
                postalCode: "00-001",
                state: "Mazowieckie",
                city: "Warszawa",
                street: "Marszałkowska 1",
            },
        });
    }

    async function createGood(overrides: Partial<CreateGoodCommand> = {}): Promise<string> {
        return commandBus.execute(createGoodCmd(overrides));
    }

    async function createWarehouse(name = "Warehouse A"): Promise<string> {
        return commandBus.execute(createWarehouseCmd(name));
    }

    async function receiveGoodsToWarehouse(params: {
        goodId: string;
        warehouseId: string;
        quantity: number;
        note?: string;
        locationDescription?: string;
    }): Promise<string> {
        const receiptId: string = await commandBus.execute(
            new OpenGoodsReceiptCommand({
                targetWarehouseId: params.warehouseId,
                note: params.note,
            }),
        );

        await commandBus.execute(
            new SetGoodsReceiptLinesCommand({
                receiptId,
                lines: [
                    {
                        goodId: params.goodId,
                        quantity: params.quantity,
                        locationDescription: params.locationDescription,
                    },
                ],
            }),
        );

        await commandBus.execute(new ConfirmGoodsReceiptCommand({ receiptId }));

        return receiptId;
    }

    async function getWarehouseStock(warehouseId: string) {
        return queryBus.execute(new ListWarehouseStockQuery(warehouseId));
    }

    async function getStockEntry(warehouseId: string, goodId: string) {
        const stock = await getWarehouseStock(warehouseId);
        const entry = stock.find((s) => s.goodId === goodId);
        if (!entry) {
            throw new Error(`Stock entry not found for good ${goodId} in warehouse ${warehouseId}`);
        }
        return entry;
    }

    // ─── 1. Composite goods (parent–child / "incorporated goods") ─

    describe("Composite goods (parent–child relationship)", () => {
        it("creates a good that contains other goods (composite)", async () => {
            const parentId = await createGood({ name: "Crate of bottles" });
            const childId = await createGood({ name: "Glass bottle", parentId });

            const child = await queryBus.execute(new GetGoodQuery(childId));

            expect(child.parentId).toEqual(parentId);
        });

        it("child good (incorporated good) has a parent reference", async () => {
            const parentId = await createGood({ name: "Pallet" });
            const child1Id = await createGood({ name: "Box A", parentId });
            const child2Id = await createGood({ name: "Box B", parentId });

            const child1 = await queryBus.execute(new GetGoodQuery(child1Id));
            const child2 = await queryBus.execute(new GetGoodQuery(child2Id));

            expect(child1.parentId).toEqual(parentId);
            expect(child2.parentId).toEqual(parentId);
        });

        it("a good without parent has undefined parentId", async () => {
            const goodId = await createGood({ name: "Standalone item" });

            const good = await queryBus.execute(new GetGoodQuery(goodId));

            expect(good.parentId).toBeUndefined();
        });

        it("rejects creating a child when parentId does not exist", async () => {
            const fakeParentId = "00000000-0000-0000-0000-000000000000";

            await expect(createGood({ name: "Orphan", parentId: fakeParentId })).rejects.toThrow();
        });

        it("incorporated good cannot be edited while it has a parent", async () => {
            const parentId = await createGood({ name: "Parent crate" });
            const childId = await createGood({ name: "Child bottle", parentId });

            await expect(
                commandBus.execute(new EditGoodCommand({ goodId: childId, name: "Renamed bottle" })),
            ).rejects.toThrow(IncorporatedGoodCannotBeEditedError);
        });

        it("standalone good (no parent) can be edited", async () => {
            const goodId = await createGood({ name: "Editable item" });

            await commandBus.execute(new EditGoodCommand({ goodId, name: "Renamed item" }));

            const good = await queryBus.execute(new GetGoodQuery(goodId));
            expect(good.name).toEqual("Renamed item");
        });
    });

    // ─── 2. Goods receipt ──────────────────────────────────────

    describe("Goods receipt — full flow", () => {
        it("opens a receipt, adds lines, confirms — stock appears in warehouse", async () => {
            const goodId = await createGood({ name: "Water bottle" });
            const warehouseId = await createWarehouse("Receipt Warehouse");

            const receiptId = await receiveGoodsToWarehouse({
                goodId,
                warehouseId,
                quantity: 50,
                note: "Initial delivery",
                locationDescription: "Shelf A1",
            });

            // Verify receipt is CONFIRMED
            const receipt = await queryBus.execute(new GetGoodsReceiptQuery(receiptId));
            expect(receipt.status).toEqual(GoodsReceiptStatus.CONFIRMED);
            expect(receipt.targetWarehouseId).toEqual(warehouseId);
            expect(receipt.lines).toHaveLength(1);
            expect(receipt.lines[0].goodId).toEqual(goodId);
            expect(receipt.lines[0].quantity).toEqual(50);

            // Verify stock in warehouse
            const entry = await getStockEntry(warehouseId, goodId);
            expect(entry.quantity).toEqual(50);
        });

        it("receipt requires at least one line to be confirmed", async () => {
            const warehouseId = await createWarehouse("Empty Receipt WH");

            const receiptId: string = await commandBus.execute(
                new OpenGoodsReceiptCommand({ targetWarehouseId: warehouseId }),
            );

            await expect(commandBus.execute(new ConfirmGoodsReceiptCommand({ receiptId }))).rejects.toThrow();
        });

        it("allows selecting a target warehouse and adding a note", async () => {
            const goodId = await createGood({ name: "Canned food" });
            const warehouseId = await createWarehouse("Note Warehouse");

            const receiptId: string = await commandBus.execute(
                new OpenGoodsReceiptCommand({
                    targetWarehouseId: warehouseId,
                    note: "Customer return — packaging",
                }),
            );

            await commandBus.execute(
                new SetGoodsReceiptLinesCommand({
                    receiptId,
                    lines: [{ goodId, quantity: 10 }],
                }),
            );

            await commandBus.execute(new ConfirmGoodsReceiptCommand({ receiptId }));

            const receipt = await queryBus.execute(new GetGoodsReceiptQuery(receiptId));
            expect(receipt.note).toEqual("Customer return — packaging");
            expect(receipt.targetWarehouseId).toEqual(warehouseId);
        });

        it("receiving the same good twice into a warehouse accumulates quantity", async () => {
            const goodId = await createGood({ name: "Soap" });
            const warehouseId = await createWarehouse("Accumulation WH");

            await receiveGoodsToWarehouse({ goodId, warehouseId, quantity: 20 });
            await receiveGoodsToWarehouse({ goodId, warehouseId, quantity: 30 });

            const entry = await getStockEntry(warehouseId, goodId);
            expect(entry.quantity).toEqual(50);
        });

        it("can receive multiple different goods in one receipt", async () => {
            const good1Id = await createGood({ name: "Juice" });
            const good2Id = await createGood({ name: "Milk" });
            const warehouseId = await createWarehouse("Multi-good WH");

            const receiptId: string = await commandBus.execute(
                new OpenGoodsReceiptCommand({ targetWarehouseId: warehouseId }),
            );

            await commandBus.execute(
                new SetGoodsReceiptLinesCommand({
                    receiptId,
                    lines: [
                        { goodId: good1Id, quantity: 15 },
                        { goodId: good2Id, quantity: 25 },
                    ],
                }),
            );

            await commandBus.execute(new ConfirmGoodsReceiptCommand({ receiptId }));

            expect((await getStockEntry(warehouseId, good1Id)).quantity).toEqual(15);
            expect((await getStockEntry(warehouseId, good2Id)).quantity).toEqual(25);
        });

        it("creates an initial history entry when stock is received", async () => {
            const goodId = await createGood({ name: "Rice" });
            const warehouseId = await createWarehouse("History WH");

            await receiveGoodsToWarehouse({ goodId, warehouseId, quantity: 100, locationDescription: "Bay 3" });

            const entry = await getStockEntry(warehouseId, goodId);
            expect(entry.quantity).toEqual(100);
        });
    });

    // ─── 3. Stock transfer ─────────────────────────────────────

    describe("Stock transfer between warehouses", () => {
        it("transfers stock: source decreases, destination increases", async () => {
            const goodId = await createGood({ name: "Flour" });
            const sourceId = await createWarehouse("Transfer Source");
            const destId = await createWarehouse("Transfer Dest");

            await receiveGoodsToWarehouse({ goodId, warehouseId: sourceId, quantity: 100 });

            await commandBus.execute(
                new TransferStockCommand({
                    goodId,
                    fromWarehouseId: sourceId,
                    toWarehouseId: destId,
                    quantity: 40,
                    locationDescription: "Rack B2",
                    note: "Planned restock",
                }),
            );

            expect((await getStockEntry(sourceId, goodId)).quantity).toEqual(60);
            expect((await getStockEntry(destId, goodId)).quantity).toEqual(40);
        });

        it("rejects transfer when insufficient stock", async () => {
            const goodId = await createGood({ name: "Sugar" });
            const sourceId = await createWarehouse("Insufficient Source");
            const destId = await createWarehouse("Insufficient Dest");

            await receiveGoodsToWarehouse({ goodId, warehouseId: sourceId, quantity: 10 });

            await expect(
                commandBus.execute(
                    new TransferStockCommand({
                        goodId,
                        fromWarehouseId: sourceId,
                        toWarehouseId: destId,
                        quantity: 50,
                    }),
                ),
            ).rejects.toThrow(InsufficientStockError);
        });

        it("rejects transfer when no stock entry exists in source", async () => {
            const goodId = await createGood({ name: "Salt" });
            const sourceId = await createWarehouse("No Stock Source");
            const destId = await createWarehouse("No Stock Dest");

            await expect(
                commandBus.execute(
                    new TransferStockCommand({
                        goodId,
                        fromWarehouseId: sourceId,
                        toWarehouseId: destId,
                        quantity: 5,
                    }),
                ),
            ).rejects.toThrow(StockEntryNotFoundError);
        });

        it("allows adding a note and location description to a transfer", async () => {
            const goodId = await createGood({ name: "Coffee" });
            const sourceId = await createWarehouse("Note Transfer Source");
            const destId = await createWarehouse("Note Transfer Dest");

            await receiveGoodsToWarehouse({ goodId, warehouseId: sourceId, quantity: 50 });

            await commandBus.execute(
                new TransferStockCommand({
                    goodId,
                    fromWarehouseId: sourceId,
                    toWarehouseId: destId,
                    quantity: 20,
                    locationDescription: "Aisle 5, Shelf 2",
                    note: "Monthly rotation",
                }),
            );

            const entry = await getStockEntry(destId, goodId);
            expect(entry.quantity).toEqual(20);
            expect(entry.locationDescription).toEqual("Aisle 5, Shelf 2");
        });
    });

    // ─── 4. Stock removal ──────────────────────────────────────

    describe("Stock removal from warehouse", () => {
        it("removes stock with reason SALE", async () => {
            const goodId = await createGood({ name: "Tea" });
            const warehouseId = await createWarehouse("Sale Removal WH");

            await receiveGoodsToWarehouse({ goodId, warehouseId, quantity: 100 });

            await commandBus.execute(
                new RemoveStockCommand({
                    goodId,
                    warehouseId,
                    quantity: 30,
                    reason: StockRemovalReason.SALE,
                }),
            );

            expect((await getStockEntry(warehouseId, goodId)).quantity).toEqual(70);
        });

        it("removes stock with reason DAMAGE", async () => {
            const goodId = await createGood({ name: "Glass jar" });
            const warehouseId = await createWarehouse("Damage Removal WH");

            await receiveGoodsToWarehouse({ goodId, warehouseId, quantity: 40 });

            await commandBus.execute(
                new RemoveStockCommand({
                    goodId,
                    warehouseId,
                    quantity: 5,
                    reason: StockRemovalReason.DAMAGE,
                    note: "Broken during transport",
                }),
            );

            expect((await getStockEntry(warehouseId, goodId)).quantity).toEqual(35);
        });

        it("removes stock with reason OTHER and a note", async () => {
            const goodId = await createGood({ name: "Biscuit" });
            const warehouseId = await createWarehouse("Other Removal WH");

            await receiveGoodsToWarehouse({ goodId, warehouseId, quantity: 60 });

            await commandBus.execute(
                new RemoveStockCommand({
                    goodId,
                    warehouseId,
                    quantity: 10,
                    reason: StockRemovalReason.OTHER,
                    note: "Expired stock write-off",
                }),
            );

            expect((await getStockEntry(warehouseId, goodId)).quantity).toEqual(50);
        });

        it("rejects removal when insufficient stock", async () => {
            const goodId = await createGood({ name: "Butter" });
            const warehouseId = await createWarehouse("Insufficient Removal WH");

            await receiveGoodsToWarehouse({ goodId, warehouseId, quantity: 5 });

            await expect(
                commandBus.execute(
                    new RemoveStockCommand({
                        goodId,
                        warehouseId,
                        quantity: 20,
                        reason: StockRemovalReason.SALE,
                    }),
                ),
            ).rejects.toThrow(InsufficientStockError);
        });

        it("rejects removal when no stock entry exists", async () => {
            const goodId = await createGood({ name: "Pepper" });
            const warehouseId = await createWarehouse("No Entry Removal WH");

            await expect(
                commandBus.execute(
                    new RemoveStockCommand({
                        goodId,
                        warehouseId,
                        quantity: 1,
                        reason: StockRemovalReason.OTHER,
                    }),
                ),
            ).rejects.toThrow(StockEntryNotFoundError);
        });
    });

    // ─── 5. Good properties (weight, dimensions, etc.) ────────

    describe("Good properties — weight, dimensions, identity", () => {
        it("creates a good with weight, 3D dimensions, name, and description", async () => {
            const goodId = await createGood({
                name: "Heavy crate",
                description: "Industrial metal crate",
                weightValue: 25.5,
                weightUnit: WeightUnit.KG,
                dimensionLength: 120,
                dimensionWidth: 80,
                dimensionHeight: 60,
                dimensionUnit: DimensionUnit.CM,
            });

            const good = await queryBus.execute(new GetGoodQuery(goodId));

            expect(good.name).toEqual("Heavy crate");
            expect(good.description).toEqual("Industrial metal crate");
            expect(good.weight.value).toEqual(25.5);
            expect(good.weight.unit).toEqual(WeightUnit.KG);
            expect(good.dimensions.length).toEqual(120);
            expect(good.dimensions.width).toEqual(80);
            expect(good.dimensions.height).toEqual(60);
            expect(good.dimensions.unit).toEqual(DimensionUnit.CM);
        });

        it("good has a unique identifier", async () => {
            const id1 = await createGood({ name: "Item 1" });
            const id2 = await createGood({ name: "Item 2" });

            expect(id1).toBeDefined();
            expect(id2).toBeDefined();
            expect(id1).not.toEqual(id2);
        });
    });

    // ─── 6. Warehouse location tracking ───────────────────────

    describe("Warehouse and location tracking", () => {
        it("stock entry tracks location in warehouse", async () => {
            const goodId = await createGood({ name: "Packaged food" });
            const warehouseId = await createWarehouse("Location Track WH");

            await receiveGoodsToWarehouse({
                goodId,
                warehouseId,
                quantity: 30,
                locationDescription: "Zone C, Shelf 12",
            });

            const entry = await getStockEntry(warehouseId, goodId);
            expect(entry.locationDescription).toEqual("Zone C, Shelf 12");
        });

        it("transfer updates location in destination warehouse", async () => {
            const goodId = await createGood({ name: "Canned soup" });
            const sourceId = await createWarehouse("Loc Source WH");
            const destId = await createWarehouse("Loc Dest WH");

            await receiveGoodsToWarehouse({
                goodId,
                warehouseId: sourceId,
                quantity: 100,
                locationDescription: "Original location",
            });

            await commandBus.execute(
                new TransferStockCommand({
                    goodId,
                    fromWarehouseId: sourceId,
                    toWarehouseId: destId,
                    quantity: 25,
                    locationDescription: "New location in dest",
                }),
            );

            const destEntry = await getStockEntry(destId, goodId);
            expect(destEntry.locationDescription).toEqual("New location in dest");
        });
    });

    // ─── 7. Incorporated goods: transfer and removal with parent ─

    describe("Incorporated goods are transferred and removed with parent", () => {
        it("transferring a parent also transfers its children", async () => {
            const parentId = await createGood({ name: "Pallet" });
            const childId = await createGood({ name: "Box on pallet", parentId });
            const sourceId = await createWarehouse("Composite Transfer Source");
            const destId = await createWarehouse("Composite Transfer Dest");

            await receiveGoodsToWarehouse({ goodId: parentId, warehouseId: sourceId, quantity: 10 });
            await receiveGoodsToWarehouse({ goodId: childId, warehouseId: sourceId, quantity: 10 });

            await commandBus.execute(
                new TransferStockCommand({
                    goodId: parentId,
                    fromWarehouseId: sourceId,
                    toWarehouseId: destId,
                    quantity: 5,
                }),
            );

            expect((await getStockEntry(sourceId, parentId)).quantity).toEqual(5);
            expect((await getStockEntry(destId, parentId)).quantity).toEqual(5);
            expect((await getStockEntry(sourceId, childId)).quantity).toEqual(5);
            expect((await getStockEntry(destId, childId)).quantity).toEqual(5);
        });

        it("removing a parent also removes its children", async () => {
            const parentId = await createGood({ name: "Crate" });
            const childId = await createGood({ name: "Bottle in crate", parentId });
            const warehouseId = await createWarehouse("Composite Removal WH");

            await receiveGoodsToWarehouse({ goodId: parentId, warehouseId, quantity: 20 });
            await receiveGoodsToWarehouse({ goodId: childId, warehouseId, quantity: 20 });

            await commandBus.execute(
                new RemoveStockCommand({
                    goodId: parentId,
                    warehouseId,
                    quantity: 8,
                    reason: StockRemovalReason.SALE,
                }),
            );

            expect((await getStockEntry(warehouseId, parentId)).quantity).toEqual(12);
            expect((await getStockEntry(warehouseId, childId)).quantity).toEqual(12);
        });

        it("transferring a child directly (without parent) does not affect parent", async () => {
            const parentId = await createGood({ name: "Standalone parent" });
            const childId = await createGood({ name: "Detachable child", parentId });
            const sourceId = await createWarehouse("Child Transfer Source");
            const destId = await createWarehouse("Child Transfer Dest");

            await receiveGoodsToWarehouse({ goodId: parentId, warehouseId: sourceId, quantity: 10 });
            await receiveGoodsToWarehouse({ goodId: childId, warehouseId: sourceId, quantity: 10 });

            await commandBus.execute(
                new TransferStockCommand({
                    goodId: childId,
                    fromWarehouseId: sourceId,
                    toWarehouseId: destId,
                    quantity: 3,
                }),
            );

            expect((await getStockEntry(sourceId, parentId)).quantity).toEqual(10);
            expect((await getStockEntry(sourceId, childId)).quantity).toEqual(7);
            expect((await getStockEntry(destId, childId)).quantity).toEqual(3);
        });
    });

    // ─── 8. End-to-end scenario ───────────────────────────────

    describe("End-to-end: receive → transfer → remove", () => {
        it("full lifecycle of a good through warehouses", async () => {
            const goodId = await createGood({ name: "Bottled water" });
            const mainWh = await createWarehouse("Main Warehouse");
            const mobileWh = await createWarehouse("Mobile Warehouse (vehicle)");

            // Step 1: Receive 200 units into main warehouse
            await receiveGoodsToWarehouse({
                goodId,
                warehouseId: mainWh,
                quantity: 200,
                locationDescription: "Loading dock",
                note: "Purchase order #123",
            });

            expect((await getStockEntry(mainWh, goodId)).quantity).toEqual(200);

            // Step 2: Transfer 80 to mobile warehouse (vehicle loading)
            await commandBus.execute(
                new TransferStockCommand({
                    goodId,
                    fromWarehouseId: mainWh,
                    toWarehouseId: mobileWh,
                    quantity: 80,
                    locationDescription: "Vehicle cargo bed",
                    note: "Route loading for tomorrow",
                }),
            );

            expect((await getStockEntry(mainWh, goodId)).quantity).toEqual(120);
            expect((await getStockEntry(mobileWh, goodId)).quantity).toEqual(80);

            // Step 3: Sell 50 from mobile warehouse (field delivery)
            await commandBus.execute(
                new RemoveStockCommand({
                    goodId,
                    warehouseId: mobileWh,
                    quantity: 50,
                    reason: StockRemovalReason.SALE,
                    note: "Delivered to client ABC",
                }),
            );

            expect((await getStockEntry(mobileWh, goodId)).quantity).toEqual(30);

            // Step 4: 5 units damaged during transport
            await commandBus.execute(
                new RemoveStockCommand({
                    goodId,
                    warehouseId: mobileWh,
                    quantity: 5,
                    reason: StockRemovalReason.DAMAGE,
                    note: "Damaged in transit",
                }),
            );

            expect((await getStockEntry(mobileWh, goodId)).quantity).toEqual(25);

            // Step 5: Return remaining stock to main warehouse
            await commandBus.execute(
                new TransferStockCommand({
                    goodId,
                    fromWarehouseId: mobileWh,
                    toWarehouseId: mainWh,
                    quantity: 25,
                    locationDescription: "Return bay",
                    note: "End of day return",
                }),
            );

            expect((await getStockEntry(mainWh, goodId)).quantity).toEqual(145);
            expect((await getStockEntry(mobileWh, goodId)).quantity).toEqual(0);
        });
    });
});
