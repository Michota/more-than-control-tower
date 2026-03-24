import z from "zod";
import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";

const goodsReceiptLineSchema = z.object({
    goodId: z.uuid(),
    quantity: z.number().int().positive(),
    sectorId: z.uuid().optional(),
    locationDescription: z.string().optional(),
    note: z.string().optional(),
});

export type GoodsReceiptLineProperties = z.infer<typeof goodsReceiptLineSchema>;

export class GoodsReceiptLine extends ValueObjectWithSchema<GoodsReceiptLineProperties> {
    protected get schema() {
        return goodsReceiptLineSchema;
    }

    get goodId(): string {
        return this.properties.goodId;
    }

    get quantity(): number {
        return this.properties.quantity;
    }

    get sectorId(): string | undefined {
        return this.properties.sectorId;
    }

    get locationDescription(): string | undefined {
        return this.properties.locationDescription;
    }

    get note(): string | undefined {
        return this.properties.note;
    }
}
