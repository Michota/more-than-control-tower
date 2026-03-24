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


# ADR-003: No `MikroOrmRepositoryBase` until proven necessary

**Status:** Accepted
**Date:** 2026-03-17

## Context

Each infrastructure repository adapter will share a predictable set of operations: `findOneById`, `save` (with Domain Event publication), and `delete`. A shared base class could eliminate this boilerplate.

## Decision

Do not create `MikroOrmRepositoryBase` now. Write the first 2–3 repositories manually. Extract a base class only when the repeated pattern is observed in real code — not speculatively.

## Rationale

Most repositories in this system are query-heavy (custom filters, pagination, cross-field lookups). The generic `save` / `findOneById` / `delete` trio may account for a small fraction of each repository's surface area. A base class built before that ratio is known risks being a premature abstraction: it couples all repositories to a shared inheritance chain to save three methods that may not even be the dominant pattern.

## Revisit when

Three or more repositories contain a copy-pasted `save` block that maps to ORM, calls `persistAndFlush`, and publishes Domain Events. At that point extract exactly what repeats — nothing more.


# ADR-004: One HTTP controller per module

**Status:** Accepted
**Date:** 2026-03-21

## Context

During early development, the codebase used one HTTP controller per feature (i.e. per command or query — `DraftOrderController`, `GetOrderController`, etc.), registering multiple controllers in a single NestJS module's `controllers` array.

This caused a concrete runtime issue: NestJS resolved controllers by their index in the array. When multiple single-feature controllers were registered in the same module, they overwrote each other depending on their order, producing silent routing failures that were difficult to diagnose.

## Decision

Each module exposes exactly one `HttpController` class (e.g. `SalesHttpController`). All HTTP endpoints for that module's features are methods on that single controller.

## Consequences

### Positive
- Eliminates the NestJS multi-controller index collision issue entirely.
- Route grouping is explicit — all Sales endpoints are visibly co-located in one file.
- Single controller per module aligns naturally with the one-module-per-bounded-context structure.

### Negative
- Controller file grows as the module gains more endpoints. Mitigated by keeping handler methods thin — each method delegates immediately to a command or query, holding no logic of its own.
- BDD and integration tests that target individual endpoints must import the full controller rather than a focused single-feature one. In practice this has negligible impact since tests call endpoints via HTTP, not by instantiating the controller directly.

## Rejected alternative

One controller per command/query. Rejected due to the runtime routing collision described above. May be revisited if NestJS resolves the underlying issue in a future major version.


# ADR-005: `Object.defineProperty` for internal fields in `Entity` and `AggregateRoot`

**Status:** Accepted, pending review
**Date:** 2026-03-21

## Context

Both `Entity` and `AggregateRoot` use `Object.defineProperty` to initialize their internal fields, combined with TypeScript's `declare` keyword to suppress the compiler's own field initialization.

In `Entity` (`entity.abstract.ts`), four fields are defined this way: `_id`, `_createdAt`, `_updatedAt`, and `_properties`. All are set with `enumerable: false`. `_properties` additionally uses `writable: false, configurable: false` — making it a true runtime constant, beyond what TypeScript's `readonly` can guarantee.

In `AggregateRoot` (`aggregate-root.abstract.ts`), `_domainEvents` is defined with `enumerable: false, writable: true` — it must be reassignable (via `clearEvents()`), but must not appear in serialized output.

The motivation in both cases is the same: these fields are internal infrastructure concerns that must not leak into `JSON.stringify`, `Object.keys()`, or spread operations.

Importantly, `Entity.toJSON()` is explicitly defined and returns only `{ id, ...properties }` — so the non-enumerability of internal fields already has a controlled serialization path in place.

## Decision

Keep the current `defineProperty` approach for now.

## Rationale for keeping it

- `_properties` on `Entity` benefits from `writable: false, configurable: false` — a runtime immutability guarantee that TypeScript's `readonly` does not provide. This is a meaningful distinction.
- `_domainEvents` must be non-enumerable to avoid leaking event payloads in any serialization path not routed through `toJSON()`.
- The pattern is already consistently applied across both base classes, so removing it partially would be inconsistent.

## Simplification path

The `defineProperty` usage can be reconsidered in two independent parts:

**For `_domainEvents` in `AggregateRoot`:** Can be replaced with a plain class field if all aggregates are serialized exclusively through mappers and never directly. Replacement:
```typescript
private _domainEvents: DomainEvent<Properties>[] = [];
```

**For `_id`, `_createdAt`, `_updatedAt` in `Entity`:** Can be replaced with plain class fields — the `toJSON()` method already guarantees controlled output regardless of enumerability.

**For `_properties` in `Entity`:** Replacement requires care. A plain `private readonly _properties` would lose the runtime `writable: false` guarantee. Acceptable only if `Object.freeze()` is applied to properties at construction time as a substitute.

## Revisit when

A full audit of serialization paths confirms that no entity or aggregate is ever serialized outside of a mapper's `toJSON()` call, and the team is comfortable relying on TypeScript `readonly` rather than runtime `writable: false` for `_properties`.


# ADR-006: ValueObject properties enforced as deeply readonly at the type level

**Status:** Proposed (not yet confirmed — approach under investigation)
**Date:** 2026-03-21

## Context

`ValueObject<T>` currently stores its properties as `protected readonly properties: ValueObjectProperties<T>`. The `readonly` modifier is TypeScript-only — it prevents reassignment of the `properties` reference, but does not prevent mutation of nested fields within `T`.

For example, if a VO holds `{ address: { street: string } }`, TypeScript does not prevent `vo.properties.address.street = 'changed'` from within the class or a subclass.

This is inconsistent with the DDD principle that Value Objects are immutable. The current runtime safeguard (`Object.freeze()` in `unpack()`) is applied only at read time, not at construction time, and only on the returned value — the internal `properties` object itself remains mutable.

## Decision

Not yet confirmed. Under investigation.

## Proposed approach

Apply a `DeepReadonly<T>` mapped type to `ValueObjectProperties<T>` so that the TypeScript compiler enforces immutability on all nested fields, not just the top-level reference:

```typescript
type DeepReadonly<T> = {
    readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

export type ValueObjectProperties<T> = DeepReadonly<DisallowId<T extends DomainPrimitiveValue ? DomainPrimitive<T> : T>>;
```

This would make all VO property access compile-time readonly without any runtime cost.

Alternatively, `Object.freeze()` applied recursively at construction time in `ValueObject` constructor would enforce the same guarantee at runtime, catching mutations in JavaScript contexts where TypeScript is not present (e.g. tests using `as any`).

Both approaches can be combined.

## Open questions

- Does `DeepReadonly` interact correctly with `DomainPrimitive<T>` and the existing `DisallowId` mapped type?
- Does applying `DeepReadonly` break any existing VO subclasses that currently mutate nested properties (intentionally or not)?
- Is `Object.freeze()` at construction time preferable to `DeepReadonly` at the type level, or should both be applied?

## Revisit when

A concrete VO is written that exposes a mutation bug, or the team decides to audit existing VOs for unintended mutability.


# ADR-007: Testing strategy — levels, styles, and tooling

**Status:** Pending review
**Date:** 2026-03-21

## Context

The codebase uses hexagonal architecture with CQRS. Tests need to cover domain invariants, use case behavior, infrastructure correctness, and full HTTP stack — each at a different level of isolation and speed.

The team evaluated BDD-style tests (Given/When/Then) vs traditional unit tests, and Jest vs Cucumber for the test runner.

## Decision

### 1. Three test levels

**Level 1 — Domain unit tests**
Target: aggregate methods, value object validation, domain service logic.
Tools: Jest, no infrastructure, no mocks.
Goal: verify that domain invariants are enforced in isolation.

**Level 2 — Handler BDD tests (primary level)**
Target: command and query handlers — the entry point for each use case.
Tools: Jest, in-memory repository implementations, `NoOpUnitOfWork`, `FakeEventBus`.
Goal: describe and verify business behavior end-to-end through the use case, without hitting a real database.
This is the primary testing level. Most behavioral coverage lives here.

**Level 3 — Repository and E2E tests**
Target: MikroORM repository adapters and full HTTP stack.
Tools: Jest + Testcontainers (`@testcontainers/postgresql`) — a real PostgreSQL container started programmatically per test run.
Goal: verify ORM mappings, database constraints, and full request/response HTTP behavior.

### 2. BDD style with Jest, not Cucumber

Tests are written using Jest's nested `describe` / `it` blocks following Given/When/Then structure. Cucumber (Gherkin) is not used.

Rationale: Cucumber adds value when non-technical stakeholders write or read scenarios. In this project all specs are developer-owned. The indirection of `.feature` files, step definitions, and a Gherkin runner adds friction with no payoff. Jest with descriptive `describe` nesting is readable enough for the audience.

### 3. In-memory repositories for handler tests

Handler BDD tests use hand-written in-memory implementations of each repository port (e.g. `InMemoryOrderRepository implements OrderRepositoryPort`). These store domain objects in a `Map` and expose a `seed()` helper for test setup.

Mocking individual methods with `jest.fn()` is not used at the repository level — it tests call signatures, not behavior. In-memory repos test that data actually persists and is retrievable.

### 4. Testcontainers for repository and E2E tests

A real PostgreSQL container is started in Jest's `globalSetup` via `@testcontainers/postgresql`. The container URI is injected into `process.env.DATABASE_URL` before any test file runs. MikroORM picks it up via the standard config. The container is stopped in `globalTeardown`.

This eliminates the need for a separately managed test database or Docker Compose step before running tests.

## Consequences

### Positive
- Handler BDD tests run fast (no I/O) and cover the majority of behavioral scenarios.
- Real database in repository/E2E tests catches ORM mapping bugs and constraint violations that in-memory repos cannot.
- Jest throughout — no context switching between two test frameworks.
- BDD structure (`describe` nesting) makes test intent readable without Gherkin ceremony.

### Negative
- In-memory repositories must be maintained alongside the real adapters. They can drift if the port interface changes and the in-memory impl is not updated. Mitigated by TypeScript — the compiler enforces the interface.
- Testcontainers requires Docker to be available in CI. Standard in most modern CI environments but worth noting.


# ADR-008: Validation of test-only environment variables

**Status:** Unconfirmed — under consideration
**Date:** 2026-03-22

## Context

Integration tests require environment variables that are meaningless in production — currently `TEST_DB_NAME`, pointing to the test PostgreSQL database. These are read in `src/shared/testing/test-database.module.ts` directly from `process.env` with a manual presence check.

The project already has `src/config/env.ts`, which uses Zod to validate and type all runtime environment variables at application startup. The question is whether test-only variables should go through the same mechanism or be handled separately.

## The tension

**Adding `TEST_DB_NAME` to `env.ts`:**
- Consistent — one place for all env var validation, one schema to read
- Typed — `env.TEST_DB_NAME` instead of raw `process.env.TEST_DB_NAME`
- But: `env.ts` is imported on every application start. Making `TEST_DB_NAME` required there means production deployments must set a variable that serves no purpose in production. Making it optional (`z.string().optional()`) weakens the guarantee that env vars are always present when accessed.

**Keeping test-only variables out of `env.ts`:**
- Production config stays clean — no test concerns leak into the startup validation
- Test utilities validate their own vars independently (as `TestDatabaseModule` currently does)
- But: two separate validation mechanisms for env vars, inconsistent developer experience, no shared Zod schema for test vars

## Open questions

- Should `env.ts` be split into `env.runtime.ts` and `env.test.ts`, each with its own Zod schema, and only the former imported by production code?
- Or should `env.ts` remain production-only and test utilities always validate their own vars with inline checks?
- If Testcontainers is adopted (see ADR-007), `TEST_DB_NAME` becomes unnecessary — the container URI is injected programmatically. Does the question become moot?

## Decision

Not yet made.


# ADR-009: Standalone-first development strategy — external adapters deferred until real clients exist

**Status:** Accepted
**Date:** 2026-03-22

## Context

The platform is designed as a multi-tenant SaaS with swappable adapters per bounded context (see CLAUDE.md). Each module's repository port has two potential implementations: an internal PostgreSQL adapter and an external API adapter for tenants who bring their own systems.

However, at this stage no real client deployments exist. Writing external adapters, customer-specific DI bindings, and their corresponding tests would be speculative — we don't know which external systems real clients will bring, what their APIs look like, or even which modules they'll need to replace.

## Decision

Develop the platform in **standalone mode only** until at least two real client instances are running in production.

Concretely:
- Every module is wired to its internal database adapter. This is the only implementation that exists and the only one that is tested.
- Port interfaces (`*RepositoryPort`, `UnitOfWorkPort`, etc.) are defined and kept stable — they are the extension point for future adapters.
- The shared behavioral test contracts (e.g. `describeCreateCustomerHandlerBehavior`) are written alongside the internal adapter tests, establishing the spec that any future adapter must satisfy.
- No external adapter classes, no customer-specific DI modules, no adapter tests for hypothetical external systems are written until a real client with a concrete external system requirement exists.

## Rationale

External adapters can only be written correctly when the target external API is known. Speculative adapters would be based on guesses, would need to be thrown away or heavily rewritten when real requirements arrive, and would add maintenance burden with zero current value.

The port interfaces and behavioral test contracts are the right preparation — they are stable, useful immediately (they define the domain contract), and make adding a real adapter straightforward when the time comes.

## When to revisit

When the first real client deployment requires an external adapter:
- Implement the adapter in a customer-specific package (see future Turborepo monorepo structure)
- Use the existing `describe*HandlerBehavior` shared test suite to verify it satisfies the behavioral contract
- At two or more real client instances, evaluate whether the monorepo split (core + customer packages) is warranted
- Consider splitting the codebase into Turborepo packages.

Until then, treat any proposal to write an external adapter as premature.


# ADR-010: Integration tests use Jest ESM mode with a dedicated tsconfig

**Status:** Accepted (superseded — migrating to Vitest, see ADR-011)
**Date:** 2026-03-24

## Context

MikroORM v7 ships as `"type": "module"` (pure ESM) and uses `import.meta.resolve` internally. Jest's default CJS module system cannot load ESM-only packages:

- Default CJS mode fails on `export` keyword in ESM packages.
- Transforming ESM packages via `transformIgnorePatterns` fails on `import.meta` syntax.
- Full ESM mode (`extensionsToTreatAsEsm` + `useESM`) breaks CJS packages like `@nestjs/testing` (`exports is not defined`).

Integration tests need the full NestJS application context with MikroORM, unlike unit tests which avoid ESM-only imports entirely.

## Decision

Integration tests (`*.integration-spec.ts`) use a separate Jest configuration with:

1. **`extensionsToTreatAsEsm: [".ts"]`** + **`ts-jest` with `useESM: true`** — test files compile as ESM.
2. **`tsconfig.integration.json`** — a dedicated tsconfig with `module: "ESNext"`, `moduleResolution: "bundler"` (differs from the project's `module: "nodenext"`).
3. **`NODE_OPTIONS='--experimental-vm-modules'`** — required for Jest's ESM support.
4. **`allowGlobalContext: true`** in `TestMikroOrmDatabaseModule` — bypasses MikroORM's request-scoped EntityManager safety, since tests run outside HTTP request context.
5. **`orm.schema.ensureDatabase()` + `drop()` + `create()`** in `beforeAll` — sets up a clean schema per test suite.

## Consequences

### Negative (motivating migration to Vitest)
- `--experimental-vm-modules` is an unstable Node.js flag that may break across versions.
- A second `tsconfig.integration.json` must be maintained in sync with the main one.
- Integration and unit tests compile differently (ESM vs CJS), risking subtle module resolution differences.
- `allowGlobalContext: true` hides bugs where production code accidentally uses the global EntityManager.


# ADR-011: Integration tests use Vitest instead of Jest

**Status:** Accepted (supersedes ADR-010)
**Date:** 2026-03-24

## Context

ADR-010 documented the workarounds needed to run integration tests with Jest and MikroORM v7 (ESM-only). The approach required `--experimental-vm-modules`, a separate `tsconfig.integration.json`, and `extensionsToTreatAsEsm` — all fragile and divergent from the unit test configuration.

Vitest uses Vite's native ESM module resolution and TypeScript handling, eliminating all three workarounds.

## Decision

Integration tests (`*.integration-spec.ts`) use Vitest with `vitest.integration.config.ts`. Unit tests (`*.spec.ts`) remain on Jest.

Configuration:
- **`vitest.integration.config.ts`** — `pool: "forks"` with `singleFork: true` (sequential execution, required for shared database state).
- **`globals: true`** — `describe`, `it`, `expect` available without imports (Jest API compatibility).
- **`resolve.alias`** — maps `src/` to the source directory (replaces Jest's `moduleNameMapper`).
- **`pnpm test:integration`** — runs `vitest run --config vitest.integration.config.ts`.

Removed:
- `tsconfig.integration.json` — no longer needed; Vitest uses the project's main `tsconfig.json`.
- `extensionsToTreatAsEsm`, `useESM`, `--experimental-vm-modules` in Jest config — all unnecessary with Vitest.

Retained from ADR-010:
- `allowGlobalContext: true` in `TestMikroOrmDatabaseModule` — still needed since tests run outside HTTP request scope.
- `orm.schema.ensureDatabase()` + `drop()` + `create()` pattern in `beforeAll`.

## Consequences

### Positive
- No experimental Node.js flags.
- No separate tsconfig — one compiler configuration for the whole project.
- Native ESM support — MikroORM v7, `es-toolkit`, and other ESM-only packages work without transformation workarounds.
- Faster execution (~2s vs ~6s for the same 24 tests).
- Test API is backward-compatible with Jest — `describe`, `it`, `expect`, `beforeAll`, `afterAll` all work identically.

### Negative
- Two test runners in the project (Jest for unit tests, Vitest for integration tests). Acceptable because unit tests have no ESM dependency issues and don't need migration.
- Developers need both `jest` and `vitest` knowledge. Mitigated by near-identical test APIs.