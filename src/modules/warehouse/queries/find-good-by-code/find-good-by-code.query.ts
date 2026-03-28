import { Query } from "@nestjs/cqrs";

export interface FindGoodByCodeResponse {
    goodId: string;
    goodName: string;
    codeId: string;
    codeType: string;
    codeValue: string;
}

export class FindGoodByCodeQuery extends Query<FindGoodByCodeResponse> {
    constructor(public readonly value: string) {
        super();
    }
}
