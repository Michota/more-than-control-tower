# Authorization, Permissions & Positions

## Overview

The system has three layers of access control:

1. **Authentication** — JWT-based. Every request (except `@Public()` routes) must include a valid `Authorization: Bearer <token>` header. Handled globally by `JwtAuthGuard`.

2. **Permission checks** — Per-endpoint. The `@RequirePermission()` decorator checks whether the authenticated user has a specific permission. Uses `AuthorizationPort` to resolve effective permissions.

3. **Positions** — HR-managed entities that group permissions. An employee assigned to a position gets all its permissions automatically.

---

## Authentication

### Login

```
POST /auth/login
{ "email": "admin@example.com", "password": "..." }
```

Returns a JWT access token. Include it in all subsequent requests:

```
Authorization: Bearer <token>
```

### Public routes

Routes decorated with `@Public()` bypass JWT authentication:

```typescript
import { Public } from "../../shared/auth/decorators/public.decorator.js";

@Public()
@Post("login")
async login(@Body() body: LoginRequest) { ... }
```

### Accessing the authenticated user

Use the `@CurrentUser()` decorator in any controller method:

```typescript
import { CurrentUser, RequestUser } from "../../shared/auth/decorators/current-user.decorator.js";

@Post()
async doSomething(@CurrentUser() user: RequestUser) {
    console.log(user.userId); // the authenticated user's ID
}
```

---

## Permissions

### What is a permission?

A permission is a string key that represents an action or capability in the system. Examples:

- `warehouse:create-good` — action: creating a good in the warehouse
- `freight:drive-cat-c` — capability: driving a category C vehicle

Permissions serve dual purpose: gating actions on endpoints and describing capabilities for employee assignment.

### How modules register permissions

Each module registers its permissions at startup in `onModuleInit()`:

```typescript
import { Inject, Module, OnModuleInit } from "@nestjs/common";
import { PERMISSION_REGISTRY, PermissionRegistry } from "../../shared/infrastructure/permission-registry.js";

@Module({ ... })
export class WarehouseModule implements OnModuleInit {
    constructor(
        @Inject(PERMISSION_REGISTRY)
        private readonly permissionRegistry: PermissionRegistry,
    ) {}

    onModuleInit(): void {
        this.permissionRegistry.registerForModule("warehouse", [
            { key: "create-good", name: "Create Good" },
            { key: "edit-good", name: "Edit Good" },
            { key: "view-goods", name: "View Goods" },
            // ...
        ]);
    }
}
```

The registry automatically prefixes each key with the module name: `"create-good"` becomes `"warehouse:create-good"`.

Modules only provide bare keys. They never hardcode the prefix.

### Permission definition fields

| Field | Required | Description |
|-------|----------|-------------|
| `key` | yes | Bare key without module prefix (e.g., `"create-good"`) |
| `name` | yes | Display name for UI (e.g., `"Create Good"`) |
| `description` | no | Human-readable description |

### Permission enum per module

Each module defines a const object with all its permission keys for compile-time safety:

```typescript
// src/modules/warehouse/warehouse.permissions.ts
export const WarehousePermission = {
    CREATE_GOOD: "warehouse:create-good",
    EDIT_GOOD: "warehouse:edit-good",
    VIEW_GOODS: "warehouse:view-goods",
    // ...
} as const;

export type WarehousePermission = (typeof WarehousePermission)[keyof typeof WarehousePermission];
```

The values are the full keys (with prefix), matching what the registry stores.

---

## Protecting endpoints

### Basic usage

```typescript
import { RequirePermission } from "../../shared/auth/decorators/require-permission.decorator.js";
import { WarehousePermission } from "./warehouse.permissions.js";

@RequirePermission(WarehousePermission.CREATE_GOOD)
@Post("goods")
async createGood(@Body() body: CreateGoodRequestDto) { ... }
```

This does:
1. `JwtAuthGuard` (global) verifies the JWT, sets `req.user.userId`. Returns 401 if invalid.
2. `PermissionGuard` (from `@RequirePermission`) calls `AuthorizationPort.canPerform(userId, "warehouse:create-good")`. Returns 403 if denied.
3. Handler runs only if both pass.

### Endpoints without permission checks

If an endpoint only needs authentication (no specific permission), just don't add `@RequirePermission`. The global `JwtAuthGuard` still protects it — unauthenticated users get 401.

### Summary

| Decorator | Effect |
|-----------|--------|
| (none) | JWT auth required (global guard), no permission check |
| `@Public()` | No auth, no permission check |
| `@RequirePermission(...)` | JWT auth + specific permission required |

---

## Positions

### What is a position?

A position is an HR-managed entity stored in the database. It groups permissions under a meaningful name:

```json
{
    "key": "warehouse:worker",
    "displayName": "Warehouse Worker",
    "permissionKeys": ["warehouse:create-good", "warehouse:view-goods", "warehouse:view-stock"]
}
```

Positions are **not defined by modules** — they are created and managed by HR at runtime (via API or database seed).

### Creating a position

```
POST /employees/positions
{
    "key": "warehouse:worker",
    "displayName": "Warehouse Worker",
    "permissionKeys": ["warehouse:create-good", "warehouse:view-goods"]
}
```

The `permissionKeys` are validated against the `PermissionRegistry`. Only keys registered by modules are accepted — unknown keys are rejected with 400.

### Default positions

The database seeder creates default positions on first run:

- `freight:driver` — Driver
- `freight:dispatcher` — Dispatcher
- `delivery:rsr` — Sales Representative
- `warehouse:worker` — Warehouse Worker
- `hr:worker` — HR Worker
- `accountancy:accountant` — Accountant

These are starting points. HR can modify them, add permissions, or create new positions at any time.

### Listing positions

```
GET /employees/positions
```

Returns all positions with their permission keys.

---

## Assigning positions to employees

```
POST /employees/:id/positions
{
    "positionKey": "warehouse:worker",
    "assignedBy": "<employee-id-of-HR-worker>"
}
```

- The position must exist in the database
- The employee gets all permissions from the position
- `assignedBy` tracks who assigned it (audit trail)

An employee can hold multiple positions. Permissions from all positions are merged.

### Unassigning a position

```
DELETE /employees/:id/positions/:positionKey
```

---

## Permission overrides

Per-user overrides allow fine-tuning beyond positions:

```
POST /employees/:id/permission-overrides
{
    "overrides": [
        { "permissionKey": "warehouse:transfer-stock", "state": "allowed" },
        { "permissionKey": "warehouse:remove-stock", "state": "denied" }
    ]
}
```

| State | Effect |
|-------|--------|
| `"allowed"` | Grants the permission, even if no position provides it |
| `"denied"` | Removes the permission, even if a position provides it |
| omitted / `null` | Removes the override (reverts to position default) |

Overrides are validated against the `PermissionRegistry` — unknown permission keys are rejected.

---

## How effective permissions are resolved

When a module asks "can user X do Y?", the system computes effective permissions:

1. **Find the employee** by userId
2. **Collect position permissions** — for each assigned position, get its `permissionKeys` from the database
3. **Merge** all permissions into a set
4. **Apply overrides**:
   - `ALLOWED` adds to the set
   - `DENIED` removes from the set
5. **Check** if the requested action is in the final set

### Administrator bypass

System users with the `"administrator"` role bypass all permission checks — they are allowed everything.

---

## Cross-module queries

### "Can user X do Y?"

```typescript
// Used internally by the PermissionGuard / HrAuthorizationAdapter
const result = await queryBus.execute(new GetEmployeePermissionsQuery(userId));
// Returns: { effectivePermissions: ["warehouse:create-good", ...], positionKeys: [...] }
```

### "Who can do Y?"

Any module can find employees with a specific permission:

```typescript
const result = await queryBus.execute(
    new FindEmployeesByPermissionQuery("freight:drive-cat-c")
);
// Returns: { employees: [{ employeeId, userId, firstName, lastName }] }
```

This respects overrides — an employee with a DENIED override won't appear even if their position grants the permission.

---

## Adding permissions to a new module

Step-by-step for a new module (e.g., `Delivery`):

### 1. Create the permissions file

```typescript
// src/modules/delivery/delivery.permissions.ts
export const DeliveryPermission = {
    CREATE_VISIT: "delivery:create-visit",
    VIEW_VISITS: "delivery:view-visits",
    CLOSE_VISIT: "delivery:close-visit",
} as const;

export type DeliveryPermission = (typeof DeliveryPermission)[keyof typeof DeliveryPermission];
```

### 2. Register in the module

```typescript
@Module({ ... })
export class DeliveryModule implements OnModuleInit {
    constructor(
        @Inject(PERMISSION_REGISTRY)
        private readonly permissionRegistry: PermissionRegistry,
    ) {}

    onModuleInit(): void {
        this.permissionRegistry.registerForModule("delivery", [
            { key: "create-visit", name: "Create Visit" },
            { key: "view-visits", name: "View Visits" },
            { key: "close-visit", name: "Close Visit" },
        ]);
    }
}
```

### 3. Apply to endpoints

```typescript
@RequirePermission(DeliveryPermission.CREATE_VISIT)
@Post("visits")
async createVisit(@Body() body: CreateVisitRequest) { ... }
```

### 4. HR assigns to positions

Via API or seed, HR maps permissions to positions:

```
PATCH /employees/positions/:id
{ "permissionKeys": ["delivery:create-visit", "delivery:view-visits"] }
```

No module code changes needed — HR manages the mapping.

---

## Architecture summary

```
Module                      Shared                          HR Module
──────                      ──────                          ─────────
registers permissions  ──>  PermissionRegistry          <── validates permission keys
defines enum           ──>  @RequirePermission          <── PermissionGuard calls
                            decorator + guard               AuthorizationPort

                            AuthorizationPort           <── HrAuthorizationAdapter
                            (canPerform interface)          resolves via QueryBus

                                                            Positions (DB entities)
                                                            Employee assignments
                                                            Permission overrides
                                                            Effective permission computation
```

Modules never import HR. HR never imports modules. They communicate through:
- `PermissionRegistry` — shared global service (modules write, HR reads)
- `QueryBus` — cross-module queries (modules ask, HR answers)
- `AuthorizationPort` — shared interface (guard calls, HR implements)
