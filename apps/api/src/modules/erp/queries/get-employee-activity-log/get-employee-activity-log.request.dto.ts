import { IsDateString, IsUUID } from "class-validator";

export class GetEmployeeActivityLogParams {
    @IsUUID()
    employeeId!: string;
}

export class GetEmployeeActivityLogQueryDto {
    @IsDateString()
    dateFrom!: string;

    @IsDateString()
    dateTo!: string;
}
