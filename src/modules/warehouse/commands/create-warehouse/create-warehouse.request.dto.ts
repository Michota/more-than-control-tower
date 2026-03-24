import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString, Max, Min, ValidateNested } from "class-validator";

export class CreateWarehouseAddressDto {
    @IsString()
    @IsNotEmpty()
    country!: string;

    @IsString()
    @IsNotEmpty()
    postalCode!: string;

    @IsString()
    @IsNotEmpty()
    state!: string;

    @IsString()
    @IsNotEmpty()
    city!: string;

    @IsString()
    @IsNotEmpty()
    street!: string;
}

export class CreateWarehouseRequestDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude!: number;

    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude!: number;

    @ValidateNested()
    @Type(() => CreateWarehouseAddressDto)
    address!: CreateWarehouseAddressDto;
}
