import { IsUUID } from "class-validator";

export class AssignGoodParams {
    @IsUUID()
    id!: string;

    @IsUUID()
    productId!: string;
}

export class AssignGoodBody {
    @IsUUID()
    goodId!: string;
}
