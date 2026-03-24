import { ApiProperty } from "@nestjs/swagger";

export class AddressResponseDto {
    /** @example "PL" */
    country!: string;
    /** @example "00-001" */
    postalCode!: string;
    /** @example "Mazowieckie" */
    state!: string;
    /** @example "Warszawa" */
    city!: string;
    /** @example "Marszałkowska 1" */
    street!: string;
}

export class WarehouseResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    id!: string;
    /** @example "Main Warehouse" */
    name!: string;
    /** @example "ACTIVE" */
    status!: string;
    /** @example "REGULAR" */
    type!: string;
    /** @example 52.2297 */
    latitude!: number;
    /** @example 21.0122 */
    longitude!: number;

    @ApiProperty({ type: AddressResponseDto })
    address!: AddressResponseDto;
}

export class WarehouseIdResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    warehouseId!: string;
}
