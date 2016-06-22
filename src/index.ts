import {createObserver} from './persist';
import {Service} from './syncedmap';
export {Service} from './syncedmap';
import  * as fty from './factory';

export const factory = {
    create : fty.create
}

export const persist = {
    
    createObserver: createObserver
}


