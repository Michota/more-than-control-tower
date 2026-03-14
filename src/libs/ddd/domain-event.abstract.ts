import { ArgumentNotProvidedException } from "@src/libs/exceptions";
import { randomUUID } from "crypto";
import { isEmpty } from "es-toolkit/compat";
import { BrandedId } from "../types";
import { AggregateId } from "./aggregate-root.abstract";

export type DomainEventId<T> = BrandedId<T, string>;

type DomainEventMetadata = {
    /** Timestamp when this domain event occurred */
    readonly timestamp: number;
};

export type DomainEventProperties<T> = Omit<T, "id" | "metadata"> & {
    // ? I am not should use this generic type with <T> or <unknown>.
    aggregateId: AggregateId<T>;
    metadata?: DomainEventMetadata;
};

export abstract class DomainEvent<T> {
    public readonly id: DomainEventId<T>;

    /** Aggregate ID where domain event occurred */
    public readonly aggregateId: AggregateId<T>;

    public readonly metadata: DomainEventMetadata;

    private generateId(): DomainEventId<T> {
        return randomUUID() as unknown as DomainEventId<T>;
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
