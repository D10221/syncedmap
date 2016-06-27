export declare type KeyType = number | string | symbol;
export declare function isKey(x: any): x is KeyType;
export declare type SvcAction = 'set' | 'add' | 'remove' | 'clear' | 'get';
export declare type ChangeAction = 'set' | 'add' | 'remove' | 'clear';
export declare type StoreEventKind = 'add' | 'remove' | 'clear' | 'set' | 'dispose';
export declare function isChange(key: string): key is ChangeAction;
export interface StoreEvent {
    sender: any;
    args: KeyValue;
}
export interface KeyValue {
    key: string;
    value: any;
}
