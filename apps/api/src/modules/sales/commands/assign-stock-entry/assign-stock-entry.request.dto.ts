import { IsUUID } from "class-validator";

export class AssignStockEntryParams {
    @IsUUID()
    id!: string;

    @IsUUID()
    productId!: string;
}

export class AssignStockEntryBody {
    @IsUUID()
    stockEntryId!: string;
}
