"use strict";
const fs = require('fs');
const encoder = require('map-encoder');
const syncedmap_1 = require('./syncedmap');
const persist = require('./persist');
function getStore(storePath) {
    return fs.existsSync(storePath) ? encoder.deserializeFromFileSync(storePath, false) : null;
}
/** Static Factory */
function create(key, storePath) {
    //
    let service = new syncedmap_1.Service(key, getStore(storePath));
    service.location = storePath;
    //
    let _subscription = service.onChange(persist.onNext, persist.onError, persist.onCompleted);
    service.on('dispose')
        .take(1)
        .subscribe(() => _subscription.unsubscribe());
    //
    return service;
}
exports.create = create;
//# sourceMappingURL=factory.js.map