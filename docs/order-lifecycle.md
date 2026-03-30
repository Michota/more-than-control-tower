# Order Lifecycle

## Overview

Orders are the central entity in the Sales module. They represent a customer's request to purchase goods. An order consists of one or more order lines, each referencing a catalog product with a quantity and a snapshotted price.

Every order tracks **who** created it (`actorId`) and **how** (`source`: SR, RSR, or SELF_SERVICE).

## Order States

```
DRAFTED ──→ PLACED ──→ IN_PROGRESS ──→ COMPLETED
  │            │
  └────────────┴──→ CANCELLED
```

| Status        | Description                                                                 |
|---------------|-----------------------------------------------------------------------------|
| `DRAFTED`     | Initial state. Order is being composed — lines can be added/changed/removed |
| `PLACED`      | Order confirmed. Line modifications blocked. Good/stock entry assignment allowed |
| `IN_PROGRESS` | At least one stock entry assigned. Physical goods committed. Non-cancellable |
| `COMPLETED`   | Order successfully fulfilled                                                |
| `CANCELLED`   | Order was cancelled (only from DRAFTED or PLACED)                           |

### Allowed Transitions

| From          | To            | Trigger                                           |
|---------------|---------------|---------------------------------------------------|
| —             | `DRAFTED`     | `DraftOrderCommand` (requires CRM customer, actorId, source) |
| `DRAFTED`     | `DRAFTED`     | `AddProductToOrder`, `ChangeProductQuantity`, `RemoveProductFromOrder` |
| `DRAFTED`     | `PLACED`      | `PlaceOrderCommand`                               |
| `DRAFTED`     | `CANCELLED`   | `CancelOrderCommand`                              |
| `PLACED`      | `PLACED`      | `AssignGoodCommand`, `AssignStockEntryCommand` (partial) |
| `PLACED`      | `IN_PROGRESS` | Auto-transition on first stock entry assignment    |
| `PLACED`      | `COMPLETED`   | `CompleteOrderCommand`                             |
| `PLACED`      | `CANCELLED`   | `CancelOrderCommand`                              |
| `IN_PROGRESS` | `COMPLETED`   | `CompleteOrderCommand`                             |
| `IN_PROGRESS` | `CANCELLED`   | **blocked** — physical goods are committed         |

## Three Ways to Create an Order

The system supports three distinct order creation flows, tracked via the `OrderSource` enum:

1. **SR (Sales Representative)** — A back-office worker creates an order on behalf of a customer (e.g. based on a phone call).

2. **RSR (Route Sales Representative)** — A field worker creates an order while visiting a customer. This allows selling goods from the truck (mobile warehouse) or ordering for future delivery.

3. **SELF_SERVICE** — The customer completes an order draft through an app or website.

All three flows produce the same `OrderAggregate` and follow the same lifecycle. The `actorId` field records who initiated the order (system user ID).

### CRM Customer Validation

Before creating a draft, the system verifies the customer exists in the CRM module via `GetCustomerQuery`. If the customer doesn't exist, `CustomerNotFoundForOrderError` is thrown.

## Order Structure

```
Order (Aggregate Root)
├── customerId         — reference to CRM customer (validated at draft time)
├── actorId            — who created the order (system user ID)
├── source             — SR | RSR | SELF_SERVICE
├── status             — current lifecycle state
├── cost               — total order cost (Money)
└── orderLines         — collection of OrderLine value objects
    └── OrderLine
        ├── product        — OrderItemEntity (catalog product ID + snapshotted price)
        ├── quantity       — number of units
        ├── goodId?        — Warehouse Good reference (what product)
        └── stockEntryId?  — Warehouse StockEntry reference (which physical batch)
```

### Price Snapshotting

Prices are resolved and captured at draft time. The `OrderItemEntity` stores the price as a `Money` value object. Subsequent catalog price changes do not affect existing orders (critical integrity rule).

## Draft Editing

Only `DRAFTED` orders can have their lines modified:

- `AddProductToOrderCommand` — add a new product line (resolves price)
- `ChangeProductQuantityCommand` — change quantity on an existing line
- `RemoveProductFromOrderCommand` — remove a line entirely

## Good Assignment

Order lines can reference a Warehouse Good (`goodId`) — the catalog-level "what product" from the Warehouse module.

- Multiple orders can reference the same Good (no uniqueness constraint)
- Assignment is a separate command, not part of drafting
- Cross-module verification via `GetGoodExistsQuery`
- Allowed on `DRAFTED`, `PLACED`, and `IN_PROGRESS` orders

## Stock Entry Assignment

Order lines can reference a Warehouse StockEntry (`stockEntryId`) — the physical "which batch" from the Warehouse.

### Key Design Decisions

- **1:1 reservation** — a stock entry can only be assigned to one active order at a time
- **Requires goodId first** — the order line must have a Good assigned, and the stock entry's `goodId` must match
- **Only on PLACED or IN_PROGRESS orders** — stock is assigned after placement, not during drafting
- **Auto-transition** — the first stock entry assignment transitions `PLACED → IN_PROGRESS` (physical goods are now committed)
- **IN_PROGRESS is non-cancellable** — physical goods are committed

### Assignment Flow

```
1. POST /order/:id/lines/:productId/assign-stock-entry
   Body: { stockEntryId: "..." }

2. AssignStockEntryCommandHandler:
   a. Load order (fail if not found)
   b. Verify stock entry exists via GetStockEntryQuery (Warehouse)
   c. Verify stock entry's goodId matches order line's goodId
   d. Check stock entry isn't already assigned to another active order
   e. Call order.assignStockEntry(productId, stockEntryId)
   f. If order is PLACED → auto-transition to IN_PROGRESS (first stock entry commits physical goods)
   g. Persist and publish events
```

## Stock Reservation Checker

The system provides a plugin-based mechanism for Warehouse to ask "can I modify this stock entry?" before mutations.

- `CanStockEntryBeModifiedQuery` — Warehouse sends this before transferOut, remove, moveToSector
- `StockReservationChecker` interface — any module can register a checker
- Sales registers `OrderStockReservationChecker` — vetoes if the stock entry is assigned to an active order
- The aggregated handler iterates all checkers and returns the first rejection

This keeps Warehouse decoupled — it doesn't import Sales concepts.

## API Endpoints

All endpoints are under the `/order` base path. All require authentication and the corresponding permission.

| Method | Path                                            | Permission            | Description                    |
|--------|-------------------------------------------------|-----------------------|--------------------------------|
| GET    | `/order`                                        | `sales:view-orders`   | List orders (paginated, filterable, searchable) |
| GET    | `/order/:id`                                    | `sales:view-orders`   | Get order by ID                |
| POST   | `/order/draft`                                  | `sales:draft-order`   | Create a new draft order       |
| POST   | `/order/:id/place`                              | `sales:place-order`   | Place a drafted order          |
| POST   | `/order/:id/cancel`                             | `sales:cancel-order`  | Cancel an order                |
| POST   | `/order/:id/complete`                           | `sales:complete-order` | Complete an order             |
| POST   | `/order/:id/lines`                              | `sales:edit-draft`    | Add product to draft           |
| PATCH  | `/order/:id/lines/:productId`                   | `sales:edit-draft`    | Change product quantity        |
| DELETE | `/order/:id/lines/:productId`                   | `sales:edit-draft`    | Remove product from draft      |
| POST   | `/order/:id/lines/:productId/assign-good`       | `sales:assign-good`   | Assign warehouse good          |
| POST   | `/order/:id/lines/:productId/assign-stock-entry`| `sales:assign-stock-entry` | Assign stock entry        |

### Query Parameters for GET /order

| Param      | Type   | Description                     |
|------------|--------|---------------------------------|
| `page`     | number | Page number (default: 1)        |
| `limit`    | number | Items per page (default: 20)    |
| `customerId` | UUID | Filter by customer              |
| `status`   | enum   | Filter by order status          |
| `search`   | string | Search by order ID prefix       |

## Permissions

8 permissions registered in `SalesModule.onModuleInit()`:

| Permission Key           | Description                    |
|--------------------------|--------------------------------|
| `sales:draft-order`      | Create draft orders            |
| `sales:edit-draft`       | Modify draft order lines       |
| `sales:place-order`      | Place orders                   |
| `sales:cancel-order`     | Cancel orders                  |
| `sales:complete-order`   | Complete orders                |
| `sales:assign-good`      | Assign warehouse goods         |
| `sales:assign-stock-entry` | Assign stock entries         |
| `sales:view-orders`      | View and query orders          |

## Domain Events

| Event                                  | Emitted When                              |
|----------------------------------------|-------------------------------------------|
| `OrderDraftedDomainEvent`              | New draft created (includes actorId, source) |
| `OrderPlacedDomainEvent`              | DRAFTED → PLACED                           |
| `OrderCancelledDomainEvent`           | → CANCELLED                                |
| `OrderCompletedDomainEvent`           | → COMPLETED                                |
| `OrderInProgressDomainEvent`          | PLACED → IN_PROGRESS (auto-transition)     |
| `GoodAssignedToOrderDomainEvent`      | Good linked to order line                  |
| `StockEntryAssignedToOrderDomainEvent`| Stock entry linked to order line           |

## Cross-Module Communication

| Direction             | Mechanism     | Contract                          |
|-----------------------|---------------|-----------------------------------|
| Sales → CRM          | QueryBus      | `GetCustomerQuery`                |
| Sales → Warehouse    | QueryBus      | `GetGoodExistsQuery`              |
| Sales → Warehouse    | QueryBus      | `GetStockEntryQuery`              |
| Warehouse → any      | QueryBus      | `CanStockEntryBeModifiedQuery`    |
| CRM → Sales          | QueryBus      | `GetCustomerOrdersQuery`          |
| Sales → any          | Domain Events | `Order*DomainEvent`               |
