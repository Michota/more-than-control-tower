import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { DriverLicenseCategory } from "../../domain/driver-license-category.enum.js";
import { VehicleAttributeDto } from "../create-vehicle/create-vehicle.request.dto.js";

export class EditVehicleRequestDto {
    /** @example "Truck A" */
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name?: string;

    /** @example "C" */
    @IsEnum(DriverLicenseCategory)
    @IsOptional()
    requiredLicenseCategory?: DriverLicenseCategory;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VehicleAttributeDto)
    @IsOptional()
    attributes?: VehicleAttributeDto[];

    /** @example "WBA3A5C55CF256789" */
    @IsString()
    @IsOptional()
    vin?: string;

    /** @example "WZ 12345" */
    @IsString()
    @IsOptional()
    licensePlate?: string;

    /** @example "Updated note" */
    @IsString()
    @IsOptional()
    note?: string;

    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    @IsOptional()
    warehouseId?: string;
}
