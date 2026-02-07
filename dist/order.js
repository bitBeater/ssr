"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderDirection = void 0;
exports.isOrderStrategy = isOrderStrategy;
var OrderDirection;
(function (OrderDirection) {
    OrderDirection["ASC"] = "ASC";
    OrderDirection["DESC"] = "DESC";
})(OrderDirection || (exports.OrderDirection = OrderDirection = {}));
function isOrderStrategy(obj) {
    return [OrderDirection.ASC, OrderDirection.DESC].includes(obj?.direction);
}
//# sourceMappingURL=order.js.map