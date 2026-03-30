import { IsDateString, IsUUID } from "class-validator";

export class LockWorkingHoursRequest {
    @IsUUID()
    employeeId!: string;

    @IsDateString()
    dateFrom!: string;

    @IsDateString()
    dateTo!: string;
}
