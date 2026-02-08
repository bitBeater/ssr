import { describe, it } from 'node:test';
import assert from 'node:assert';

import Database from 'better-sqlite3';

import { Person, personMetadata } from '../valid_types';
import { Condition, Search, Metadata, Field, Order, OrderDirection } from '@bitbeater/ssr';
import { buildQueryString, buildWhereQueryString, makeOrderByClause } from '../../dist/query_builder/sqlite3_query_builder';



describe('sqlite3 query builder', () => {

    describe('where query string', () => {
        it('1. simple query builder', () => {
            const searchOperators: Search<Person> = {
                name: { $_lk: 'ohn' },
                age: { $_gt: 18, $_lt: 30 },
                isActive: true,
                description: { $_eq: 'avoid me', $_not: true },
            };

            const [queryString, values] = buildWhereQueryString(searchOperators, personMetadata);
            const expectedQueryString = `WHERE person.name LIKE ? AND person.age > ? AND person.age < ? AND person.isActive = ? AND NOT person.description = ?`;
            const expectedValues = ['ohn', 18, 30, 'TRUE', 'avoid me'];

            assert.equal(queryString, expectedQueryString);
            assert.deepEqual(values, expectedValues);
        });

        it('2. one to many (INBOUND)', () => {
            // all persons that have a veichle with model 'corolla'
            // person.id IN (SELECT veichles.ownerId FROM veichles WHERE veichles.model = 'corolla');
            const searchOperators: Search<Person> = {
                veichles: {
                    model: 'corolla',
                },
            };

            const [queryString, values] = buildWhereQueryString(searchOperators, personMetadata);
            const expectedQueryString = `WHERE person.id IN (SELECT veichles.ownerId FROM veichles WHERE veichles.model = ?)`;
            const expectedValues = ['corolla'];

            assert.equal(queryString, expectedQueryString);
            assert.deepEqual(values, expectedValues);
        });

        it('3. many to one (OUTBOUND)', () => {
            // all persons with bioMetrics eyeColor 'blue'
            // person.id IN (SELECT personId FROM bio_metrics WHERE bio_metrics.eye_color = 'blue');
            const searchOperators: Search<Person> = {
                bioMetrics: { eyeColor: 'blue' },
            };

            const [queryString, values] = buildWhereQueryString(searchOperators, personMetadata);

            const expectedQueryString = `WHERE person.bioMetricsId IN (SELECT bio_metrics.id FROM bio_metrics WHERE bio_metrics.eye_color = ?)`;
            const expectedValues = ['blue'];

            assert.equal(queryString, expectedQueryString);
            assert.deepEqual(values, expectedValues);
        });

        it('4. many to many (BRIDGE)', () => {
            // all persons that have a tag with name like '%tag1%'
            // person.id IN (SELECT person_tags.person_id FROM person_tags WHERE person_tags.tag_id IN (SELECT tags.id FROM tags WHERE tags.name LIKE '%tag1%'));
            const searchOperators: Search<Person> = {
                tags: { name: { $_lk: 'tag1' } },
            };

            const [queryString, values] = buildWhereQueryString(searchOperators, personMetadata);

            const expectedQueryString = `WHERE person.id IN (SELECT person_tags.person_id FROM person_tags WHERE person_tags.tag_id IN (SELECT tags.id FROM tags WHERE tags.name LIKE ?))`;
            const expectedValues = ['tag1'];

            assert.equal(queryString, expectedQueryString);
            assert.deepEqual(values, expectedValues);
        });
    });

    describe('order query string', () => {
        it('1. simple order by', () => {
            const order: Order<Person> = { name: { direction: OrderDirection.ASC } };
            const orderQuery = makeOrderByClause(order, personMetadata);
            assert.equal(orderQuery, 'ORDER BY person.name ASC');
        });
    });

    describe('integration tests', () => {
        it('EQUAL', () => {
            // ---------- ARRANGE ----------
            const db = new Database(':memory:');
            db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL
                );
            `);
            const insert = db.prepare('INSERT INTO testData (name) VALUES (?)');
            insert.run('test1');
            insert.run('test2');
            insert.run('test3');

            type DataTest = { id: number; name: string };

            const metadata: Metadata<DataTest> = {
                tableName: 'testData',
                id: 'id',
                name: 'name',
            };

            const search: Search<DataTest> = { name: 'test2' };

            // ---------- ACT ----------
            const [queryString, values] = buildQueryString({ search }, metadata);
            const data = db.prepare(queryString).all(values) as DataTest[];

            // ---------- ASSERT ---------
            assert.equal(data.length, 1);
            assert.equal(data[0].name, 'test2');

            // ---------- CLEANUP ---------
            db.close();
        });

        it('RANGE', () => {
            // ---------- ARRANGE ----------
            const db = new Database(':memory:');
            db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    age INTEGER NOT NULL
                );
            `);
            const insert = db.prepare('INSERT INTO testData (age) VALUES (?)');
            insert.run(1);
            insert.run(2);
            insert.run(3);
            insert.run(4);

            type DataTest = { id: number; age: number };

            const metadata: Metadata<DataTest> = {
                tableName: 'testData',
                id: 'id',
                age: 'age',
            };

            const search: Search<DataTest> = { age: { [Condition.GREATER]: 1, [Condition.LESSER]: 4 } };

            // ---------- ACT ----------
            const [queryString, values] = buildQueryString({ search }, metadata);
            const data = db.prepare(queryString).all(values) as DataTest[];

            // ---------- ASSERT ---------
            assert.equal(data.length, 2);
            assert.equal(data[0].age, 2);
            assert.equal(data[1].age, 3);

            // ---------- CLEANUP ---------
            db.close();
        });

        it('IN', () => {
            // ---------- ARRANGE ----------
            const db = new Database(':memory:');
            db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    age INTEGER NOT NULL
                );
            `);
            const insert = db.prepare('INSERT INTO testData (age) VALUES (?)');
            insert.run(1);
            insert.run(2);
            insert.run(3);
            insert.run(4);

            type DataTest = { id: number; age: number };

            const metadata: Metadata<DataTest> = {
                tableName: 'testData',
                id: 'id',
                age: 'age',
            };

            const search: Search<DataTest> = { age: [1, 3] };

            // ---------- ACT ----------
            const [queryString, values] = buildQueryString({ search }, metadata);
            const data = db.prepare(queryString).all(values) as DataTest[];

            // ---------- ASSERT ---------
            assert.equal(data.length, 2);
            assert.equal(data[0].age, 1);
            assert.equal(data[1].age, 3);

            // ---------- CLEANUP ---------
            db.close();
        });

        it('LIKE', () => {
            // ---------- ARRANGE ----------
            const db = new Database(':memory:');
            db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL
                );
            `);
            const insert = db.prepare('INSERT INTO testData (name) VALUES (?)');
            insert.run('john');
            insert.run('jane');
            insert.run('steve');
            insert.run('josh');

            type DataTest = { id: number; name: string };

            const metadata: Metadata<DataTest> = {
                tableName: 'testData',
                id: 'id',
                name: 'name',
            };

            const search: Search<DataTest> = { name: { [Condition.LIKE]: 'j%' } };

            // ---------- ACT ----------
            const [queryString, values] = buildQueryString({ search }, metadata);
            const data = db.prepare(queryString).all(values) as DataTest[];

            // ---------- ASSERT ---------
            assert.equal(data.length, 3);
            assert.equal(data[0].name, 'john');
            assert.equal(data[1].name, 'jane');
            assert.equal(data[2].name, 'josh');

            // ---------- CLEANUP ---------
            db.close();
        });

        // --------------- NOTS ------------------

        it('NOT EQUAL', () => {
            // ---------- ARRANGE ----------
            const db = new Database(':memory:');
            db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL
                );
            `);
            const insert = db.prepare('INSERT INTO testData (name) VALUES (?)');
            insert.run('test1');
            insert.run('test2');
            insert.run('test3');

            type DataTest = { id: number; name: string };

            const metadata: Metadata<DataTest> = {
                tableName: 'testData',
                id: 'id',
                name: 'name',
            };

            const search: Search<DataTest> = { name: { [Condition.EQUAL]: 'test2', [Condition.NOT]: true } };

            // ---------- ACT ----------
            const [queryString, values] = buildQueryString({ search }, metadata);
            const data = db.prepare(queryString).all(values) as DataTest[];

            // ---------- ASSERT ---------
            assert.equal(data.length, 2);
            assert.equal(data[0].name, 'test1');
            assert.equal(data[1].name, 'test3');

            // ---------- CLEANUP ---------
            db.close();
        });

        it('NOT IN RANGE', () => {
            // ---------- ARRANGE ----------
            const db = new Database(':memory:');
            db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    age INTEGER NOT NULL
                );
            `);
            const insert = db.prepare('INSERT INTO testData (age) VALUES (?)');
            insert.run(1);
            insert.run(2);
            insert.run(3);
            insert.run(4);

            type DataTest = { id: number; age: number };

            const metadata: Metadata<DataTest> = {
                tableName: 'testData',
                id: 'id',
                age: 'age',
            };

            const search: Search<DataTest> = { age: { [Condition.GREATER]: 1, [Condition.LESSER]: 4, [Condition.NOT]: true } };

            // ---------- ACT ----------
            const [queryString, values] = buildQueryString({ search }, metadata);
            const data = db.prepare(queryString).all(values) as DataTest[];

            // ---------- ASSERT ---------
            assert.equal(data.length, 2);
            assert.equal(data[0].age, 1);
            assert.equal(data[1].age, 4);

            // ---------- CLEANUP ---------
            db.close();
        });

        it('NOT LIKE', () => {
            // ---------- ARRANGE ----------
            const db = new Database(':memory:');
            db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL
                );
            `);
            const insert = db.prepare('INSERT INTO testData (name) VALUES (?)');
            insert.run('john');
            insert.run('jane');
            insert.run('steve');
            insert.run('josh');

            type DataTest = { id: number; name: string };

            const metadata: Metadata<DataTest> = {
                tableName: 'testData',
                id: 'id',
                name: 'name',
            };

            const search: Search<DataTest> = { name: { [Condition.LIKE]: 'j%', [Condition.NOT]: true } };

            // ---------- ACT ----------
            const [queryString, values] = buildQueryString({ search }, metadata);
            const data = db.prepare(queryString).all(values) as DataTest[];

            // ---------- ASSERT ---------
            assert.equal(data.length, 1);
            assert.equal(data[0].name, 'steve');

            // ---------- CLEANUP ---------
            db.close();
        });

        it('NOT ROOT', () => {
            // ---------- ARRANGE ----------
            const db = new Database(':memory:');
            db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    age INTEGER NOT NULL
                );
            `);
            const insert = db.prepare('INSERT INTO testData (name, age) VALUES (?,?)');
            insert.run('john', 10);
            insert.run('jane', 20);
            insert.run('mark', 22);
            insert.run('steve', 30);
            insert.run('josh', 40);

            type DataTest = { id: number; name: string; age: number };

            const metadata: Metadata<DataTest> = {
                tableName: 'testData',
                id: 'id',
                name: 'name',
                age: 'age',
            };

            const search: Search<DataTest> = { [Condition.NOT]: true, name: { [Condition.LIKE]: '%a%' }, age: { [Condition.GREATER]: 19, [Condition.LESSER]: 30 } };

            // ---------- ACT ----------
            const [queryString, values] = buildQueryString({ search }, metadata);
            const data = db.prepare(queryString).all(values) as DataTest[];

            // ---------- ASSERT ---------
            assert.equal(data.length, 3);
            assert.equal(data[0].name, 'john');
            assert.equal(data[1].name, 'steve');
            assert.equal(data[2].name, 'josh');

            // ---------- CLEANUP ---------
            db.close();
        });

        it('NOT ROOT', () => {
            // ---------- ARRANGE ----------
            const db = new Database(':memory:');
            db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    age INTEGER NOT NULL
                );
            `);
            const insert = db.prepare('INSERT INTO testData (name, age) VALUES (?,?)');
            insert.run('john', 10);
            insert.run('jane', 20);
            insert.run('mark', 22);
            insert.run('steve', 30);
            insert.run('josh', 40);

            type DataTest = { id: number; name: string; age: number };

            const metadata: Metadata<DataTest> = {
                tableName: 'testData',
                id: 'id',
                name: 'name',
                age: 'age',
            };

            const search: Search<DataTest> = { [Condition.NOT]: true, name: { [Condition.LIKE]: '%a%' }, age: { [Condition.GREATER]: 19, [Condition.LESSER]: 30 } };

            // ---------- ACT ----------
            const [queryString, values] = buildQueryString({ search }, metadata);
            const data = db.prepare(queryString).all(values) as DataTest[];

            // ---------- ASSERT ---------
            assert.equal(data.length, 3);
            assert.equal(data[0].name, 'john');
            assert.equal(data[1].name, 'steve');
            assert.equal(data[2].name, 'josh');

            // ---------- CLEANUP ---------
            db.close();
        });

        // --------------------------------- RELATIONS ------------------
        it('one to many (INBOUND)', () => {
            // ---------- ARRANGE ----------
            const db = new Database(':memory:');
            db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL
                );
                CREATE TABLE testDataChild (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    parentId INTEGER NOT NULL,
                    description TEXT NOT NULL,
                    FOREIGN KEY (parentId) REFERENCES testData(id)
                );
            `);
            const insert = db.prepare('INSERT INTO testData (name) VALUES (?)');
            const insertChild = db.prepare('INSERT INTO testDataChild (parentId, description) VALUES (?, ?)');
            const parentId1 = insert.run('test1').lastInsertRowid;
            const parentId2 = insert.run('test2').lastInsertRowid;
            insertChild.run(parentId1, 'child1');
            insertChild.run(parentId1, 'child2');
            insertChild.run(parentId2, 'child3');

            type DataTest = { id: number; name: string; children: { id: number; parentId: number; description: string }[] };

            const metadata: Metadata<DataTest> = {
                tableName: 'testData',
                id: 'id',
                name: 'name',
                children: { targetMetadata: { tableName: 'testDataChild', id: 'id', parentId: 'parentId', description: 'description' }, targetForeignKey: 'parentId', sourceRefKey: 'id' },
            };

            const search: Search<DataTest> = { children: { description: 'child1' } };

            // ---------- ACT ----------
            const [queryString, values] = buildQueryString({ search }, metadata);
            const data = db.prepare(queryString).all(values) as DataTest[];

            // ---------- ASSERT ---------
            assert.equal(data.length, 1);
            assert.equal(data[0].name, 'test1');

            // ---------- CLEANUP ---------
            db.close();
        });

        it('many to one (OUTBOUND)', () => {
            // ---------- ARRANGE ----------
            const db = new Database(':memory:');
            db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    bioId INTEGER,
                    FOREIGN KEY (bioId) REFERENCES testDataBio(id)
                );
                CREATE TABLE testDataBio (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    height REAL NOT NULL
                );
            `);
            const insert = db.prepare('INSERT INTO testData (name, bioId) VALUES (?, ?)');
            const insertBio = db.prepare('INSERT INTO testDataBio (height) VALUES (?)');
            const bioId1 = insertBio.run(180).lastInsertRowid;
            const bioId2 = insertBio.run(175).lastInsertRowid;
            insert.run('test1', bioId1);
            insert.run('test2', bioId2);
            insert.run('test3', null);

            type DataTest = { id: number; name: string; bio: { id: number; height: number } };

            const metadata: Metadata<DataTest> = {
                tableName: 'testData',
                id: 'id',
                name: 'name',
                bio: { targetMetadata: { tableName: 'testDataBio', id: 'id', height: 'height' }, sourceForeignkey: 'bioId', targetRefKey: 'id' },
            };

            const search: Search<DataTest> = { bio: { height: 175 } };

            // ---------- ACT ----------
            const [queryString, values] = buildQueryString({ search }, metadata);
            const data = db.prepare(queryString).all(values) as DataTest[];

            // ---------- ASSERT ---------
            assert.equal(data.length, 1);
            assert.equal(data[0].name, 'test2');

            // ---------- CLEANUP ---------
            db.close();
        });

        it('many to many (BRIDGE)', () => {
            // ---------- ARRANGE ----------
            const db = new Database(':memory:');
            db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL
                );
                CREATE TABLE testDataTag (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL
                );
                CREATE TABLE testData_tags (
                    testDataId INTEGER NOT NULL,
                    tagId INTEGER NOT NULL,
                    PRIMARY KEY (testDataId, tagId),
                    FOREIGN KEY (testDataId) REFERENCES testData(id),
                    FOREIGN KEY (tagId) REFERENCES testDataTag(id)
                );
            `);
            const insert = db.prepare('INSERT INTO testData (name) VALUES (?)');
            const insertTag = db.prepare('INSERT INTO testDataTag (name) VALUES (?)');
            const insertBridge = db.prepare('INSERT INTO testData_tags (testDataId, tagId) VALUES (?, ?)');
            const tagId1 = insertTag.run('tag1').lastInsertRowid;
            const tagId2 = insertTag.run('tag2').lastInsertRowid;
            const dataId1 = insert.run('test1').lastInsertRowid;
            const dataId2 = insert.run('test2').lastInsertRowid;
            insertBridge.run(dataId1, tagId1);
            insertBridge.run(dataId1, tagId2);
            insertBridge.run(dataId2, tagId1);

            type DataTest = { id: number; name: string; tags: { id: number; name: string }[] };

            const metadata: Metadata<DataTest> = {
                tableName: 'testData',
                id: 'id',
                name: 'name',
                tags: { targetMetadata: { tableName: 'testDataTag', id: 'id', name: 'name' }, bridgeTable: 'testData_tags', sourceRefKey: 'id', targetRefKey: 'id', bridgeSourceForeignKey: 'testDataId', bridgeTargetForeignKey: 'tagId' },
            };

            const search: Search<DataTest> = { tags: { name: 'tag2' } };

            // ---------- ACT ----------
            const [queryString, values] = buildQueryString({ search }, metadata);
            const data = db.prepare(queryString).all(values) as DataTest[];

            // ---------- ASSERT ---------
            assert.equal(data.length, 1);
            assert.equal(data[0].name, 'test1');

            // ---------- CLEANUP ---------
            db.close();
        });

        // --------------------------------- FIELDS --------------------------
        it('select only name field', () => {
            // ---------- ARRANGE ----------
            const db = new Database(':memory:');
            db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    age INTEGER NOT NULL
                );
            `);
            const insert = db.prepare('INSERT INTO testData (name, age) VALUES (?, ?)');
            insert.run('john', 10);
            insert.run('jane', 20);
            insert.run('mark', 22);
            insert.run('steve', 30);
            insert.run('josh', 40);

            type DataTest = { id: number; name: string; age: number };

            const metadata: Metadata<DataTest> = {
                tableName: 'testData',
                id: 'id',
                name: 'name',
                age: 'age',
            };


            const fields: Field<DataTest> = {
                name: true,
            };

            // ---------- ACT ----------
            const [queryString, values] = buildQueryString({ fields }, metadata);
            const data = db.prepare(queryString).all(values) as Partial<DataTest>[];

            // ---------- ASSERT ---------
            assert.equal(data.length, 5);
            assert.equal(data[0].name, 'john');
            assert.equal(data[1].name, 'jane');
            assert.equal(data[2].name, 'mark');
            assert.equal(data[3].name, 'steve');
            assert.equal(data[4].name, 'josh');

            assert.equal(data[0].age, undefined);
            assert.equal(data[1].age, undefined);
            assert.equal(data[2].age, undefined);
            assert.equal(data[3].age, undefined);
            assert.equal(data[4].age, undefined);

            assert.equal(data[0].id, undefined);
            assert.equal(data[1].id, undefined);
            assert.equal(data[2].id, undefined);
            assert.equal(data[3].id, undefined);
            assert.equal(data[4].id, undefined);

            // ---------- CLEANUP ---------
            db.close();
        });

        // --------------------------------- ORDER --------------------------
        describe('order', () => {
            it('order by age DESC', () => {
                // ---------- ARRANGE ----------
                const db = new Database(':memory:');
                db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    age INTEGER NOT NULL
                );
            `);
                const insert = db.prepare('INSERT INTO testData (name, age) VALUES (?, ?)');
                insert.run('steve', 30);
                insert.run('john', 10);
                insert.run('mark', 22);
                insert.run('josh', 40);
                insert.run('jane', 20);

                type DataTest = { id: number; name: string; age: number };

                const metadata: Metadata<DataTest> = {
                    tableName: 'testData',
                };
                const order: Order<DataTest> = { age: { direction: OrderDirection.DESC } };

                // ---------- ACT ----------
                const [queryString, values] = buildQueryString({ order }, metadata);
                const data = db.prepare(queryString).all(values) as DataTest[];

                // ---------- ASSERT ---------
                assert.equal(data.length, 5);
                assert.equal(data[0].age, 40);
                assert.equal(data[1].age, 30);
                assert.equal(data[2].age, 22);
                assert.equal(data[3].age, 20);
                assert.equal(data[4].age, 10);

                // ---------- CLEANUP ---------
                db.close();
            });
            it('order by age and name', () => {
                // ---------- ARRANGE ----------
                const db = new Database(':memory:');
                db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    age INTEGER NOT NULL
                );
            `);
                const insert = db.prepare('INSERT INTO testData (name, age) VALUES (?, ?)');
                insert.run('mark', 22);
                insert.run('steve', 30);
                insert.run('alex', 20);
                insert.run('john', 30);
                insert.run('jane', 20);
                insert.run('josh', 22);

                type DataTest = { id: number; name: string; age: number };

                const metadata: Metadata<DataTest> = {
                    tableName: 'testData',
                };
                const order: Order<DataTest> = { age: { direction: OrderDirection.DESC, priority: 1 }, name: { direction: OrderDirection.ASC, priority: 2 } };

                // ---------- ACT ----------
                const [queryString, values] = buildQueryString({ order }, metadata);
                const data = db.prepare(queryString).all(values) as DataTest[];

                // ---------- ASSERT ---------
                assert.equal(data.length, 6);

                assert.equal(data[0].age, 30);
                assert.equal(data[0].name, 'john');
                assert.equal(data[1].age, 30);
                assert.equal(data[1].name, 'steve');

                assert.equal(data[2].age, 22);
                assert.equal(data[2].name, 'josh');
                assert.equal(data[3].age, 22);
                assert.equal(data[3].name, 'mark');

                assert.equal(data[4].age, 20);
                assert.equal(data[4].name, 'alex');
                assert.equal(data[5].age, 20);
                assert.equal(data[5].name, 'jane');
                // ---------- CLEANUP ---------
                db.close();
            });
            it('nulls first', () => {
                // ---------- ARRANGE ----------
                const db = new Database(':memory:');
                db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT
                );
            `);
                const insert = db.prepare('INSERT INTO testData (name) VALUES (?)');
                insert.run('mark');
                insert.run('steve');
                insert.run('alex');
                insert.run(null);
                insert.run('jane');
                insert.run(null);

                type DataTest = { name: string; };

                const metadata: Metadata<DataTest> = {
                    tableName: 'testData',
                };
                const order: Order<DataTest> = { name: { direction: OrderDirection.DESC, nulls: 'FIRST' } };

                // ---------- ACT ----------
                const [queryString, values] = buildQueryString({ order }, metadata);
                const data = db.prepare(queryString).all(values) as DataTest[];

                // ---------- ASSERT ---------
                assert.equal(data.length, 6);

                assert.equal(data[0].name, null);
                assert.equal(data[1].name, null);
                assert.equal(data[2].name, 'steve');
                assert.equal(data[3].name, 'mark');
                assert.equal(data[4].name, 'jane');
                assert.equal(data[5].name, 'alex');

                // ---------- CLEANUP ---------
                db.close();
            });
            it('nulls last', () => {
                // ---------- ARRANGE ----------
                const db = new Database(':memory:');
                db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT
                );
            `);
                const insert = db.prepare('INSERT INTO testData (name) VALUES (?)');
                insert.run('mark');
                insert.run('steve');
                insert.run('alex');
                insert.run(null);
                insert.run('jane');
                insert.run(null);

                type DataTest = { name: string; };

                const metadata: Metadata<DataTest> = {
                    tableName: 'testData',
                };
                const order: Order<DataTest> = { name: { direction: OrderDirection.DESC, nulls: 'LAST' } };

                // ---------- ACT ----------
                const [queryString, values] = buildQueryString({ order }, metadata);
                const data = db.prepare(queryString).all(values) as DataTest[];

                // ---------- ASSERT ---------
                assert.equal(data.length, 6);

                assert.equal(data[0].name, 'steve');
                assert.equal(data[1].name, 'mark');
                assert.equal(data[2].name, 'jane');
                assert.equal(data[3].name, 'alex');
                assert.equal(data[4].name, null);
                assert.equal(data[5].name, null);

                // ---------- CLEANUP ---------
                db.close();
            });
        });
        describe('pagination', () => {
            it('first page of 2 elements', () => {
                // ---------- ARRANGE ----------
                const db = new Database(':memory:');
                db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL
                );
            `);
                const insert = db.prepare('INSERT INTO testData (name) VALUES (?)');
                insert.run('mark');
                insert.run('steve');
                insert.run('alex');
                insert.run('jane');

                type DataTest = { id: number; name: string; };

                const metadata: Metadata<DataTest> = {
                    tableName: 'testData',
                };

                // ---------- ACT ----------
                const [queryString, values] = buildQueryString({ page: 0, pageSize: 2 }, metadata);
                const data = db.prepare(queryString).all(values) as DataTest[];

                // ---------- ASSERT ---------
                assert.equal(data.length, 2);
                assert.equal(data[0].name, 'mark');
                assert.equal(data[1].name, 'steve');

                // ---------- CLEANUP ---------
                db.close();
            });
            it('second page of 2 elements', () => {
                // ---------- ARRANGE ----------
                const db = new Database(':memory:');
                db.exec(`
                CREATE TABLE testData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL
                );
            `);
                const insert = db.prepare('INSERT INTO testData (name) VALUES (?)');
                insert.run('mark');
                insert.run('steve');
                insert.run('alex');
                insert.run('jane');

                type DataTest = { id: number; name: string; };

                const metadata: Metadata<DataTest> = {
                    tableName: 'testData',
                };

                // ---------- ACT ----------
                const [queryString, values] = buildQueryString({ page: 1, pageSize: 2 }, metadata);
                const data = db.prepare(queryString).all(values) as DataTest[];

                // ---------- ASSERT ---------
                assert.equal(data.length, 2);
                assert.equal(data[0].name, 'alex');
                assert.equal(data[1].name, 'jane');

                // ---------- CLEANUP ---------
                db.close();
            });
        });
    });

    // test by everything together
    it('everything together', () => {
        // ---------- ARRANGE ----------
        const db = new Database(':memory:');
        db.exec(`
            CREATE TABLE testData (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                age INTEGER NOT NULL,
                bioId INTEGER,
                FOREIGN KEY (bioId) REFERENCES testDataBio(id)
            );
            CREATE TABLE testDataChild (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                parentId INTEGER NOT NULL,
                description TEXT NOT NULL,
                FOREIGN KEY (parentId) REFERENCES testData(id)
            );
            CREATE TABLE testDataBio (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                height REAL NOT NULL
            );
            CREATE TABLE testDataTag (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
            );
            CREATE TABLE testData_tags (
                testDataId INTEGER NOT NULL,
                tagId INTEGER NOT NULL,
                PRIMARY KEY (testDataId, tagId),
                FOREIGN KEY (testDataId) REFERENCES testData(id),
                FOREIGN KEY (tagId) REFERENCES testDataTag(id)
            );
        `);

        const insertBio = db.prepare('INSERT INTO testDataBio (height) VALUES (?)');
        const bioId1 = insertBio.run(180).lastInsertRowid;
        const bioId2 = insertBio.run(175).lastInsertRowid;
        const bioId3 = insertBio.run(160).lastInsertRowid;
        const bioId4 = insertBio.run(190).lastInsertRowid;
        const bioId5 = insertBio.run(200).lastInsertRowid;
        const bioId6 = insertBio.run(150).lastInsertRowid;

        const insertTag = db.prepare('INSERT INTO testDataTag (name) VALUES (?)');
        const tagId1 = insertTag.run('tag1').lastInsertRowid;
        const tagId2 = insertTag.run('tag2').lastInsertRowid;
        const tagId3 = insertTag.run('tag3').lastInsertRowid;
        const tagId4 = insertTag.run('tag4').lastInsertRowid;

        const insert = db.prepare('INSERT INTO testData (name, age, bioId) VALUES (?, ?, ?)');
        const dataId1 = insert.run('steve', 30, bioId1).lastInsertRowid;

        const dataId3 = insert.run('mark', 22, bioId3).lastInsertRowid;
        const dataId5 = insert.run('jane', 20, bioId5).lastInsertRowid;
        const dataId6 = insert.run('alex', 15, bioId6).lastInsertRowid;
        const dataId4 = insert.run('josh', 40, bioId4).lastInsertRowid;
        const dataId2 = insert.run('john', 10, bioId2).lastInsertRowid;

        const insertChild = db.prepare('INSERT INTO testDataChild (parentId, description) VALUES (?, ?)');
        insertChild.run(dataId1, 'child1match');
        insertChild.run(dataId1, 'child2');
        insertChild.run(dataId2, 'child3match');
        insertChild.run(dataId3, 'child4');
        insertChild.run(dataId4, 'child5match');
        insertChild.run(dataId5, 'child6');
        insertChild.run(dataId5, 'child7');
        insertChild.run(dataId5, 'child8match');
        insertChild.run(dataId6, 'child9match');

        const insertBridge = db.prepare('INSERT INTO testData_tags (testDataId, tagId) VALUES (?, ?)');
        insertBridge.run(dataId1, tagId1);
        insertBridge.run(dataId1, tagId2);
        insertBridge.run(dataId2, tagId1);
        insertBridge.run(dataId3, tagId2);
        insertBridge.run(dataId4, tagId1);
        insertBridge.run(dataId5, tagId3);
        insertBridge.run(dataId6, tagId1);
        insertBridge.run(dataId6, tagId2);
        insertBridge.run(dataId1, tagId3);
        insertBridge.run(dataId1, tagId4);
        insertBridge.run(dataId2, tagId4);
        insertBridge.run(dataId3, tagId3);
        insertBridge.run(dataId4, tagId2);
        insertBridge.run(dataId5, tagId4);
        insertBridge.run(dataId6, tagId3);
        insertBridge.run(dataId6, tagId4);


        type DataTest = {
            id: number;
            name: string;
            age: number;
            bio: {
                id: number;
                height: number
            };
            children: {
                id: number;
                parentId: number;
                description: string
            }[];
            tags: {
                id: number;
                name: string
            }[]
        };

        const metadata: Metadata<DataTest> = {
            tableName: 'testData',
            id: 'id',
            name: 'name',
            age: 'age',
            bio: {
                targetMetadata: {
                    tableName: 'testDataBio',
                    id: 'id',
                    height: 'height'
                },
                sourceForeignkey: 'bioId',
                targetRefKey: 'id'
            },
            children: {
                targetMetadata: {
                    tableName: 'testDataChild',
                    id: 'id',
                    parentId: 'parentId',
                    description: 'description'
                },
                targetForeignKey: 'parentId',
                sourceRefKey: 'id'
            },
            tags: {
                targetMetadata: {
                    tableName: 'testDataTag',
                    id: 'id',
                    name: 'name'
                },
                bridgeTable: 'testData_tags',
                sourceRefKey: 'id',
                targetRefKey: 'id',
                bridgeSourceForeignKey: 'testDataId',
                bridgeTargetForeignKey: 'tagId'
            },
        };

        const search: Search<DataTest> = {
            age: { [Condition.GREATER]: 10, [Condition.LESSER]: 20, [Condition.NOT]: true },
            bio: { height: { [Condition.GREATER]: 170 } },
            tags: { name: ['tag2', 'tag1'] },
            children: { description: { [Condition.LIKE]: '%match%' } }
        };
        const fields: Field<DataTest> = { name: true };
        const order: Order<DataTest> = { name: { direction: OrderDirection.ASC } };

        // ---------- ACT ----------
        const [queryString, values] = buildQueryString({ search, fields, order, page: 0, pageSize: 2 }, metadata);
        const data = db.prepare(queryString).all(values) as Partial<DataTest>[];

        // ---------- ASSERT ---------
        assert.equal(data.length, 2);
        assert.equal(data[0].name, 'john');
        assert.equal(data[0].age, undefined);
        assert.equal(data[0].id, undefined);

        assert.equal(data[1].name, 'josh');
        assert.equal(data[1].age, undefined);
        assert.equal(data[1].id, undefined);

        // assert.equal(data[2].name, 'john');
        // assert.equal(data[2].age, undefined);
        // assert.equal(data[2].id, undefined);

        // ---------- CLEANUP ---------
        db.close();
    });
});
