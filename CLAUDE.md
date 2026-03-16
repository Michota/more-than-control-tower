# Project Context: DSC Distribution Management Platform

## What Are We Building?
A B2B field sales and logistics management platform for product distribution companies. It handles the full operational cycle: product catalog and pricing management, order creation and tracking, delivery route planning and execution, warehouse stock management, and financial accounting for field transactions.

The system serves four concurrent user roles: dispatchers (planning routes, approving orders), warehouse workers (loading vehicles), field sales representatives (RSR — executing deliveries, collecting payments in the field), and office accountants. It must operate reliably on mobile devices in field conditions, including during periods of limited connectivity.

## Multi-Tenant SaaS
The system runs as a multi-tenant SaaS platform. Each tenant may operate existing external systems — invoicing software, ERP, WMS — and the platform must integrate with them rather than replacing them. If a tenant has no existing system for a given domain, the platform uses its own internal data storage instead.

This constraint is the primary driver of the adapter architecture described below.

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
Modules never import or directly call each other's classes. All cross-module communication happens through domain events published to an in-process event bus defined in the Shared Kernel. A module publishes an event when a significant state change occurs. Other modules subscribe to events they care about and react independently.

## Critical Integrity Rules
These are non-negotiable constraints that must be enforced at the architecture level, not left to application logic:

- **Price snapshot on order creation**: The price is copied from the current pricing tier at the moment of order creation and stored on the order. Subsequent catalog price changes must never silently modify existing unpaid orders.
- **No hard deletes on stock**: Stock records are never permanently deleted. Transfers and destructions are modeled as state transitions with full audit trail, enforced via soft delete.
- **Atomic order closing**: The process of closing an order — stock transfer, payment collection, signature capture, status update — must execute as a single database transaction. Partial completion is not acceptable.