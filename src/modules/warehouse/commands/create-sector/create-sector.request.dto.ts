import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { DimensionUnit } from "../../domain/good-dimensions.value-object.js";
import { SectorCapability } from "../../domain/sector-capability.enum.js";

export class CreateSectorRequestDto {
    /** @example "Cold Storage Zone A" */
    @IsString()
    @IsNotEmpty()
    name!: string;

    /** @example "Refrigerated sector for perishable goods" */
    @IsString()
    @IsOptional()
    description?: string;

    /** @example 10 */
    @IsNumber()
    @Min(0)
    dimensionLength!: number;

    /** @example 8 */
    @IsNumber()
    @Min(0)
    dimensionWidth!: number;

    /** @example 4 */
    @IsNumber()
    @Min(0)
    dimensionHeight!: number;

    /** @example "m" */
    @IsEnum(DimensionUnit)
    dimensionUnit!: DimensionUnit;

    /** @example ["COLD_STORAGE"] */
    @IsArray()
    @IsEnum(SectorCapability, { each: true })
    capabilities!: SectorCapability[];
}
