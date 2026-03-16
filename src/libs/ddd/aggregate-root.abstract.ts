import { EventEmitter2 } from "@nestjs/event-emitter";
import { DomainEvent } from "./domain-event.abstract";
import { Entity, EntityId } from "./entity.abstract";

export type AggregateId<T> = EntityId<T>;

/**
 * ## Aggregate
 * Aggregate is a ***cluster* of domain objects that can be treated as a single unit**.
 * It encapsulates entities and value objects which conceptually belong together.
 * It also contains a set of operations which those domain objects can be operated on.
 *
 * * Any operations on an aggregate must be transactional operations. Either everything gets saved/updated/deleted or nothing.
 * * Similar to {@link Entity}, aggregates must protect their invariants through entire lifecycle.
 * * When a change to any object within the Aggregate boundary is committed, all invariants of the whole Aggregate must be satisfied. Simply said, **all objects in an aggregate must be consistent, meaning that if one object inside an aggregate changes state, this shouldn't conflict with other domain objects inside this aggregate (this is called *Consistency Boundary*)**.
 * * Try to avoid aggregates that are too big, this can lead to performance and maintaining problems.
 * * Aggregates can publish {@link DomainEvent}s.
 * * Aggregates help to simplify the domain model by gathering multiple domain objects under a single abstraction.
 * * Aggregates should not be influenced by the data model. Associations between domain objects are not the same as database relationships.
 *
 *
 * ## Aggregate Root
 * Aggregate root is an entity that contains other entities/value objects and all logic to operate them.
 *
 * * Aggregate root has global identity (UUID / GUID / primary key). Entities inside the aggregate boundary have local identities, unique only within the Aggregate.
 * * Aggregate root is a gateway to entire aggregate. Any references from outside the aggregate should only go to the aggregate root.
 * * Only Aggregate Roots can be obtained directly with database queries. Everything else must be done through traversal.
 * * Objects within the Aggregate can reference other Aggregate roots via their globally unique identifier (id). Avoid holding a direct object reference.
 *
 *
 * Based on [this example](https://github.com/Sairyss/domain-driven-hexagon/tree/master?tab=readme-ov-file#aggregates).
 */
export abstract class AggregateRoot<Properties> extends Entity<Properties> {
    private _domainEvents: DomainEvent<Properties>[] = [];

    get domainEvents(): DomainEvent<Properties>[] {
        return this._domainEvents;
    }

    protected addEvent(domainEvent: DomainEvent<Properties>): void {
        this._domainEvents.push(domainEvent);
    }

    public clearEvents(): void {
        this._domainEvents = [];
    }

    public async publishEvents(eventEmitter: EventEmitter2): Promise<void> {
        await Promise.all(
            this.domainEvents.map(async (event) => eventEmitter.emitAsync(event.constructor.name, event)),
        );
        this.clearEvents();
    }
}
