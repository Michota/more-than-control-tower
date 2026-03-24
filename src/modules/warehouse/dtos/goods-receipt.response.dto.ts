import { ApiProperty } from "@nestjs/swagger";

export class GoodsReceiptLineResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    goodId!: string;
    /** @example 50 */
    quantity!: number;
    /** @example "Shelf A1, Zone B" */
    locationDescription?: string;
    /** @example "2 bottles had minor dents" */
    note?: string;
}

export class GoodsReceiptResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    id!: string;
    /** @example "660e8400-e29b-41d4-a716-446655440000" */
    targetWarehouseId!: string;
    /** @example "DRAFT" */
    status!: string;
    /** @example "Truck arrived late, some boxes dented" */
    note?: string;

    @ApiProperty({ type: [GoodsReceiptLineResponseDto] })
    lines!: GoodsReceiptLineResponseDto[];
}

export class GoodsReceiptListItemResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    id!: string;
    /** @example "660e8400-e29b-41d4-a716-446655440000" */
    targetWarehouseId!: string;
    /** @example "CONFIRMED" */
    status!: string;
    /** @example "Initial delivery batch" */
    note?: string;
    /** @example 3 */
    lineCount!: number;
}

export class PaginatedGoodsReceiptsResponseDto {
    @ApiProperty({ type: [GoodsReceiptListItemResponseDto] })
    data!: GoodsReceiptListItemResponseDto[];
    /** @example 10 */
    count!: number;
    /** @example 1 */
    page!: number;
    /** @example 20 */
    limit!: number;
}

export class ReceiptIdResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    receiptId!: string;
}
