import * as Rx from 'rx';
import * as persist from './persist';
import {Chain} from 'chain';
let uuid = require('node-uuid');

export type KeyType = number | string | symbol;

export function isKey(x): x is KeyType {
    return 'string' == typeof (x) || 'number' == typeof x || 'symbol' == typeof x;
}

export type SvcAction = 'set' | 'add' | 'remove' | 'clear' | 'get' ;

export type ChangeAction = 'set' | 'add' | 'remove' | 'clear';

export type StoreEvent = 'add' | 'remove' | 'clear' | 'set' | 'dispose';

export function isChange(key: string): key is ChangeAction {
    for (let eKey of ['set', 'add', 'remove', 'clear', ]) {
        if (key == eKey) {
            return true;
        }
    }    
    return false;
}

export class Service<TValue> implements Rx.Disposable {
    /**Maybe empty */
    location: string;
   
    constructor(private getKey: (x: TValue) => KeyType, map?: Map<KeyType, TValue>) {
        this._values = map || new Map<KeyType, TValue>();
    }

    private _values = new Map<KeyType, TValue>();

    get values() : Map<KeyType, TValue> { return this._values;  }

    _events = new Rx.Subject<KeyValue>();

    get events(): Rx.Observable<KeyValue> { return this._events.asObservable(); }

    getEvent(event: StoreEvent): Rx.Observable<any> {
        return this.events.where(e => e.key == event).select(e => e.value);
    }
    //short Alias
    on = this.getEvent;

    publish(key: string, value: any) {
        this._events.onNext({ key: key, value: value });
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

    set(value: TValue | TValue[]): Promise<this> {
        return this.addSetRemove('set', value, this);
    }

    remove(value: TValue | TValue[]): Promise<this> {
        return this.addSetRemove('remove', value, this);
    }

    add(value: TValue | TValue[]): Promise<this> {
        return this.addSetRemove('add', value, this);
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

    private addSetRemove<TReturn>(action: SvcAction, value: TValue | TValue[], ret: TReturn): Promise<TReturn> {

        return new Promise((resolve, reject) => {

            try {

                value = Array.isArray(value) ? value : [value];

                let changed = false;
                (value as TValue[]).forEach(item => {
                    changed = true;
                    this.internally(action, item);
                });

                if (changed) {
                    let onSave = (e: KeyValue) => {
                        if (isError(e.value)) {
                            console.log(`Error: ${e.value.message}`);
                            reject(e.value);
                            return;
                        }
                        resolve(ret);
                    };
                    let onError = e => {
                        console.log(`Error: ${e.message}`);
                        reject(e);
                    } 
                    
                    let eventId = uuid.v4();
                        
                    this.persists(action, eventId );
                    
                    this.onSave(eventId).subscribe(onSave, onError);
                };

            } catch (e) {
                reject(e);
            }
        })
    }
    persists(action:SvcAction, eventId: any){
        this._events.onNext({key: action, value: { service: this , eventId: eventId } })
    }

    private onSave(eventId /*: uuid */): Rx.Observable<any> {
        return this.events
            .where(e => 
                e.key == 'save' &&
                     // if no eventId provided , then any 
                     (!eventId || e.value == eventId)) 
            .take(1)
            .timeout(this.timeOut);
    }

    timeOut: number = 3000;

    clear(): Promise<this> {
        let me = this; 
        return new Promise((resolve, reject) => {

            if (this.size == 0) {
                resolve(this);
                return;
            }

            let onSave = (e: KeyValue) => {
                if (isError(e.value)) {
                    reject(e.value);
                    return;
                }
                resolve(this);
            };
            let onError = e => 
                reject(e);
            
            this._values.clear();
            let eventId = uuid.v4();
            this.persists('clear', eventId);
            this.onSave(eventId).subscribe(onSave, onError);
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

    dispose(){
        if(this._disposed) throw AlreadyDisposed;
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

export interface KeyValue {
    key: string;
    value: any;
}