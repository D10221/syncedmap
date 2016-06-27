import * as fs from 'fs';
import * as encoder from 'map-encoder';
import {Service} from './syncedmap';
import {KeyType, StoreEvent , StoreEventKind, SvcAction } from './common';
import * as persist from './persist';
import { Observer } from '@reactivex/rxjs';
 
function getStore<TKey, TValue>(storePath: string): Map<TKey, TValue> {
    return fs.existsSync(storePath) ? encoder.deserializeFromFileSync<TKey, TValue>(storePath) : null
}
/** Static Factory */
export function create<TValue>( key: (x: TValue) => KeyType, storePath: string): Service<TValue> {
    //
    let service = new Service(key, getStore<KeyType, TValue>(storePath));
    service.location = storePath;    
    //
    
    let _subscription = service.onChange(
        persist.onNext,persist.onError,persist.onCompleted
    );
    
    service.on('dispose')
        .take(1)
        .subscribe(()=> _subscription.unsubscribe() );
    //
    return service;
}