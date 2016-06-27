import { Service } from './syncedmap';
export { Service } from './syncedmap';
import { StoreError } from './syncedmap';
export { KeyType, StoreEvent, StoreEventKind, SvcAction, ChangeAction, isChange, isKey } from './common';
export declare const factory: {
    create: <TValue>(key: (x: TValue) => number | string | symbol, storePath: string) => Service<TValue>;
};
export declare const errors: {
    Empty: StoreError;
    Exists: StoreError;
    NotFound: StoreError;
    AlreadyDisposed: StoreError;
    StoreError: typeof StoreError;
};
