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
import { CreateSectorCommand } from "./commands/create-sector/create-sector.command";
import { MoveStockToSectorCommand } from "./commands/move-stock-to-sector/move-stock-to-sector.command";
import { EditWarehouseCommand } from "./commands/edit-warehouse/edit-warehouse.command";
import { DeleteGoodsCommand } from "./commands/delete-goods/delete-goods.command";
import { SectorCapability } from "./domain/sector-capability.enum";
import { SectorNotInWarehouseError } from "./domain/good.errors";
import { ListSectorsQuery } from "./queries/list-sectors/list-sectors.query";
import { GetSectorLoadQuery } from "./queries/get-sector-load/get-sector-load.query";
import { ListWarehousesQuery } from "./queries/list-warehouses/list-warehouses.query";
import {
    ActivateWarehouseCommand,
    DeactivateWarehouseCommand,
} from "./commands/change-warehouse-status/change-warehouse-status.command";
import { DeactivateSectorCommand } from "./commands/change-sector-status/change-sector-status.command";
import { WarehouseHasStockError, GoodHasActiveStockError, GoodNotFoundError } from "./domain/good.errors";
import { PermissionRegistryModule } from "../../shared/infrastructure/permission-registry.module";
import { AttachCodeToGoodCommand } from "./commands/attach-code-to-good/attach-code-to-good.command";
import { DetachCodeFromGoodCommand } from "./commands/detach-code-from-good/detach-code-from-good.command";
import { FindGoodByCodeQuery } from "./queries/find-good-by-code/find-good-by-code.query";
import { ListCodesForGoodQuery } from "./queries/list-codes-for-good/list-codes-for-good.query";
import { CodeType } from "./domain/code-type.enum";
import { CodeNotFoundError, CodeValueAlreadyExistsError } from "./domain/code.errors";
import { uuidRegex } from "src/shared/utils/uuid-regex";
import { RequestStockTransferCommand } from "../../shared/commands/request-stock-transfer.command";
import { FulfillStockTransferRequestCommand } from "./commands/fulfill-stock-transfer-request/fulfill-stock-transfer-request.command";
import { CancelStockTransferRequestCommand } from "./commands/cancel-stock-transfer-request/cancel-stock-transfer-request.command";
import { RejectStockTransferRequestCommand } from "./commands/reject-stock-transfer-request/reject-stock-transfer-request.command";
import { GetStockTransferRequestQuery } from "./queries/get-stock-transfer-request/get-stock-transfer-request.query";
import { ListStockTransferRequestsQuery } from "./queries/list-stock-transfer-requests/list-stock-transfer-requests.query";
import { StockTransferRequestStatus } from "./domain/stock-transfer-request-status.enum";
import {
    StockTransferRequestNotFoundError,
    StockTransferRequestNotPendingError,
} from "./domain/stock-transfer-request.errors";

describe("Warehouse Module — Integration Tests", () => {
    let moduleRef: TestingModule;
    let commandBus: CommandBus;
    let queryBus: QueryBus;
    let orm: MikroORM;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [TestMikroOrmDatabaseModule(), CqrsModule.forRoot(), PermissionRegistryModule, WarehouseModule],
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
                    },
                ],
            }),
        );

        await commandBus.execute(new ConfirmGoodsReceiptCommand({ receiptId }));

        return receiptId;
    }

    async function getWarehouseStock(warehouseId: string) {
        return queryBus.execute(new ListWarehouseStockQuery({ warehouseId }));
    }

    async function createSector(warehouseId: string, name = "Sector A"): Promise<string> {
        return commandBus.execute(
            new CreateSectorCommand({
                warehouseId,
                name,
                dimensionLength: 10,
                dimensionWidth: 8,
                dimensionHeight: 4,
                dimensionUnit: DimensionUnit.M,
                capabilities: [SectorCapability.GENERAL],
                weightCapacityGrams: 500_000,
            }),
        );
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

            await receiveGoodsToWarehouse({ goodId, warehouseId, quantity: 100 });

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

        it("allows adding a note to a transfer", async () => {
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
                    note: "Monthly rotation",
                }),
            );

            const entry = await getStockEntry(destId, goodId);
            expect(entry.quantity).toEqual(20);
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

    // ─── 6. Incorporated goods: transfer and removal with parent ─

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

    // ─── 7. End-to-end scenario ───────────────────────────────

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
                    note: "End of day return",
                }),
            );

            expect((await getStockEntry(mainWh, goodId)).quantity).toEqual(145);
            expect((await getStockEntry(mobileWh, goodId)).quantity).toEqual(0);
        });
    });

    // ─── 8. Sectors ─────────────────────────────────────────────

    describe("Sectors", () => {
        it("lists sectors of a warehouse", async () => {
            const warehouseId = await createWarehouse("Sector List WH");
            await createSector(warehouseId, "Zone A");
            await createSector(warehouseId, "Zone B");

            const sectors = await queryBus.execute(new ListSectorsQuery(warehouseId));

            expect(sectors).toHaveLength(2);
            expect(sectors.map((s) => s.name).sort()).toEqual(["Zone A", "Zone B"]);
        });

        it("creates a sector in a warehouse", async () => {
            const warehouseId = await createWarehouse("Sector Create WH");
            const sectorId = await createSector(warehouseId, "Cold Storage");

            expect(sectorId).toBeDefined();

            const sectors = await queryBus.execute(new ListSectorsQuery(warehouseId));
            expect(sectors).toHaveLength(1);
            expect(sectors[0].name).toEqual("Cold Storage");
            expect(sectors[0].warehouseId).toEqual(warehouseId);
            expect(sectors[0].weightCapacityGrams).toEqual(500_000);
        });

        it("receives stock into a sector via goods receipt", async () => {
            const warehouseId = await createWarehouse("Sector Receipt WH");
            const sectorId = await createSector(warehouseId, "Shelf Zone");
            const goodId = await createGood({ name: "Sectored item" });

            const receiptId: string = await commandBus.execute(
                new OpenGoodsReceiptCommand({ targetWarehouseId: warehouseId }),
            );
            await commandBus.execute(
                new SetGoodsReceiptLinesCommand({
                    receiptId,
                    lines: [{ goodId, quantity: 30, sectorId }],
                }),
            );
            await commandBus.execute(new ConfirmGoodsReceiptCommand({ receiptId }));

            const entry = await getStockEntry(warehouseId, goodId);
            expect(entry.quantity).toEqual(30);
            expect(entry.sectorId).toEqual(sectorId);
        });

        it("removes stock from warehouse even when it is in a sector", async () => {
            const warehouseId = await createWarehouse("Sector Removal WH");
            const sectorId = await createSector(warehouseId, "Removal Zone");
            const goodId = await createGood({ name: "Sector removal item" });

            const receiptId: string = await commandBus.execute(
                new OpenGoodsReceiptCommand({ targetWarehouseId: warehouseId }),
            );
            await commandBus.execute(
                new SetGoodsReceiptLinesCommand({
                    receiptId,
                    lines: [{ goodId, quantity: 50, sectorId }],
                }),
            );
            await commandBus.execute(new ConfirmGoodsReceiptCommand({ receiptId }));

            await commandBus.execute(
                new RemoveStockCommand({
                    goodId,
                    warehouseId,
                    quantity: 20,
                    reason: StockRemovalReason.SALE,
                }),
            );

            expect((await getStockEntry(warehouseId, goodId)).quantity).toEqual(30);
        });

        it("moves stock between sectors within the same warehouse", async () => {
            const warehouseId = await createWarehouse("Sector Move WH");
            const sectorA = await createSector(warehouseId, "Sector A");
            const sectorB = await createSector(warehouseId, "Sector B");
            const goodId = await createGood({ name: "Movable item" });

            const receiptId: string = await commandBus.execute(
                new OpenGoodsReceiptCommand({ targetWarehouseId: warehouseId }),
            );
            await commandBus.execute(
                new SetGoodsReceiptLinesCommand({
                    receiptId,
                    lines: [{ goodId, quantity: 40, sectorId: sectorA }],
                }),
            );
            await commandBus.execute(new ConfirmGoodsReceiptCommand({ receiptId }));

            expect((await getStockEntry(warehouseId, goodId)).sectorId).toEqual(sectorA);

            await commandBus.execute(
                new MoveStockToSectorCommand({
                    goodId,
                    warehouseId,
                    sectorId: sectorB,
                }),
            );

            expect((await getStockEntry(warehouseId, goodId)).sectorId).toEqual(sectorB);
        });

        it("rejects moving stock to a sector from a different warehouse", async () => {
            const wh1 = await createWarehouse("Move WH 1");
            const wh2 = await createWarehouse("Move WH 2");
            const sectorInWh2 = await createSector(wh2, "Foreign Sector");
            const goodId = await createGood({ name: "Cross-wh item" });

            await receiveGoodsToWarehouse({ goodId, warehouseId: wh1, quantity: 10 });

            await expect(
                commandBus.execute(
                    new MoveStockToSectorCommand({
                        goodId,
                        warehouseId: wh1,
                        sectorId: sectorInWh2,
                    }),
                ),
            ).rejects.toThrow(SectorNotInWarehouseError);
        });

        it("transfers stock between warehouses preserving sector assignment", async () => {
            const sourceWh = await createWarehouse("Sector Transfer Source");
            const destWh = await createWarehouse("Sector Transfer Dest");
            const destSector = await createSector(destWh, "Dest Sector");
            const goodId = await createGood({ name: "Transfer to sector" });

            await receiveGoodsToWarehouse({ goodId, warehouseId: sourceWh, quantity: 100 });

            await commandBus.execute(
                new TransferStockCommand({
                    goodId,
                    fromWarehouseId: sourceWh,
                    toWarehouseId: destWh,
                    quantity: 30,
                    sectorId: destSector,
                }),
            );

            expect((await getStockEntry(sourceWh, goodId)).quantity).toEqual(70);
            const destEntry = await getStockEntry(destWh, goodId);
            expect(destEntry.quantity).toEqual(30);
            expect(destEntry.sectorId).toEqual(destSector);
        });

        it("sector load reflects stock weight", async () => {
            const warehouseId = await createWarehouse("Load WH");
            const sectorId = await createSector(warehouseId, "Load Sector");
            const goodId = await createGood({
                name: "Heavy item",
                weightValue: 2,
                weightUnit: WeightUnit.KG,
            });

            const receiptId: string = await commandBus.execute(
                new OpenGoodsReceiptCommand({ targetWarehouseId: warehouseId }),
            );
            await commandBus.execute(
                new SetGoodsReceiptLinesCommand({
                    receiptId,
                    lines: [{ goodId, quantity: 10, sectorId }],
                }),
            );
            await commandBus.execute(new ConfirmGoodsReceiptCommand({ receiptId }));

            const load = await queryBus.execute(new GetSectorLoadQuery(sectorId));
            expect(load.currentLoadGrams).toEqual(20_000);
            expect(load.weightCapacityGrams).toEqual(500_000);
            expect(load.loadPercentage).toEqual(4);
        });
    });

    // ─── 9. Warehouse type immutability ─────────────────────────

    describe("Warehouse type cannot be changed", () => {
        it("editing a warehouse changes name but type remains unchanged", async () => {
            const warehouseId = await createWarehouse("Immutable Type WH");

            await commandBus.execute(new EditWarehouseCommand({ warehouseId, name: "Renamed WH" }));

            const warehouses = await queryBus.execute(new ListWarehousesQuery());
            const wh = warehouses.find((w) => w.id === warehouseId);
            expect(wh).toBeDefined();
            expect(wh!.name).toEqual("Renamed WH");
            expect(wh!.type).toEqual("REGULAR");
        });

        it("EditWarehouseCommand does not expose a type property", () => {
            const cmd = new EditWarehouseCommand({ warehouseId: "00000000-0000-0000-0000-000000000000", name: "Test" });
            expect("type" in cmd).toBe(false);
        });
    });

    // ─── 10. Validation: negative dimensions and weight ─────────

    describe("Validation: negative dimensions and weight are rejected", () => {
        it("rejects creating a good with negative weight", async () => {
            await expect(createGood({ name: "Bad weight", weightValue: -1 })).rejects.toThrow();
        });

        it("rejects creating a good with zero weight", async () => {
            await expect(createGood({ name: "Zero weight", weightValue: 0 })).rejects.toThrow();
        });

        it("rejects creating a good with negative dimensions", async () => {
            await expect(
                createGood({
                    name: "Bad dimensions",
                    dimensionLength: -5,
                    dimensionWidth: 10,
                    dimensionHeight: 10,
                }),
            ).rejects.toThrow();
        });

        it("rejects creating a good with zero dimension", async () => {
            await expect(
                createGood({
                    name: "Zero dimension",
                    dimensionLength: 0,
                    dimensionWidth: 10,
                    dimensionHeight: 10,
                }),
            ).rejects.toThrow();
        });

        it("rejects creating a sector with negative dimensions", async () => {
            const warehouseId = await createWarehouse("Bad Sector WH");

            await expect(
                commandBus.execute(
                    new CreateSectorCommand({
                        warehouseId,
                        name: "Bad Sector",
                        dimensionLength: -1,
                        dimensionWidth: 5,
                        dimensionHeight: 3,
                        dimensionUnit: DimensionUnit.M,
                        capabilities: [SectorCapability.GENERAL],
                        weightCapacityGrams: 100_000,
                    }),
                ),
            ).rejects.toThrow();
        });

        it("rejects creating a sector with zero weight capacity", async () => {
            const warehouseId = await createWarehouse("Zero Cap WH");

            await expect(
                commandBus.execute(
                    new CreateSectorCommand({
                        warehouseId,
                        name: "Zero Cap Sector",
                        dimensionLength: 5,
                        dimensionWidth: 5,
                        dimensionHeight: 3,
                        dimensionUnit: DimensionUnit.M,
                        capabilities: [SectorCapability.GENERAL],
                        weightCapacityGrams: 0,
                    }),
                ),
            ).rejects.toThrow();
        });

        it("rejects receiving goods with negative quantity", async () => {
            const goodId = await createGood({ name: "Neg qty item" });
            const warehouseId = await createWarehouse("Neg Qty WH");

            const receiptId: string = await commandBus.execute(
                new OpenGoodsReceiptCommand({ targetWarehouseId: warehouseId }),
            );

            await expect(
                commandBus.execute(
                    new SetGoodsReceiptLinesCommand({
                        receiptId,
                        lines: [{ goodId, quantity: -5 }],
                    }),
                ),
            ).rejects.toThrow();
        });
    });

    // ─── 11. Deleting goods ────────────────────────────────────

    describe("Deleting goods", () => {
        it("can delete a good that has no stock entries", async () => {
            const goodId = await createGood({ name: "Deletable" });

            await expect(commandBus.execute(new DeleteGoodsCommand({ goodIds: [goodId] }))).resolves.not.toThrow();
        });

        it("rejects deleting a good that has active stock entries", async () => {
            const goodId = await createGood({ name: "Undeletable" });
            const warehouseId = await createWarehouse("Delete Guard WH");
            await receiveGoodsToWarehouse({ goodId, warehouseId, quantity: 10 });

            await expect(commandBus.execute(new DeleteGoodsCommand({ goodIds: [goodId] }))).rejects.toThrow(
                GoodHasActiveStockError,
            );
        });

        it("allows deleting a good when all stock entries have quantity 0", async () => {
            const goodId = await createGood({ name: "Fully sold" });
            const warehouseId = await createWarehouse("Zero Stock WH");
            await receiveGoodsToWarehouse({ goodId, warehouseId, quantity: 10 });

            // Remove all stock so quantity reaches 0
            await commandBus.execute(
                new RemoveStockCommand({
                    goodId,
                    warehouseId,
                    quantity: 10,
                    reason: StockRemovalReason.SALE,
                }),
            );

            // Should succeed — only archived (qty 0) entries remain
            await expect(commandBus.execute(new DeleteGoodsCommand({ goodIds: [goodId] }))).resolves.not.toThrow();
        });
    });

    // ─── 12. Warehouse deactivation with stock guard ────────────

    describe("Warehouse deactivation", () => {
        it("deactivates an empty warehouse", async () => {
            const warehouseId = await createWarehouse("Deactivatable WH");

            await commandBus.execute(new DeactivateWarehouseCommand({ warehouseId }));

            const warehouses = await queryBus.execute(new ListWarehousesQuery());
            const wh = warehouses.find((w) => w.id === warehouseId);
            expect(wh!.status).toEqual("INACTIVE");
        });

        it("rejects deactivation if warehouse has stock", async () => {
            const warehouseId = await createWarehouse("Has Stock WH");
            const goodId = await createGood({ name: "Blocker item" });
            await receiveGoodsToWarehouse({ goodId, warehouseId, quantity: 5 });

            await expect(commandBus.execute(new DeactivateWarehouseCommand({ warehouseId }))).rejects.toThrow(
                WarehouseHasStockError,
            );
        });

        it("reactivates an inactive warehouse", async () => {
            const warehouseId = await createWarehouse("Reactivatable WH");
            await commandBus.execute(new DeactivateWarehouseCommand({ warehouseId }));
            await commandBus.execute(new ActivateWarehouseCommand({ warehouseId }));

            const warehouses = await queryBus.execute(new ListWarehousesQuery());
            const wh = warehouses.find((w) => w.id === warehouseId);
            expect(wh!.status).toEqual("ACTIVE");
        });
    });

    // ─── 13. Sector deactivation ────────────────────────────────

    describe("Sector deactivation", () => {
        it("deactivates a sector", async () => {
            const warehouseId = await createWarehouse("Sector Deactivate WH");
            const sectorId = await createSector(warehouseId, "Deactivatable Sector");

            await commandBus.execute(new DeactivateSectorCommand({ sectorId }));

            const sectors = await queryBus.execute(new ListSectorsQuery(warehouseId));
            const sector = sectors.find((s) => s.id === sectorId);
            expect(sector!.status).toEqual("INACTIVE");
        });
    });

    // ─── 14. Stock history toggle ───────────────────────────────

    describe("Stock list with history", () => {
        it("returns history when includeHistory is true", async () => {
            const goodId = await createGood({ name: "History toggle item" });
            const warehouseId = await createWarehouse("History Toggle WH");
            await receiveGoodsToWarehouse({ goodId, warehouseId, quantity: 10 });

            const withHistory = await queryBus.execute(
                new ListWarehouseStockQuery({ warehouseId, includeHistory: true }),
            );
            expect(withHistory[0].history).toBeDefined();
            expect(withHistory[0].history!.length).toBeGreaterThan(0);
            expect(withHistory[0].history![0].eventType).toEqual("RECEIVED");
        });

        it("omits history by default", async () => {
            const goodId = await createGood({ name: "No history item" });
            const warehouseId = await createWarehouse("No History WH");
            await receiveGoodsToWarehouse({ goodId, warehouseId, quantity: 10 });

            const withoutHistory = await queryBus.execute(new ListWarehouseStockQuery({ warehouseId }));
            expect(withoutHistory[0].history).toBeUndefined();
        });
    });

    // ─── 15. Stock filtering and sorting ────────────────────────

    describe("Stock filtering and sorting", () => {
        it("filters stock by good name", async () => {
            const warehouseId = await createWarehouse("Filter Name WH");
            const appleId = await createGood({ name: "Apple" });
            const bananaId = await createGood({ name: "Banana" });
            await receiveGoodsToWarehouse({ goodId: appleId, warehouseId, quantity: 10 });
            await receiveGoodsToWarehouse({ goodId: bananaId, warehouseId, quantity: 20 });

            const result = await queryBus.execute(new ListWarehouseStockQuery({ warehouseId, goodName: "Apple" }));

            expect(result).toHaveLength(1);
            expect(result[0].goodName).toEqual("Apple");
        });

        it("filters stock by sector", async () => {
            const warehouseId = await createWarehouse("Filter Sector WH");
            const sectorId = await createSector(warehouseId, "Filter Sector");
            const goodId = await createGood({ name: "Filtered item" });
            const otherId = await createGood({ name: "Other item" });

            // Receive one into sector, one without
            const r1: string = await commandBus.execute(
                new OpenGoodsReceiptCommand({ targetWarehouseId: warehouseId }),
            );
            await commandBus.execute(
                new SetGoodsReceiptLinesCommand({ receiptId: r1, lines: [{ goodId, quantity: 5, sectorId }] }),
            );
            await commandBus.execute(new ConfirmGoodsReceiptCommand({ receiptId: r1 }));
            await receiveGoodsToWarehouse({ goodId: otherId, warehouseId, quantity: 10 });

            const result = await queryBus.execute(new ListWarehouseStockQuery({ warehouseId, sectorId }));

            expect(result).toHaveLength(1);
            expect(result[0].goodId).toEqual(goodId);
        });

        it("sorts stock by name", async () => {
            const warehouseId = await createWarehouse("Sort Name WH");
            const zId = await createGood({ name: "Zucchini" });
            const aId = await createGood({ name: "Avocado" });
            await receiveGoodsToWarehouse({ goodId: zId, warehouseId, quantity: 5 });
            await receiveGoodsToWarehouse({ goodId: aId, warehouseId, quantity: 5 });

            const asc = await queryBus.execute(
                new ListWarehouseStockQuery({ warehouseId, sortBy: "name", sortDirection: "asc" }),
            );
            expect(asc[0].goodName).toEqual("Avocado");
            expect(asc[1].goodName).toEqual("Zucchini");

            const desc = await queryBus.execute(
                new ListWarehouseStockQuery({ warehouseId, sortBy: "name", sortDirection: "desc" }),
            );
            expect(desc[0].goodName).toEqual("Zucchini");
        });
    });

    // ─── 16. Children of a good ─────────────────────────────────

    describe("Children of a good", () => {
        it("returns children in get-good response", async () => {
            const parentId = await createGood({ name: "Parent box" });
            const child1Id = await createGood({ name: "Child A", parentId });
            const child2Id = await createGood({ name: "Child B", parentId });

            const parent = await queryBus.execute(new GetGoodQuery(parentId));

            expect(parent.children).toHaveLength(2);
            const childIds = parent.children.map((c) => c.id).sort();
            expect(childIds).toEqual([child1Id, child2Id].sort());
        });

        it("returns empty children array for a good with no children", async () => {
            const goodId = await createGood({ name: "Childless" });

            const good = await queryBus.execute(new GetGoodQuery(goodId));

            expect(good.children).toEqual([]);
        });
    });

    // ─── 17. Stock entry attributes ─────────────────────────────

    describe("Stock entry attributes", () => {
        async function receiveWithAttributes(
            goodId: string,
            warehouseId: string,
            quantity: number,
            attributes: { name: string; type: string; value: string }[],
        ) {
            const receiptId: string = await commandBus.execute(
                new OpenGoodsReceiptCommand({ targetWarehouseId: warehouseId }),
            );
            await commandBus.execute(
                new SetGoodsReceiptLinesCommand({
                    receiptId,
                    lines: [{ goodId, quantity, attributes }],
                }),
            );
            await commandBus.execute(new ConfirmGoodsReceiptCommand({ receiptId }));
        }

        it("receives stock with DATE attribute and returns it in query", async () => {
            const goodId = await createGood({ name: "Perishable" });
            const warehouseId = await createWarehouse("Date Attr WH");

            await receiveWithAttributes(goodId, warehouseId, 50, [
                { name: "expiration_date", type: "DATE", value: "2026-06-01" },
            ]);

            const stock = await queryBus.execute(new ListWarehouseStockQuery({ warehouseId }));
            expect(stock[0].attributes).toHaveLength(1);
            expect(stock[0].attributes[0].name).toEqual("expiration_date");
            expect(stock[0].attributes[0].type).toEqual("DATE");
            expect(stock[0].attributes[0].value).toEqual("2026-06-01");
        });

        it("receives stock with STRING and NUMBER attributes", async () => {
            const goodId = await createGood({ name: "Multi attr" });
            const warehouseId = await createWarehouse("Multi Attr WH");

            await receiveWithAttributes(goodId, warehouseId, 20, [
                { name: "batch", type: "STRING", value: "LOT-2026-A" },
                { name: "temperature", type: "NUMBER", value: "-18" },
            ]);

            const stock = await queryBus.execute(new ListWarehouseStockQuery({ warehouseId }));
            expect(stock[0].attributes).toHaveLength(2);
            expect(stock[0].attributes.find((a) => a.name === "batch")!.value).toEqual("LOT-2026-A");
            expect(stock[0].attributes.find((a) => a.name === "temperature")!.value).toEqual("-18");
        });

        it("filters stock by attribute name and value", async () => {
            const warehouseId = await createWarehouse("Attr Val Filter WH");
            const goodA = await createGood({ name: "Batch A" });
            const goodB = await createGood({ name: "Batch B" });

            await receiveWithAttributes(goodA, warehouseId, 10, [{ name: "batch", type: "STRING", value: "LOT-001" }]);
            await receiveWithAttributes(goodB, warehouseId, 10, [{ name: "batch", type: "STRING", value: "LOT-002" }]);

            const result = await queryBus.execute(
                new ListWarehouseStockQuery({
                    warehouseId,
                    attributeName: "batch",
                    attributeValue: "LOT-001",
                }),
            );

            expect(result).toHaveLength(1);
            expect(result[0].goodName).toEqual("Batch A");
        });

        it("filters stock by DATE attribute before a given date", async () => {
            const warehouseId = await createWarehouse("Date Filter WH");
            const soonGood = await createGood({ name: "Expires soon" });
            const laterGood = await createGood({ name: "Expires later" });

            await receiveWithAttributes(soonGood, warehouseId, 10, [
                { name: "expiration_date", type: "DATE", value: "2026-04-15" },
            ]);
            await receiveWithAttributes(laterGood, warehouseId, 10, [
                { name: "expiration_date", type: "DATE", value: "2026-12-01" },
            ]);

            // Find stock expiring before June 2026 (within ~90 days from March 24)
            const result = await queryBus.execute(
                new ListWarehouseStockQuery({
                    warehouseId,
                    attributeName: "expiration_date",
                    attributeDateBefore: "2026-06-01",
                }),
            );

            expect(result).toHaveLength(1);
            expect(result[0].goodName).toEqual("Expires soon");
        });

        it("returns empty attributes when none are set", async () => {
            const goodId = await createGood({ name: "No attr" });
            const warehouseId = await createWarehouse("No Attr WH");
            await receiveGoodsToWarehouse({ goodId, warehouseId, quantity: 10 });

            const stock = await queryBus.execute(new ListWarehouseStockQuery({ warehouseId }));
            expect(stock[0].attributes).toEqual([]);
        });

        it("filters out stock with no matching attribute name", async () => {
            const goodId = await createGood({ name: "Plain item" });
            const warehouseId = await createWarehouse("No Match WH");
            await receiveGoodsToWarehouse({ goodId, warehouseId, quantity: 10 });

            const result = await queryBus.execute(
                new ListWarehouseStockQuery({
                    warehouseId,
                    attributeName: "nonexistent",
                }),
            );

            expect(result).toHaveLength(0);
        });
    });

    // ─── Codes ────────────────────────────────────────────────

    describe("Codes (barcode, QR, etc.)", () => {
        it("attaches a code to a good and lists it", async () => {
            const goodId = await createGood({ name: "Coded Product" });

            const codeId: string = await commandBus.execute(
                new AttachCodeToGoodCommand({
                    goodId,
                    type: CodeType.EAN_13,
                    value: "5901234123457",
                }),
            );

            expect(codeId).toMatch(uuidRegex);

            const codes = await queryBus.execute(new ListCodesForGoodQuery(goodId));
            expect(codes).toHaveLength(1);
            expect(codes[0]).toEqual({
                id: codeId,
                type: CodeType.EAN_13,
                value: "5901234123457",
            });
        });

        it("attaches multiple codes of different types to the same good", async () => {
            const goodId = await createGood({ name: "Multi-code Product" });

            await commandBus.execute(
                new AttachCodeToGoodCommand({
                    goodId,
                    type: CodeType.EAN_13,
                    value: "5901234000001",
                }),
            );

            await commandBus.execute(
                new AttachCodeToGoodCommand({
                    goodId,
                    type: CodeType.QR,
                    value: "QR-MULTI-001",
                }),
            );

            const codes = await queryBus.execute(new ListCodesForGoodQuery(goodId));
            expect(codes).toHaveLength(2);
        });

        it("rejects duplicate code values", async () => {
            const goodId1 = await createGood({ name: "Product A" });
            const goodId2 = await createGood({ name: "Product B" });

            await commandBus.execute(
                new AttachCodeToGoodCommand({
                    goodId: goodId1,
                    type: CodeType.EAN_13,
                    value: "5901234999999",
                }),
            );

            await expect(
                commandBus.execute(
                    new AttachCodeToGoodCommand({
                        goodId: goodId2,
                        type: CodeType.EAN_13,
                        value: "5901234999999",
                    }),
                ),
            ).rejects.toThrow(CodeValueAlreadyExistsError);
        });

        it("looks up a good by code value", async () => {
            const goodId = await createGood({ name: "Lookup Product" });

            await commandBus.execute(
                new AttachCodeToGoodCommand({
                    goodId,
                    type: CodeType.CODE_128,
                    value: "LOOKUP-CODE-001",
                }),
            );

            const result = await queryBus.execute(new FindGoodByCodeQuery("LOOKUP-CODE-001"));
            expect(result.goodId).toEqual(goodId);
            expect(result.goodName).toEqual("Lookup Product");
            expect(result.codeType).toEqual(CodeType.CODE_128);
            expect(result.codeValue).toEqual("LOOKUP-CODE-001");
        });

        it("detaches a code from a good", async () => {
            const goodId = await createGood({ name: "Detach Product" });

            const codeId: string = await commandBus.execute(
                new AttachCodeToGoodCommand({
                    goodId,
                    type: CodeType.INTERNAL,
                    value: "INT-DETACH-001",
                }),
            );

            await commandBus.execute(new DetachCodeFromGoodCommand({ codeId }));

            const codes = await queryBus.execute(new ListCodesForGoodQuery(goodId));
            expect(codes).toHaveLength(0);
        });

        it("throws CodeNotFoundError when looking up a non-existent code value", async () => {
            await expect(queryBus.execute(new FindGoodByCodeQuery("NONEXISTENT-CODE"))).rejects.toThrow(
                CodeNotFoundError,
            );
        });

        it("throws CodeNotFoundError when detaching a non-existent code", async () => {
            await expect(
                commandBus.execute(new DetachCodeFromGoodCommand({ codeId: "00000000-0000-0000-0000-000000000000" })),
            ).rejects.toThrow(CodeNotFoundError);
        });

        it("throws GoodNotFoundError when attaching a code to a non-existent good", async () => {
            await expect(
                commandBus.execute(
                    new AttachCodeToGoodCommand({
                        goodId: "00000000-0000-0000-0000-000000000000",
                        type: CodeType.EAN_13,
                        value: "ORPHAN-CODE-001",
                    }),
                ),
            ).rejects.toThrow(GoodNotFoundError);
        });
    });

    // ─── Transfer Requests ────────────────────────────────────

    describe("Stock Transfer Requests", () => {
        it("creates a transfer request via shared command and queries it", async () => {
            const goodId = await createGood({ name: "Transfer Good" });
            const fromWarehouseId = await createWarehouse("Source WH");
            const toWarehouseId = await createWarehouse("Dest WH");

            const requestId: string = await commandBus.execute(
                new RequestStockTransferCommand({
                    goodId,
                    quantity: 5,
                    fromWarehouseId,
                    toWarehouseId,
                    note: "Load for route",
                    requestedBy: "freight",
                }),
            );

            expect(requestId).toMatch(uuidRegex);

            const result = await queryBus.execute(new GetStockTransferRequestQuery(requestId));
            expect(result.status).toEqual(StockTransferRequestStatus.PENDING);
            expect(result.goodId).toEqual(goodId);
            expect(result.quantity).toEqual(5);
            expect(result.fromWarehouseId).toEqual(fromWarehouseId);
            expect(result.toWarehouseId).toEqual(toWarehouseId);
            expect(result.note).toEqual("Load for route");
            expect(result.requestedBy).toEqual("freight");
        });

        it("lists transfer requests with status filter", async () => {
            const goodId = await createGood({ name: "Filter Good" });
            const fromId = await createWarehouse("Filter Source");
            const toId = await createWarehouse("Filter Dest");

            await commandBus.execute(
                new RequestStockTransferCommand({ goodId, quantity: 1, fromWarehouseId: fromId, toWarehouseId: toId }),
            );
            const cancelId: string = await commandBus.execute(
                new RequestStockTransferCommand({ goodId, quantity: 2, fromWarehouseId: fromId, toWarehouseId: toId }),
            );
            await commandBus.execute(new CancelStockTransferRequestCommand({ requestId: cancelId }));

            const pending = await queryBus.execute(
                new ListStockTransferRequestsQuery(StockTransferRequestStatus.PENDING, undefined, undefined, 1, 100),
            );
            const cancelled = await queryBus.execute(
                new ListStockTransferRequestsQuery(StockTransferRequestStatus.CANCELLED, undefined, undefined, 1, 100),
            );

            expect(pending.data.every((r) => r.status === (StockTransferRequestStatus.PENDING as string))).toBe(true);
            expect(cancelled.data.some((r) => r.id === cancelId)).toBe(true);
        });

        it("fulfills a request and transfers stock", async () => {
            const goodId = await createGood({ name: "Fulfill Good" });
            const fromWarehouseId = await createWarehouse("Fulfill Source");
            const toWarehouseId = await createWarehouse("Fulfill Dest");

            await receiveGoodsToWarehouse({ goodId, warehouseId: fromWarehouseId, quantity: 20 });

            const requestId: string = await commandBus.execute(
                new RequestStockTransferCommand({
                    goodId,
                    quantity: 8,
                    fromWarehouseId,
                    toWarehouseId,
                }),
            );

            await commandBus.execute(new FulfillStockTransferRequestCommand({ requestId }));

            const result = await queryBus.execute(new GetStockTransferRequestQuery(requestId));
            expect(result.status).toEqual(StockTransferRequestStatus.FULFILLED);

            const sourceStock = await getWarehouseStock(fromWarehouseId);
            expect(sourceStock[0].quantity).toEqual(12);

            const destStock = await getWarehouseStock(toWarehouseId);
            expect(destStock[0].quantity).toEqual(8);
        });

        it("cancels a pending request", async () => {
            const goodId = await createGood({ name: "Cancel Good" });
            const fromId = await createWarehouse("Cancel Source");
            const toId = await createWarehouse("Cancel Dest");

            const requestId: string = await commandBus.execute(
                new RequestStockTransferCommand({ goodId, quantity: 3, fromWarehouseId: fromId, toWarehouseId: toId }),
            );

            await commandBus.execute(new CancelStockTransferRequestCommand({ requestId }));

            const result = await queryBus.execute(new GetStockTransferRequestQuery(requestId));
            expect(result.status).toEqual(StockTransferRequestStatus.CANCELLED);
        });

        it("rejects a pending request with reason", async () => {
            const goodId = await createGood({ name: "Reject Good" });
            const fromId = await createWarehouse("Reject Source");
            const toId = await createWarehouse("Reject Dest");

            const requestId: string = await commandBus.execute(
                new RequestStockTransferCommand({ goodId, quantity: 3, fromWarehouseId: fromId, toWarehouseId: toId }),
            );

            await commandBus.execute(
                new RejectStockTransferRequestCommand({ requestId, reason: "Insufficient stock" }),
            );

            const result = await queryBus.execute(new GetStockTransferRequestQuery(requestId));
            expect(result.status).toEqual(StockTransferRequestStatus.REJECTED);
            expect(result.rejectionReason).toEqual("Insufficient stock");
        });

        it("throws when fulfilling a non-PENDING request", async () => {
            const goodId = await createGood({ name: "Invalid Fulfill Good" });
            const fromId = await createWarehouse("Inv Fulfill Source");
            const toId = await createWarehouse("Inv Fulfill Dest");

            const requestId: string = await commandBus.execute(
                new RequestStockTransferCommand({ goodId, quantity: 1, fromWarehouseId: fromId, toWarehouseId: toId }),
            );
            await commandBus.execute(new CancelStockTransferRequestCommand({ requestId }));

            await expect(commandBus.execute(new FulfillStockTransferRequestCommand({ requestId }))).rejects.toThrow(
                StockTransferRequestNotPendingError,
            );
        });

        it("fails to fulfill when source warehouse has insufficient stock", async () => {
            const goodId = await createGood({ name: "Insufficient Good" });
            const fromId = await createWarehouse("Empty Source");
            const toId = await createWarehouse("Insuf Dest");

            // No stock received — source warehouse is empty
            const requestId: string = await commandBus.execute(
                new RequestStockTransferCommand({ goodId, quantity: 5, fromWarehouseId: fromId, toWarehouseId: toId }),
            );

            await expect(commandBus.execute(new FulfillStockTransferRequestCommand({ requestId }))).rejects.toThrow(
                StockEntryNotFoundError,
            );

            // Request should still be PENDING (not stuck as FULFILLED)
            const result = await queryBus.execute(new GetStockTransferRequestQuery(requestId));
            expect(result.status).toEqual(StockTransferRequestStatus.PENDING);
        });

        it("throws StockTransferRequestNotFoundError for non-existent request", async () => {
            await expect(
                commandBus.execute(
                    new FulfillStockTransferRequestCommand({ requestId: "00000000-0000-0000-0000-000000000000" }),
                ),
            ).rejects.toThrow(StockTransferRequestNotFoundError);
        });
    });
});
