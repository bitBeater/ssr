import { ScalarValue } from './misc';

export interface EqualOperator<T> {
	equal: T | T[];
}


export interface LikeOperator<T> {
	like: T | T[];
}


// interface that replaces greater, lesser and between
// it should have atleast one of the properties
export type RangeOperator<T> = {
	greater: T;
	lesser: T;
} | {
	greater: T;
} | {
	lesser: T;
}

export type Operator<T> = EqualOperator<T> | LikeOperator<T> | RangeOperator<T>

export type Find<Property> = { not?: boolean } & Operator<Property>;

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

export function isOperator<T>(operator: unknown): operator is Operator<T> {

	return isEqualOperator<T>(operator as Operator<T>) ||
		isLikeOperator<T>(operator as Operator<T>) ||
		isRangeOperator<T>(operator as Operator<T>);
}

export function isEqualOperator<T>(operator: Operator<T>): operator is EqualOperator<T> {
	return Object.keys(operator).includes('equal');
}

export function isLikeOperator<T>(operator: Operator<T>): operator is LikeOperator<T> {
	return Object.keys(operator).includes('like');
}

export function isRangeOperator<T>(operator: Operator<T>): operator is RangeOperator<T> {
	return Object.keys(operator).includes('greater') || Object.keys(operator).includes('lesser');
}
