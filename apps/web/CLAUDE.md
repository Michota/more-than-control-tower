# Web — Frontend Conventions

## Monorepo Context

This app lives in `apps/web/` inside a pnpm monorepo. Shared workspace packages:

- `@mtct/api-client` (`packages/api-client`) — generated API client (types, hooks, Zod schemas) from OpenAPI spec
- `@mtct/i18n` (`packages/i18n`) — Paraglide.js i18n source messages
- `@mtct/shared-types` (`packages/shared-types`) — shared TypeScript types
- `@mtct/typescript-config` (`packages/typescript-config`) — shared tsconfig
- `@mtct/eslint-config` (`packages/eslint-config`) — shared ESLint config

## Stack

- **React 19** with **Vite** (SPA, PWA via `vite-plugin-pwa`)
- **TanStack Router** — file-based routing in `src/routes/`
- **TanStack Query v5** — server state management
- **TanStack Form** — form handling
- **Tailwind CSS v4** with OKLCH color tokens
- **shadcn/ui** (New York style, stone palette) — `src/components/ui/`
- **Ky** — HTTP client (`src/lib/api-client.ts`), prefixed with `/api`, proxied to backend in dev
- **Paraglide.js v2** — i18n (source locale: `pl`, supported: `pl`, `en`)
- **Zod v4** — validation
- **Lucide** — icons

## File Naming

All files and directories use **kebab-case**. No PascalCase or camelCase file names.

## Responsive Design

All UI must be **responsive** (mobile-first). Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, etc.). The app must work on mobile devices in field conditions.

## Project Structure

Feature-first architecture. Domain logic is grouped by feature; shared code stays in lean top-level directories.

```text
src/
  routes/              # TanStack Router file-based routes — thin shells only
  features/            # Domain feature modules (the bulk of the app)
    orders/
      components/      # Feature-specific components
      hooks/           # Feature-specific hooks
      utils/           # Feature-specific helpers
      validation/      # Feature-specific Zod schemas
    warehouse/
      ...
  components/
    ui/                # shadcn/ui primitives (managed by CLI, avoid heavy customization)
    forms/             # Shared form building blocks (form-field-input, etc.)
    layout/            # Shared layout components (sidebar, header, etc.)
  hooks/               # Shared hooks (useAppForm, useLocale, etc.)
  lib/                 # Shared infra: api-client, theme, config, query-client, locale-store
  types/               # App-wide TypeScript types not covered by @mtct/shared-types
```

### Rules

- **Routes are thin shells.** Route files in `src/routes/` define the route and import the page component from `src/features/`. They should contain minimal logic — just the `createFileRoute` call, loader if needed, and a component import.
- **Features own their code.** Each feature folder (`src/features/<name>/`) contains its own `components/`, `hooks/`, `utils/`, `validation/` subdirectories as needed. Not every subdirectory is required — create them when the feature needs them.
- **Shared code is the exception, not the rule.** Only promote something to a top-level shared directory (`src/hooks/`, `src/components/`, `src/lib/`) when it is used by 2+ features. Start colocated, extract when reuse appears.
- **shadcn/ui primitives** live in `src/components/ui/` and are managed by the shadcn CLI — avoid heavy customization.
- Use CVA (class-variance-authority) for component variants.

## Routing

TanStack Router with file-based routing. Route files live in `src/routes/`. Every file in this directory is treated as a route by the router — do not place non-route code here.

- `__root.tsx` — root layout
- `index.tsx` — `/` route
- `routeTree.gen.ts` — auto-generated, never edit

Route files should be thin — delegate to feature components:

```tsx
// src/routes/orders/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { OrdersPage } from "@/features/orders/components/orders-page";

export const Route = createFileRoute("/orders/")({
  component: OrdersPage,
});
```

The router has `QueryClient` in its context for loader-level data fetching.

## State Management

- **Server state**: TanStack Query (staleTime: 1min, retry: 1). All API data goes through Query.
- **Client state**: React context or component state. No global client state library unless needed.
- **Forms**: TanStack Form with Zod validation.

## API Communication

Prefer **generated hooks and clients** from `@mtct/api-client` (Kubb codegen from the OpenAPI spec):

```typescript
import { useListEmployees } from "@mtct/api-client/hooks/useListEmployees";
import { listEmployeesQueryOptions } from "@mtct/api-client/hooks/useListEmployees";
```

For endpoints not yet covered by codegen, fall back to the shared Ky client from `@/lib/api-client`:

```typescript
import { api } from "@/lib/api-client";
const data = await api.get("endpoint").json<ResponseType>();
```

To regenerate the API client after backend changes:
1. `pnpm dev:api` — ensure backend is running
2. `pnpm export:openapi` — export OpenAPI spec
3. `pnpm generate:api-client` — regenerate client code

In dev, `/api` is proxied to `http://localhost:3000`.

## Internationalization

Paraglide.js v2. Source messages live in `packages/i18n/messages/{locale}.json` (not in this app).

```typescript
import * as m from "@/lib/paraglide/messages";
<span>{m.some_key()}</span>
```

- Files in `src/lib/paraglide/` are auto-generated — never edit them
- Source locale is Polish (`pl`), English (`en`) is the second language
- All user-facing text must use message functions, no hardcoded strings

## Theme

Light/dark/system theme via `useTheme()` hook from `@/lib/theme`. Dark mode uses Tailwind's `.dark` class on `<html>`.

## Path Alias

`@/` maps to `src/`. Always use `@/` imports, never relative paths outside the current directory.

## Auto-Generated Files (Do Not Edit)

- `src/routeTree.gen.ts`
- `src/lib/paraglide/**`
