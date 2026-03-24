import z from "zod";
import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";
import { StockEventType } from "./stock-event-type.enum.js";
import { StockRemovalReason } from "./stock-removal-reason.enum.js";

const stockHistoryEntrySchema = z.object({
    eventType: z.enum(StockEventType),
    quantityDelta: z.number().int(),
    quantityAfter: z.number().int().min(0),
    note: z.string().optional(),
    removalReason: z.enum(StockRemovalReason).optional(),
    relatedWarehouseId: z.uuid().optional(),
    relatedSectorId: z.uuid().optional(),
    occurredAt: z.date(),
});

export type StockHistoryEntryProperties = z.infer<typeof stockHistoryEntrySchema>;

export class StockHistoryEntry extends ValueObjectWithSchema<StockHistoryEntryProperties> {
    protected get schema() {
        return stockHistoryEntrySchema;
    }

    get eventType(): StockEventType {
        return this.properties.eventType;
    }

    get quantityDelta(): number {
        return this.properties.quantityDelta;
    }

    get quantityAfter(): number {
        return this.properties.quantityAfter;
    }

    get note(): string | undefined {
        return this.properties.note;
    }

    get removalReason(): StockRemovalReason | undefined {
        return this.properties.removalReason;
    }

    get relatedWarehouseId(): string | undefined {
        return this.properties.relatedWarehouseId;
    }

    get relatedSectorId(): string | undefined {
        return this.properties.relatedSectorId;
    }

    get occurredAt(): Date {
        return this.properties.occurredAt;
    }
}
