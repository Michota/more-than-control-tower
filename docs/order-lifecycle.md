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
        └── goodId?        — optional reference to a Warehouse Good (assigned later)
```

### Price Snapshotting

Prices are resolved and captured at draft time. The `OrderItemEntity` stores the price as a `Money` value object. Subsequent catalog price changes do not affect existing orders (critical integrity rule).

## Good Assignment

Order lines can optionally reference a Warehouse Good (`goodId`). This links the order line to a product definition in the Warehouse module — the catalog-level "what" rather than a specific stock batch.

### Key Design Decisions

- **Good, not StockEntry** — the order line references the Warehouse Good (product definition), not a specific stock entry. Multiple orders can reference the same Good. Physical stock allocation is a Delivery/fulfillment concern.
- **Assignment is a separate command** (`AssignGoodCommand`) — not part of drafting or placement. This allows orders to be placed before the Good is even created in the Warehouse.
- **No reservation/uniqueness constraint** — unlike stock entries, Goods are shared catalog items. Many orders can reference the same Good simultaneously.
- **Cross-module verification** — the assignment handler sends `GetGoodExistsQuery` through the QueryBus to verify the Good exists in the Warehouse module.

### Assignment Flow

```
1. Client sends POST /order/:id/lines/:productId/assign-good
   Body: { goodId: "..." }

2. AssignGoodCommandHandler:
   a. Load the order (fail if not found)
   b. Query Warehouse module via GetGoodExistsQuery (fail if good doesn't exist)
   c. Call order.assignGood(productId, goodId)
   d. Persist and publish GoodAssignedToOrderDomainEvent
```

### When a Good Can Be Assigned

- Order must be in `DRAFTED` or `PLACED` status (not `CANCELLED` or `COMPLETED`)
- The Good must exist in the Warehouse module

## API Endpoints

All endpoints are under the `/order` base path.

| Method | Path                                        | Description              |
|--------|---------------------------------------------|--------------------------|
| POST   | `/order/draft`                              | Create a new draft order |
| POST   | `/order/:id/place`                          | Place a drafted order    |
| POST   | `/order/:id/cancel`                         | Cancel an order          |
| POST   | `/order/:id/complete`                       | Complete a placed order  |
| POST   | `/order/:id/lines/:productId/assign-good`   | Assign warehouse good to line |

## Domain Events

| Event                              | Emitted When                     |
|------------------------------------|----------------------------------|
| `OrderDraftedDomainEvent`          | New order draft created          |
| `OrderPlacedDomainEvent`           | Order transitions to PLACED      |
| `OrderCancelledDomainEvent`        | Order transitions to CANCELLED   |
| `OrderCompletedDomainEvent`        | Order transitions to COMPLETED   |
| `GoodAssignedToOrderDomainEvent`   | Warehouse good linked to order line |

These events can be consumed by other modules (Warehouse, Delivery, Freight) to trigger downstream workflows.

## Cross-Module Communication

| Direction             | Mechanism     | Contract                  |
|-----------------------|---------------|---------------------------|
| Sales → Warehouse     | QueryBus      | `GetGoodExistsQuery`      |
| Sales → other modules | Domain Events | `Order*DomainEvent`       |
| CRM → Sales           | QueryBus      | `GetCustomerOrdersQuery`  |
