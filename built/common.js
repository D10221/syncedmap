"use strict";
function isKey(x) {
    return 'string' == typeof (x) || 'number' == typeof x || 'symbol' == typeof x;
}
exports.isKey = isKey;
function isChange(key) {
    for (let eKey of ['set', 'add', 'remove', 'clear',]) {
        if (key == eKey) {
            return true;
        }
    }
    return false;
}
exports.isChange = isChange;
//# sourceMappingURL=common.js.map