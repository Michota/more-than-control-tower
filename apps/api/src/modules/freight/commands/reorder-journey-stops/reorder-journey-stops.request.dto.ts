import { Type } from "class-transformer";
import { IsArray, IsNumber, IsUUID, Min, ValidateNested } from "class-validator";

export class StopSequenceDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    customerId!: string;

    /** @example 0 */
    @IsNumber()
    @Min(0)
    sequence!: number;
}

export class ReorderJourneyStopsRequestDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StopSequenceDto)
    stopSequences!: StopSequenceDto[];
}
