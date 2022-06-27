import { RequireExactlyOne } from 'type-fest';
interface Operator<T> {
	equal: T | T[];
	like: T | T[];
	greater: T;
	lesser: T;
	between: { start: T; end: T };
}

export type FindOperator<Property> = { not?: boolean } & RequireExactlyOne<Operator<Property>>;

export type FindOptionsWhereProperty<Property> = Property extends Promise<infer I>
	? FindOptionsWhereProperty<NonNullable<I>>
	: Property extends Array<infer I>
	? FindOptionsWhereProperty<NonNullable<I>>
	: Property extends Function
	? never
	: Property extends Date
	? Property | FindOperator<Property>
	: Property extends object
	? Search<Property> | Search<Property>[] | FindOperator<any> | boolean
	: Property | FindOperator<Property> | Property[];

export type Search<Entity> = {
	[P in keyof Entity]?: FindOptionsWhereProperty<NonNullable<Entity[P]>>;
};
