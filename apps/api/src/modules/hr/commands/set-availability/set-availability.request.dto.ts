import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsString, Matches, ValidateNested } from "class-validator";

export class AvailabilityEntryDto {
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "date must be YYYY-MM-DD" })
    date!: string;

    @IsString()
    @Matches(/^\d{2}:\d{2}$/, { message: "startTime must be HH:mm" })
    startTime!: string;

    @IsString()
    @Matches(/^\d{2}:\d{2}$/, { message: "endTime must be HH:mm" })
    endTime!: string;
}

export class SetAvailabilityRequest {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => AvailabilityEntryDto)
    entries!: AvailabilityEntryDto[];
}
