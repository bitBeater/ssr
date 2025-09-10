import { describe, it } from "node:test";
import { isOperator, EqualOperator, RangeOperator, isRangeOperator, LikeOperator, isLikeOperator } from '@alexrr2iggs/ssr';
import assert from "node:assert";


describe('search operators', () => {
    it('1. isOperator works correctly', () => {
        const op1: EqualOperator<number> = { equal: 5 };
        const shouldBeTrue = isOperator(op1);
        assert.equal(shouldBeTrue, true);
    });

    it('2. isOperator returns false for non-operators', () => {
        const notAnOperator = { foo: 'bar' };
        const shouldBeFalse = isOperator(notAnOperator);
        assert.equal(shouldBeFalse, false);
    });

    it('3. isRangeOperator works correctly', () => {
        const op: RangeOperator<number> = { greater: 10, lesser: 20 };
        const shouldBeTrue = isRangeOperator(op);
        assert.equal(shouldBeTrue, true);
    });

    it('4. isRangeOperator works correctly whith only "greater"', () => {
        const op: RangeOperator<number> = { greater: 10 };
        const shouldBeTrue = isRangeOperator(op);
        assert.equal(shouldBeTrue, true);
    });

    it('5. isRangeOperator works correctly, with only "lesser"', () => {
        const op: RangeOperator<number> = { lesser: 20 };
        const shouldBeTrue = isRangeOperator(op);
        assert.equal(shouldBeTrue, true);
    });

    it('6. isRangeOperator returns false for non-range operators', () => {
        const notARangeOperator: EqualOperator<number> = { equal: 5 };
        const shouldBeFalse = isRangeOperator(notARangeOperator);
        assert.equal(shouldBeFalse, false);
    });

    it(`7. isLikeOperator works correctly`, () => {
        const likeOperator: LikeOperator<string> = { like: 'test' };
        const shouldBeTrue = isLikeOperator(likeOperator);
        assert.equal(shouldBeTrue, true);
    });

    it(`8. isLikeOperator returns false for non-like operators`, () => {
        const equalOperator: EqualOperator<string> = { equal: 'test' };
        const shouldBeFalse = isLikeOperator(equalOperator);
        assert.equal(shouldBeFalse, false);
    });


    // Add more tests as needed



});
