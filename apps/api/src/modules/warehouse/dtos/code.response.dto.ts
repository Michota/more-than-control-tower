export class CodeResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    id!: string;
    /** @example "EAN_13" */
    type!: string;
    /** @example "5901234123457" */
    value!: string;
}

export class CodeIdResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    codeId!: string;
}

export class FindGoodByCodeResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    goodId!: string;
    /** @example "Coca-Cola 330ml" */
    goodName!: string;
    /** @example "660e8400-e29b-41d4-a716-446655440000" */
    codeId!: string;
    /** @example "EAN_13" */
    codeType!: string;
    /** @example "5901234123457" */
    codeValue!: string;
}
