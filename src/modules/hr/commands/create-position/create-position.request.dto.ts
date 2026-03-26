import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, ValidateNested } from "class-validator";
import type { QualificationValueType } from "../../../../shared/positions/position.types.js";

export class QualificationSchemaEntryDto {
    @IsString()
    key!: string;

    @IsIn(["STRING", "NUMBER", "STRING_ARRAY"])
    type!: QualificationValueType;

    @IsString()
    description!: string;

    @IsOptional()
    @IsBoolean()
    required?: boolean;
}

export class CreatePositionRequest {
    @IsString()
    key!: string;

    @IsString()
    displayName!: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QualificationSchemaEntryDto)
    qualificationSchema!: QualificationSchemaEntryDto[];

    @IsArray()
    @IsString({ each: true })
    permissionKeys!: string[];
}
