import { ApiProperty } from "@nestjs/swagger";

export class PositionResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    id!: string;
    /** @example "dispatcher" */
    key!: string;
    /** @example "Dispatcher" */
    displayName!: string;
    /** @example ["hr.employees.read", "freight.routes.manage"] */
    permissionKeys!: string[];
}

export class PositionIdResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    positionId!: string;
}

export class ListPositionsResponseDto {
    @ApiProperty({ type: [PositionResponseDto] })
    positions!: PositionResponseDto[];
}
