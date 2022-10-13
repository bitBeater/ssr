import { PaginatedResult } from './paginated-result';
import { PaginatedSearch } from './paginated-search';
import { Search } from './search-operators';



/**
 * create or update one or more entities
 * @param e
 */
export type ssrSaveFn<T> = (e: T[]) => Promise<T[]>;

/**
 * perform a paginated and ordered search on entities
 * if search is not provided, all entities are returned
 * @param search
 */
export type ssrSearchFn<T> = (search?: PaginatedSearch<T>) => Promise<PaginatedResult<T>>;

/**
 * delete entities matching the search parameters
 * @param search
 **/
export type ssrRemoveFn<T> = (search: Search<T>) => Promise<T[]>;


export interface SSR<T> {
	/**
	 * create or update one or more entities
	 * @param e
	 */
	save: ssrSaveFn<T>;

	/**
	 * perform a paginated and ordered search on entities
	 * if search is not provided, all entities are returned
	 * @param search
	 */
	search: ssrSearchFn<T>;

	/**
	 * delete entities matching the search parameters
	 * @param search
	 **/
	remove: ssrRemoveFn<T>;
}
