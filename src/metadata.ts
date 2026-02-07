import { ScalarValue } from "./misc";




export type Regular = string;

export type BridgeLink<T> = { targetMetadata: Metadata<T>, bridgeTable: string, sourceRefKey: string, targetRefKey: string, bridgeSourceForeignKey: string, bridgeTargetForeignKey: string };

export type OutcomeingLink<T> = { targetMetadata: Metadata<T>, sourceForeignkey: string, targetRefKey: string };

export type IncomingLink<T> = { targetMetadata: Metadata<T>, sourceRefKey: string, targetForeignKey: string };

export type Relation<T> = BridgeLink<T> | OutcomeingLink<T> | IncomingLink<T>;



export type FieldMetadata<FieldType> =
	FieldType extends ScalarValue ?
	Regular
	:
	FieldType extends Function ?
	never
	:
	FieldType extends Array<infer ArrayType> ?
	BridgeLink<ArrayType> | IncomingLink<ArrayType>
	:
	FieldType extends object ?
	BridgeLink<FieldType> | OutcomeingLink<FieldType>
	:
	never


export type Metadata<Entity> =
	{

		[Key in keyof Entity]?: FieldMetadata<NonNullable<Entity[Key]>>;
	} & { tableName: string };




export function isRelation<T>(obj: unknown): obj is Relation<T> {
	return !!(obj as Relation<T>)?.targetMetadata;
}

export function isBridgeLink<T>(obj: unknown): obj is BridgeLink<T> {
	return !!(obj as BridgeLink<T>).bridgeTable;
}

export function isOutcomeingLink<T>(obj: unknown): obj is OutcomeingLink<T> {
	return !!(obj as OutcomeingLink<T>).sourceForeignkey;
}

export function isIncomingLink<T>(obj: unknown): obj is IncomingLink<T> {
	return !!(obj as IncomingLink<T>).targetForeignKey;
}