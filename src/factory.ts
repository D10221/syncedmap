import * as Rx from 'rx';
import * as fs from 'fs';
import * as encoder from 'map-encoder';
import {Service} from './syncedmap';
import {KeyType, StoreEvent , StoreEventKind, SvcAction, ChangeAction, isChange, isKey } from './common';
import * as persist from './persist';


function getStore<TKey, TValue>(storePath: string): Map<TKey, TValue> {
    
    return fs.existsSync(storePath) ? encoder.deserializeFromFileSync<TKey, TValue>(storePath, false) : null
}
/** Static Factory */
export function create<TValue>( key: (x: TValue) => KeyType, storePath: string): Service<TValue> {
    //
    let service = new Service(key, getStore<KeyType, TValue>(storePath));
    service.location = storePath;    
    //
    let _subscription = service.onChange(
        Rx.Observer.create<StoreEvent>(persist.onNext,persist.onError,persist.onCompleted)
    );
    service.on('dispose')
        .take(1)
        .subscribe(()=> _subscription.dispose() );
    //
    return service;
}