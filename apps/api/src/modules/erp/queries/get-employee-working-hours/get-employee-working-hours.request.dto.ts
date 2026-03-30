import { IsDateString, IsUUID } from "class-validator";

export class GetEmployeeWorkingHoursParams {
    @IsUUID()
    employeeId!: string;
}

export class GetEmployeeWorkingHoursQueryDto {
    @IsDateString()
    dateFrom!: string;

    @IsDateString()
    dateTo!: string;
}
