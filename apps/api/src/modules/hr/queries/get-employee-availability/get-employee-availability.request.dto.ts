import { IsOptional, IsString, Matches } from "class-validator";

export class GetEmployeeAvailabilityRequestDto {
    @IsOptional()
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "fromDate must be YYYY-MM-DD" })
    fromDate?: string;

    @IsOptional()
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "toDate must be YYYY-MM-DD" })
    toDate?: string;
}
