import { Fields, Order, OrderDirection, Search } from '../src';
import { Metadata } from '../src/metadata';

export type Tag = {
    id: number;
    name: string;
}
export type BioMetrics = {
    height: number;
    hairColor: string;
    eyeColor: string;
}

export type Veichle = {
    id: number;
    type: 'car' | 'bike' | 'truck';
    brand: string;
    model: string;
    year: number;
    owner: Person;
    tags: Tag[];
}

export type Person = {
    id?: number;
    name?: string;
    birthDate?: Date;
    nickNames?: string[];
    description?: string;
    age?: number;
    type?: 'admin' | 'user' | 'guest';
    isActive?: boolean;

    // self reference
    father?: Person;
    mother?: Person;

    // outbound relation
    bioMetrics?: BioMetrics;

    // inbound relations
    veichles?: Veichle[];

    // bridge tables
    tags?: Tag[];

    // this should be ignored
    method?: () => void;
}

// ---------------------- METADATA --------------------


export const tagMetadata: Metadata<Tag> = {
    tableName: 'tags',
    id: 'id',
    name: 'name',
}

export const bioMetricsMetadata: Metadata<BioMetrics> = {
    tableName: 'bio_metrics',
    height: 'height',
    hairColor: 'hair_color',
    eyeColor: 'eye_color',
}

export const veichleMetadata: Metadata<Veichle> = {
    tableName: 'veichles',
    id: 'id',
    type: 'type',
    brand: 'brand',
    model: 'model',
    year: 'year',
    tags: {
        bridgeTable: 'veichle_tags',
        sourceRefKey: 'id',
        targetRefKey: 'id',
        bridgeSourceForeignKey: 'veichleId',
        bridgeTargetForeignKey: 'tagId',
        targetMetadata: tagMetadata
    },
}


export const personMetadata: Metadata<Person> = {
    tableName: 'person',
    id: 'id',
    name: 'name',
    birthDate: 'birthDate',
    description: 'description',
    age: 'age',
    type: 'type',
    isActive: 'isActive',

    // MANY TO MANY
    tags: {
        bridgeTable: 'person_tags',
        sourceRefKey: 'id',
        targetRefKey: 'id',
        bridgeSourceForeignKey: 'person_id',
        bridgeTargetForeignKey: 'tag_id',
        targetMetadata: tagMetadata
    },

    // ONE TO ONE
    bioMetrics: {
        sourceForeignkey: 'bioMetricsId',
        targetRefKey: 'id',
        targetMetadata: bioMetricsMetadata
    },

    // ONE TO MANY
    veichles: {
        sourceRefKey: 'id',
        targetForeignKey: 'ownerId',
        targetMetadata: veichleMetadata
    }
}

// MANY TO ONE
veichleMetadata.owner = {
    sourceForeignkey: 'ownerId',
    targetRefKey: 'id',
    targetMetadata: personMetadata
}

// MANY TO ONE SELF REFERENCE
personMetadata.father = {
    sourceForeignkey: 'fatherId',
    targetRefKey: 'id',
    targetMetadata: personMetadata
}

// MANY TO ONE SELF REFERENCE
personMetadata.mother = {
    sourceForeignkey: 'motherId',
    targetRefKey: 'id',
    targetMetadata: personMetadata
}

// ---------------------- SEARCH ----------------------

const testOkSearch: Search<Person> = {
    $_not: true,
    id: 5,
    name: { $_lk: 'John' },
    age: { $_gt: 18 },
    birthDate: { $_gt: new Date('2020-01-01'), $_lt: new Date('2020-12-31') },
    isActive: { $_eq: true },
    description: { $_not: true, $_eq: "avoid me" }, // description is string, so $_gt should be ignored
    tags: { name: 'tag1' },
    bioMetrics: {
        height: { $_gt: 170 },
        hairColor: 'brown',
    },
    veichles: {
        type: 'car',
        brand: 'Toyota',
        year: { $_gt: 2015 },
        tags: { name: { $_lk: 'suv' } },
        id: { $_eq: 10 }
    },
}




// ---------------------- FIELDS ----------------------

const testOkFields: Fields<Person> = {
    id: true,
    name: true,
    age: true,
    birthDate: true,
    tags: {
        id: true,
        name: true,
    },
    bioMetrics: {
        height: true,
        hairColor: true,
        eyeColor: true,
    },
    veichles: {
        id: true,
        type: true,
        brand: true,
        model: true,
        year: true,
        tags: {
            id: true,
            name: true,
        }
    }
}

const testOkFields2: Fields<Person> = {
    id: true,
    name: true,
    age: true,
    birthDate: true,
    tags: true, // string Array field can be true
    bioMetrics: true, // object field can be true
    veichles: true, // Array field can be true
}





// ---------------------- ORDER ----------------------


const testOkOrder: Order<Person> = {
    id: { direction: OrderDirection.ASC, priority: 1 },
    name: { direction: OrderDirection.ASC, priority: 1 },
    age: { direction: OrderDirection.ASC, priority: 1 },
    birthDate: { direction: OrderDirection.ASC, priority: 1 },


    bioMetrics: {
        height: { direction: OrderDirection.ASC, priority: 1 },
        hairColor: { direction: OrderDirection.ASC, priority: 1 },
        eyeColor: { direction: OrderDirection.ASC, priority: 1 },
    },

    veichles: {
        id: { direction: OrderDirection.ASC, priority: 1 },
        type: { direction: OrderDirection.ASC, priority: 1 },
        brand: { direction: OrderDirection.ASC, priority: 1 },
        model: { direction: OrderDirection.ASC, priority: 1 },
        year: { direction: OrderDirection.ASC, priority: 1 },
        tags: {
            id: { direction: OrderDirection.ASC, priority: 1 },
            name: { direction: OrderDirection.ASC, priority: 1 },
        }
    },

    tags: {
        id: { direction: OrderDirection.ASC, priority: 1 },
        name: { direction: OrderDirection.ASC, priority: 1 },
    } // object Array field can be an object    
}

