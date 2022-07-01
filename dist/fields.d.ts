export declare type Field<Property> = Property extends Promise<infer I> ? Field<NonNullable<I>> : Property extends Array<infer I> ? Field<NonNullable<I>> : Property extends Function ? never : Property extends Date ? Property | boolean : Property extends object ? Fields<Property> : Property | boolean | Property[];
export declare type Fields<T> = {
    [P in keyof T]?: Field<NonNullable<T[P]>>;
} | boolean;
//# sourceMappingURL=fields.d.ts.map