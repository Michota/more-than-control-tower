import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { CodeType } from "../../domain/code-type.enum.js";

export class AttachCodeToGoodRequestDto {
    /** @example "EAN_13" */
    @IsEnum(CodeType)
    type!: CodeType;

    /** @example "5901234123457" */
    @IsString()
    @IsNotEmpty()
    value!: string;
}
