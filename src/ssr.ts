import { PaginatedResult } from './paginated-result';
import { PaginatedSearch } from './paginated-search';
import { Search } from './search-operators';

export interface SSR<T> {
	/**
	 * create or update one or more entities
	 * @param e
	 */
	save(...e: T[]): Promise<T[]>;

	/**
	 * perform a paginated and ordered search on entities
	 * if search is not provided, all entities are returned
	 * @param search
	 */
	search(search?: PaginatedSearch<T>): Promise<PaginatedResult<T>>;

	/**
	 * delete entities matching the search parameters
	 * @param search
	 **/
	remove(search: Search<T>): Promise<T[]>;
}
