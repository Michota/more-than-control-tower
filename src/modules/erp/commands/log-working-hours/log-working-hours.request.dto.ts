import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";

export class LogWorkingHoursRequest {
    @IsUUID()
    employeeId!: string;

    @IsDateString()
    date!: string;

    @IsNumber()
    @Min(0.01)
    @Max(24)
    hours!: number;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    note?: string;

    @IsOptional()
    @IsUUID()
    activityId?: string;
}
