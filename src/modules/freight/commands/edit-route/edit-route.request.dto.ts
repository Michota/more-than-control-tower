import { Type } from "class-transformer";
import {
    IsArray,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
    ValidateNested,
} from "class-validator";
import { ScheduleType } from "../../domain/route-schedule.value-object.js";

export class RouteScheduleDto {
    /** @example "DAYS_OF_WEEK" */
    @IsEnum(ScheduleType)
    type!: ScheduleType;

    /** @example [1, 3, 5] */
    @IsArray()
    @IsNumber({}, { each: true })
    @Min(0, { each: true })
    @Max(6, { each: true })
    @IsOptional()
    daysOfWeek?: number[];

    /** @example [1, 15] */
    @IsArray()
    @IsNumber({}, { each: true })
    @Min(1, { each: true })
    @Max(31, { each: true })
    @IsOptional()
    daysOfMonth?: number[];

    /** @example ["2026-04-01", "2026-04-15"] */
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    specificDates?: string[];
}

export class EditRouteRequestDto {
    /** @example "Route North" */
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name?: string;

    @IsArray()
    @IsUUID("all", { each: true })
    @IsOptional()
    vehicleIds?: string[];

    @IsArray()
    @IsUUID("all", { each: true })
    @IsOptional()
    representativeIds?: string[];

    @IsArray()
    @IsUUID("all", { each: true })
    @IsOptional()
    visitPointIds?: string[];

    @ValidateNested()
    @Type(() => RouteScheduleDto)
    @IsOptional()
    schedule?: RouteScheduleDto;
}
