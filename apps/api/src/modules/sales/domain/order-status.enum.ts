export enum OrderStatus {
    /**
     * When order is being drafted, which means it has not been placed yet.
     */
    DRAFTED = "DRAFTED",
    /**
     * When order has been placed, but has not been processed yet. This is the initial status of an order after it has been placed, and before it has been processed.
     */
    PLACED = "PLACED",
    /**
     * When progress has been placed and is being processed, but has not been completed yet
     */
    IN_PROGRESS = "IN_PROGRESS",
    CANCELLED = "CANCELLED",
    /**
     * When order has ben successfully placed
     */
    COMPLETED = "COMPLETED",
}
