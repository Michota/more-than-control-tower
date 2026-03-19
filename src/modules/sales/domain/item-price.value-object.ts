import { ValueObjectWithSchema } from "@src/shared/ddd/value-object-with-schema.abstract";
import { Money } from "@src/shared/value-objects/money";
import z from "zod";

const itemPriceSchema = z.object({
    itemId: z.string(),
    price: z.instanceof(Money),
});

export type ItemPriceProperties = z.infer<typeof itemPriceSchema>;

export class ItemPrice extends ValueObjectWithSchema<z.infer<typeof itemPriceSchema>> {
    get amount() {
        return this.properties.price.amount;
    }
    get currency() {
        return this.properties.price.currency;
    }
    create(props: ItemPriceProperties): ItemPrice {
        return new ItemPrice(props);
    }

    schema = itemPriceSchema;
}
