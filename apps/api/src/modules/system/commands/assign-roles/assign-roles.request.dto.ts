import { IsArray, IsEnum } from "class-validator";
import { SystemUserRole } from "../../domain/system-user-role.enum.js";

export class AssignRolesRequest {
    @IsArray()
    @IsEnum(SystemUserRole, { each: true })
    roles!: SystemUserRole[];
}
