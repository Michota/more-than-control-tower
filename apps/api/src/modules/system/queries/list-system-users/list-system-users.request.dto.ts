import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class ListSystemUsersRequestDto {
    @IsOptional()
    @IsString()
    query?: string;

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
