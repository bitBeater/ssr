import { PartialDeep, Schema } from 'type-fest';

export type Fields<T> = Schema<PartialDeep<T>, boolean | T> | boolean;
