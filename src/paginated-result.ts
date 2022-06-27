export interface PaginatedResult<T> {
	page?: number;
	pageSize?: number;
	totalCount?: number;
	items?: T[];
}
