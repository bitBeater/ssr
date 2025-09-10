import { ScalarValue } from './misc';
export interface EqualOperator<T> {
    equal: T | T[];
}
export interface LikeOperator<T> {
    like: T | T[];
}
export type RangeOperator<T> = {
    greater: T;
    lesser: T;
} | {
    greater: T;
} | {
    lesser: T;
};
export type Operator<T> = EqualOperator<T> | LikeOperator<T> | RangeOperator<T>;
export type Find<Property> = {
    not?: boolean;
} & Operator<Property>;
export type Where<FieldType> = FieldType extends ScalarValue ? Find<FieldType> | FieldType : FieldType extends Function ? never : FieldType extends Array<infer ArrayType> ? Where<ArrayType> : FieldType extends object ? Search<FieldType> : never;
export type Search<Entity> = {
    [P in keyof Entity]?: Where<NonNullable<Entity[P]>>;
};
export declare function isOperator<T>(operator: unknown): operator is Operator<T>;
export declare function isEqualOperator<T>(operator: Operator<T>): operator is EqualOperator<T>;
export declare function isLikeOperator<T>(operator: Operator<T>): operator is LikeOperator<T>;
export declare function isRangeOperator<T>(operator: Operator<T>): operator is RangeOperator<T>;
//# sourceMappingURL=search-operators.d.ts.map