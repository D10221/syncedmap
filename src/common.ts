
export type KeyType = number | string | symbol;

export function isKey(x): x is KeyType {
    return 'string' == typeof (x) || 'number' == typeof x || 'symbol' == typeof x;
}

export type SvcAction = 'set' | 'add' | 'remove' | 'clear' | 'get' ;

export type ChangeAction = 'set' | 'add' | 'remove' | 'clear';

export type StoreEventKind = 'add' | 'remove' | 'clear' | 'set' | 'dispose';

export function isChange(key: string): key is ChangeAction {
    for (let eKey of ['set', 'add', 'remove', 'clear', ]) {
        if (key == eKey) {
            return true;
        }
    }    
    return false;
}

export interface StoreEvent {
    sender: any;
    args: KeyValue;
}


export interface KeyValue {
    key: string;
    value: any;
}