import { ApiProperty } from "@nestjs/swagger";
import { SystemUserRole } from "../domain/system-user-role.enum.js";
import { SystemUserStatus } from "../domain/system-user-status.enum.js";

export class SystemUserResponseDto {
    /** @example "a0000000-0000-0000-0000-000000000001" */
    id!: string;

    /** @example "admin@example.com" */
    email!: string;

    /** @example "Jan" */
    firstName!: string;

    /** @example "Kowalski" */
    lastName!: string;

    @ApiProperty({ enum: SystemUserRole, isArray: true, example: [SystemUserRole.USER] })
    roles!: string[];

    @ApiProperty({ enum: SystemUserStatus, example: SystemUserStatus.ACTIVATED })
    status!: string;
}

export class SystemUserIdResponseDto {
    /** @example "a0000000-0000-0000-0000-000000000001" */
    userId!: string;
}

export class SystemUserListResponseDto {
    @ApiProperty({ type: [SystemUserResponseDto] })
    data!: SystemUserResponseDto[];

    /** @example 42 */
    count!: number;

    /** @example 1 */
    page!: number;

    /** @example 20 */
    limit!: number;
}
