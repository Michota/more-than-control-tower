import z from "zod";
import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { type EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import { GoodsReceiptLine } from "./goods-receipt-line.value-object.js";
import { GoodsReceiptStatus } from "./goods-receipt-status.enum.js";
import { GoodsReceiptConfirmedDomainEvent } from "./events/goods-receipt-confirmed.domain-event.js";
import { GoodsReceiptHasNoLinesError, GoodsReceiptNotDraftError } from "./good.errors.js";

const goodsReceiptSchema = z.object({
    targetWarehouseId: z.uuid(),
    lines: z.array(z.instanceof(GoodsReceiptLine)),
    note: z.string().optional(),
    status: z.enum(GoodsReceiptStatus),
});

export type GoodsReceiptProperties = z.infer<typeof goodsReceiptSchema>;

export class GoodsReceiptAggregate extends AggregateRoot<GoodsReceiptProperties> {
    static open(props: { targetWarehouseId: string; note?: string }): GoodsReceiptAggregate {
        const receipt = new GoodsReceiptAggregate({
            properties: {
                targetWarehouseId: props.targetWarehouseId,
                lines: [],
                note: props.note,
                status: GoodsReceiptStatus.DRAFT,
            },
        });

        receipt.validate();

        return receipt;
    }

    static reconstitute(props: EntityProps<GoodsReceiptProperties>): GoodsReceiptAggregate {
        return new GoodsReceiptAggregate(props);
    }

    validate(): void {
        goodsReceiptSchema.parse(this.properties);
    }

    get targetWarehouseId(): string {
        return this.properties.targetWarehouseId;
    }

    get lines(): GoodsReceiptLine[] {
        return this.properties.lines;
    }

    get note(): string | undefined {
        return this.properties.note;
    }

    get status(): GoodsReceiptStatus {
        return this.properties.status;
    }

    addLine(goodId: string, quantity: number, note?: string, locationDescription?: string): void {
        if (this.properties.status !== GoodsReceiptStatus.DRAFT) {
            throw new GoodsReceiptNotDraftError();
        }

        this.properties.lines = [
            ...this.properties.lines,
            new GoodsReceiptLine({ goodId, quantity, note, locationDescription }),
        ];
    }

    confirm(): void {
        if (this.properties.status !== GoodsReceiptStatus.DRAFT) {
            throw new GoodsReceiptNotDraftError();
        }
        if (this.properties.lines.length === 0) {
            throw new GoodsReceiptHasNoLinesError();
        }

        this.properties.status = GoodsReceiptStatus.CONFIRMED;

        this.addEvent(
            new GoodsReceiptConfirmedDomainEvent({
                aggregateId: this.id,
                targetWarehouseId: this.properties.targetWarehouseId,
                lines: this.properties.lines.map((l) => ({ goodId: l.goodId, quantity: l.quantity })),
            }),
        );
    }
}
