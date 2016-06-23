import {Service} from './syncedmap';
export {Service} from './syncedmap';
import { Empty, Exists, NotFound, AlreadyDisposed ,StoreError} from './syncedmap';
import  * as fty from './factory';
import {KeyType, StoreEvent , StoreEventKind, SvcAction, ChangeAction, isChange, isKey } from './common';
export {KeyType, StoreEvent , StoreEventKind, SvcAction, ChangeAction, isChange, isKey } from './common';

export const factory = {
    create : fty.create
}

export const errors = { Empty: Empty, Exists: Exists, NotFound: NotFound, AlreadyDisposed: AlreadyDisposed ,StoreError: StoreError } ;



