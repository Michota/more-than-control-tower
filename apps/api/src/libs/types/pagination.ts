export interface PaginationParameters {
    page: number;
    limit: number;
}

export interface OffsetPaginationParameters extends PaginationParameters {
    offset: number;
}
