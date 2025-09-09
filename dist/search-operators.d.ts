import { RequireExactlyOne } from 'type-fest';
import { ScalarValue } from './misc';
interface Operator<T> {
    equal: T | T[];
    like: T;
    greater: T;
    lesser: T;
    between: {
        start: T;
        end: T;
    };
}
export type Find<Property> = {
    not?: boolean;
} & RequireExactlyOne<Operator<Property>>;
export type Where<FieldType> = FieldType extends ScalarValue ? Find<FieldType> | FieldType : FieldType extends Function ? never : FieldType extends Array<infer ArrayType> ? Where<ArrayType> : FieldType extends object ? Search<FieldType> : never;
export type Search<Entity> = {
    [P in keyof Entity]?: Where<NonNullable<Entity[P]>>;
};
export {};
//# sourceMappingURL=search-operators.d.ts.map