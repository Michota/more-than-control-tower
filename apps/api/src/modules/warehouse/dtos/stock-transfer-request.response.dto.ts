import { ApiProperty } from "@nestjs/swagger";

export class StockTransferRequestResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    id!: string;
    /** @example "660e8400-e29b-41d4-a716-446655440000" */
    goodId!: string;
    /** @example 10 */
    quantity!: number;
    /** @example "770e8400-e29b-41d4-a716-446655440000" */
    fromWarehouseId!: string;
    /** @example "880e8400-e29b-41d4-a716-446655440000" */
    toWarehouseId!: string;
    /** @example "PENDING" */
    status!: string;
    /** @example "Load for morning route" */
    note?: string;
    /** @example "freight" */
    requestedBy?: string;
    /** @example "Insufficient stock" */
    rejectionReason?: string;
}

export class PaginatedStockTransferRequestsResponseDto {
    @ApiProperty({ type: [StockTransferRequestResponseDto] })
    data!: readonly StockTransferRequestResponseDto[];
    /** @example 42 */
    count!: number;
    /** @example 1 */
    page!: number;
    /** @example 20 */
    limit!: number;
}
