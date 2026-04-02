# Internationalization (i18n)

## Overview

The platform supports Polish (`pl`, source locale) and English (`en`). All user-facing text must go through the translation system — no hardcoded strings in components.

**Stack:** Paraglide.js v2 (compile-time message functions) + a thin `t()` wrapper for dynamic backend data.

---

## Architecture

```
packages/i18n/
├── messages/
│   ├── pl.json          ← source locale (Polish)
│   └── en.json          ← English translations
├── src/
│   ├── t.ts             ← unified t() function
│   ├── t.spec.ts        ← tests
│   └── index.ts         ← exports
└── project.inlang/
    └── settings.json    ← Paraglide config

apps/web/src/lib/paraglide/   ← auto-generated (never edit)
├── runtime.js
└── messages.js
```

Paraglide's Vite plugin reads `packages/i18n/messages/*.json` and generates typed message functions into `apps/web/src/lib/paraglide/`. These are auto-generated — never edit them.

---

## How to Add a Translation

1. Add the key-value pair to both `packages/i18n/messages/pl.json` and `en.json`:

```json
// pl.json
{ "warehouse_page_title": "Magazyny" }

// en.json
{ "warehouse_page_title": "Warehouses" }
```

2. Paraglide generates `m.warehouse_page_title()` automatically on next build/dev server restart.

3. Use in a component:

```tsx
import * as m from "@/lib/paraglide/messages";

<h1>{m.warehouse_page_title()}</h1>
```

---

## Two Ways to Use Translations

### 1. Static UI text — use `m.xxx()` directly

For labels, buttons, headers — anything where you know the key at code-writing time:

```tsx
import * as m from "@/lib/paraglide/messages";

<Button>{m.common_save()}</Button>
<Label>{m.auth_email_label()}</Label>
```

### 2. Dynamic backend data — use `t()`

For values that come from the backend at runtime (error messages, enum values, permission names), use the `t()` function from `@mtct/i18n`:

```tsx
import { t } from "@mtct/i18n";

// Error messages — backend sends translation keys as the message field
// API response: { code: "ORDER.NOT_FOUND", message: "error_order_not_found" }
t("error_order_not_found")  // → "Zamówienie nie znalezione." (PL)

// Enum values — pass the enum object first to disambiguate
t(OrderStatus, order.status)  // → "Złożone" (PL) when status is "PLACED"
```

`t()` looks up the key in Paraglide's generated messages. If no translation exists, it falls back to the key itself (or a provided fallback string).

---

## Error Messages

Backend error classes use translation keys as their `message` field:

```ts
// Backend (apps/api)
export class OrderNotFoundError extends NotFoundDomainException {
    static readonly message = "error_order_not_found";  // ← i18n key, not English
    public readonly code = "ORDER.NOT_FOUND";
}
```

The API response is `{ code: "ORDER.NOT_FOUND", message: "error_order_not_found" }`. The frontend translates it:

```ts
const body = await err.response.json();
const errorMessage = t(body.message);  // → localized string
```

### Naming convention

Error keys follow: `error_{descriptive_name}`

Examples:
- `error_order_not_found`
- `error_auth_invalid_credentials`
- `error_warehouse_has_stock`

---

## Enum Labels

Enums are pure backend logic (`"PLACED"`, `"ACTIVE"`) — they are not display text. When the frontend needs to show an enum value to the user, it translates it via `t()`.

### Setup (once per enum)

1. Register the enum with a prefix at app init:

```ts
import { registerEnum } from "@mtct/i18n";
import { OrderStatus } from "@mtct/shared-types";

registerEnum(OrderStatus, "order_status");
```

2. Add translations:

```json
{ "order_status_placed": "Złożone", "order_status_drafted": "Szkic" }
```

3. Use in component:

```tsx
import { t } from "@mtct/i18n";
import { OrderStatus } from "@mtct/shared-types";

<Badge>{t(OrderStatus, order.status)}</Badge>
// When status is "PLACED" → constructs key "order_status_placed" → "Złożone"
```

### Why `registerEnum()`?

Multiple enums share the same values (e.g., `"ACTIVE"` exists in `WarehouseStatus`, `VehicleStatus`, `EmployeeStatus`). The enum object passed as the first argument to `t()` tells it which prefix to use, so `t(WarehouseStatus, "ACTIVE")` and `t(VehicleStatus, "ACTIVE")` resolve to different translations.

### Naming convention

Enum keys follow: `{prefix}_{value_lowercase}`

Examples:
- `order_status_placed`, `order_status_drafted`
- `warehouse_type_regular`, `warehouse_type_mobile`

Enums are translated incrementally — only add translations when building UI that displays them.

---

## Permission Names

Permission definitions in `@mtct/shared-types` use `messageKey` instead of hardcoded English names:

```ts
// packages/shared-types/src/permissions/warehouse.permissions.ts
CREATE_GOOD: { key: "create-good", messageKey: "permission_warehouse_create_good" },
```

The frontend translates them: `t(permission.messageKey)` → "Utwórz towar" (PL)

### Naming convention

Permission keys follow: `permission_{module}_{key_with_dashes_as_underscores}`

Optional description keys: `permission_{module}_{key}_desc`

---

## Frontend Wiring

### App initialization (`main.tsx`)

```ts
import * as messages from "@/lib/paraglide/messages";
import { setMessageSource } from "@mtct/i18n";

setMessageSource(messages as Record<string, () => string>);
```

This injects Paraglide's generated messages into `t()` so it can look up keys at runtime.

### Locale switching

The locale store (`src/lib/locale-store.ts`) intercepts Paraglide's `setLocale` to sync:
- Zod validation error locale
- `<html lang>` attribute
- React re-renders via `useSyncExternalStore`

Use the `useLocale()` hook to read/change the current locale:

```ts
const { locale, setLocale } = useLocale();
setLocale("en");
```

### Reactivity

Both `m.xxx()` and `t()` are reactive — when the locale changes, components re-render and get the new language. This works because `t()` delegates to Paraglide message functions which read the current locale at call time.

---

## Key Naming Conventions

| Category    | Pattern                                    | Example                              |
|-------------|--------------------------------------------|--------------------------------------|
| UI text     | `{feature}_{description}`                  | `warehouse_page_title`               |
| Error       | `error_{descriptive_name}`                 | `error_order_not_found`              |
| Enum        | `{prefix}_{value_lowercase}`               | `order_status_placed`                |
| Permission  | `permission_{module}_{key}`                | `permission_warehouse_create_good`   |
| Common      | `common_{action}`                          | `common_save`, `common_cancel`       |
| Sidebar     | `sidebar_{section}_{item}`                 | `sidebar_warehouse_goods`            |
| Validation  | `validation_{rule}`                        | `validation_required`                |

---

## Adding Translations Checklist

- [ ] Key added to both `pl.json` and `en.json`
- [ ] Keys match between both files (no missing translations)
- [ ] Key follows the naming convention for its category
- [ ] Used `m.xxx()` for static text or `t()` for dynamic backend data
- [ ] No hardcoded user-facing strings in components
