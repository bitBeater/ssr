import { describe, it } from 'node:test';
import assert from 'node:assert';
import BetterSqlite3, { Database } from 'better-sqlite3';
import { Person, personMetadata } from '../valid_types';
import { buildInsertQueryString, } from '@bitbeater/ssr/query_builder/sqlite3';



describe('sqlite3 query builder: insert', () => {
    it('should build a valid insert query string', () => {
        const data: Person = { id: 2, name: 'Bob', isActive: false, birthDate: new Date('1995-05-15'), method: () => { } };

        const [query, values] = buildInsertQueryString([data], personMetadata);

        assert.strictEqual(query, 'INSERT INTO person (id, name, birthDate, description, age, type, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)');
        assert.deepStrictEqual(values, [2, 'Bob', '1995-05-15 00:00:00', null, null, null, 'FALSE']);
    });

    it('should build a valid insert query string for multiple records', () => {
        const data: Person[] = [
            { id: 2, name: 'Bob', isActive: false, birthDate: new Date('1995-05-15'), method: () => { } },
            { id: 3, name: 'Charlie', isActive: true, birthDate: new Date('1988-10-20'), method: () => { } }
        ];

        const [query, values] = buildInsertQueryString(data, personMetadata);

        assert.strictEqual(query, 'INSERT INTO person (id, name, birthDate, description, age, type, isActive) VALUES (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)');
        assert.deepStrictEqual(values, [
            2, 'Bob', '1995-05-15 00:00:00', null, null, null, 'FALSE',
            3, 'Charlie', '1988-10-20 00:00:00', null, null, null, 'TRUE'
        ]);
    });

    it('Write on db', () => {
        // ---------- ARRANGE ----------
        const db = new BetterSqlite3(':memory:');;

        db.exec(`
                CREATE TABLE person (
                    id INTEGER,
                    name TEXT,
                    birthDate DATETIME,
                    isActive BOOLEAN,

                    description TEXT,
                    age INTEGER,
                    type TEXT
                );
            `);


        const data: Person[] = [
            { id: 1, name: 'Bob', birthDate: new Date('1995-05-15'), isActive: false, method: () => { } },
            { id: 2, name: 'Charlie', birthDate: new Date('1988-10-20'), isActive: true, method: () => { } }
        ];

        const [query, values] = buildInsertQueryString(data, personMetadata);



        // const stmt = db.prepare(query);
        // const info = stmt.run(values);

        // ---------- ACT ----------

        // const [queryString, values] = buildQueryString({ search, fields, order, page: 0, pageSize: 2 }, metadata);
        // const data = db.prepare(queryString).all(values) as Partial<DataTest>[];


        let stmt;
        let info;
        try {
            stmt = db.prepare(query);
            info = stmt.run(values);
        } catch (error) {
            console.error('Error preparing statement:', error);
            throw error;
        }

        const insertedData = db.prepare('SELECT * FROM person').all();

        // ---------- ASSERT ---------

        assert.strictEqual(info.changes, 2);
        assert.deepStrictEqual(insertedData, [
            { id: 1, name: 'Bob', birthDate: '1995-05-15 00:00:00', isActive: 'FALSE', description: null, age: null, type: null },
            { id: 2, name: 'Charlie', birthDate: '1988-10-20 00:00:00', isActive: 'TRUE', description: null, age: null, type: null }
        ]);

        // ---------- CLEANUP ---------
        db.close();
    });
});

