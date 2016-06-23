import {createObserver} from './persist';
import {Service} from './syncedmap';
export {Service} from './syncedmap';
import { Empty, Exists, NotFound, AlreadyDisposed ,StoreError} from './syncedmap';
import  * as fty from './factory';
import {PersistsEvent} from './persist';
export {PersistsEvent} from './persist';

export const factory = {
    create : fty.create
}

export const persist = {    
    createObserver: createObserver
}

export const errors = { Empty: Empty, Exists: Exists, NotFound: NotFound, AlreadyDisposed: AlreadyDisposed ,StoreError: StoreError } ;



