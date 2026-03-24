import { Type } from "class-transformer";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";
import { WarehouseType } from "../../domain/warehouse-type.enum.js";

export class CreateWarehouseAddressDto {
    /** @example "PL" */
    @IsString()
    @IsNotEmpty()
    country!: string;

    /** @example "00-001" */
    @IsString()
    @IsNotEmpty()
    postalCode!: string;

    /** @example "Mazowieckie" */
    @IsString()
    @IsNotEmpty()
    state!: string;

    /** @example "Warszawa" */
    @IsString()
    @IsNotEmpty()
    city!: string;

    /** @example "Marszałkowska 1" */
    @IsString()
    @IsNotEmpty()
    street!: string;
}

export class CreateWarehouseRequestDto {
    /** @example "Main Warehouse" */
    @IsString()
    @IsNotEmpty()
    name!: string;

    /** @example 52.2297 */
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude!: number;

    /** @example 21.0122 */
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude!: number;

    @ValidateNested()
    @Type(() => CreateWarehouseAddressDto)
    address!: CreateWarehouseAddressDto;

    /** @example "REGULAR" */
    @IsEnum(WarehouseType)
    @IsOptional()
    type?: WarehouseType;
}
