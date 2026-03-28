import { IsNotEmpty, IsString } from "class-validator";

export class RejectStockTransferRequestDto {
    /** @example "Insufficient stock available" */
    @IsString()
    @IsNotEmpty()
    reason!: string;
}
