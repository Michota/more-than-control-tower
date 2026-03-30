import { IsOptional, IsString } from "class-validator";
import { PaginatedQueryRequestDto } from "../../../../libs/dtos/paginated-query.request.dto.js";

export class ListEmployeesRequestDto extends PaginatedQueryRequestDto {
    @IsOptional()
    @IsString()
    positionKey?: string;

    @IsOptional()
    @IsString()
    status?: string;
}
