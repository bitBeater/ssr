import { describe, it } from "node:test";
import { buildWhereQueryString, Search, } from '@alexrr2iggs/ssr';
import assert from "node:assert";
import { Person, personMetadata } from "./valid_types";


describe('query builder', () => {
    it('1. simple query builder', () => {

        // all persons with name like '%ohn%' and age between 18 and 30 and isActive true and description not equal to 'avoid me'
        // name LIKE '%ohn%' AND age > 18 AND age < 30 AND isActive = true AND NOT (description = 'avoid me')
        const searchOperators: Search<Person> = {
            name: { $_lk: 'ohn' },
            age: { $_gt: 18, $_lt: 30 },
            isActive: true,
            description: { $_eq: "avoid me", $_not: true },
        };

        const [queryString, values] = buildWhereQueryString(searchOperators, personMetadata);
        const expectedQueryString = `person.name LIKE ? AND person.age > ? AND person.age < ? AND person.isActive = ? AND NOT person.description = ?`;
        const expectedValues = ['ohn', 18, 30, true, 'avoid me'];

        assert.equal(queryString, expectedQueryString);
        assert.deepEqual(values, expectedValues);
    });


    it('2. one to many query builder', () => {
        // all persons that have a veichle with model 'corolla' and year greater than 2010, and age greater than 18
        // person.age > 18 AND person.id IN (SELECT veichles.ownerId FROM veichles WHERE veichles.year > 2010 AND veichles.model = 'corolla');
        const searchOperators: Search<Person> = {
            age: { $_gt: 18 },
            veichles: {
                year: { $_gt: 2010 },
                model: 'corolla'
            }
        };

        const [queryString, values] = buildWhereQueryString(searchOperators, personMetadata);
        const expectedQueryString = `person.age > ? AND person.id IN (SELECT veichles.ownerId FROM veichles WHERE veichles.year > ? AND veichles.model = ?)`;
        const expectedValues = [18, 2010, 'corolla'];

        assert.equal(queryString, expectedQueryString);
        assert.deepEqual(values, expectedValues);
    });

    it('3. many to many query builder', () => {
        // all persons that have a tag with name like '%tag1%'
        // person.id IN (SELECT person_tags.person_id FROM person_tags WHERE person_tags.tag_id IN (SELECT tags.id FROM tags WHERE tags.name LIKE '%tag1%'));
        const searchOperators: Search<Person> = {
            tags: { name: { $_lk: 'tag1' } }
        };

        const [queryString, values] = buildWhereQueryString(searchOperators, personMetadata);

        const expectedQueryString = `person.id IN (SELECT person_tags.person_id FROM person_tags WHERE person_tags.tag_id IN (SELECT tags.id FROM tags WHERE tags.name LIKE ?))`;
        const expectedValues = ['tag1'];

        assert.equal(queryString, expectedQueryString);
        assert.deepEqual(values, expectedValues);
    });
});
