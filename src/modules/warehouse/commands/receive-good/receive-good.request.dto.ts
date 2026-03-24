import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";
import { DimensionUnit } from "../../domain/good-dimensions.value-object.js";
import { WeightUnit } from "../../domain/good-weight.value-object.js";

export class ReceiveGoodRequestDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsPositive()
    weightValue!: number;

    @IsEnum(WeightUnit)
    weightUnit!: WeightUnit;

    @IsNumber()
    @IsPositive()
    dimensionLength!: number;

    @IsNumber()
    @IsPositive()
    dimensionWidth!: number;

    @IsNumber()
    @IsPositive()
    dimensionHeight!: number;

    @IsEnum(DimensionUnit)
    dimensionUnit!: DimensionUnit;

    @IsUUID()
    warehouseId!: string;

    @IsString()
    @IsNotEmpty()
    locationDescription!: string;

    @IsString()
    @IsOptional()
    note?: string;
}
