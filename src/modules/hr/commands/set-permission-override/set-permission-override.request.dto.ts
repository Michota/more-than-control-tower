import { IsEnum, IsOptional, IsString } from "class-validator";
import { PermissionOverrideState } from "../../domain/permission-override-state.enum.js";

export class SetPermissionOverrideRequest {
    @IsString()
    permissionKey!: string;

    @IsOptional()
    @IsEnum(PermissionOverrideState)
    state?: PermissionOverrideState;
}
