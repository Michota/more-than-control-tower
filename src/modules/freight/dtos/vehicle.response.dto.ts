import { ApiProperty } from "@nestjs/swagger";

export class VehicleAttributeResponseDto {
    /** @example "has-fridge" */
    name!: string;
    /** @example "true" */
    value!: string;
}

export class VehicleResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    id!: string;
    /** @example "Truck A" */
    name!: string;
    /** @example "ACTIVE" */
    status!: string;
    /** @example "C" */
    requiredLicenseCategory!: string;

    @ApiProperty({ type: [VehicleAttributeResponseDto] })
    attributes!: VehicleAttributeResponseDto[];

    /** @example "WBA3A5C55CF256789" */
    vin?: string;
    /** @example "WZ 12345" */
    licensePlate?: string;
    /** @example "Main delivery truck" */
    note?: string;
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    warehouseId?: string;
}

export class VehicleIdResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    vehicleId!: string;
}
