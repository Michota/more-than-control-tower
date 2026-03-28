import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString, IsUUID, Min, ValidateNested } from "class-validator";
import { RouteStopAddressDto } from "../edit-route/edit-route.request.dto.js";

export class AddJourneyStopRequestDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    customerId!: string;

    /** @example "Sklep ABC" */
    @IsString()
    @IsNotEmpty()
    customerName!: string;

    @ValidateNested()
    @Type(() => RouteStopAddressDto)
    address!: RouteStopAddressDto;

    /** @example 0 */
    @IsNumber()
    @Min(0)
    sequence!: number;
}
