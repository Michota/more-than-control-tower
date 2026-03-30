import { Type } from "class-transformer";
import { IsOptional, IsString, ValidateNested } from "class-validator";

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

    @ValidateNested()
    @IsOptional()
    @Type(() => EditWarehouseAddressDto)
    address?: EditWarehouseAddressDto;
}
