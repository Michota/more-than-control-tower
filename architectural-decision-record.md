# ADR-001: Cross-Module Communication via CQRS Bus and Domain Events

**Status:** Accepted
**Date:** 2026-03-16
**Context:** DSC Distribution Management Platform - Modular Monolith, NestJS, MikroORM, PostgreSQL

---

## Context

The system is a multi-tenant B2B platform where each module (Warehouse, Sales, CRM, Freight, Accountancy, Delivery) must be independently swappable — a tenant may replace any internal module with an external system (e.g. Fakturownia for invoicing, external WMS for warehouse). This requires that modules have zero knowledge of each other's internals.

We needed to decide how modules communicate for three distinct scenarios: reacting to state changes, reading data from another module, and triggering actions in another module.

Several approaches were evaluated: direct facade imports, shared ORM entities across modules, event-driven local projections (read model copies), and bus-based communication.

## Decision

### 1. Cross-module reads use Query Bus

When a module needs data owned by another module, it dispatches a Query object through the NestJS `QueryBus` (`@nestjs/cqrs`). The owning module registers a `QueryHandler`. The requesting module knows only the Query class and the response interface — both defined in `src/shared/queries/`.

Rejected alternatives:

- **Direct facade import** — creates a compile-time dependency on the providing module. If the module is removed (tenant uses external system), the import breaks. Query Bus decouples sender from receiver.
- **Shared ORM entity import in infrastructure** — even importing an ORM entity from another module's infrastructure layer creates a dependency that breaks when the module is swapped out.
- **Event-driven local projection** — duplicates data, introduces eventual consistency. For a B2B system with physical goods, selling stock that doesn't exist is unacceptable. Rejected as the default approach; may be adopted later for specific high-throughput read scenarios.

### 2. Cross-module reactions use Domain Events

When a module completes a significant state change, it publishes a Domain Event to the in-process event bus (`@nestjs/event-emitter`). Other modules subscribe and react independently. The **publishing module does not know who listens**.

Domain Event classes are the sole permitted direct import between modules — they are small, immutable data objects serving as a public contract.

### 3. Cross-module writes use Command Bus

When a module needs to trigger a state change in another module, it dispatches a Command through the NestJS `CommandBus`. The target module validates and executes.

### 4. No cross-module database coupling

- No physical foreign keys between tables of different modules.
- No cross-module SQL joins or shared ORM entities.
- Inter-module references use plain string/UUID columns (logical references only).
- Table names are prefixed with module name (e.g. `warehouse_product_stocks`, `sales_products`).

### 5. Single global migration pipeline

MikroORM manages all ORM entities and migrations globally — one config, one migrations folder, one execution order. Module separation is enforced at the code level (directories, ports, adapters), not at the database level.

### 6. Query/Command/Event contracts live in Shared Kernel

`src/shared/queries/`, `src/shared/commands/`, and base event types form the inter-module contract layer. These contain flat data types only — no business logic, no services, no database access.

## Consequences

### Positive
- Any module can be swapped for an external system by registering a different QueryHandler/CommandHandler for the same Query/Command — **zero changes in consuming modules**.
- Modules are testable in isolation by mocking the bus.
- No N+1 risk if Query interfaces are designed to accept arrays of IDs from the start.
- Strong consistency for reads — QueryBus in a monolith is a direct in-process call, no eventual consistency gap.
- Single deployment, single transaction scope — atomic operations across aggregates remain straightforward.

### Negative
- Temporal coupling on reads — if a module's QueryHandler fails, the requesting module cannot get the data. Acceptable in a monolith (same process), would require mitigation in a distributed system.
- Shared Kernel becomes a coordination point — changes to Query/Response interfaces require alignment between the publishing and consuming module. Mitigated by treating these as versioned API contracts.
- QueryBus adds a layer of indirection compared to a direct function call. Debugging requires knowing which handler is registered for a given Query. Mitigated by NestJS CQRS module's explicit `@QueryHandler` decorator.
- Event-based workflows can be hard to trace across modules. For complex multi-step processes, an orchestrator/saga may be needed instead of chained events.

### Future migration path
If modules are ever extracted into separate services, the QueryBus dispatch can be replaced with an HTTP/gRPC call behind the same Query interface. The EventBus can be replaced with RabbitMQ/Kafka. The bus abstraction makes this a transport-layer change, not a domain-layer rewrite.


# ADR-002: Mikro ORM entity definition uses `defineEntity` (schema-first, no decorators)

MikroORM entities are defined using the `defineEntity` / class pattern instead of decorator-based `@Entity()` / `@Property()` annotations.

Reasons:
- Avoids `reflect-metadata` and TypeScript `experimentalDecorators` — the `defineEntity` approach is compatible with modern TypeScript without legacy compiler flags.
- Schema definition is co-located and explicit rather than scattered across class fields as decorators.
- Cleaner separation between the domain class and its persistence mapping.

See: [MikroORM docs — comparison of approaches](https://mikro-orm.io/docs/using-decorators#comparison-of-approaches) and [defineEntity pattern](https://mikro-orm.io/docs/define-entity#the-defineentity--class-pattern-recommended).