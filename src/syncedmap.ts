import * as Rx from 'rx';
import * as persist from './persist';
import {Chain} from 'chain';
import {KeyType, KeyValue, StoreEvent, StoreEventKind, SvcAction, ChangeAction, isChange, isKey } from './common';
let uuid = require('node-uuid');


export class Service<TValue> implements Rx.Disposable {
    /**Maybe empty */
    location: string;

    constructor(private getKey: (x: TValue) => KeyType, map?: Map<KeyType, TValue>) {
        this._values = map || new Map<KeyType, TValue>();
    }

    private _values = new Map<KeyType, TValue>();

    get values(): Map<KeyType, TValue> { return this._values; }

    _events = new Rx.Subject<StoreEvent>();

    get events(): Rx.Observable<StoreEvent> { return this._events.asObservable(); }

    getEvent(event: StoreEventKind): Rx.Observable<any> {
        return this.events.where(e => e.args.key == event);
        //.select(e => e.args.value);
    }
    //short Alias
    on = this.getEvent;

    private publish(key: string, value: any) {
        this._events.onNext({ sender: this, args: { key: key, value: value } });
    }
    public notify(sender: any, action: "save" | "whatever", value: any) {
        this._events.onNext({ sender: sender, args: { key: action, value: value } });
    }

    get(key: KeyType): Promise<TValue> {
        return new Promise((resolve, reject) => {
            try {
                let user = this._values.get(key);
                if (user) {
                    resolve(user);
                    return;
                }
                reject(NotFound);
            } catch (e) {
                reject(e);
            }
        });
    }

    set(value: TValue | TValue[]): Promise<StoreEvent> {
        return this.addSetRemove('set', value);
    }

    remove(value: TValue | TValue[]): Promise<StoreEvent> {
        return this.addSetRemove('remove', value);
    }

    add(value: TValue | TValue[]): Promise<StoreEvent> {
        return this.addSetRemove('add', value);
    }

    private validate(action: SvcAction, key: KeyType, value: TValue) {

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

    private internally(action: SvcAction, value: TValue) {
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

    private addSetRemove<TReturn>(action: SvcAction, value: TValue | TValue[]): Promise<StoreEvent> {

        return new Promise(async (resolve, reject) => {

            try {

                value = Array.isArray(value) ? value : [value];

                let changed = false;
                (value as TValue[]).forEach(item => {
                    changed = true;
                    this.internally(action, item);
                });

                if (changed) {

                    let e = await this.waitForPersists(action);
                    if (isError(e.args.value)) {
                        reject(e.args.value);
                        return;
                    }
                    resolve(e);
                };

            } catch (error) {
                console.log(`addSetRemove: Error: ${error.message}`);
                reject(error);
            }
        })
    }

    private persists(action: SvcAction, eventId: any) {
        this._events.onNext({ sender: this, args: { key: action, value: eventId } })
    }

    waitForPersists(action: SvcAction): Promise<StoreEvent> {
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
            })
            this.persists(action, eventId);
        })
    }

    private onSave(eventId /*: uuid */): Rx.Observable<StoreEvent> {
        return this.events
            .where(e =>
                e.args.key == 'save' &&
                // if no eventId provided , then any ?
                (!eventId || e.args.value == eventId))
            .take(1)
        //.timeout(this.timeOut);
    }

    timeOut: number = 3000;

    clear(): Promise<StoreEvent> {
        let me = this;
        return new Promise(async (resolve, reject) => {
            //...
            try {
                //..
                if (this.size == 0) {
                    resolve(this);
                    return;
                }

                this._values.clear();

                let e = await this.waitForPersists('clear');

                if (isError(e.args.value)) {
                    reject(e.args.value);
                    return;
                }

                resolve({ sender: me, args: e.args });
                //...
            } catch (error) {
                console.log(`Clear: Error: ${error.message}`);
                reject(error);
            }
            //...
        });

    }

    has(valueOrKey: TValue | KeyType): boolean {
        return isKey(valueOrKey) ? this._values.has(valueOrKey as KeyType) : this._values.has(this.getKey(valueOrKey as TValue));
    }

    onChange(observer: Rx.Observer<any>): Rx.Disposable {
        return this.getEvent('add')
            .merge(this.getEvent('set'))
            .merge(this.getEvent('remove'))
            .merge(this.getEvent('clear'))
            //.select(x => this)
            .subscribe(observer);
    }

    get query(): Chain<TValue> { return new Chain(this._values.values()) }

    get size() { return this._values.size }

    _disposed = false;

    get disposed() {
        return this._disposed;
    }

    dispose() {
        if (this._disposed) throw AlreadyDisposed;
        this.publish('dispose', this);
        //
        this._disposables.dispose();
    }

    _disposables = new Rx.CompositeDisposable();
}

function timeout(ok: Rx.Observable<any>, timeOut: number): Promise<boolean> {

    return new Promise((resolve, reject) => {

        let timer = setTimeout(() => {
            resolve(false)
        }, timeOut)

        ok.take(1)
            .subscribe(e => {
                timer.unref();
                resolve(true)
            },
        /* onError */(e) => {
                timer.unref();
                reject(e);
            })
    })
}
function rejectEmpty(x: any) {
    if ('undefined' == typeof x || null == x) {
        throw Empty;
    }
}

function rejectExists<TValue>(svc: Service<TValue>, valueOrKey: TValue | KeyType) {
    if (svc.has(valueOrKey)) {
        throw Exists;
    }
}

function rejectNotFound<TValue>(svc: Service<TValue>, valueOrKey: TValue | KeyType) {
    if (!svc.has(valueOrKey)) {
        throw NotFound;
    }
}

export class StoreError extends Error {
    constructor(message, private code) {
        super(message);

    }
}

export const Empty = new StoreError('Null or Undefined', 400);
export const NotFound = new StoreError('Not Found', 404);
export const Exists = new StoreError('Exists', 409);
export const AlreadyDisposed = new StoreError('Already Disposed', 500);

function isError(e): e is Error {
    return e && 'Error' == e.name
}
function isFunction(x): x is Function {
    return 'function' == typeof (x);
}
function isIterator(x): x is IterableIterator<any> {
    return x && isFunction(x.next);
}
