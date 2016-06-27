"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const rxjs_1 = require('@reactivex/rxjs');
const chain_1 = require('chain');
const common_1 = require('./common');
let uuid = require('node-uuid');
class Service {
    constructor(getKey, map) {
        this.getKey = getKey;
        this._values = new Map();
        this._events = new rxjs_1.Subject();
        //short Alias
        this.on = this.getEvent;
        this.timeOut = 3000;
        this._disposed = false;
        this._values = map || new Map();
    }
    get values() { return this._values; }
    get events() { return this._events.asObservable(); }
    getEvent(event) {
        return this.events.filter(e => e.args.key == event);
        //.select(e => e.args.value);
    }
    publish(key, value) {
        this._events.next({ sender: this, args: { key: key, value: value } });
    }
    notify(sender, action, value) {
        this._events.next({ sender: sender, args: { key: action, value: value } });
    }
    get(key) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this._values.get(key));
            }
            catch (e) {
                reject(e);
            }
        });
    }
    set(value) {
        return this.addSetRemove('set', value);
    }
    remove(value) {
        return this.addSetRemove('remove', value);
    }
    add(value) {
        return this.addSetRemove('add', value);
    }
    validate(action, key, value) {
        if (action == 'add') {
            rejectEmpty(value);
            rejectEmpty(key);
            rejectExists(this, value);
            return;
        }
        if (action == 'set') {
            rejectEmpty(value);
            rejectEmpty(key);
            rejectNotFound(this, value);
            return;
        }
        if (action == 'remove') {
            rejectEmpty(value);
            rejectEmpty(key);
            rejectNotFound(this, value);
            return;
        }
    }
    internally(action, value) {
        let key = this.getKey(value);
        this.validate(action, key, value);
        if (action == 'add' || action == 'set') {
            this._values.set(key, value);
            return;
        }
        if (action == 'remove') {
            this._values.delete(key);
            return;
        }
    }
    addSetRemove(action, value) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                value = Array.isArray(value) ? value : [value];
                let changed = false;
                value.forEach(item => {
                    changed = true;
                    this.internally(action, item);
                });
                if (changed) {
                    let e = yield this.waitForPersists(action);
                    if (isError(e.args.value)) {
                        reject(e.args.value);
                        return;
                    }
                    resolve(e);
                }
                ;
            }
            catch (error) {
                console.log(`addSetRemove: Error: ${error.message}`);
                reject(error);
            }
        }));
    }
    persists(action, eventId) {
        this._events.next({ sender: this, args: { key: action, value: eventId } });
    }
    waitForPersists(action) {
        let me = this;
        let eventId = uuid.v4();
        return new Promise((resolve, reject) => {
            let x = this.onSave(eventId);
            // this line stops debugger  
            if (this.timeOut > 0) {
                x = x.timeout(this.timeOut);
            }
            x.subscribe((event) => {
                resolve({ sender: me, args: event.args });
            }, error => {
                reject(error);
            });
            this.persists(action, eventId);
        });
    }
    onSave(eventId /*: uuid */) {
        return this.events
            .filter(e => e.args.key == 'save' &&
            // if no eventId provided , then any ?
            (!eventId || e.args.value == eventId))
            .take(1);
        //.timeout(this.timeOut);
    }
    clear() {
        let me = this;
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            //...
            try {
                //..
                if (this.size == 0) {
                    resolve(this);
                    return;
                }
                this._values.clear();
                let e = yield this.waitForPersists('clear');
                if (isError(e.args.value)) {
                    reject(e.args.value);
                    return;
                }
                resolve({ sender: me, args: e.args });
            }
            catch (error) {
                console.log(`Clear: Error: ${error.message}`);
                reject(error);
            }
            //...
        }));
    }
    has(valueOrKey) {
        return common_1.isKey(valueOrKey) ? this._values.has(valueOrKey) : this._values.has(this.getKey(valueOrKey));
    }
    onChange(x) {
        let createObserver = (args) => {
            const onCompleted = args[2];
            if (typeof onCompleted != 'function') {
                throw new Error('next: is Not A fucntion');
            }
            ;
            const onError = args[1];
            const onNext = args[0];
            return new rxjs_1.Subscriber(onNext, onError, onCompleted);
        };
        let observer = arguments.length > 1 ? createObserver(arguments) : x;
        return this.getEvent('add')
            .merge(this.getEvent('set'))
            .merge(this.getEvent('remove'))
            .merge(this.getEvent('clear'))
            .subscribe(observer);
    }
    get query() { return new chain_1.Chain(this._values.values()); }
    get size() { return this._values.size; }
    get isDisposed() {
        return this._disposed;
    }
    dispose() {
        if (this._disposed)
            throw exports.AlreadyDisposed;
        this.publish('dispose', true);
        if (this._disposables)
            this._disposables.unsubscribe();
    }
}
exports.Service = Service;
function timeout(ok, timeOut) {
    return new Promise((resolve, reject) => {
        let timer = setTimeout(() => {
            resolve(false);
        }, timeOut);
        ok.take(1)
            .subscribe(e => {
            timer.unref();
            resolve(true);
        }, 
        /* onError */ (e) => {
            timer.unref();
            reject(e);
        });
    });
}
function rejectEmpty(x) {
    if ('undefined' == typeof x || null == x) {
        throw exports.Empty;
    }
}
function rejectExists(svc, valueOrKey) {
    if (svc.has(valueOrKey)) {
        throw exports.Exists;
    }
}
function rejectNotFound(svc, valueOrKey) {
    if (!svc.has(valueOrKey)) {
        throw exports.NotFound;
    }
}
class StoreError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}
exports.StoreError = StoreError;
exports.Empty = new StoreError('Null or Undefined', 400);
exports.NotFound = new StoreError('Not Found', 404);
exports.Exists = new StoreError('Exists', 409);
exports.AlreadyDisposed = new StoreError('Already Disposed', 500);
function isError(e) {
    return e && 'Error' == e.name;
}
function isFunction(x) {
    return 'function' == typeof (x);
}
function isIterator(x) {
    return x && isFunction(x.next);
}
//# sourceMappingURL=syncedmap.js.map