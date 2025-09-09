"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//export type Order<T> = Schema<PartialDeep<T>, OrderDirection>;
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
// const testOkFields: Order<TestType> = {
// 	id: { direction: 'ASC', priority: 1 },
// 	name: { direction: 'ASC', priority: 1 },
// 	age: { direction: 'ASC', priority: 1 },
// 	createdAt: { direction: 'ASC', priority: 1 },
// 	updatedAt: { direction: 'ASC', priority: 1 },
// 	metadata: {
// 		key: { direction: 'ASC', priority: 1 },
// 		value: { direction: 'ASC', priority: 1 },
// 		nested: {
// 			field1: { direction: 'ASC', priority: 1 },
// 			field2: { direction: 'ASC', priority: 1 },
// 		}
// 	},
// 	tags: { direction: 'ASC', priority: 1, nulls: 'LAST' }, // Array field can be an object or true
// 	related: {
// 		a: { direction: 'ASC', priority: 1 },
// 		b: { direction: 'ASC', priority: 1 },
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
//# sourceMappingURL=order.js.map