import { RequireExactlyOne } from 'type-fest';
interface Operator<T> {
	equal: T | T[];
	like: T;
	greater: T;
	lesser: T;
	between: { start: T; end: T };
}

export type Find<Property> = { not?: boolean } & RequireExactlyOne<Operator<Property>>;

export type Where<Property> = Property extends Promise<infer I>
	? Where<NonNullable<I>>
	: Property extends Array<infer I>
	? Where<NonNullable<I>>
	: Property extends Function
	? never
	: Property extends Date
	? Property | Find<Property>
	: Property extends object
	? Search<Property>
	: Property | Find<Property> | Property[];

export type Search<Entity> = {
	[P in keyof Entity]?: Where<NonNullable<Entity[P]>>;
};
