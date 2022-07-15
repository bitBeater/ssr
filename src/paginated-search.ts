import { Fields } from './fields';
import { Order } from './order';
import { Search } from './search-operators';

export interface PaginatedSearch<T> {
	page?: number;
	pageSize?: number;
	order?: Order<T>;

	/**  list of fields to return, if empty or null return all. */
	fields?: Fields<T>;

	search?: Search<T>;
}
