import { ApiProperty } from "@nestjs/swagger";

export class RouteScheduleResponseDto {
    /** @example "DAYS_OF_WEEK" */
    type!: string;
    /** @example [1, 3, 5] */
    daysOfWeek?: number[];
    /** @example [1, 15] */
    daysOfMonth?: number[];
    /** @example ["2026-04-01", "2026-04-15"] */
    specificDates?: string[];
}

export class RouteResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    id!: string;
    /** @example "Route North" */
    name!: string;
    /** @example "ACTIVE" */
    status!: string;
    /** @example ["550e8400-e29b-41d4-a716-446655440000"] */
    vehicleIds!: string[];
    /** @example ["550e8400-e29b-41d4-a716-446655440000"] */
    representativeIds!: string[];
    /** @example ["550e8400-e29b-41d4-a716-446655440000"] */
    visitPointIds!: string[];

    @ApiProperty({ type: RouteScheduleResponseDto, required: false })
    schedule?: RouteScheduleResponseDto;
}

export class RouteIdResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    routeId!: string;
}
