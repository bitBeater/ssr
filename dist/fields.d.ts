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
export type Field<FieldType> = FieldType extends ScalarValue ? true : FieldType extends Function ? never : FieldType extends Array<infer ArrayType> ? Field<ArrayType> | true : FieldType extends object ? Fields<FieldType> | true : never;
export type Fields<Entity> = {
    [Key in keyof Entity]?: Field<NonNullable<Entity[Key]>>;
};
//# sourceMappingURL=fields.d.ts.map