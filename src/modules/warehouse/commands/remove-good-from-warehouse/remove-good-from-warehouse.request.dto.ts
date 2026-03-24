import { IsEnum, IsOptional, IsString } from "class-validator";
import { GoodRemovalReason } from "../../domain/good-removal-reason.enum.js";

export class RemoveGoodFromWarehouseRequestDto {
    @IsEnum(GoodRemovalReason)
    reason!: GoodRemovalReason;

    @IsString()
    @IsOptional()
    note?: string;
}
