import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";

export class EditWarehouseAddressDto {
    /** @example "PL" */
    @IsString()
    @IsOptional()
    country?: string;

    /** @example "00-001" */
    @IsString()
    @IsOptional()
    postalCode?: string;

    /** @example "Mazowieckie" */
    @IsString()
    @IsOptional()
    state?: string;

    /** @example "Warszawa" */
    @IsString()
    @IsOptional()
    city?: string;

    /** @example "Marszałkowska 1" */
    @IsString()
    @IsOptional()
    street?: string;
}

export class EditWarehouseRequestDto {
    /** @example "Main Warehouse" */
    @IsString()
    @IsOptional()
    name?: string;

    /** @example 52.2297 */
    @IsNumber()
    @IsOptional()
    @Min(-90)
    @Max(90)
    latitude?: number;

    /** @example 21.0122 */
    @IsNumber()
    @IsOptional()
    @Min(-180)
    @Max(180)
    longitude?: number;

    @ValidateNested()
    @IsOptional()
    @Type(() => EditWarehouseAddressDto)
    address?: EditWarehouseAddressDto;
}
