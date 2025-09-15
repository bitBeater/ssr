export type ScalarValue = string | number | boolean | Date | Promise<any>;

export function isScalarValue(value: unknown): value is ScalarValue {
    return ['string', 'number', 'boolean'].includes(typeof value) || value instanceof Date;
}