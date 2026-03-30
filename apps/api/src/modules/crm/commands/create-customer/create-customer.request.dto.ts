import { Type } from "class-transformer";
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { ContactType } from "../../domain/customer-contact-type.enum.js";
import { CustomerType } from "../../domain/customer-type.enum.js";

export class CustomerAddressRequestDto {
    @IsOptional()
    @IsString()
    label?: string;

    @IsOptional()
    @IsString()
    note?: string;

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

    @IsOptional()
    @IsString()
    note?: string;

    @IsOptional()
    @IsString()
    customLabel?: string;

    @IsString()
    value!: string;
}

export class CreateCustomerRequest {
    @IsString()
    name!: string;

    @IsEnum(CustomerType)
    customerType!: CustomerType;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    note?: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    companyName?: string;

    @IsOptional()
    @IsString()
    nip?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CustomerAddressRequestDto)
    addresses!: CustomerAddressRequestDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CustomerContactRequestDto)
    contacts!: CustomerContactRequestDto[];
}
