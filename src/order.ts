export type OrderDirection = 'ASC' | 'DESC';

export type OrderField<Property> = Property extends Promise<infer I>
	? OrderField<NonNullable<I>>
	: Property extends Array<infer I>
	? OrderField<NonNullable<I>>
	: Property extends Function
	? never
	: Property extends Date
	? Property | OrderDirection
	: Property extends object
	? Order<Property> //| Search<Property>[]
	: Property | OrderDirection | Property[];

export type Order<T> = {
	[P in keyof T]?: OrderField<NonNullable<T[P]>>;
};

//export type Order<T> = Schema<PartialDeep<T>, OrderDirection>;
