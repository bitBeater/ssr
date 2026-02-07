import { describe, it } from "node:test";
import { EqualCondition, RangeCondition, isRangeCondition, LikeCondition, isLikeCondition, Condition } from '@bitbeater/ssr';
import assert from "node:assert";


describe('search operators', () => {


    it('3. isRangeCondition works correctly', () => {
        const op: RangeCondition<number> = { [Condition.GREATER]: 10, [Condition.LESSER]: 20 };
        const shouldBeTrue = isRangeCondition(op);
        assert.equal(shouldBeTrue, true);
    });

    it('4. isRangeCondition works correctly whith only "greater"', () => {
        const op: RangeCondition<number> = { [Condition.GREATER]: 10 };
        const shouldBeTrue = isRangeCondition(op);
        assert.equal(shouldBeTrue, true);
    });

    it('5. isRangeCondition works correctly, with only "lesser"', () => {
        const op: RangeCondition<number> = { [Condition.LESSER]: 20 };
        const shouldBeTrue = isRangeCondition(op);
        assert.equal(shouldBeTrue, true);
    });

    it('6. isRangeCondition returns false for non-range operators', () => {
        const notARangeCondition: EqualCondition<number> = { [Condition.EQUAL]: 5 };
        const shouldBeFalse = isRangeCondition(notARangeCondition);
        assert.equal(shouldBeFalse, false);
    });

    it(`7. isLikeCondition works correctly`, () => {
        const LikeCondition: LikeCondition<string> = { [Condition.LIKE]: 'test' };
        const shouldBeTrue = isLikeCondition(LikeCondition);
        assert.equal(shouldBeTrue, true);
    });

    it(`8. isLikeCondition returns false for non-like operators`, () => {
        const EqulaCondition: EqualCondition<string> = { [Condition.EQUAL]: 'test' };
        const shouldBeFalse = isLikeCondition(EqulaCondition);
        assert.equal(shouldBeFalse, false);
    });


    // Add more tests as needed



});
