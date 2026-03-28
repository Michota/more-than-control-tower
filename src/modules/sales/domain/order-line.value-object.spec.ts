import Decimal from "decimal.js";
import { generateEntityId } from "../../../libs/ddd/utils/randomize-entity-id.js";
import { Currency } from "../../../shared/value-objects/currency.js";
import { Money } from "../../../shared/value-objects/money.js";
import { OrderItemEntity } from "./order-item.entity.js";
import { OrderLine } from "./order-line.value-object.js";
import { OrderLines } from "./order-lines.value-object.js";
import { randomUUID } from "crypto";

const pln = new Currency("PLN");

function createProduct(price = 10): OrderItemEntity {
    return OrderItemEntity.create({
        id: generateEntityId(),
        properties: { price: new Money(new Decimal(price), pln) },
    });
}

// ── OrderLine ────────────────────────────────────────────────

describe("OrderLine", () => {
    it("computes subtotal from product price and quantity", () => {
        const product = createProduct(15);
        const line = new OrderLine({ product, quantity: 3 });

        expect(line.subtotal.amount.toNumber()).toBe(45);
    });

    it("creates without stockEntryId by default", () => {
        const product = createProduct();
        const line = new OrderLine({ product, quantity: 1 });

        expect(line.stockEntryId).toBeUndefined();
    });

    it("preserves stockEntryId when created with one", () => {
        const product = createProduct();
        const stockEntryId = randomUUID();
        const line = new OrderLine({ product, quantity: 1, stockEntryId });

        expect(line.stockEntryId).toBe(stockEntryId);
    });

    it("withQuantity preserves stockEntryId", () => {
        const product = createProduct();
        const stockEntryId = randomUUID();
        const line = new OrderLine({ product, quantity: 1, stockEntryId });

        const updated = line.withQuantity(5);

        expect(updated.quantity).toBe(5);
        expect(updated.stockEntryId).toBe(stockEntryId);
    });

    it("withStockEntry returns new line with stock entry set", () => {
        const product = createProduct();
        const line = new OrderLine({ product, quantity: 2 });
        const stockEntryId = randomUUID();

        const updated = line.withStockEntry(stockEntryId);

        expect(updated.stockEntryId).toBe(stockEntryId);
        expect(updated.quantity).toBe(2);
        expect(updated.product).toBe(product);
    });

    it("throws when quantity is negative", () => {
        const product = createProduct();

        expect(() => new OrderLine({ product, quantity: -1 })).toThrow("Quantity cannot be negative");
    });
});

// ── OrderLines ───────────────────────────────────────────────

describe("OrderLines", () => {
    it("starts empty", () => {
        const lines = new OrderLines();

        expect(lines.hasItems()).toBe(false);
    });

    it("addProduct returns new instance with product", () => {
        const product = createProduct();
        const lines = new OrderLines();

        const updated = lines.addProduct(product, 3);

        expect(updated.hasItems()).toBe(true);
        expect(updated.getLines().get(product.id)?.quantity).toBe(3);
        // original is unchanged (immutability)
        expect(lines.hasItems()).toBe(false);
    });

    it("addProduct increments quantity for existing product", () => {
        const product = createProduct();
        const lines = new OrderLines().addProduct(product, 2);

        const updated = lines.addProduct(product, 3);

        expect(updated.getLines().get(product.id)?.quantity).toBe(5);
    });

    it("changeQuantityOfProduct sets exact quantity", () => {
        const product = createProduct();
        const lines = new OrderLines().addProduct(product, 5);

        const updated = lines.changeQuantityOfProduct(product, 2);

        expect(updated.getLines().get(product.id)?.quantity).toBe(2);
    });

    it("changeQuantityOfProduct to 0 removes product", () => {
        const product = createProduct();
        const lines = new OrderLines().addProduct(product, 5);

        const updated = lines.changeQuantityOfProduct(product, 0);

        expect(updated.hasItems()).toBe(false);
    });

    it("removeProduct removes product entirely", () => {
        const productA = createProduct();
        const productB = createProduct();
        const lines = new OrderLines().addProduct(productA, 1).addProduct(productB, 1);

        const updated = lines.removeProduct(productA);

        expect(updated.getLines().size).toBe(1);
        expect(updated.getLines().has(productA.id)).toBe(false);
    });

    it("getTotalPrice sums all line subtotals", () => {
        const productA = createProduct(10);
        const productB = createProduct(20);
        const lines = new OrderLines().addProduct(productA, 2).addProduct(productB, 3);

        const total = lines.getTotalPrice();

        // 10*2 + 20*3 = 80
        expect(total.amount.toNumber()).toBe(80);
    });

    it("assignStockEntry sets stock entry on specific line", () => {
        const product = createProduct();
        const lines = new OrderLines().addProduct(product, 2);
        const stockEntryId = randomUUID();

        const updated = lines.assignStockEntry(product.id, stockEntryId);

        expect(updated.getLines().get(product.id)?.stockEntryId).toBe(stockEntryId);
        // original unchanged
        expect(lines.getLines().get(product.id)?.stockEntryId).toBeUndefined();
    });

    it("assignStockEntry throws when product not found", () => {
        const lines = new OrderLines();

        expect(() => lines.assignStockEntry(generateEntityId(), randomUUID())).toThrow("Order line not found");
    });

    it("assignStockEntry preserves other lines", () => {
        const productA = createProduct();
        const productB = createProduct();
        const lines = new OrderLines().addProduct(productA, 1).addProduct(productB, 3);
        const stockEntryId = randomUUID();

        const updated = lines.assignStockEntry(productA.id, stockEntryId);

        expect(updated.getLines().get(productA.id)?.stockEntryId).toBe(stockEntryId);
        expect(updated.getLines().get(productB.id)?.stockEntryId).toBeUndefined();
        expect(updated.getLines().get(productB.id)?.quantity).toBe(3);
    });
});
