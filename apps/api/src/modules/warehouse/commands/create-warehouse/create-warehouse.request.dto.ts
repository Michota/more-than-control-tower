import { Type } from "class-transformer";
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
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

    @ValidateNested()
    @Type(() => CreateWarehouseAddressDto)
    address!: CreateWarehouseAddressDto;

    /** @example "REGULAR" */
    @IsEnum(WarehouseType)
    @IsOptional()
    type?: WarehouseType;
}
