import { Fields } from './fields';
import { Order } from './order';
import { Search } from './search-operators';

/**
 * describes a paginated and ordered search.
 * if page is not provided, defau
 *
 */
export interface PaginatedSearch<T> {
	/**
	 * @default 0
	 */
	page?: number;

	/**
	 * if not provided returns all entities til the end
	 */
	pageSize?: number;

	order?: Order<T>;

	/**
	 *  list of fields to return, if empty or null return all.
	 * */
	fields?: Fields<T>;

	/**
	 * if not provided returns all entities
	 */
	search?: Search<T>;
}
