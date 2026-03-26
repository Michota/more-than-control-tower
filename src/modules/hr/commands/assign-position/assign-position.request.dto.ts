import { Type } from "class-transformer";
import { IsArray, IsString, ValidateNested } from "class-validator";

export class QualificationRequestDto {
    @IsString()
    key!: string;

    @IsString()
    type!: string;

    @IsString()
    value!: string;
}

export class AssignPositionRequest {
    @IsString()
    positionKey!: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QualificationRequestDto)
    qualifications!: QualificationRequestDto[];
}
