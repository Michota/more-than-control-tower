import { IsOptional, IsString } from "class-validator";
import { PaginatedQueryRequestDto } from "../../../../libs/dtos/paginated-query.request.dto.js";

export class ListGoodsRequestDto extends PaginatedQueryRequestDto {
    @IsString()
    @IsOptional()
    name?: string;
}
