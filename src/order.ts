import { PartialDeep, Schema } from 'type-fest';

export type OrderDirection = 'ASC' | 'DESC';

export type Order<T> = Schema<PartialDeep<T>, OrderDirection>;
