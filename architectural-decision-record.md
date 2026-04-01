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

The team evaluated BDD-style tests (Given/When/Then) vs traditional unit tests, and Vitest vs Cucumber for the test runner.

## Decision

### 1. Three test levels

**Level 1 — Domain unit tests**
Target: aggregate methods, value object validation, domain service logic.
Tools: Vitest, no infrastructure, no mocks.
Goal: verify that domain invariants are enforced in isolation.

**Level 2 — Handler BDD tests (primary level)**
Target: command and query handlers — the entry point for each use case.
Tools: Vitest, in-memory repository implementations, `NoOpUnitOfWork`, `FakeEventBus`.
Goal: describe and verify business behavior end-to-end through the use case, without hitting a real database.
This is the primary testing level. Most behavioral coverage lives here.

**Level 3 — Repository and E2E tests**
Target: MikroORM repository adapters and full HTTP stack.
Tools: Vitest + Testcontainers (`@testcontainers/postgresql`) — a real PostgreSQL container started programmatically per test run.
Goal: verify ORM mappings, database constraints, and full request/response HTTP behavior.

### 2. BDD style with Vitest, not Cucumber

Tests are written using Vitest's nested `describe` / `it` blocks following Given/When/Then structure. Cucumber (Gherkin) is not used.

Rationale: Cucumber adds value when non-technical stakeholders write or read scenarios. In this project all specs are developer-owned. The indirection of `.feature` files, step definitions, and a Gherkin runner adds friction with no payoff. Vitest with descriptive `describe` nesting is readable enough for the audience.

### 3. In-memory repositories for handler tests

Handler BDD tests use hand-written in-memory implementations of each repository port (e.g. `InMemoryOrderRepository implements OrderRepositoryPort`). These store domain objects in a `Map` and expose a `seed()` helper for test setup.

Mocking individual methods with `vi.fn()` is not used at the repository level — it tests call signatures, not behavior. In-memory repos test that data actually persists and is retrievable.

### 4. Testcontainers for repository and E2E tests

A real PostgreSQL container is started in Vitest's `globalSetup` via `@testcontainers/postgresql`. The container URI is injected into `process.env.DATABASE_URL` before any test file runs. MikroORM picks it up via the standard config. The container is stopped in `globalTeardown`.

This eliminates the need for a separately managed test database or Docker Compose step before running tests.

### 5. Test runner: Vitest (see ADR-011)

The project originally used Jest. It was replaced by Vitest due to Jest's inability to load ESM-only packages (MikroORM v7) without fragile workarounds. See ADR-011 for full rationale.

## Consequences

### Positive
- Handler BDD tests run fast (no I/O) and cover the majority of behavioral scenarios.
- Real database in repository/E2E tests catches ORM mapping bugs and constraint violations that in-memory repos cannot.
- Vitest throughout — no context switching between two test frameworks.
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


# ADR-011: Vitest replaces Jest as the sole test runner

**Status:** Accepted (supersedes ADR-010)
**Date:** 2026-03-24

## Context

Jest could not load MikroORM v7, which ships as `"type": "module"` (pure ESM) and uses `import.meta.resolve` internally. Three workaround paths were attempted:

1. **CJS mode with `transformIgnorePatterns`** — ts-jest converted ESM exports to CJS but could not transpile `import.meta`, which has no CJS equivalent.
2. **Full ESM mode** (`extensionsToTreatAsEsm` + `useESM: true` + `--experimental-vm-modules`) — test files compiled as ESM, but CJS packages like `@nestjs/testing` broke with `exports is not defined` because they expect a CJS module scope.
3. **Hybrid** (ESM test files + native ESM loading for node_modules) — worked, but required a separate `tsconfig.integration.json`, an unstable `--experimental-vm-modules` Node flag, and different compilation settings for integration vs unit tests.

Option 3 was shipped initially (ADR-010) but created ongoing friction: two tsconfigs to maintain, an experimental flag that could break across Node versions, and divergent module resolution between test levels.

Vitest uses Vite's native ESM module resolution and TypeScript handling, eliminating all three workarounds. After successfully migrating integration tests, the unit tests were migrated as well — the test API (`describe`, `it`, `expect`, `beforeAll`, `afterAll`) is identical, no test code changes were required, and having a single test runner is simpler than maintaining two.

## Decision

Vitest is the sole test runner. Jest, ts-jest, and eslint-plugin-jest are fully removed.

Configuration:
- **`vitest.config.ts`** — unit tests (`*.spec.ts`). Default parallel execution.
- **`vitest.integration.config.ts`** — integration tests (`*.integration-spec.ts`). `fileParallelism: false` (sequential, required for shared database state).
- **`globals: true`** in both configs — `describe`, `it`, `expect` available without imports.
- **`resolve.alias`** — maps `src/` to the source directory (replaces Jest's `moduleNameMapper`).
- **`vitest/globals`** added to `tsconfig.json` `types` — provides type definitions for global test functions.
- **`@vitest/eslint-plugin`** replaces `eslint-plugin-jest` — same rule names, `vitest/` prefix instead of `jest/`.

Scripts:
- `pnpm test` — `vitest run` (unit tests)
- `pnpm test:watch` — `vitest watch`
- `pnpm test:cov` — `vitest run --coverage`
- `pnpm test:integration` — `vitest run --config vitest.integration.config.ts`

Retained from ADR-010:
- `allowGlobalContext: true` in `TestMikroOrmDatabaseModule` — still needed since tests run outside HTTP request scope.
- `orm.schema.ensureDatabase()` + `drop()` + `create()` pattern in `beforeAll`.

Removed:
- `jest.spec.json`, `jest.integration.json`, `test/jest-e2e.json` — all Jest config files.
- `tsconfig.integration.json` — Vitest uses the project's main `tsconfig.json`.
- `ts-jest`, `eslint-plugin-jest` — no longer dependencies.
- `--experimental-vm-modules` — not needed.

## Consequences

### Positive
- One test runner for the entire project — simpler toolchain, one set of conventions.
- Native ESM support — MikroORM v7, `es-toolkit`, `zod`, and any future ESM-only packages work without transformation workarounds.
- No experimental Node.js flags or separate tsconfig.
- Faster execution — unit tests ~0.6s (vs ~1.4s with Jest), integration tests ~2.2s (vs ~6s with Jest ESM mode).
- Near-zero migration cost — existing test files required no code changes (no `jest.fn()` or `jest.mock()` usage in the codebase).

### Negative
- NestJS documentation and examples default to Jest. Developers copy-pasting from NestJS docs need to be aware that `jest.fn()` → `vi.fn()` and `jest.mock()` → `vi.mock()` if they introduce mocking in the future.
- Vitest watch mode uses Vite's HMR, which occasionally behaves differently from Jest's `--watch` on file rename or deletion. Minor nuisance, not a correctness issue.


# ADR-012: Logging via `LoggerPort` — infrastructure concern, not domain

**Status:** Accepted
**Date:** 2026-03-24

## Context

The system needs structured logging for debugging, audit trails, and production observability. The question is where logging lives in the hexagonal architecture and how it is injected.

Logging is an infrastructure concern — it depends on transport (stdout, file, external service), formatting (JSON, plaintext), and configuration (log levels, sampling). None of this belongs in the domain layer. However, the infrastructure layer (repositories, interceptors, event publishing) needs to log operations like database writes, domain event publications, and transaction lifecycle.

## Decision

### 1. `LoggerPort` interface in `src/libs/ports/`

A minimal port interface that the infrastructure layer depends on:

```typescript
export interface LoggerPort {
    log(message: string, ...meta: unknown[]): void;
    error(message: string, trace?: unknown, ...meta: unknown[]): void;
    warn(message: string, ...meta: unknown[]): void;
    debug(message: string, ...meta: unknown[]): void;
}
```

No external library types leak through this interface. Any adapter (NestJS Logger, Pino, Winston) can implement it.

### 2. Injected into repositories and infrastructure services

The logger is constructor-injected into:
- **Repository implementations** — logs database writes, deletes, unique constraint violations, and transaction start/commit/abort.
- **`AggregateRoot.publishEvents()`** — logs every domain event publication with the event class name and aggregate ID.
- **Exception interceptors** — logs unhandled errors with request context.

The logger is **not** injected into aggregates, value objects, entities, or domain services. Domain logic does not log — it throws domain errors or emits domain events. The infrastructure layer observes and logs these.

### 3. Request correlation ID in all log messages

Every log message includes a correlation ID from the request context (e.g. `[req-abc123]`). This enables tracing all log entries for a single HTTP request across repositories, event handlers, and interceptors.

The correlation ID is set once per request (e.g. by middleware or an interceptor) and read via a `RequestContextService`.

### 4. DI token for the logger

A `LOGGER_PORT` symbol in `src/shared/ports/tokens.ts` is used for injection. The concrete adapter is bound once in the application module:

```typescript
{ provide: LOGGER_PORT, useClass: NestJsLoggerAdapter }
```

Modules that need logging inject `@Inject(LOGGER_PORT) private readonly logger: LoggerPort`.

## Consequences

### Positive
- Domain layer stays pure — no logging dependencies, no import of any logger library.
- Logger implementation is swappable per environment (e.g. JSON structured logging in production, pretty-print in development, silent in tests).
- Correlation ID threading makes production debugging tractable across the request lifecycle.
- Consistent log structure — all infrastructure components use the same interface and patterns.

### Negative
- Every repository and infrastructure service that needs logging must accept `LoggerPort` in its constructor — slight boilerplate increase.
- Request correlation ID requires a request-scoped context mechanism (e.g. `AsyncLocalStorage`). This adds a small runtime cost and must be set up in application bootstrap.

## Rejected alternatives

- **Domain objects logging directly** — rejected because it couples domain logic to infrastructure. A domain aggregate should not know whether its operations are logged, or how.
- **Global singleton logger** — rejected because it makes testing harder (can't verify log output per-test), prevents per-module log level configuration, and hides the dependency instead of making it explicit.
- **Decorator-based logging (`@Log()`)** — rejected because it requires `reflect-metadata`, adds magic that obscures the call path, and is difficult to test or customize per-method.


# ADR-013: Domain error codes as a shared package for frontend i18n

**Status:** Accepted
**Date:** 2026-03-24

## Context

The `DomainExceptionFilter` returns structured error responses containing a `code` field (e.g. `GOOD.NOT_FOUND`, `STOCK_ENTRY.INSUFFICIENT`). The frontend needs to map these codes to user-facing translated messages. Currently, error codes are string literals scattered across domain error classes in the backend — the frontend has no way to know the full set of codes without manually reading backend source code.

When the codebase moves to a Turborepo monorepo (see ADR-009), error codes should be extractable into a shared package consumed by both backend and frontend.

## Decision

### 1. Error codes are the stable public contract

The `code` field on every domain exception is the identifier the frontend uses for i18n lookups. Codes follow the pattern `MODULE.ERROR_NAME` (e.g. `GOOD.HAS_ACTIVE_STOCK`, `GOODS_RECEIPT.NOT_DRAFT`). These codes are treated as a public API — renaming or removing a code is a breaking change that requires frontend coordination.

### 2. Future: shared `error-codes` package in Turborepo

When the monorepo split happens, a `packages/error-codes` package will export:
- A TypeScript enum or const object mapping all domain error codes.
- Optionally, default English messages as fallback text.

Both backend exception classes and frontend i18n dictionaries import from this package. Adding a new error code in the backend automatically surfaces it as a type error in the frontend if the i18n dictionary is incomplete.

### 3. Current: codes are co-located with domain errors

Until the monorepo split, error codes remain as string literals in domain error classes (e.g. `readonly code = "GOOD.NOT_FOUND"`). No separate codes file is created yet — it would be a premature abstraction with only one consumer (the backend). The shared package is justified only when the frontend exists and needs the same codes.

### 4. The `message` field is for developers, not users

The English `message` in the error response (e.g. "Cannot delete good X because it has active stock entries") is a developer-facing description for debugging and logs. The frontend should never display it to end users — it should map the `code` to a localized string from its own i18n dictionary.

## Consequences

### Positive
- Frontend can build exhaustive i18n mappings by importing the shared codes package — TypeScript ensures completeness.
- Error codes are decoupled from message wording — backend can reword messages without breaking the frontend.
- The pattern works for any number of languages without backend changes.

### Negative
- Renaming an error code requires a coordinated backend + frontend change. Mitigated by treating codes as stable identifiers (like API field names) — rename only with a deprecation period.
- Until the monorepo split, the frontend must manually maintain its own copy of the codes. Acceptable for early development with a small error surface.

## Implementation status

**Not yet implemented.** Error codes currently live as string literals in domain error classes. The shared package will be created when the Turborepo monorepo split occurs and a frontend consumer exists.


# ADR-014: Replace UUID-only identifiers with opaque string IDs

**Status:** Proposed (not yet implemented)
**Date:** 2026-03-24

## Context

The codebase currently uses UUIDs as the sole identifier format for all entities — generated via `randomUUID()`, validated via `z.uuid()` and `@IsUUID()`, stored as `p.uuid()` columns. This works for internally-created entities but creates friction when integrating with external systems.

Per the platform's multi-tenant design (see CLAUDE.md), any module can be backed by an external system instead of the internal database. External systems use their own ID formats:

- ERPs often use sequential numeric IDs (`"12345"`, `"00089412"`).
- Legacy WMS systems may use alphanumeric codes (`"WH-A-0042"`).
- External invoicing systems may use composite keys (`"2026/03/INV-001"`).

When an external adapter syncs data into the platform, it must preserve the external system's ID — not replace it with a UUID. If the platform enforces UUID format at every layer (validation, database schema, type system), external IDs cannot be stored without an additional mapping table or translation layer, adding complexity for no business value.

## Decision

### 1. Entity IDs become `string` throughout

Replace `z.uuid()` with `z.string().min(1)` in domain schemas. Replace `@IsUUID()` with `@IsString() @IsNotEmpty()` in DTOs that accept entity references. Replace `p.uuid()` with `p.string()` for ID columns in ORM entities (except the primary key of internally-created entities, which can remain `p.uuid()` for default generation).

### 2. Internal entities still default to UUID generation

`AggregateRoot` and `Entity` base classes continue to generate UUIDs via `randomUUID()` when no ID is provided. The change is about what formats are *accepted*, not what is *generated*. Internally-created goods, warehouses, and orders still get UUIDs — but externally-synced entities keep their original IDs.

### 3. ID format is the external system's concern, not ours

The platform treats IDs as opaque strings. It does not validate whether an ID is a UUID, a number, or an alphanumeric code. The only invariant is that it is a non-empty string and unique within its entity type.

### 4. Migration path

This is a codebase-wide change affecting:
- Domain schemas (Zod)
- Request DTOs (class-validator)
- ORM entity definitions (MikroORM `defineEntity`)
- Database columns (migration from `uuid` to `varchar` or `text` for reference columns)
- Tests that assert UUID format (`expect(id).toMatch(uuidRegex)`)

The migration should be done module by module, starting with the module most likely to integrate with an external system first.

## Rationale

The cost of accepting any string as an ID is near zero — string comparison, indexing, and storage work identically for UUIDs and other formats. The cost of enforcing UUID-only is paid every time an external system integration is added: either an ID mapping table, a format translation layer, or a refusal to integrate. The platform's core value proposition is adapter swappability — rigid ID formats undermine it.

## Consequences

### Positive
- External adapter implementations become simpler — they pass through the external system's ID directly, no mapping needed.
- Anti-corruption layers (ACLs) have one less translation to perform.
- The platform's ID handling is future-proof for any external system, regardless of their ID scheme.

### Negative
- Loss of UUID format guarantee means IDs cannot be assumed to be sortable by creation time (UUIDs v7 are, arbitrary strings are not). Anywhere that relied on ID-based ordering must use an explicit `createdAt` timestamp instead.
- Database indexes on `varchar`/`text` are slightly less efficient than `uuid` columns. Negligible for the expected data volumes.
- Developers lose the convenience of `ParseUUIDPipe` in controllers — must use a generic string validation instead.

## Implementation status

**Not yet implemented.** The codebase still uses UUIDs everywhere. This ADR documents the intended direction for when the first external system integration requires non-UUID identifiers.


# ADR-015: Authorization as a port — role baseline with per-user overrides

**Status:** Accepted
**Date:** 2026-03-25

## Context

The platform serves four operational roles (dispatcher, warehouse worker, RSR, accountant) with distinct access needs. Authorization must eventually support:

1. **Fixed roles** — a static, non-changeable set of roles with predefined permission baselines. Managed by a future HR module (assigned by someone with a Head of HR position).
2. **Per-user permission overrides** — an IT administrator can toggle individual permissions for specific users, independent of their role. This means users with the same role can have different effective permissions.
3. **Three-state resolution** — each per-user override is `allowed`, `denied`, or `unspecified`. When `unspecified`, the system falls back to the role's baseline permission.

This model does not exist yet. The HR module, IT administrator role, and override storage are future work. However, the authorization interface must be designed now so that modules do not hardcode assumptions about how permissions are resolved.

## Decision

### 1. Authorization is an output port, not inline logic

Each module that needs authorization depends on a shared `AuthorizationPort` interface. Modules ask "can this user perform this action?" and receive a boolean. They never inspect roles, check override tables, or contain resolution logic.

```typescript
// src/shared/auth/authorization.port.ts
export interface AuthorizationPort {
    canPerform(userId: string, action: string): Promise<boolean>;
}
```

This is the same pattern used for repository ports — the module depends on an interface, the DI container binds the implementation.

### 2. Each module defines its own permission keys

Permission actions are string constants namespaced by module (e.g. `warehouse:create-receipt`, `delivery:close-visit`). Each module owns its permission keys in a local `*.permissions.ts` file.

### 3. Initial adapter: static role-to-permission map

The first `AuthorizationPort` implementation is a `RoleBasedAuthorizationAdapter` with a hardcoded map of role → permitted actions. No database, no configuration, no HR module dependency. This is sufficient for early development.

### 4. Future adapter: three-state override resolution

When the HR module and IT administrator functionality are built, a new `OverrideAuthorizationAdapter` replaces the initial adapter. Resolution order:

1. Check per-user override for the action. If `allowed` → permit. If `denied` → deny.
2. If `unspecified` → fall back to the role's baseline permission set.

The swap is a DI binding change. No module code changes.

### 5. Where authorization checks live

Authorization checks are placed according to what data they require:

- **Role-based and static permission checks → guards/decorators on controllers.** These checks are stateless — they need only the user's role and permissions, already available from the JWT/session on the request. A NestJS guard resolves them before the handler runs. This covers ~80% of cases.
- **Resource-based, ownership, or state-dependent checks → application layer (handlers/services).** These checks require loading the resource from the database to determine access (e.g. "does this user own this order?", "is this order in a state that allows this action?"). They naturally live where the data is already loaded.

Guards on controllers are the default. Application-layer checks are the exception, used only when the authorization decision depends on persisted state.

System-initiated operations (domain event handlers, background workers, cron jobs) do not carry a user context and do not go through authorization.

### 6. Domain layer does not participate in authorization

Authorization checks happen in the infrastructure layer (guards) or application layer (handlers), not in domain entities or aggregates. The domain layer has no dependency on `AuthorizationPort`.

### 7. `ForbiddenDomainException` for authorization failures

`src/libs/exceptions/http-domain.exceptions.ts` provides a `ForbiddenDomainException` base class (HTTP 403) for authorization-related domain errors, following the same pattern as `NotFoundDomainException`, `ConflictDomainException`, and `BadRequestDomainException`.

## Consequences

### Positive
- Modules are decoupled from the authorization implementation — same pattern as repository ports.
- The three-state override model can be added without touching any module's controllers or handlers.
- Role definitions remain non-changeable (static baseline), while per-user flexibility is layered on top.
- Guards fail fast on stateless checks — unauthorized requests are rejected before any business logic or database access.
- Testable — in-memory `AuthorizationPort` implementations for handler BDD tests.

### Negative
- Guard-based checks require role/permission data to be present on the request (e.g. in JWT claims). The authentication layer must populate this.
- The static role-to-permission map in the initial adapter must be manually maintained as modules add new permission keys. Acceptable for early development; may be automated when the HR module provides a UI for permission management.

### Future considerations
- The HR module will be the source of truth for role assignments (position → role mapping) and the IT administrator will manage per-user overrides through it.
- Permission keys may eventually be discoverable at runtime (e.g. each module registers its keys at startup) to support a UI that shows all available permissions.


# ADR-016: Self-service profile changes require email confirmation — auth module responsibility

**Status:** Proposed (not yet implemented)
**Date:** 2026-03-26

## Context

The System module allows updating user profile data (email, name) via `UpdateSystemUserCommand`. Two distinct actors can trigger this:

1. **Administrator or Moderator** editing another user's data — should apply immediately, no confirmation needed.
2. **User editing their own data** — should require email confirmation before the change is applied, to prevent unauthorized account takeover (e.g. someone accessing an unlocked device).

The System module currently applies all updates immediately regardless of who triggered them. It has no concept of "pending changes" or "who is the current actor" beyond what the command carries.

## Decision

### 1. The System module stays simple — it applies updates immediately

`UpdateSystemUserCommand` remains a direct, synchronous write. It does not know whether the caller is an admin or the user themselves. It does not hold pending state or confirmation tokens. It is a trusted internal command.

### 2. The Auth module gates self-service changes

When a user requests a profile change through an HTTP endpoint:

- If the authenticated user is an **Administrator or Moderator** updating another user → the Auth module dispatches `UpdateSystemUserCommand` directly.
- If the authenticated user is updating **their own data** → the Auth module:
  1. Stores a pending change record with a confirmation token.
  2. Emits a `ProfileChangeRequestedEvent` (consumed by a future email/notification service).
  3. Does **not** dispatch `UpdateSystemUserCommand` yet.
  4. When the user confirms via token → the Auth module dispatches `UpdateSystemUserCommand` with the pending values.
  5. If the token expires → the pending change is discarded.

### 3. No changes needed in System module now

The System module's `UpdateSystemUserCommand` is already the right primitive. The confirmation flow is purely an Auth module concern — it decides *when* to call the command, not *how* the command works.

### 4. CLI bypasses confirmation

CLI commands (`update-admin`) dispatch `UpdateSystemUserCommand` directly, bypassing Auth module gatekeeping entirely. CLI access implies server-level trust.

## Consequences

### Positive
- System module remains a clean, trusted write path — no pending state, no token management, no email dependencies.
- The confirmation flow is fully owned by Auth, which already owns authentication context (who is the current user, what role do they have).
- Adding confirmation later requires zero changes to System module code.

### Negative
- Until the Auth module is implemented, there is no self-service confirmation — all HTTP updates apply immediately. Acceptable for the current development phase where only administrators use the system.

## Implementation status

**Not yet implemented.** The Auth module does not exist yet. This ADR documents the intended design so that the System module is not polluted with confirmation logic when the Auth module is built.


# ADR-017: CLI commands via nest-commander — mandatory review after each module

**Status:** Accepted
**Date:** 2026-03-26

## Context

The platform runs as an HTTP server, but several operational tasks need to be executable from the terminal without the HTTP stack — initial setup (seeding admin accounts, creating warehouses), emergency ops (suspending users, deactivating employees), and quick data lookups (listing users, searching customers). These are server-level operations performed by IT administrators or during deployment, not by end users through the UI.

The project adopted `nest-commander` for CLI commands. It reuses the same NestJS DI container, module system, and CQRS buses as the HTTP server — CLI commands dispatch the same `Command` and `Query` objects that HTTP controllers do. This means zero code duplication between the two entry points.

## Decision

### 1. nest-commander is the CLI framework

CLI commands are NestJS providers decorated with `@Command()` from `nest-commander`. They are registered in `src/cli/cli.module.ts`, which imports the same domain modules as `AppModule` but without HTTP controllers. Entry point: `pnpm cli <command> [options]`.

### 2. CLI commands dispatch through the bus, not through services

CLI commands use `CommandBus` and `QueryBus` — the same path as HTTP controllers. They never import repositories, mappers, or domain services directly. This ensures that domain rules (e.g. last-admin protection) are enforced identically regardless of entry point.

### 3. CLI commands are organized by module

```
src/cli/
├── cli-main.ts          # Entry point
├── cli.module.ts         # DI registration
├── system/               # System module commands
├── hr/                   # HR module commands
└── crm/                  # CRM module commands
```

Each module gets its own directory under `src/cli/`. The CLI module imports all domain modules it needs.

### 4. Mandatory review: "does this module need CLI commands?"

After completing any module (new or significantly extended), the developer must ask: **which operations in this module should be available from the CLI?** Good candidates are:

- **Bootstrap operations** — creating initial records needed before the system is usable (admin accounts, warehouses, positions).
- **Emergency ops** — suspending users, deactivating employees, removing stock — actions that may be needed when the HTTP server is down or inaccessible.
- **Data lookups** — listing and searching records for quick verification without opening the UI.
- **Destructive operations** — hard deletes, data corrections — things that should require server access, not just an API call.

This is a process checkpoint, not a technical constraint. The goal is to prevent CLI commands from being an afterthought that gets discovered only when someone needs them in production.

## Consequences

### Positive
- One codebase, two entry points — HTTP and CLI share the same domain logic via the bus.
- CLI commands respect all domain invariants (validation, last-admin protection, etc.) because they go through the same handlers.
- Organized by module — easy to find which CLI commands exist for a given domain.
- Explicit review step prevents gaps in operational tooling.

### Negative
- `cli.module.ts` must import every domain module that has CLI commands — grows over time. Acceptable for a modular monolith.
- nest-commander adds a dependency. Justified by the NestJS DI integration it provides — a raw `yargs` or `commander` setup would need manual DI wiring.


# ADR-018: Merge qualifications into permissions — use permissions as capability tags

**Status:** Accepted
**Date:** 2026-03-27

## Context

The HR module currently has two separate concepts for describing what an employee can do:

1. **Permissions** — boolean flags gating system actions (e.g., `freight:execute-route`). Defined by modules, assigned to positions by HR, overridable per user.
2. **Qualifications** — typed key-value attributes on position assignments (e.g., `licenseCategory: "C"`). Defined on positions by HR, used for filtering employees by capabilities.

The question: should qualifications be eliminated and replaced by permissions used as capability tags?

### Proposed change

Modules define capability permissions alongside action permissions:
- `freight:drive-cat-b`, `freight:drive-cat-c`, `freight:drive-cat-ce` (capability tags)
- `freight:execute-route`, `freight:plan-route` (action gates)

HR assigns them to positions or overrides per employee. Cross-module queries become `FindEmployeesByPermissionQuery("freight:drive-cat-c")` instead of filtering by qualification key-value pairs.

This eliminates the `QualificationAttribute` value object, `qualificationSchema` on positions, and the `QualificationAttribute` embeddable — simplifying the domain model.

## Arguments for merging

- **Single concept** — no distinction between "what you can do" and "what you are qualified for." Everything is a permission.
- **Clean cross-module contract** — Freight defines `freight:drive-cat-c` as a permission key. It doesn't need to know about HR's qualification schema. The contract is the permission key itself.
- **Simpler domain model** — Position becomes just `{ key, displayName, permissionKeys }`. No qualification schema, no typed values, no validation of qualification entries.
- **Same resolution mechanism** — effective permissions already handle position defaults + per-user overrides. Capability queries reuse the same logic.

## Arguments against merging

- **Combinatorial explosion for high-cardinality attributes** — License categories (5-6 values) are fine. But "Warehouse Worker who can handle product X" with 500 products means 500 permissions (`warehouse:handle-product-001`, ..., `warehouse:handle-product-500`). Every new product requires registering a new permission and assigning it to employees.
- **Permissions become dual-purpose** — Some gate actions (checked by guards), some describe capabilities (used for filtering). These are conceptually different but now live in one flat list. The UI for "manage permissions" mixes access control with capability tagging.
- **No typed values** — Qualifications carry data (`maxWeight: 3500`, `licenseCategory: "C"`). Permissions are binary (have it or don't). Merging loses the ability to store and query by value.
- **Query performance** — Finding employees by qualification can be indexed in the DB (JSON query on qualification attributes). Finding employees by effective permissions requires computing position defaults + overrides for every employee, then filtering in memory.
- **Permission count bloat** — 10 modules x 20 real actions + 30 capability tags = 500 permissions in the registry. Most are tags, not access control. Harder to manage and audit.

## Decision

**Accepted.** Qualifications have been removed. Permissions serve dual purpose: gating actions and describing capabilities. Positions map to permission keys. Cross-module queries use `FindEmployeesByPermissionQuery`.

The known risks (combinatorial explosion for high-cardinality attributes, dual-purpose permissions in UI) are accepted as trade-offs for simplicity. If a module later needs high-cardinality capability attributes (e.g., per-product handling), the qualification concept may be reintroduced as a separate mechanism alongside permissions.

## Consequences of acceptance

- `QualificationAttribute` value object, `qualificationSchema` on Position, and `QualificationAttribute` embeddable have been removed.
- `FindEmployeesByQualificationQuery` replaced with `FindEmployeesByPermissionQuery`.
- Position is now: `{ key, displayName, permissionKeys }` — simpler model.
- Modules define capability permissions (e.g., `freight:drive-cat-c`) alongside action permissions (e.g., `freight:execute-route`).

---

# ADR-019: Email Notification Port

**Status:** Proposed
**Date:** 2026-03-27

## Context

Several flows would benefit from automated email delivery: user activation (sending the activation link instead of admin sharing it manually), self-service password reset, and future operational notifications (delivery confirmations, order receipts).

Currently the admin manually shares activation tokens. Password reset doesn't exist — admin sets a new password directly.

## Decision

Introduce an `EmailPort` interface in `src/shared/ports/` with a single method: `send(to, subject, html)`. The initial adapter will use Resend (API-based, no SMTP infrastructure). The port makes the provider swappable (Resend → SendGrid → SES → SMTP) without touching consumers.

Consumers: Auth module (activation emails, password reset), potentially Accountancy (sales documents) and Delivery (visit confirmations) later.

## Status

Not yet implemented. Tracked here so the port is designed when email sending is first needed rather than bolted on ad-hoc.

---

# ADR-020: Order Fulfillment as a Separate Entity in the Delivery Module

**Status:** Accepted — not yet implemented
**Date:** 2026-03-30

---

## Context

The Sales module's `OrderAggregate` manages the commercial lifecycle of an order: drafting, placement, pricing, cancellation, and completion. Once an order reaches `IN_PROGRESS` status (first stock entry assigned), physical execution begins — stock must be collected, loaded onto a vehicle, transported, and handed over to the customer.

These physical execution stages (stock collecting, awaiting dispatch, loaded, in delivery, delivered) are operational concerns that belong to the Delivery module, not Sales. Embedding them in the Sales `OrderAggregate` would:

1. Couple Sales to physical logistics concepts (truck loading, route execution, handover)
2. Bloat the Order with state that only Delivery/Freight actors care about
3. Make the Order aggregate responsible for two distinct lifecycles (commercial + physical)

## Decision

Physical order execution is modeled as a **Fulfillment** entity (or aggregate) in the **Delivery module**, separate from the Sales Order.

### Responsibilities

**Sales Order** — commercial lifecycle only:
- DRAFTED → PLACED → IN_PROGRESS → COMPLETED / CANCELLED
- Knows: what was ordered, for whom, at what price, which stock entries are assigned
- Does NOT know: how goods are physically collected, loaded, transported, or delivered

**Fulfillment (Delivery module)** — physical execution lifecycle:
- Created when a Sales Order enters IN_PROGRESS (reacts to `OrderInProgressDomainEvent`)
- Tracks substages: STOCK_COLLECTING → AWAITING_DISPATCH → LOADED → IN_DELIVERY → DELIVERED
- Owns: loading plans, route assignment, delivery confirmation, signature capture
- Completes the Sales Order (dispatches `CompleteOrderCommand`) when fulfillment reaches DELIVERED

### Communication

- Delivery listens to `OrderInProgressDomainEvent` → creates Fulfillment
- Delivery reads order data via `GetOrderQuery` (shared query, Sales handles)
- Delivery completes the order via `CompleteOrderCommand` (command bus)
- Sales does not import or know about Fulfillment internals

### Why not a substatus on Order?

Adding an `inProgressStage` enum to the Sales Order would work short-term but violates bounded context separation. The stages are Delivery domain concepts — Sales actors (back-office workers, customers) don't need to know if goods are "loaded on truck" vs "awaiting dispatch." They care about: is my order placed, is it being worked on, is it done?

Delivery actors (dispatchers, drivers, warehouse workers) need the granular stages — and they operate through the Delivery module's own UI and workflows.

## Consequences

- The Delivery module must be built before the full order execution flow works end-to-end
- Sales Order completion is triggered by Delivery, not by a Sales actor directly (though manual completion remains possible for edge cases)
- Querying "where is my order?" requires joining Sales Order status with Delivery Fulfillment stage — this can be done via a cross-module query or a dedicated read model

---

# ADR-021: ERP Activity Log — cross-module event consumption (TODO)

**Status:** Pending implementation
**Date:** 2026-03-30

## Context

The ERP module has an `ActivityLogService` that records timestamped employee actions (e.g. "visit-completed", "payment-collected") into the `activity_log_entry` table. A daily cron job (`ActivityLogCleanupCron`) deletes entries older than 7 days.

The service is built and exported, but **no cross-module event handlers consume it yet**. The intent is for the ERP module's application layer to subscribe to domain events from other modules (e.g. Delivery's visit completion, Accountancy's payment collection) and call `ActivityLogService.log()` to record them.

## TODO

- Create event handlers in `src/modules/erp/application/event-handlers/` that listen to cross-module domain events and write activity log entries via `ActivityLogService`
- Candidate events to subscribe to (once the emitting modules exist):
  - Delivery: visit completed, delivery confirmed
  - Accountancy: payment collected
  - Warehouse: goods receipt confirmed, stock transfer completed
  - Sales: order placed, order completed
- Each handler imports only the event class from the publishing module's `domain/events/` — no other cross-module imports

---

# ADR-022: API Client Code Generation with Kubb

**Status:** Accepted
**Date:** 2026-03-31

## Context

The frontend needs typed API communication with the backend. The backend already serves an OpenAPI spec at `/api-json` via `@nestjs/swagger`. Manual type duplication is error-prone and unsustainable as the API surface grows.

A previous attempt with Hey API failed due to module resolution clashes (`@tanstack/` directory naming), `noImplicitAny` errors in generated code, and types collapsing to `unknown`.

## Decision

Use **Kubb** (v3) for API client code generation. Kubb generates into clean subdirectories, supports a custom client adapter pattern (compatible with Ky), and produces proper `queryOptions()` factories for TanStack Query.

### Pipeline

1. Backend serves OpenAPI spec at `/api-json`
2. `curl` exports the spec to `packages/api-client/openapi.json` (gitignored)
3. `kubb generate` produces TypeScript types, client functions, TanStack Query hooks, and Zod schemas into `packages/api-client/src/gen/` (gitignored)
4. `apps/web` consumes `@mtct/api-client` as a workspace dependency

### Package structure

```text
packages/api-client/
├── kubb.config.ts        Kubb plugin configuration
├── src/
│   ├── client.ts         Ky-based HTTP adapter (Kubb client contract)
│   ├── index.ts          Barrel re-exports
│   └── gen/              Generated code (gitignored)
│       ├── models/       TypeScript types
│       ├── clients/      Client functions
│       ├── hooks/        TanStack Query hooks + queryOptions
│       └── zod/          Zod schemas
```

### Why not Hey API

- Hey API outputs a flat `@tanstack/` directory that confused module resolution
- Generated code had `noImplicitAny` violations under strict TS
- Generic response types collapsed to `unknown`

Kubb avoids all three: subdirectory output, clean type generation, and explicit response models.

### Swagger DTO requirement

Generic TypeScript interfaces (e.g. `Paginated<T>`) produce `{ type: "object" }` in OpenAPI. Controllers must use concrete DTO classes with `@ApiProperty` decorators to produce proper schemas. This is an API-layer concern — domain types remain unchanged.

## Consequences

- **Generated code is gitignored** — CI must run `kubb generate` before type checks
- **Concrete response DTOs** are required for all controller return types that need typed OpenAPI output
- **Ky adapter** in `src/client.ts` is the single HTTP layer — no direct `fetch` calls in generated code
- Frontend gets fully typed API access: types, client functions, query hooks, and runtime validation schemas

---

# ADR-023: Two-Factor Authentication — Planned

**Status:** Planned
**Date:** 2026-04-01

## Context

The platform handles B2B field sales operations involving financial transactions (payment collection, order pricing, returns). Currently, authentication relies on a single factor (password). For a system where field workers handle money and dispatchers control logistics, a second authentication factor adds meaningful protection against credential theft.

## Decision

Implement **two-factor authentication (2FA)** as an optional-per-tenant feature. Tenants can enforce 2FA for specific roles (e.g. dispatchers, accountants) while leaving it optional for field workers where UX friction matters more.

### Planned approach

- Login flow with 2FA: email+password → 2FA challenge (separate step) → tokens issued
- Per-tenant and per-role enforcement policy
- Recovery codes generated at enrollment time (one-time use, hashed in DB)

### Not yet decided

- **2FA method**: TOTP (authenticator app), email-based codes, WebAuthn/FIDO2, or a combination
- Whether to issue a short-lived intermediate token during the 2FA challenge step, or use a session-based approach
- Exact recovery code count and format
- SMS is likely ruled out (unreliable in field conditions)

## Consequences

- Auth module gains 2FA enrollment and verification commands
- Login flow becomes two-step when 2FA is enabled
- Recovery codes require secure storage (hashed, not plaintext)
- Frontend needs 2FA enrollment and verification UI components