import z from "zod";
import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";

export enum StockAttributeType {
    STRING = "STRING",
    NUMBER = "NUMBER",
    DATE = "DATE",
}

const stockEntryAttributeSchema = z.object({
    name: z.string().min(1),
    type: z.enum(StockAttributeType),
    value: z.string(),
});

export type StockEntryAttributeProperties = z.infer<typeof stockEntryAttributeSchema>;

export class StockEntryAttribute extends ValueObjectWithSchema<StockEntryAttributeProperties> {
    protected get schema() {
        return stockEntryAttributeSchema;
    }

    get name(): string {
        return this.properties.name;
    }

    get type(): StockAttributeType {
        return this.properties.type;
    }

    get value(): string {
        return this.properties.value;
    }

    get dateValue(): Date | undefined {
        if (this.properties.type === StockAttributeType.DATE) {
            return new Date(this.properties.value);
        }
        return undefined;
    }

    get numberValue(): number | undefined {
        if (this.properties.type === StockAttributeType.NUMBER) {
            return Number(this.properties.value);
        }
        return undefined;
    }
}
