import { Fields } from './fields';
import { Order } from './order';
import { Search } from './search-operators';
export interface PaginatedSearch<T> {
    page?: number;
    pageSize?: number;
    order?: Order<T>;
    fields?: Fields<T>;
    search?: Search<T>;
}
//# sourceMappingURL=paginated-search.d.ts.map