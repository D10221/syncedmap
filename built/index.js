"use strict";
var syncedmap_1 = require('./syncedmap');
exports.Service = syncedmap_1.Service;
const syncedmap_2 = require('./syncedmap');
const fty = require('./factory');
var common_1 = require('./common');
exports.isChange = common_1.isChange;
exports.isKey = common_1.isKey;
exports.factory = {
    create: fty.create
};
exports.errors = { Empty: syncedmap_2.Empty, Exists: syncedmap_2.Exists, NotFound: syncedmap_2.NotFound, AlreadyDisposed: syncedmap_2.AlreadyDisposed, StoreError: syncedmap_2.StoreError };
//# sourceMappingURL=index.js.map