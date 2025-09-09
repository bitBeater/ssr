import { ScalarValue } from "./misc";

/**
 * Fields to select in a search
 * if a field is set to true, it will be included in the result
 * if a field is set to false, it will be excluded from the result
 * if a field is an object, it will be recursively processed
 * if a field is not present, it will be excluded from the result
 * if the whole object is set to true, all fields will be included
 * if the field is a function, it will be excluded
 */

export type Field<FieldType> =
	FieldType extends ScalarValue ?
	true
	:
	FieldType extends Function ?
	never
	:
	FieldType extends Array<infer ArrayType> ?
	Field<ArrayType> | true
	:
	FieldType extends object ?
	Fields<FieldType> | true
	:
	never


export type Fields<Entity> =
	{
		[Key in keyof Entity]?: Field<NonNullable<Entity[Key]>>;
	}

// type sub = {
// 	a: number;
// 	b: string;
// }

// type TestType = {
// 	id: number;
// 	name: string;
// 	age: number;
// 	createdAt: Date;
// 	updatedAt?: Date;
// 	tags: string[];
// 	related: sub[];
// 	metadata: {
// 		key: string;
// 		value: string;
// 		nested: {
// 			field1: string;
// 			field2: number;
// 		}
// 	} | null;
// 	method: () => void;
// }

// const testOkFields: Fields<TestType> = {
// 	id: true,
// 	name: true,
// 	age: true,
// 	createdAt: true,
// 	updatedAt: true,
// 	metadata: {
// 		key: true,
// 		value: true,
// 		nested: {
// 			field1: true,
// 			field2: true,
// 		}
// 	},
// 	tags: true, // Array field can be an object or true
// 	related: {
// 		a: true,
// 		b: true,
// 	},
// 	// method: true, // Error
// }

// const testNotOkFields: Fields<TestType> = {
// 	id: false, // Error
// 	name: 123, // Error
// 	age: "string", // Error
// 	createdAt: null, // Error
// 	updatedAt: undefined, // Error
// 	metadata: {
// 		key: 123, // Error
// 		value: false, // Error
// 		nested: {
// 			field1: null, // Error
// 			field2: "string", // Error
// 		}
// 	},
// 	tags: {
// 		0: true, // Error
// 	}, // Array field can be an object or true
// 	related: {
// 		a: "string", // Error
// 		b: 123, // Error
// 		c: true, // Error
// 	},
// 	method: true, // Error
// }
