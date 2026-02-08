import { ScalarValue } from './misc';


export enum Condition {
	EQUAL = '$_eq',
	LIKE = '$_lk',
	GREATER = '$_gt',
	LESSER = '$_lt',
	NOT = '$_not'
}


export interface EqualCondition<T extends ScalarValue> {
	/** `Equal` Condition*/
	[Condition.EQUAL]: T | T[];
}


export interface LikeCondition<T extends ScalarValue> {
	/** `Like` Condition*/
	[Condition.LIKE]: T;
}


// interface that replaces greater, lesser and between
// it should have atleast one of the properties
export type RangeCondition<T extends ScalarValue> = {
	/** `Only Greater than` Condition*/
	[Condition.GREATER]: T;
} | {
	/** `Only Less than` Condition*/
	[Condition.LESSER]: T;
}

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;


export type Operator<T extends ScalarValue> = XOR<XOR<EqualCondition<T>, LikeCondition<T>>, RangeCondition<T>> & { [Condition.NOT]?: true };

const op: Operator<number> = { $_eq: 5, }; // should be invalid
const op0: Operator<number> = { $_lk: 20 }; // should be invalid
const op1: Operator<number> = { $_gt: 10, $_lt: 20 }; // should be invalid

// export type Find<Property> = { $_not?: boolean } & Operator<Property>;

export type Where<FieldType> =
	FieldType extends ScalarValue ?
	Operator<FieldType> | FieldType | FieldType[]
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
} & {
	[Condition.NOT]?: true;
};

// export function isOperator<T extends ScalarValue>(operator: unknown): operator is Operator<T> {

// 	return isScalarValue(operator) ||
// 		Array.isArray(operator) ||
// 		isEqualCondition(operator) ||
// 		isLikeCondition(operator) ||
// 		isRangeCondition(operator);
// }

export function isEqualCondition(operator: unknown): operator is EqualCondition<ScalarValue> {
	return Object.keys(operator).includes(Condition.EQUAL);
}

export function isLikeCondition(operator: unknown): operator is LikeCondition<ScalarValue> {
	return Object.keys(operator).includes(Condition.LIKE);
}

export function isRangeCondition(operator: unknown): operator is RangeCondition<ScalarValue> {
	return Object.keys(operator).includes(Condition.GREATER) || Object.keys(operator).includes(Condition.LESSER);
}

