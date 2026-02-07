## @bitbeater/ssr — Type-safe search, fields, order, and pagination

Tiny TypeScript typings to describe search filters, selected fields, ordering, and pagination for repositories. It’s runtime-agnostic (ORM/DB/framework independent) and focuses on strong compile-time safety for your query shape.

Key ideas:
- Search: deep, type-safe filters with operators (equal, like, greater, lesser, between, not)
- Fields: precise field selection, including nested objects and arrays
- Order: multi-field ordering with direction, nulls handling, and priority
- Pagination: page + pageSize with optional search/order/fields
- Repository: a minimal interface to wire your data source


## Install

```bash
npm i @bitbeater/ssr
```


## Quick start

```ts
import {
	Fields,
	Order,
	PaginatedResult,
	PaginatedSearch,
	Repository,
	Search,
} from '@bitbeater/ssr';
```


## Person model used in examples

Includes number, string, object, date, array, and boolean types.

```ts
type Contact = {
	type: 'email' | 'phone';
	value: string;
	verified: boolean;
};

type Person = {
	id: number;            // number
	name: string;          // string
	age: number;           // number
	isActive: boolean;     // boolean
	createdAt: Date;       // date
	tags: string[];        // array of scalar
	address: {             // object
		city: string;
		zip: number;
	};
	contacts: Contact[];   // array of objects
	notes?: string | null; // nullable field
};
```


## Search — type-safe filters

Operator shape for scalar fields:
- equal: T | T[]
- like: T
- range: { greater: T; lesser: T }
- not?: boolean (negate any of the above)

You can pass either a raw scalar (shorthand for equal) or a Find<T> object with one operator. Nested objects and arrays are supported recursively.

```ts
import { Search } from '@bitbeater/ssr';

const search: Search<Person> = {
	// scalars
	name: { like: 'ali' },
	age: { greater: 18 },
	isActive: true, // shorthand for { equal: true }
	createdAt: {  greater: new Date('2024-01-01'), lesser: new Date('2024-12-31') },
	// array of scalars -> filter by an element match
	tags: { like: 'script' },
	// or shorthand equal
	// tags: 'typescript',

	// nested object
	address: {
		city: { like: 'York' },
	},

	// array of objects -> filter by fields on the element type
	contacts: {
		verified: { equal: true },
		type: { equal: ['email', 'phone'] },
	},
};
```

Notes:
- Arrays use the element type for filtering (semantics like “any element matches” are up to your implementation).
- Functions are excluded by design and cannot be filtered.
 - Nullable fields are treated as their non-nullable type for filtering (i.e., `string | null` is filtered as `string`). If you need explicit null checks, model them in your repository implementation or extend the types to support it.


## Fields — shape the returned data

Rules:
- true includes the field
- object selects nested fields recursively
- arrays accept either true (whole element) or a nested object describing the element shape
- functions are excluded

```ts
import { Fields } from '@bitbeater/ssr';

const fields: Fields<Person> = {
	id: true,
	name: true,
	address: { city: true },
	tags: true, // include array values
	contacts: { type: true, verified: true },
	// Omitting a key excludes it (unless the root is set to true)
};
```


## Order — multi-field ordering

Each ordered field accepts a strategy:
- direction: 'ASC' | 'DESC'
- nulls?: 'FIRST' | 'LAST'
- priority?: number (lower number = higher precedence)

```ts
import { Order } from '@bitbeater/ssr';

const order: Order<Person> = {
	createdAt: { direction: 'DESC', nulls: 'LAST', priority: 1 },
	name: { direction: 'ASC', priority: 2 },
	// order within arrays-of-objects is expressed over the element type
	contacts: { verified: { direction: 'DESC', priority: 1 } },
};
```


## PaginatedSearch and PaginatedResult

```ts
import { PaginatedSearch, PaginatedResult } from '@bitbeater/ssr';

const query: PaginatedSearch<Person> = {
	page: 0,        // default 0
	pageSize: 20,   // omit to fetch until the end
	fields,         // optional: return all when omitted/empty
	order,          // optional
	search,         // optional: match-all when omitted
};

// Your data source returns this shape
const result: PaginatedResult<Person> = {
	page: 0,
	pageSize: 20,
	totalCount: 2,
	items: [/* persons */],
};
```


## Repository interface

Bring your own persistence. These types describe a minimal repo surface.

```ts
import { Repository } from '@bitbeater/ssr';

const peopleRepo: Repository<Person> = {
	save: async (people) => people, // create/update
	search: async (q) => ({ page: q?.page ?? 0, pageSize: q?.pageSize, totalCount: 0, items: [] }),
	remove: async (s) => [],
};
```


## Type-only package

This library exports TypeScript types with no runtime. Use them to type your query-building and repository contracts in any stack (SQL, NoSQL, REST, GraphQL, ORM, etc.).


## API surface

- Fields<T>: describe selected fields
- Search<T>: describe filters by field with operators
- Order<T>: describe ordering with direction/nulls/priority
- PaginatedSearch<T>: page, pageSize, order, fields, search
- PaginatedResult<T>: page, pageSize, totalCount, items
- Repository<T>: save, search, remove function types


## Query Builder
A simple SQLite query builder implementation is included to demonstrate how to use the types in practice. It supports basic filtering, field selection, ordering, and pagination.

```ts
import { buildQueryString } from '@bitbeater/ssr/query_builder/sqlite3_query_builder';
import { Condition, OrderDirection } from '@bitbeater/ssr';
import { Metadata, QueryParam } from '@bitbeater/ssr/metadata';


type Tag = { 
	id: number;
 	name: string 
};

type Bio = { 
	height: number; 
	eyeColor: string;
};

type Address = {
	city: string;
	zip: number;
};

type Person = {
	id: number;
	name: string;
	bio: Bio;
	address: Address;
	tags: Tag[];
	children: Person[];
	parent: Person;
};


/*
	sql schema:
	CREATE TABLE person (
		id INTEGER PRIMARY KEY,
		name TEXT,
		parentId INTEGER,
		addressId INTEGER,
		FOREIGN KEY(parentId) REFERENCES person(id)
		FOREIGN KEY(addressId) REFERENCES address(id),
	);

	CREATE TABLE bio (
		id INTEGER PRIMARY KEY,
		personId INTEGER,
		height INTEGER,
		eyeColor TEXT,
		FOREIGN KEY(personId) REFERENCES person(id)
	);

*/

```	


## License
ISC
