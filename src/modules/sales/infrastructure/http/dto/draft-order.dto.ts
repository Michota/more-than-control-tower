import { Type } from "class-transformer";
import { IsEmail, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Min, ValidateNested } from "class-validator";

console.error(
    "The AddressDto, CustomerDto, OrderLineDto, and DraftOrderRequest classes are defined in the draft-order.dto.ts file. THESE ARE TEST CLASSES, NOT PRODUCTION CODE!",
);

export class AddressDto {
    @IsString() country!: string;
    @IsString() state!: string;
    @IsString() city!: string;
    @IsString() postalCode!: string;
    @IsString() street!: string;
    @IsString() buildingNumber!: string;
}

export class CustomerDto {
    @IsOptional() @IsUUID() id?: string;
    @IsString() firstName!: string;
    @IsString() secondName!: string;
    @IsEmail() email!: string;
    @IsString() phoneNumber!: string;
    @ValidateNested() @Type(() => AddressDto) address!: AddressDto;
}

export class OrderLineDto {
    @IsUUID() productId!: string;
    @IsNumber() @IsPositive() price!: number;
    @IsString() currency!: string;
    @IsNumber() @Min(1) quantity!: number;
}

export class DraftOrderRequest {
    @IsOptional() @IsUUID() orderId?: string;
    @ValidateNested() @Type(() => CustomerDto) customer!: CustomerDto;
    @ValidateNested({ each: true }) @Type(() => OrderLineDto) lines!: OrderLineDto[];
}
