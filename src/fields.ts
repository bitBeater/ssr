//export type Fields<T> = Schema<PartialDeep<T>, boolean> | boolean;

export type Field<Property> = Property extends Promise<infer I>
	? Field<NonNullable<I>>
	: Property extends Array<infer I>
	? Field<NonNullable<I>>
	: Property extends Function
	? never
	: Property extends Date
	? Property | boolean
	: Property extends object
	? Fields<Property> //| Search<Property>[]
	: Property | boolean | Property[];

export type Fields<T> =
	| {
			[P in keyof T]?: Field<NonNullable<T[P]>>;
	  }
	| boolean;
