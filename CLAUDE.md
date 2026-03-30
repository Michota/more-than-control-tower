# Project Context: DSC Distribution Management Platform

## What Are We Building?

A B2B field sales and logistics management platform for product distribution companies. It handles the full operational cycle: product catalog and pricing management, order creation and tracking, delivery route planning and execution, warehouse stock management, and financial accounting for field transactions.

The system serves four concurrent user roles: dispatchers (planning routes, approving orders), warehouse workers (loading vehicles), field sales representatives (RSR — executing deliveries, collecting payments in the field), and office accountants. It must operate reliably on mobile devices in field conditions, including during periods of limited connectivity.

## Multi-Tenant SaaS

The system runs as a multi-tenant SaaS platform. Each tenant may operate existing external systems — invoicing software, ERP, WMS — and the platform must integrate with them rather than replacing them. If a tenant has no existing system for a given domain, the platform uses its own internal data storage instead.

This constraint is the primary driver of the adapter architecture described in `apps/api/CLAUDE.md`.

## Architectural Decision Record

Significant architectural decisions are tracked in `architectural-decision-record.md` at the repo root.

## Testing

The project uses **Vitest** (not Jest). A dedicated dockerized test PostgreSQL database is available for integration tests.

After completing any requested feature, always write tests at all relevant levels:

- **Unit domain tests** — pure domain logic (aggregates, value objects, domain services). These live alongside the domain files (e.g. `order.aggregate.spec.ts`).
- **Unit tests** — application layer (command/query handlers) with mocked ports.
- **Integration tests** — test through the HTTP layer or full module bootstrap against the real test database. These use the `*.integration-spec.ts` suffix.

Tests are not optional follow-up work — they are part of the feature.

## Commits

- Prefer atomic commits — group logically related changes together rather than committing everything at once. For example, separate domain logic, infrastructure, and test commits when it makes sense. Don't over-split either; use judgment.
- Add prefix in title that describes scope. e.g. `feat<warehouse>: ...`, or `fix<permissions>: ...`
