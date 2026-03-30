import { Type } from "class-transformer";
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { PermissionOverrideState } from "../../domain/permission-override-state.enum.js";

export class PermissionOverrideEntryDto {
    @IsString()
    permissionKey!: string;

    @IsOptional()
    @IsEnum(PermissionOverrideState)
    state?: PermissionOverrideState;
}

export class SetPermissionOverrideRequest {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PermissionOverrideEntryDto)
    overrides!: PermissionOverrideEntryDto[];
}
