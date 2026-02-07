import { ScalarValue } from './misc';


export enum OrderDirection {
	ASC = 'ASC',
	DESC = 'DESC'
}

export type OrderStrategy = {
	direction: OrderDirection;
	nulls?: 'FIRST' | 'LAST';
	priority?: number; // lower number means higher priority

}

export type OrderField<FieldType> =
	FieldType extends ScalarValue ?
	OrderStrategy
	:
	FieldType extends Function ?
	never
	:
	FieldType extends Array<infer ArrayType> ?
	OrderField<ArrayType>
	:
	FieldType extends object ?
	Order<FieldType>
	:
	never



export type Order<T> = {
	[P in keyof T]?: OrderField<NonNullable<T[P]>>;
};

export function isOrderStrategy(obj: unknown): obj is OrderStrategy {
	return [OrderDirection.ASC, OrderDirection.DESC].includes((obj as OrderStrategy)?.direction);
}