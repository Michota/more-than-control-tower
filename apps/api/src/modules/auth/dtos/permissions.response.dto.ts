import { ApiProperty } from "@nestjs/swagger";

export class PermissionsResponseDto {
    @ApiProperty({ type: [String], example: ["warehouse:view-goods", "sales:draft-order"] })
    permissions!: string[];
}
