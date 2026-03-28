# Order Lifecycle

## Overview

Orders are the central entity in the Sales module. They represent a customer's request to purchase goods. An order consists of one or more order lines, each referencing a catalog product with a quantity and a snapshotted price.

## Order States

```
DRAFTED ──> PLACED ──> COMPLETED
   │           │
   └───────────┴──> CANCELLED
```

| Status        | Description                                                                 |
|---------------|-----------------------------------------------------------------------------|
| `DRAFTED`     | Initial state. Order is being composed — lines can be added/changed/removed |
| `PLACED`      | Order has been confirmed. No further line modifications allowed              |
| `IN_PROGRESS` | Reserved for future use (e.g. when order is being prepared for delivery)     |
| `COMPLETED`   | Order successfully fulfilled                                                |
| `CANCELLED`   | Order was cancelled before completion                                       |

### Allowed Transitions

| From       | To          | Command               |
|------------|-------------|-----------------------|
| `DRAFTED`  | `PLACED`    | `PlaceOrderCommand`   |
| `DRAFTED`  | `CANCELLED` | `CancelOrderCommand`  |
| `PLACED`   | `COMPLETED` | `CompleteOrderCommand` |
| `PLACED`   | `CANCELLED` | `CancelOrderCommand`  |

All transitions are enforced in the `OrderAggregate` domain model. Invalid transitions throw a conflict error.

## Three Ways to Create an Order

The system supports three distinct order creation flows, all converging on the same `DraftOrderCommand`:

1. **Back-office order** — A sales worker creates an order on behalf of a customer (e.g. based on a phone call). The order is drafted, placed, and later fulfilled through warehouse and delivery workflows.

2. **RSR field order** — A Route Sales Representative creates an order while visiting a customer. This allows selling goods that are physically on the truck (mobile warehouse) or ordering goods for future delivery.

3. **Customer self-service** — The customer completes an order draft through an app or website. The system receives the finalized draft and transitions it to `PLACED`.

All three flows produce the same `OrderAggregate` and follow the same lifecycle.

## Order Structure

```
Order (Aggregate Root)
├── customerId        — reference to CRM customer
├── status            — current lifecycle state
├── cost              — total order cost (Money)
└── orderLines        — collection of OrderLine value objects
    └── OrderLine
        ├── product       — OrderItemEntity (catalog product ID + snapshotted price)
        ├── quantity      — number of units
        └── stockEntryId? — optional reference to assigned warehouse stock entry
```

### Price Snapshotting

Prices are resolved and captured at draft time. The `OrderItemEntity` stores the price as a `Money` value object. Subsequent catalog price changes do not affect existing orders (critical integrity rule).

## Stock Entry Assignment

Order lines can optionally reference a warehouse stock entry (`stockEntryId`). This links the order to physical inventory.

### Key Design Decisions

- **Assignment is a separate command** (`AssignStockEntryCommand`) — not part of drafting or placement. This allows orders to be placed before stock is available.
- **Reservation is implicit** — there is no dedicated "reserved" flag on stock entries. Instead, the system queries all active orders to determine if a stock entry is already assigned.
- **One stock entry per order line** — a stock entry can only be assigned to one active (non-cancelled, non-completed) order line at a time.
- **Cross-module verification** — the assignment handler sends `GetStockEntryQuery` through the QueryBus to verify the stock entry exists in the Warehouse module.

### Assignment Flow

```
1. Client sends POST /order/:id/lines/:productId/assign-stock-entry
   Body: { stockEntryId: "..." }

2. AssignStockEntryCommandHandler:
   a. Load the order (fail if not found)
   b. Query Warehouse module via GetStockEntryQuery (fail if stock entry doesn't exist)
   c. Check if stock entry is already assigned to any active order (fail if taken)
   d. Call order.assignStockEntry(productId, stockEntryId)
   e. Persist and publish StockEntryAssignedToOrderDomainEvent
```

### When Stock Entry Can Be Assigned

- Order must be in `DRAFTED` or `PLACED` status (not `CANCELLED` or `COMPLETED`)
- The stock entry must exist in the Warehouse module
- The stock entry must not be assigned to another active order

## API Endpoints

All endpoints are under the `/order` base path.

| Method | Path                                        | Description              |
|--------|---------------------------------------------|--------------------------|
| POST   | `/order/draft`                              | Create a new draft order |
| POST   | `/order/:id/place`                          | Place a drafted order    |
| POST   | `/order/:id/cancel`                         | Cancel an order          |
| POST   | `/order/:id/complete`                       | Complete a placed order  |
| POST   | `/order/:id/lines/:productId/assign-stock-entry` | Assign stock entry to line |

## Domain Events

| Event                                | Emitted When                     |
|--------------------------------------|----------------------------------|
| `OrderDraftedDomainEvent`            | New order draft created          |
| `OrderPlacedDomainEvent`             | Order transitions to PLACED      |
| `OrderCancelledDomainEvent`          | Order transitions to CANCELLED   |
| `OrderCompletedDomainEvent`          | Order transitions to COMPLETED   |
| `StockEntryAssignedToOrderDomainEvent` | Stock entry linked to order line |

These events can be consumed by other modules (Warehouse, Delivery, Freight) to trigger downstream workflows.

## Cross-Module Communication

| Direction             | Mechanism    | Contract                  |
|-----------------------|-------------|---------------------------|
| Sales → Warehouse     | QueryBus    | `GetStockEntryQuery`      |
| Sales → other modules | Domain Events | `Order*DomainEvent`      |
| CRM → Sales           | QueryBus    | `GetCustomerOrdersQuery`  |
