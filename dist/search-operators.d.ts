import { RequireExactlyOne } from 'type-fest';
interface Operator<T> {
    equal: T | T[];
    like: T | T[];
    greater: T;
    lesser: T;
    between: {
        start: T;
        end: T;
    };
}
export declare type FindOperator<Property> = {
    not?: boolean;
} & RequireExactlyOne<Operator<Property>>;
export declare type Where<Property> = Property extends Promise<infer I> ? Where<NonNullable<I>> : Property extends Array<infer I> ? Where<NonNullable<I>> : Property extends Function ? never : Property extends Date ? Property | FindOperator<Property> : Property extends object ? Search<Property> | Search<Property>[] | FindOperator<any> | boolean : Property | FindOperator<Property> | Property[];
export declare type Search<Entity> = {
    [P in keyof Entity]?: Where<NonNullable<Entity[P]>>;
};
export {};
//# sourceMappingURL=search-operators.d.ts.map