import { Type } from "class-transformer";
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { ContactType } from "../../domain/customer-contact-type.enum.js";

export class CustomerAddressRequestDto {
    @IsOptional()
    @IsString()
    label?: string;

    @IsString()
    country!: string;

    @IsString()
    state!: string;

    @IsString()
    city!: string;

    @IsString()
    postalCode!: string;

    @IsString()
    street!: string;
}

export class CustomerContactRequestDto {
    @IsEnum(ContactType)
    type!: ContactType;

    @IsString()
    title!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    value!: string;
}

export class CreateCustomerRequest {
    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CustomerAddressRequestDto)
    addresses!: CustomerAddressRequestDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CustomerContactRequestDto)
    contacts!: CustomerContactRequestDto[];
}
