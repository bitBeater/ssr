import { Fields, Order, Search } from '../src';

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


// ---------------------- SEARCH ----------------------

const testOkSearch: Search<TestType> = {
    id: 5,
    name: { like: 'John' },
    age: { greater: 18 },
    createdAt: { greater: new Date('2020-01-01'), lesser: new Date('2020-12-31') },
    updatedAt: { equal: null },
    metadata: {
        key: { equal: 'value1' },
        nested: {
            field1: { like: 'test' },
            field2: { lesser: 100 },
        }
    },
    tags: 'tag1',
    related: {
        a: { lesser: 10 },
        b: { like: 'related' }
    }
}




// ---------------------- FIELDS ----------------------

const testOkFields: Fields<TestType> = {
    id: true,
    name: true,
    age: true,
    createdAt: true,
    updatedAt: true,
    metadata: {
        key: true,
        value: true,
        nested: {
            field1: true,
            field2: true,
        }
    },
    tags: true, // Array field can be an object or true
    related: {
        a: true,
        b: true,
    },
}

const testOkFields2: Fields<TestType> = {
    id: true,
    name: true,
    age: true,
    createdAt: true,
    updatedAt: true,
    metadata: true, // object field can be true
    tags: true, // string Array field can be true
    related: true, // Array field can be an object or true

}



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




// ---------------------- ORDER ----------------------


const testOkOrder: Order<TestType> = {
    id: { direction: 'ASC', priority: 1 },
    name: { direction: 'ASC', priority: 1 },
    age: { direction: 'ASC', priority: 1 },
    createdAt: { direction: 'ASC', priority: 1 },
    updatedAt: { direction: 'ASC', priority: 1 },
    metadata: {
        key: { direction: 'ASC', priority: 1 },
        value: { direction: 'ASC', priority: 1 },
        nested: {
            field1: { direction: 'ASC', priority: 1 },
            field2: { direction: 'ASC', priority: 1 },
        }
    },
    tags: { direction: 'ASC', priority: 1, nulls: 'LAST' }, // Array field can be an object or true
    related: {
        a: { direction: 'ASC', priority: 1 },
        b: { direction: 'ASC', priority: 1 },
    },
}

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
