import { arrayBuffer } from "stream/consumers";
import { BridgeLink, IncomingLink, isBridgeLink, isIncomingLink, isOutcomeingLink, isRelation, Metadata, OutcomeingLink, Relation } from "../metadata";
import { isScalarValue, ScalarValue } from "../misc";
import { PaginatedSearch } from "../paginated_search";
import { Condition, EqualCondition, isEqualCondition, isLikeCondition, isRangeCondition, LikeCondition, Operator, RangeCondition, Search, Where } from "../search_operators";
import { isPlainObject, keysOf } from "iggs-utils/object";

type QueryParam = boolean | number | string;




/*
 * Limitations:
 * - no Composite Key: handles only single primary/foreign keys based relations.
 * - can only handle one to many self references. (e.g. a person has many childs, but a child has only one father and one mother)
 * @Example
 * ```ts
 * interface Person {
 *   id: number;
 *   name: string;
 *   childs: Person[]; // can't query persons that have childs with certain conditions
 *   father: Person; // many to one self reference
 *   mother: Person; // many to one self reference
 * }
 * 
 * const personMetadata: Metadata<Person> = {
 *   tableName: 'person',
 *   id: 'id',
 *   name: 'name'
 * }
 * 
 * personMetadata.father = {
 *   targetRefKey: 'id',
 *   sourceForeignkey: 'fatherId',
 *  targetMetadata: personMetadata
 * }
 * 
 * personMetadata.mother = {
 *   targetRefKey: 'id',
 *   sourceForeignkey: 'motherId',
 *  targetMetadata: personMetadata
 * }
 * 
 * personMetadata.childs = {
 *   sourceRefKey: 'id',
 *   targetForeignKey: 'fatherId', // or motherId can't both
 *  targetMetadata: personMetadata
 * }
 * ```
 */

export function buildQueryString<T>(params: PaginatedSearch<T>, metadata: Metadata<T>): string {
    const queryString = '';
    return queryString;
}


// export function buildWhereQueryString2<T>(searchConditions: Search<T>, metadata: Metadata<T>): [string, (number | string)[]] {
//     const values: (number | string)[] = [];

//     function isPlainObject(v: any) {
//         return typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Date);
//     }

//     // Detect the relation type for a metadata field entry
//     function relationInfo(fieldMeta: any) {
//         if (!fieldMeta || typeof fieldMeta === 'string') return { kind: 'scalar' } as const;
//         if ('bridgeTable' in fieldMeta) return { kind: 'manyToMany', meta: fieldMeta } as const;
//         if ('targetForeignKey' in fieldMeta) return { kind: 'oneToMany', meta: fieldMeta } as const; // incoming
//         if ('sourceForeignkey' in fieldMeta) return { kind: 'manyToOneOrOneToOne', meta: fieldMeta } as const; // outgoing
//         return { kind: 'unknown' } as const;
//     }

//     function applyOperator(column: string, condition: any): string[] {
//         const parts: string[] = [];
//         const notPrefix = condition.$_not ? 'NOT ' : '';
//         if (Object.prototype.hasOwnProperty.call(condition, '$_eq')) {
//             // equality (single value only in tests)
//             parts.push(`${notPrefix}${column} = ?`);
//             values.push(condition.$_eq as any);
//         }
//         if (Object.prototype.hasOwnProperty.call(condition, '$_lk')) {
//             let lkVal = condition.$_lk as any;
//             // Tests expect implicit wrapping with % on both sides unless already contains % or * wildcards
//             if (typeof lkVal === 'string') {
//                 // Replace leading * with % (test uses '*ohn') and if no % inside add surrounding %
//                 if (lkVal.startsWith('*')) lkVal = '%' + lkVal.slice(1);
//                 if (!lkVal.includes('%')) lkVal = `%${lkVal}%`;
//             }
//             parts.push(`${notPrefix}${column} LIKE ?`);
//             values.push(lkVal);
//         }
//         const hasGt = Object.prototype.hasOwnProperty.call(condition, '$_gt');
//         const hasLt = Object.prototype.hasOwnProperty.call(condition, '$_lt');
//         if (hasGt) {
//             parts.push(`${notPrefix}${column} > ?`);
//             values.push(condition.$_gt as any);
//         }
//         if (hasLt) {
//             parts.push(`${notPrefix}${column} < ?`);
//             values.push(condition.$_lt as any);
//         }
//         return parts;
//     }

//     function build(fieldSearch: any, currentMeta: any, currentAlias: string): string[] {
//         if (!fieldSearch) return [];
//         const clauses: string[] = [];
//         for (const key of Object.keys(fieldSearch)) {
//             const value = fieldSearch[key];
//             const fieldMeta = (currentMeta as any)[key];
//             const rel = relationInfo(fieldMeta);
//             if (rel.kind === 'scalar') {
//                 const column = `${currentAlias}.${fieldMeta || key}`; // fallback to key if metadata missing
//                 if (isPlainObject(value) && (value.$_eq !== undefined || value.$_lk !== undefined || value.$_gt !== undefined || value.$_lt !== undefined || value.$_not !== undefined)) {
//                     const ops = applyOperator(column, value);
//                     clauses.push(...ops);
//                 } else {
//                     // direct equality
//                     clauses.push(`${column} = ?`);
//                     values.push(value);
//                 }
//             } else if (rel.kind === 'oneToMany') {
//                 // parent.id IN (SELECT child.targetForeignKey FROM childTable WHERE ...)
//                 const childMeta = rel.meta.targetMetadata;
//                 const childAlias = childMeta.tableName; // simple alias
//                 const parentIdCol = `${currentAlias}.${rel.meta.sourceRefKey}`;
//                 const fkCol = `${childAlias}.${rel.meta.targetForeignKey}`;
//                 const innerConditions = build(value, childMeta, childAlias);
//                 const whereInner = innerConditions.length ? ` WHERE ${innerConditions.join(' AND ')}` : '';
//                 clauses.push(`${parentIdCol} IN (SELECT ${fkCol} FROM ${childMeta.tableName}${whereInner})`);
//             } else if (rel.kind === 'manyToMany') {
//                 // parent.id IN (SELECT bridge.bridgeSourceForeignKey FROM bridge WHERE bridge.bridgeTargetForeignKey IN (SELECT target.targetRefKey FROM target WHERE ...))
//                 const mm = rel.meta;
//                 const targetMeta = mm.targetMetadata;
//                 const targetAlias = targetMeta.tableName;
//                 const bridgeAlias = mm.bridgeTable;
//                 const parentIdCol = `${currentAlias}.${mm.sourceRefKey}`;
//                 const bridgeSourceFK = `${bridgeAlias}.${mm.bridgeSourceForeignKey}`;
//                 const bridgeTargetFK = `${bridgeAlias}.${mm.bridgeTargetForeignKey}`;
//                 const targetIdCol = `${targetAlias}.${mm.targetRefKey}`;
//                 const targetConditions = build(value, targetMeta, targetAlias);
//                 const targetWhere = targetConditions.length ? ` WHERE ${targetConditions.join(' AND ')}` : '';
//                 clauses.push(`${parentIdCol} IN (SELECT ${bridgeSourceFK} FROM ${bridgeAlias} WHERE ${bridgeTargetFK} IN (SELECT ${targetIdCol} FROM ${targetMeta.tableName}${targetWhere}))`);
//             } else if (rel.kind === 'manyToOneOrOneToOne') {
//                 // traverse to target metadata (e.g. bioMetrics) treat as nested object filters referencing target table columns
//                 // We only support filtering on target fields -> parent.sourceForeignKey IN (SELECT target.targetRefKey FROM target WHERE ...)
//                 const m = rel.meta;
//                 const targetMeta = m.targetMetadata;
//                 const targetAlias = targetMeta.tableName;
//                 const parentFKCol = `${currentAlias}.${m.sourceForeignkey}`;
//                 const targetIdCol = `${targetAlias}.${m.targetRefKey}`;
//                 const targetConditions = build(value, targetMeta, targetAlias);
//                 const targetWhere = targetConditions.length ? ` WHERE ${targetConditions.join(' AND ')}` : '';
//                 clauses.push(`${parentFKCol} IN (SELECT ${targetIdCol} FROM ${targetMeta.tableName}${targetWhere})`);
//             }
//         }
//         return clauses;
//     }

//     const allClauses = build(searchConditions, metadata, metadata.tableName);
//     return [allClauses.join(' AND '), values];
// }


function buildBridgeLinkQueryString<T>(search: Search<T>, sourceTable: string, bridgeLink: BridgeLink<T>): [string, QueryParam[]] {

    const bridgeTable = bridgeLink.bridgeTable;
    const targetTable = bridgeLink.targetMetadata.tableName;

    const sourceRefKey = `${sourceTable}.${bridgeLink.sourceRefKey}`;
    const targetRefKey = `${targetTable}.${bridgeLink.targetRefKey}`;
    const bridgeSourceFK = `${bridgeTable}.${bridgeLink.bridgeSourceForeignKey}`;
    const bridgeTargetFK = `${bridgeTable}.${bridgeLink.bridgeTargetForeignKey}`;

    const [targetWhere, values] = buildWhereQueryString(search, bridgeLink.targetMetadata); // split and filter empty

    const selectTargetRefsQuery = `SELECT ${targetRefKey} FROM ${targetTable} WHERE ${targetWhere}`;
    const selectSourceRefsQuery = `SELECT ${bridgeSourceFK} FROM ${bridgeTable} WHERE ${bridgeTargetFK} IN (${selectTargetRefsQuery})`;

    const queryString = `${sourceRefKey} IN (${selectSourceRefsQuery})`;

    return [queryString, values];
}


function buildIncomingLinkQueryString<T>(search: Search<T>, sourceTable: string, incomingLink: IncomingLink<T>): [string, QueryParam[]] {

    const targetTable = incomingLink.targetMetadata.tableName;

    const sourceRefKey = `${sourceTable}.${incomingLink.sourceRefKey}`;
    const targetFK = `${targetTable}.${incomingLink.targetForeignKey}`;

    const [targetWhere, values] = buildWhereQueryString(search, incomingLink.targetMetadata); // split and filter empty

    const selectTargetRefsQuery = `SELECT ${targetFK} FROM ${targetTable} WHERE ${targetWhere}`;
    const queryString = `${sourceRefKey} IN (${selectTargetRefsQuery})`;

    return [queryString, values];
}


function buildOutcomeingLinkQueryString<T>(search: Search<T>, sourceTable: string, outcomeingLink: OutcomeingLink<T>): [string, QueryParam[]] {

    const targetTable = outcomeingLink.targetMetadata.tableName;

    const sourceFK = `${sourceTable}.${outcomeingLink.sourceForeignkey}`;
    const targetRefKey = `${targetTable}.${outcomeingLink.targetRefKey}`;

    const [targetWhere, values] = buildWhereQueryString(search, outcomeingLink.targetMetadata); // split and filter empty

    const selectTargetRefsQuery = `SELECT ${targetRefKey} FROM ${targetTable} WHERE ${targetWhere}`;
    const queryString = `${sourceFK} IN (${selectTargetRefsQuery})`;

    return [queryString, values];
}


export function buildWhereQueryString<T>(searchConditions: Search<T>, metadata: Metadata<T>): [string, QueryParam[]] {
    const queryParams: QueryParam[] = [];
    const queryParts: string[] = [];

    for (const key of keysOf(searchConditions)) {

        if (key === Condition.NOT) continue;

        const [query, params] = makeCondition<T>(key, searchConditions, metadata);

        if (query) {
            queryParts.push(query);
            queryParams.push(...params);
        }
    }

    if (searchConditions[Condition.NOT])
        return [`NOT (${queryParts.join(" OR ")})`, queryParams];
    else
        return [queryParts.join(" AND "), queryParams];
}





export function makeCondition<T extends Search<any>>(field: keyof T, search: Search<T>, metadata: Metadata<T>): [string, QueryParam[]] {

    // if where is a scalar value or array of scalar values, treat it as equality

    const fieldSearch = search[field];

    if (!fieldSearch) return ['', []];

    if (isScalarValue(fieldSearch) || Array.isArray(fieldSearch)) {
        return makeEqualCondition(field, { [Condition.EQUAL]: fieldSearch }, metadata);
    }

    if (isEqualCondition(fieldSearch)) {
        return makeEqualCondition(field, fieldSearch, metadata);
    }

    if (isLikeCondition(fieldSearch)) {
        return makeLikeCondition(field, fieldSearch, metadata);
    }

    if (isRangeCondition(fieldSearch)) {
        return makeRangeCondition(field, fieldSearch, metadata);
    }


    if (isRelation(metadata[field])) {
        return makeRelationCondition(field, fieldSearch, metadata);
    }
}

export function makeEqualCondition<T>(field: keyof T, value: EqualCondition<ScalarValue>, metadata?: Metadata<T>): [string, QueryParam[]] {
    let query = '';
    const params: QueryParam[] = [];
    const fieldName = `${metadata.tableName}.${String(metadata?.[field] || field)}`;
    const valueToMatch = value[Condition.EQUAL];

    if (Array.isArray(valueToMatch)) {
        const placeholders = valueToMatch.map(() => '?').join(', ');
        query = `${value[Condition.NOT] ? 'NOT ' : ''}${fieldName} IN (${placeholders})`;
        params.push(...valueToMatch.map(v => ScalarValueToSql(v)));

    } else if (isScalarValue(valueToMatch)) {

        query = `${value[Condition.NOT] ? 'NOT ' : ''}${fieldName} = ?`;
        params.push(ScalarValueToSql(valueToMatch));
    }


    return [query, params];
}

export function makeLikeCondition<T>(field: keyof T, likeCondtition: LikeCondition<ScalarValue>, metadata?: Metadata<T>): [string, QueryParam[]] {
    const fieldName = `${metadata.tableName}.${String(metadata?.[field] || field)}`;
    const query = `${likeCondtition[Condition.NOT] ? 'NOT ' : ''}${fieldName} LIKE ?`;
    const params = [ScalarValueToSql(likeCondtition[Condition.LIKE])];

    return [query, params];
}


export function makeRangeCondition<T>(field: keyof T, rangeCondition: RangeCondition<ScalarValue>, metadata?: Metadata<T>): [string, QueryParam[]] {
    const fieldName = `${metadata.tableName}.${String(metadata?.[field] || field)}`;
    const parts: string[] = [];
    const params: QueryParam[] = [];

    if (rangeCondition[Condition.GREATER]) {
        parts.push(`${fieldName} > ?`);
        params.push(ScalarValueToSql(rangeCondition[Condition.GREATER]));
    }
    if (rangeCondition[Condition.LESSER]) {
        parts.push(`${fieldName} < ?`);
        params.push(ScalarValueToSql(rangeCondition[Condition.LESSER]));
    }

    let query = parts.join(' AND ');

    if (rangeCondition[Condition.NOT])
        query = `NOT ${parts.join(' OR ')}`;



    return [query, params];
}

export function ScalarValueToSql(value: ScalarValue): QueryParam {
    if (value instanceof Date) {
        return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`; // format as 'YYYY-MM-DD HH:MM:SS'
    } if (value instanceof Promise) {
        throw new Error('Promise is not a valid ScalarValue');
    }

    return value;
}


export function makeRelationCondition<T>(field: keyof T, search: Search<T>, metadata: Metadata<T>): [string, QueryParam[]] {

    const sourceTable = metadata.tableName;
    const relationMetadata = metadata[field];

    if (isBridgeLink(relationMetadata)) {
        return buildBridgeLinkQueryString(search, sourceTable, relationMetadata);
    }

    if (isOutcomeingLink(relationMetadata)) {
        return buildOutcomeingLinkQueryString(search, sourceTable, relationMetadata);
    }

    if (isIncomingLink(relationMetadata)) {
        return buildIncomingLinkQueryString(search, sourceTable, relationMetadata);
    }

    throw new Error('Unsupported Relation type');
}


// function makeBridgeLinkCondition<T>(search: Search<T>, sourceTable: string, bridgeLink: BridgeLink<T>): [string, SqlParam[]] {

//     const bridgeTable = bridgeLink.bridgeTable;
//     const targetTable = bridgeLink.targetMetadata.tableName;

//     const sourceRefKey = `${sourceTable}.${bridgeLink.sourceRefKey}`;
//     const targetRefKey = `${targetTable}.${bridgeLink.targetRefKey}`;
//     const bridgeSourceFK = `${bridgeTable}.${bridgeLink.bridgeSourceForeignKey}`;
//     const bridgeTargetFK = `${bridgeTable}.${bridgeLink.bridgeTargetForeignKey}`;

//     const [targetWhere, values] = buildWhereQueryString(search, bridgeLink.targetMetadata); // split and filter empty

//     const selectTargetRefsQuery = `SELECT ${targetRefKey} FROM ${targetTable} WHERE ${targetWhere}`;
//     const selectSourceRefsQuery = `SELECT ${bridgeSourceFK} FROM ${bridgeTable} WHERE ${bridgeTargetFK} IN (${selectTargetRefsQuery})`;

//     const queryString = `${sourceRefKey} IN (${selectSourceRefsQuery})`;

//     return [queryString, values];
// }