import { Metadata } from './metadata';
export type ScalarValue = string | number | boolean | Date | Promise<any>;
import { keysOf } from "@bitbeater/ecma-utils/object";


export function isScalarValue(value: unknown): value is ScalarValue {
    return ['string', 'number', 'boolean'].includes(typeof value) || value instanceof Date;
}



export function getValueByFieldName<T>(obj: T, fieldName: string, metadata: Metadata<T>): any {
    const key = getObjectKyeByFieldName(fieldName, metadata);
    if (!key) throw new Error(`Field name ${fieldName} not found in metadata`);
    return obj[key];
}


function getObjectKyeByFieldName<T, M extends Metadata<T>>(fieldName: string, metadata: M): keyof T {
    for (const [key, value] of Object.entries(metadata))
        if (value === fieldName)
            return key as keyof T;
}
