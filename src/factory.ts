import * as fs from 'fs';
import * as encoder from 'map-encoder';
import {Service, KeyType} from './syncedmap';
import * as persist from './persist';


function getStore<TKey, TValue>(storePath: string): Map<TKey, TValue> {
    return fs.existsSync(storePath) ? encoder.deserializeFromFileSync<TKey, TValue>(storePath) : null
}
/** Static Factory */
export function create<TValue>(
    key: (x: TValue) => KeyType, storePath: string
): Service<TValue> {

    //
    let service = new Service(key, getStore<KeyType, TValue>(storePath));
    service.location = storePath;
    
    //
    let _subscription = service.onChange(persist.createObserver());
    service.on('dispose')
        .take(1)
        .subscribe(()=> _subscription.dispose() );

    return service;
}