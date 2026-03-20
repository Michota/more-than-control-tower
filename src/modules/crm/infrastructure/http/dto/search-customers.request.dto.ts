import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";

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
}
