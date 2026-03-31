# API — Backend Architecture & Conventions

## Deployment Model: Modular Monolith

The system is intentionally built as a single deployable unit sharing one database transaction scope. This is a deliberate constraint, not a limitation. Several core business processes require atomicity across multiple domain objects simultaneously. That level of transactional integrity is only reliably achievable within a single process. Microservices are explicitly ruled out for this project.

Modules are separated by domain logic and enforced code boundaries, not by network boundaries.

## Internal Module Architecture: Hexagonal with DDD

Each Bounded Context (module) is structured using Hexagonal Architecture with DDD tactical patterns:

- The **domain layer** contains pure business logic: entities, value objects, aggregates, domain services, and domain events. It has zero dependencies on frameworks, databases, or external APIs. All external dependencies are expressed as Output Port interfaces (repository contracts) defined here and implemented elsewhere.
- The **application layer** orchestrates use cases via Commands and Queries (CQRS). It holds no business logic itself — it delegates entirely to the domain layer and calls Output Ports.
- The **infrastructure layer** contains all Adapters: database implementations of repository ports, HTTP controllers as Input Adapters, and external API clients as Output Adapters.

## Bounded Contexts

The system is decomposed into the following modules:

- **Warehouse**: Physical stock lifecycle. Tracks goods across stationary and mobile warehouses (vehicle cargo beds are mobile warehouses). Governs stock intake and transfer processes.
- **Delivery**: Operational execution layer for field workers. Manages visit points (permanent customer locations), visits (one-time delivery events), and the RSR's real-time task execution.
- **Freight**: Dispatcher-facing logistics planning. Route construction, driver and vehicle assignment, visit point sequencing. Route optimization is delegated to an external routing API — not computed internally.
- **Accountancy**: All financial flows. Order pricing, payment collection (cash multi-currency and card/NFC), order closing, return processing, and sales document generation.
- **Sales**: Product catalog and pricing tiers (base → segment → individual). Source of truth for product data consumed by other modules.
- **CRM**: Client entity management. Client records are referenced across orders, visit points, and returns.
- **HR**: Handles managing employees, their positions, permissions, etc.
- **System** - IT-heart of the codebase. Makes it possible to manage users of the system.
- **ERP** - costs, working-hours, etc.

## Per-Tenant Data Source Swappability

Every Output Port in every module has two possible implementations:

1. **Internal DB Adapter** — queries the platform's own PostgreSQL database.
2. **External API Adapter** — calls the tenant's external system, with an Anti-Corruption Layer (ACL) that maps the foreign data format to the platform's internal domain object.

The correct adapter is bound once at application startup via the DI container, based on per-tenant configuration. This is a startup-time binding, not a runtime factory. Adding a new external system integration requires writing one Adapter class and one ACL Mapper. No existing module code changes.

## Asynchronous Data Replication

External API Adapters are never called synchronously during user-facing requests. Background Workers (cron jobs or webhook receivers) pull data from external APIs, pass it through ACL mappers, and write normalized records into the internal database. Modules always read from the internal database only.

This eliminates cascading failures, rate limit exhaustion, and latency propagation into the mobile UI. The accepted tradeoff is Eventual Consistency for externally-sourced data.

Exception: immediately before any irreversible physical action (e.g. finalizing a delivery, capturing a signature), a Just-In-Time synchronous verification check is performed to detect any state divergence before it becomes permanent.

## Cross-Module Communication

Modules never import or directly call each other's internal classes — no repository, entity, service, or ORM model may cross a module boundary. All cross-module communication uses one of three mechanisms, each for a distinct purpose:

### Domain Events (state change notification)

When a significant state change occurs within a module, it publishes a Domain Event to the in-process event bus (`@nestjs/event-emitter`). Other modules subscribe to events they care about and react independently. The emitting module does not know who listens.

Events are for **reactions**, not for data retrieval. Example: Warehouse emits `StockTransferredEvent` → Delivery module reacts by updating visit task status.

Event handlers that react to another module's events live in the subscribing module's **application layer** (`application/event-handlers/`). The handler imports the event class from the publishing module's `domain/events/` directory — this is the one permitted cross-module import, and it belongs exclusively in the application layer, but other domain cannot import from the publishing module's domain layer, not even the event class itself.

### Query Bus (cross-module data reads)

When a module needs data owned by another module, it sends a Query object through the NestJS `QueryBus` (`@nestjs/cqrs`). The owning module registers a `QueryHandler` that fulfills the request. The requesting module never knows which module answers — it knows only the Query shape and the response interface.

Query and response type definitions live in `src/shared/queries/`, forming the public read contract between modules. These are flat data objects with no logic.

This is the **primary mechanism for cross-module reads**. It replaces direct facade imports, direct repository access, and ORM entity sharing between modules. Key properties:

- **Decoupled**: Sales sends `GetProductsAvailabilityQuery` without importing anything from Warehouse. Warehouse registers the handler. Sales doesn't know Warehouse exists.
- **Swappable**: When a tenant uses an external WMS instead of the internal Warehouse module, a different `QueryHandler` is registered for the same Query — one that calls the external API. Zero changes in Sales or any other consuming module.
- **Batch-friendly**: Query interfaces should accept arrays of IDs to avoid N+1 patterns (e.g. `GetProductsAvailabilityQuery({ productIds: string[] })`).
- **Synchronous within monolith**: In this deployment model, QueryBus dispatch is a direct in-process function call. There is no network hop, no serialization overhead.

### Command Bus (cross-module write triggers)

When a module needs to trigger a state-changing action in another module, it dispatches a Command through the NestJS `CommandBus`. The target module's `CommandHandler` validates and executes the action. Commands follow the same decoupling principles as Queries.

Commands are for **actions**, not for data retrieval. A Command handler should not return business data — only confirmation (ID of created entity, success/failure).

### What is NOT permitted

- Importing a service, repository, entity, or ORM model from another module — at any layer, including infrastructure.
- Querying another module's database tables directly (no cross-module SQL joins, no shared ORM entities).
- Calling another module's facade or public service class directly. All inter-module calls go through the bus or event system.

## Shared Kernel

The `src/shared/` directory contains cross-cutting definitions that multiple modules depend on:

- **Query/Response types**: `src/shared/queries/` — flat data objects defining the read contracts between modules.
- **Command types**: `src/shared/commands/` — flat data objects defining the write contracts between modules.
- **Domain Event base class**: The abstract event class and common event interfaces.
- **Common Value Objects**: Shared primitives like `Money`, `Address`, `DateRange` that appear across multiple bounded contexts.

The Shared Kernel contains no business logic, no services, and no database access. It is purely a type-level contract layer.

## Critical Integrity Rules

These are non-negotiable constraints that must be enforced at the architecture level, not left to application logic:

- **Price snapshot on order creation**: The price is copied from the current pricing tier at the moment of order creation and stored on the order. Subsequent catalog price changes must never silently modify existing unpaid orders.
- **No hard deletes on stock**: Stock records are never permanently deleted. Transfers and destructions are modeled as state transitions with full audit trail, enforced via soft delete.
- **Atomic order closing**: The process of closing an order — stock transfer, payment collection, signature capture, status update — must execute as a single database transaction. Partial completion is not acceptable.
