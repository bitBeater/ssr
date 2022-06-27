export declare type OrderDirection = 'ASC' | 'DESC';
export declare type Field<Property> = Property extends Promise<infer I> ? Field<NonNullable<I>> : Property extends Array<infer I> ? Field<NonNullable<I>> : Property extends Function ? never : Property extends Date ? Property | OrderDirection : Property extends object ? Order<Property> : Property | OrderDirection | Property[];
export declare type Order<T> = {
    [P in keyof T]?: Field<NonNullable<T[P]>>;
};
//# sourceMappingURL=order.d.ts.map