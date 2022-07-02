export declare type OrderDirection = 'ASC' | 'DESC';
export declare type OrderField<Property> = Property extends Promise<infer I> ? OrderField<NonNullable<I>> : Property extends Array<infer I> ? OrderField<NonNullable<I>> : Property extends Function ? never : Property extends Date ? Property | OrderDirection : Property extends object ? Order<Property> : Property | OrderDirection;
export declare type Order<T> = {
    [P in keyof T]?: OrderField<NonNullable<T[P]>>;
};
//# sourceMappingURL=order.d.ts.map