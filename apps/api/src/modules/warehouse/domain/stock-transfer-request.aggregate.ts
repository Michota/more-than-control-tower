import z from "zod";
import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { type EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import { StockTransferRequestStatus } from "./stock-transfer-request-status.enum.js";
import { StockTransferRequestNotPendingError } from "./stock-transfer-request.errors.js";
import { StockTransferRequestCreatedDomainEvent } from "./events/stock-transfer-request-created.domain-event.js";
import { StockTransferRequestFulfilledDomainEvent } from "./events/stock-transfer-request-fulfilled.domain-event.js";

const stockTransferRequestSchema = z.object({
    goodId: z.uuid(),
    quantity: z.number().int().positive(),
    fromWarehouseId: z.uuid(),
    toWarehouseId: z.uuid(),
    status: z.enum(StockTransferRequestStatus),
    note: z.string().optional(),
    requestedBy: z.string().optional(),
    rejectionReason: z.string().optional(),
});

export type StockTransferRequestProperties = z.infer<typeof stockTransferRequestSchema>;

export class StockTransferRequestAggregate extends AggregateRoot<StockTransferRequestProperties> {
    static create(props: {
        goodId: string;
        quantity: number;
        fromWarehouseId: string;
        toWarehouseId: string;
        note?: string;
        requestedBy?: string;
    }): StockTransferRequestAggregate {
        const request = new StockTransferRequestAggregate({
            properties: {
                ...props,
                status: StockTransferRequestStatus.PENDING,
            },
        });

        request.validate();

        request.addEvent(
            new StockTransferRequestCreatedDomainEvent({
                aggregateId: request.id,
                goodId: props.goodId,
                quantity: props.quantity,
                fromWarehouseId: props.fromWarehouseId,
                toWarehouseId: props.toWarehouseId,
                requestedBy: props.requestedBy,
            }),
        );

        return request;
    }

    static reconstitute(props: EntityProps<StockTransferRequestProperties>): StockTransferRequestAggregate {
        return new StockTransferRequestAggregate(props);
    }

    validate(): void {
        stockTransferRequestSchema.parse(this.properties);
    }

    get goodId(): string {
        return this.properties.goodId;
    }

    get quantity(): number {
        return this.properties.quantity;
    }

    get fromWarehouseId(): string {
        return this.properties.fromWarehouseId;
    }

    get toWarehouseId(): string {
        return this.properties.toWarehouseId;
    }

    get status(): StockTransferRequestStatus {
        return this.properties.status;
    }

    get note(): string | undefined {
        return this.properties.note;
    }

    get requestedBy(): string | undefined {
        return this.properties.requestedBy;
    }

    get rejectionReason(): string | undefined {
        return this.properties.rejectionReason;
    }

    private guardPending(): void {
        if (this.properties.status !== StockTransferRequestStatus.PENDING) {
            throw new StockTransferRequestNotPendingError();
        }
    }

    fulfill(): void {
        this.guardPending();
        this.properties.status = StockTransferRequestStatus.FULFILLED;

        this.addEvent(
            new StockTransferRequestFulfilledDomainEvent({
                aggregateId: this.id,
                goodId: this.properties.goodId,
                quantity: this.properties.quantity,
                fromWarehouseId: this.properties.fromWarehouseId,
                toWarehouseId: this.properties.toWarehouseId,
            }),
        );
    }

    cancel(): void {
        this.guardPending();
        this.properties.status = StockTransferRequestStatus.CANCELLED;
    }

    reject(reason: string): void {
        this.guardPending();
        this.properties.status = StockTransferRequestStatus.REJECTED;
        this.properties.rejectionReason = reason;
    }
}
