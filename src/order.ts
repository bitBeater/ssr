export type OrderDirection = 'ASC' | 'DESC';

export type Field<Property> = Property extends Promise<infer I>
	? Field<NonNullable<I>>
	: Property extends Array<infer I>
	? Field<NonNullable<I>>
	: Property extends Function
	? never
	: Property extends Date
	? Property | OrderDirection
	: Property extends object
	? Order<Property> //| Search<Property>[]
	: Property | OrderDirection | Property[];

export type Order<T> = {
	[P in keyof T]?: Field<NonNullable<T[P]>>;
};

//export type Order<T> = Schema<PartialDeep<T>, OrderDirection>;
