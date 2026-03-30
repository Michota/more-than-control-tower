import { Transform } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";

export class PaginatedQueryRequestDto {
    @IsInt()
    @Min(1)
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    page?: number = 1;

    @IsInt()
    @Min(1)
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    limit?: number = 20;
}
