import { Observable, Subject, Observer, Subscription } from '@reactivex/rxjs';
import { Chain } from 'chain';
import { KeyType, StoreEvent, StoreEventKind, SvcAction } from './common';
export interface iDisposable {
    dispose(): any;
    isDisposed: boolean;
}
export declare class Service<TValue> implements iDisposable {
    private getKey;
    /**Maybe empty */
    location: string;
    constructor(getKey: (x: TValue) => KeyType, map?: Map<KeyType, TValue>);
    private _values;
    values: Map<KeyType, TValue>;
    _events: Subject<StoreEvent>;
    events: Observable<StoreEvent>;
    getEvent(event: StoreEventKind): Observable<any>;
    on: (event: "add" | "remove" | "clear" | "set" | "dispose") => Observable<any>;
    private publish(key, value);
    notify(sender: any, action: "save" | "whatever", value: any): void;
    get(key: KeyType): Promise<TValue>;
    set(value: TValue | TValue[]): Promise<StoreEvent>;
    remove(value: TValue | TValue[]): Promise<StoreEvent>;
    add(value: TValue | TValue[]): Promise<StoreEvent>;
    private validate(action, key, value);
    private internally(action, value);
    private addSetRemove<TReturn>(action, value);
    private persists(action, eventId);
    waitForPersists(action: SvcAction): Promise<StoreEvent>;
    private onSave(eventId);
    timeOut: number;
    clear(): Promise<StoreEvent>;
    has(valueOrKey: TValue | KeyType): boolean;
    onChange(next: any, error: any, completed: any): Subscription;
    onChange(observer: Observer<any>): Subscription;
    query: Chain<TValue>;
    size: number;
    _disposed: boolean;
    isDisposed: boolean;
    dispose(): void;
    _disposables: Subscription;
}
export declare class StoreError extends Error {
    private code;
    constructor(message: any, code: any);
}
export declare const Empty: StoreError;
export declare const NotFound: StoreError;
export declare const Exists: StoreError;
export declare const AlreadyDisposed: StoreError;
