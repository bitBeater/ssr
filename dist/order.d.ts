import { ScalarValue } from './misc';
export declare enum OrderDirection {
    ASC = "ASC",
    DESC = "DESC"
}
export type OrderStrategy = {
    direction: OrderDirection;
    nulls?: 'FIRST' | 'LAST';
    priority?: number;
};
export type OrderField<FieldType> = FieldType extends ScalarValue ? OrderStrategy : FieldType extends Function ? never : FieldType extends Array<infer ArrayType> ? OrderField<ArrayType> : FieldType extends object ? Order<FieldType> : never;
export type Order<T> = {
    [P in keyof T]?: OrderField<NonNullable<T[P]>>;
};
export declare function isOrderStrategy(obj: unknown): obj is OrderStrategy;
//# sourceMappingURL=order.d.ts.map