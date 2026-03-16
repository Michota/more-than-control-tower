import { ArgumentNotProvidedException } from "@src/libs/exceptions";
import { randomUUID } from "crypto";
import { isEmpty } from "es-toolkit/compat";
import { AggregateId } from "./aggregate-root.abstract";

type DomainEventMetadata = {
    /** Timestamp when this domain event occurred */
    readonly timestamp: number;
};

export type DomainEventProperties<T> = Omit<T, "id" | "metadata"> & {
    aggregateId: AggregateId;
    metadata?: DomainEventMetadata;
};

export abstract class DomainEvent<T = unknown> {
    public readonly id: string;

    /** Aggregate ID where domain event occurred */
    public readonly aggregateId: AggregateId;

    public readonly metadata: DomainEventMetadata;

    private generateId() {
        return randomUUID();
    }

    constructor(properties: DomainEventProperties<T>) {
        if (isEmpty(properties)) {
            throw new ArgumentNotProvidedException("DomainEvent props should not be empty");
        }
        this.id = this.generateId();
        this.aggregateId = properties.aggregateId;
        this.metadata = {
            timestamp: properties?.metadata?.timestamp ?? Date.now(),
        };
    }
}
