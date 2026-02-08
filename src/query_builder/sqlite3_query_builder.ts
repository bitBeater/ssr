import { Fields as SelectedFields } from "../fields";
import { BridgeLink, IncomingLink, isBridgeLink, isIncomingLink, isOutcomeingLink, isRelation, Metadata, OutcomeingLink } from "../metadata";
import { isScalarValue, ScalarValue } from "../misc";
import { PaginatedSearch } from "../paginated_search";
import { Condition, EqualCondition, isEqualCondition, isLikeCondition, isRangeCondition, LikeCondition, RangeCondition, Search } from "../search_operators";
// import { keysOf } from "iggs-utils/object";
import { keysOf } from "@bitbeater/ecma-utils/object";
import { isOrderStrategy, Order, OrderDirection, OrderStrategy } from "../order";

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


/**
 *  Builds a SQL query string and its parameters from a paginated search object and metadata.
 * @param paginatedSearch 
 * @param metadata 
 * @returns 
 */
export function buildQueryString<T>(paginatedSearch: PaginatedSearch<T>, metadata: Metadata<T>): [string, QueryParam[]] {
    const selectFields = makeSelectedFields(paginatedSearch.fields, metadata);
    const from = `FROM ${metadata.tableName}`;
    const [whereClause, queryParams] = buildWhereQueryString(paginatedSearch.search, metadata);
    const orderByClause = makeOrderByClause(paginatedSearch.order, metadata);
    const paginationClause = buildPaginationClause(paginatedSearch);

    // let query = `${selectFields} FROM ${metadata.tableName} ${whereClause.length ? whereClause : ''} ${orderByClause} ${paginationClause}`.trim();
    let query = [selectFields, from, whereClause, orderByClause, paginationClause].filter(e => e?.length).join(' ').trim();

    return [query, queryParams];
}

function makeSelectedFields<T>(selectedFields: SelectedFields<T> = {}, metadata: Metadata<T>,): string {
    const fields: string[] = [];

    for (const [selectedField, isSelected] of Object.entries(selectedFields)) {
        if (isSelected !== true) continue

        const metadataField = metadata[selectedField];
        const fieldName = (typeof metadataField === 'string') ? metadataField : selectedField;

        fields.push(`${metadata.tableName}.${fieldName}`);
    }

    return 'SELECT ' + (fields.length ? fields.join(',') : `${metadata.tableName}.*`);
}

export function makeOrderByClause<T>(order: Order<T> = {}, metadata: Metadata<T>): string {
    // ORDER BY FirstName DESC, YearOfBirth ASC
    let orders: (OrderStrategy & { fieldName: string })[] = [];

    for (const [field, orderStrategy] of Object.entries(order)) {
        if (!isOrderStrategy(orderStrategy)) continue;
        if (typeof metadata[field] === 'object') continue;

        const fieldName = metadata[field] || field;
        orders.push({ ...orderStrategy, fieldName });
    }

    orders = orders.sort((a, b) => (a.priority || 0) - (b.priority || 0));

    if (!orders.length) return '';


    const orderClauseChunks: string[] = [];

    for (const order of orders) {
        let clause = `${metadata.tableName}.${order.fieldName}`;
        clause += order.direction === OrderDirection.DESC ? ' DESC' : ' ASC';
        if (order.nulls === "FIRST") clause += ' NULLS FIRST';
        if (order.nulls === "LAST") clause += ' NULLS LAST';
        orderClauseChunks.push(clause);
    }


    return 'ORDER BY ' + orderClauseChunks.join(', ');
}




function buildPaginationClause(paginatedSearch: PaginatedSearch<any>): string {
    let clause = '';

    if (paginatedSearch.pageSize > 0) {
        clause += `LIMIT ${paginatedSearch.pageSize}`;
        if (paginatedSearch.page > 0)
            clause += ` OFFSET ${paginatedSearch.page * paginatedSearch.pageSize}`;
    }

    return clause;
}

/**
 * 
 * @param searchConditions 
 * @param metadata 
 * @returns 
 */
export function buildWhereQueryString<T>(searchConditions: Search<T> = {}, metadata: Metadata<T>): [string, QueryParam[]] {
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

    if (!queryParts.length) return ['', []];

    if (searchConditions[Condition.NOT])
        return [`WHERE NOT (${queryParts.join(" OR ")})`, queryParams];
    else
        return ['WHERE ' + queryParts.join(" AND "), queryParams];
}

function makeCondition<T extends Search<any>>(field: keyof T, search: Search<T>, metadata: Metadata<T>): [string, QueryParam[]] {

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

function makeEqualCondition<T>(field: keyof T, value: EqualCondition<ScalarValue>, metadata?: Metadata<T>): [string, QueryParam[]] {
    let query = '';
    const params: QueryParam[] = [];
    const fieldName = `${metadata.tableName}.${String(metadata?.[field] || field)}`;
    const valueToMatch = value[Condition.EQUAL];

    if (Array.isArray(valueToMatch)) {
        const placeholders = valueToMatch.map(() => '?').join(', ');
        query = `${value[Condition.NOT] ? 'NOT ' : ''}${fieldName} IN (${placeholders})`;
        params.push(...valueToMatch.map(v => scalarValueToSql(v)));

    } else if (isScalarValue(valueToMatch)) {

        query = `${value[Condition.NOT] ? 'NOT ' : ''}${fieldName} = ?`;
        params.push(scalarValueToSql(valueToMatch));
    }

    return [query, params];
}

function makeLikeCondition<T>(field: keyof T, likeCondtition: LikeCondition<ScalarValue>, metadata?: Metadata<T>): [string, QueryParam[]] {
    const fieldName = `${metadata.tableName}.${String(metadata?.[field] || field)}`;
    const query = `${likeCondtition[Condition.NOT] ? 'NOT ' : ''}${fieldName} LIKE ?`;
    const params = [scalarValueToSql(likeCondtition[Condition.LIKE])];

    return [query, params];
}

function makeRangeCondition<T>(field: keyof T, rangeCondition: RangeCondition<ScalarValue>, metadata?: Metadata<T>): [string, QueryParam[]] {
    const fieldName = `${metadata.tableName}.${String(metadata?.[field] || field)}`;
    const parts: string[] = [];
    const params: QueryParam[] = [];

    if (rangeCondition[Condition.GREATER]) {
        parts.push(`${fieldName} > ?`);
        params.push(scalarValueToSql(rangeCondition[Condition.GREATER]));
    }
    if (rangeCondition[Condition.LESSER]) {
        parts.push(`${fieldName} < ?`);
        params.push(scalarValueToSql(rangeCondition[Condition.LESSER]));
    }

    let query = parts.join(' AND ');

    if (rangeCondition[Condition.NOT])
        query = `NOT (${query})`;

    return [query, params];
}

function scalarValueToSql(value: ScalarValue): QueryParam {
    if (value instanceof Date) {
        return `${value.toISOString().slice(0, 19).replace('T', ' ')}`; // format as 'YYYY-MM-DD HH:MM:SS'
    } if (value instanceof Promise) {
        throw new Error('Promise is not a valid ScalarValue');
    } if (value === undefined) {
        return null;
    }
    if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE';
    }

    return value;
}

function makeRelationCondition<T>(field: keyof T, search: Search<T>, metadata: Metadata<T>): [string, QueryParam[]] {

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

function buildBridgeLinkQueryString<T>(search: Search<T>, sourceTable: string, bridgeLink: BridgeLink<T>): [string, QueryParam[]] {

    const bridgeTable = bridgeLink.bridgeTable;
    const targetTable = bridgeLink.targetMetadata.tableName;

    const sourceRefKey = `${sourceTable}.${bridgeLink.sourceRefKey}`;
    const targetRefKey = `${targetTable}.${bridgeLink.targetRefKey}`;
    const bridgeSourceFK = `${bridgeTable}.${bridgeLink.bridgeSourceForeignKey}`;
    const bridgeTargetFK = `${bridgeTable}.${bridgeLink.bridgeTargetForeignKey}`;

    const [WHERE_Target, values] = buildWhereQueryString(search, bridgeLink.targetMetadata); // split and filter empty

    const selectTargetRefsQuery = `SELECT ${targetRefKey} FROM ${targetTable} ${WHERE_Target}`;
    const selectSourceRefsQuery = `SELECT ${bridgeSourceFK} FROM ${bridgeTable} WHERE ${bridgeTargetFK} IN (${selectTargetRefsQuery})`;

    const queryString = `${sourceRefKey} IN (${selectSourceRefsQuery})`;

    return [queryString, values];
}

function buildIncomingLinkQueryString<T>(search: Search<T>, sourceTable: string, incomingLink: IncomingLink<T>): [string, QueryParam[]] {

    const targetTable = incomingLink.targetMetadata.tableName;

    const sourceRefKey = `${sourceTable}.${incomingLink.sourceRefKey}`;
    const targetFK = `${targetTable}.${incomingLink.targetForeignKey}`;

    const [WHERE_Target, values] = buildWhereQueryString(search, incomingLink.targetMetadata); // split and filter empty

    const selectTargetRefsQuery = `SELECT ${targetFK} FROM ${targetTable} ${WHERE_Target}`;
    const queryString = `${sourceRefKey} IN (${selectTargetRefsQuery})`;

    return [queryString, values];
}

function buildOutcomeingLinkQueryString<T>(search: Search<T>, sourceTable: string, outcomeingLink: OutcomeingLink<T>): [string, QueryParam[]] {

    const targetTable = outcomeingLink.targetMetadata.tableName;

    const sourceFK = `${sourceTable}.${outcomeingLink.sourceForeignkey}`;
    const targetRefKey = `${targetTable}.${outcomeingLink.targetRefKey}`;

    const [WHERE_Target, values] = buildWhereQueryString(search, outcomeingLink.targetMetadata); // split and filter empty

    const selectTargetRefsQuery = `SELECT ${targetRefKey} FROM ${targetTable} ${WHERE_Target}`;
    const queryString = `${sourceFK} IN (${selectTargetRefsQuery})`;

    return [queryString, values];
}


/**
 * Builds an INSERT SQL query string and its parameters from an array of data objects and metadata.
 * 
 * ---
 * Limitations:
 * - Only handles scalar values (string, number, boolean, Date) in the data objects. 
 * - Relations and complex types are not supported.
 * - Does not handle auto-incrementing primary keys or default values.
 * @param data
 * @param metadata
 * @returns 
 */
export function buildInsertQueryString<T>(data: T[], metadata: Metadata<T>): [string, QueryParam[]] {
    const fields: string[] = getTableFields(metadata);
    const valuePlaceholders: string[] = [];
    const values: QueryParam[] = [];

    for (const item of data) {
        const itemPlaceholders: string[] = [];

        for (const field of fields) {
            itemPlaceholders.push('?');
            values.push(scalarValueToSql(item[field]));
        }

        valuePlaceholders.push(`(${itemPlaceholders.join(', ')})`);
    }

    const query = `INSERT INTO ${metadata.tableName} (${fields.join(', ')}) VALUES ${valuePlaceholders.join(', ')}`;

    return [query, values];
}

/**
 * Returns the list of table fields defined in the metadata, excluding relations and complex types.
 * @param metadata 
 * @returns 
 */
function getTableFields<T>(metadata: Metadata<T>): string[] {
    const fields: string[] = [];

    for (const key of keysOf(metadata)) {

        if (key === 'tableName') continue;

        const metadataFieldValue = metadata[key];

        if (typeof metadataFieldValue === 'string') {
            fields.push(metadataFieldValue);
        }
    }

    return fields;
}