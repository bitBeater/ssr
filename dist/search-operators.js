"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOperator = isOperator;
exports.isEqualOperator = isEqualOperator;
exports.isLikeOperator = isLikeOperator;
exports.isRangeOperator = isRangeOperator;
function isOperator(operator) {
    return isEqualOperator(operator) ||
        isLikeOperator(operator) ||
        isRangeOperator(operator);
}
function isEqualOperator(operator) {
    return Object.keys(operator).includes('equal');
}
function isLikeOperator(operator) {
    return Object.keys(operator).includes('like');
}
function isRangeOperator(operator) {
    return Object.keys(operator).includes('greater') || Object.keys(operator).includes('lesser');
}
//# sourceMappingURL=search-operators.js.map