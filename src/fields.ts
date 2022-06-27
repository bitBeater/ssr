export type Field<Property> = Property extends Promise<infer I>
	? Field<NonNullable<I>>
	: Property extends Array<infer I>
	? Field<NonNullable<I>>
	: Property extends Function
	? never
	: Property extends Date
	? boolean
	: Property extends object
	? Fields<Property> | boolean
	: boolean;

export type Fields<T> = {
	[P in keyof T]?: Field<NonNullable<T[P]>>;
};
