import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { DimensionUnit } from "../../domain/good-dimensions.value-object.js";
import { SectorCapability } from "../../domain/sector-capability.enum.js";

export class EditSectorRequestDto {
    /** @example "Cold Storage Zone B" */
    @IsString()
    @IsOptional()
    name?: string;

    /** @example "Updated description" */
    @IsString()
    @IsOptional()
    description?: string;

    /** @example 12 */
    @IsNumber()
    @IsOptional()
    @Min(0)
    dimensionLength?: number;

    /** @example 10 */
    @IsNumber()
    @IsOptional()
    @Min(0)
    dimensionWidth?: number;

    /** @example 5 */
    @IsNumber()
    @IsOptional()
    @Min(0)
    dimensionHeight?: number;

    /** @example "m" */
    @IsEnum(DimensionUnit)
    @IsOptional()
    dimensionUnit?: DimensionUnit;

    /** @example ["COLD_STORAGE", "FRAGILE"] */
    @IsArray()
    @IsEnum(SectorCapability, { each: true })
    @IsOptional()
    capabilities?: SectorCapability[];
}
