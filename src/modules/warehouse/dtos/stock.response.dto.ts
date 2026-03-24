export class WarehouseStockItemResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    id!: string;
    /** @example "660e8400-e29b-41d4-a716-446655440000" */
    goodId!: string;
    /** @example 120 */
    quantity!: number;
    /** @example "880e8400-e29b-41d4-a716-446655440000" */
    sectorId?: string;
}
