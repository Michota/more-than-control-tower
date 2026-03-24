import z from "zod";
import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";
import { GoodHistoryEventType } from "./good-history-event-type.enum.js";
import { GoodRemovalReason } from "./good-removal-reason.enum.js";

const goodHistoryEntrySchema = z.object({
    eventType: z.enum(GoodHistoryEventType),
    note: z.string().optional(),
    removalReason: z.enum(GoodRemovalReason).optional(),
    fromWarehouseId: z.uuid().optional(),
    toWarehouseId: z.uuid().optional(),
    occurredAt: z.date(),
});

export type GoodHistoryEntryProperties = z.infer<typeof goodHistoryEntrySchema>;

export class GoodHistoryEntry extends ValueObjectWithSchema<GoodHistoryEntryProperties> {
    protected get schema() {
        return goodHistoryEntrySchema;
    }

    get eventType(): GoodHistoryEventType {
        return this.properties.eventType;
    }

    get note(): string | undefined {
        return this.properties.note;
    }

    get removalReason(): GoodRemovalReason | undefined {
        return this.properties.removalReason;
    }

    get fromWarehouseId(): string | undefined {
        return this.properties.fromWarehouseId;
    }

    get toWarehouseId(): string | undefined {
        return this.properties.toWarehouseId;
    }

    get occurredAt(): Date {
        return this.properties.occurredAt;
    }
}
