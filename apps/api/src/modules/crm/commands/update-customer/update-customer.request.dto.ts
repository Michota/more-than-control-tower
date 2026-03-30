import { Type } from "class-transformer";
import { IsArray, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { ContactType } from "../../domain/customer-contact-type.enum.js";

export class UpdateCustomerAddressRequestDto {
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

export class UpdateCustomerContactRequestDto {
    @IsOptional()
    @IsUUID()
    id?: string;

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

export class UpdateCustomerRequest {
    @IsOptional()
    @IsString()
    name?: string;

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

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateCustomerAddressRequestDto)
    addresses?: UpdateCustomerAddressRequestDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateCustomerContactRequestDto)
    contacts?: UpdateCustomerContactRequestDto[];
}
