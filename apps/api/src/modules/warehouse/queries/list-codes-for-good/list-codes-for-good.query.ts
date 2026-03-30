import { Query } from "@nestjs/cqrs";

export interface CodeListItem {
    id: string;
    type: string;
    value: string;
}

export type ListCodesForGoodResponse = CodeListItem[];

export class ListCodesForGoodQuery extends Query<ListCodesForGoodResponse> {
    constructor(public readonly goodId: string) {
        super();
    }
}
