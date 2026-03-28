export class JourneyResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    id!: string;
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    routeId!: string;
    /** @example "Route North" */
    routeName!: string;
    /** @example "PLANNED" */
    status!: string;
    /** @example "2026-04-01" */
    scheduledDate!: string;
    /** @example ["550e8400-e29b-41d4-a716-446655440000"] */
    vehicleIds!: string[];
    crewMembers!: { employeeId: string; employeeName: string; role: string }[];
    /** @example ["550e8400-e29b-41d4-a716-446655440000"] */
    visitPointIds!: string[];
}

export class JourneyIdResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    journeyId!: string;
}
