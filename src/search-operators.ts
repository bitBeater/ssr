import { RequireExactlyOne } from 'type-fest';
import { ScalarValue } from './misc';
interface Operator<T> {
	equal: T | T[];
	like: T;
	greater: T;
	lesser: T;
	between: { start: T; end: T };
}

export type Find<Property> = { not?: boolean } & RequireExactlyOne<Operator<Property>>;

export type Where<FieldType> =
	FieldType extends ScalarValue ?
	Find<FieldType> | FieldType
	:
	FieldType extends Function ?
	never
	:
	FieldType extends Array<infer ArrayType> ?
	Where<ArrayType>
	:
	FieldType extends object ?
	Search<FieldType>
	:
	never

export type Search<Entity> = {
	[P in keyof Entity]?: Where<NonNullable<Entity[P]>>;
};


type sub = {
	a: number;
	b: string;
}

type TestType = {
	id: number;
	name: string;
	age: number;
	createdAt: Date;
	updatedAt?: Date;
	tags: string[];
	related: sub[];
	metadata: {
		key: string;
		value: string;
		nested: {
			field1: string;
			field2: number;
		}
	} | null;
	method: () => void;
}

// const testOkSearch: Search<TestType> = {
// 	id: 5,
// 	name: { like: 'John' },
// 	age: 18,
// 	createdAt: { between: { start: new Date('2020-01-01'), end: new Date('2020-12-31') } },
// 	updatedAt: { equal: null },
// 	metadata: {
// 		key: { equal: 'value1' },
// 		nested: {
// 			field1: { like: 'test' },
// 			field2: { lesser: 100 },
// 		}
// 	},
// 	tags: 'tag1',
// 	related: {
// 		a: { greater: 10 },
// 		b: { like: 'related' }
// 	}
//     method: { equal: () => { } }, // Error
// }
