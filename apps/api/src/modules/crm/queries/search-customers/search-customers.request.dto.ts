import { Transform } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";

export class SearchCustomersRequestDto {
    @IsString()
    query!: string;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === "true")
    alsoSearchByDescription?: boolean;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === "true")
    alsoSearchByAddress?: boolean;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === "true")
    alsoSearchByEmail?: boolean;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === "true")
    alsoSearchByPhone?: boolean;

    @IsInt()
    @Min(1)
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    page?: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    limit?: number;
}
