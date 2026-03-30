import { ArrayMinSize, IsArray, IsString, Matches } from "class-validator";

export class LockAvailabilityRequest {
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { each: true, message: "Each date must be YYYY-MM-DD" })
    dates!: string[];
}
