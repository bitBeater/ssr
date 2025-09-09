import { ScalarValue } from './misc';
export type OrderDirection = 'ASC' | 'DESC';
export type OrderStrategy = {
    direction: OrderDirection;
    nulls?: 'FIRST' | 'LAST';
    priority?: number;
};
export type OrderField<FieldType> = FieldType extends ScalarValue ? OrderStrategy : FieldType extends Function ? never : FieldType extends Array<infer ArrayType> ? OrderField<ArrayType> : FieldType extends object ? Order<FieldType> : never;
export type Order<T> = {
    [P in keyof T]?: OrderField<NonNullable<T[P]>>;
};
//# sourceMappingURL=order.d.ts.map