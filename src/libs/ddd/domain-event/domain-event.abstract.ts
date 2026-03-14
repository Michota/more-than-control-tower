import { ArgumentNotProvidedException } from "@src/libs/exceptions";
import { randomUUID } from "crypto";
import { isEmpty } from "es-toolkit/compat";

type DomainEventMetadata = {
    /** Timestamp when this domain event occurred */
    readonly timestamp: number;
};

export type DomainEventProperties<T> = Omit<T, "id" | "metadata"> & {
    aggregateId: string;
    metadata?: DomainEventMetadata;
};

export abstract class DomainEvent {
    public readonly id: string;

    /** Aggregate ID where domain event occurred */
    public readonly aggregateId: string;

    public readonly metadata: DomainEventMetadata;

    constructor(properties: DomainEventProperties<unknown>) {
        if (isEmpty(properties)) {
            throw new ArgumentNotProvidedException("DomainEvent props should not be empty");
        }
        this.id = randomUUID();
        this.aggregateId = properties.aggregateId;
        this.metadata = {
            timestamp: properties?.metadata?.timestamp ?? Date.now(),
        };
    }
}
