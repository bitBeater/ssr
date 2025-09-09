import { PaginatedResult } from './paginated-result';
import { PaginatedSearch } from './paginated-search';
import { Search } from './search-operators';



/**
 * create or update one or more entities
 * @param e
 */
export type SaveFn<T> = (e: T[]) => Promise<T[]>;

/**
 * perform a paginated and ordered search on entities
 * if search is not provided, all entities are returned
 * @param search
 */
export type SearchFn<T> = (search?: PaginatedSearch<T>) => Promise<PaginatedResult<T>>;

/**
 * delete entities matching the search parameters
 * @param search
 **/
export type RemoveFn<T> = (search: Search<T>) => Promise<T[]>;


export interface Repository<T> {
	/**
	 * create or update one or more entities
	 * @param e
	 */
	save: SaveFn<T>;

	/**
	 * perform a paginated and ordered search on entities
	 * if search is not provided, all entities are returned
	 * @param search
	 */
	search: SearchFn<T>;

	/**
	 * delete entities matching the search parameters
	 * @param search
	 **/
	remove: RemoveFn<T>;
}