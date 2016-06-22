import * as fs from 'fs';
import * as encoder from 'map-encoder';
import {Service, TKey} from './syncedmap';
import * as persist from './persist';

function getStore<TKey, TValue>(storePath: string): Map<TKey, TValue> {
    return fs.existsSync(storePath) ? encoder.deserializeFromFileSync<TKey, TValue>(storePath) : null
}
/** Static Factory */
export function create<TValue>(
    key: (x: TValue) => TKey, storePath: string

): Service<TValue> {

    let service = new Service(key, getStore<TKey, TValue>(storePath));
    service.location = storePath;
    service.onChange(persist.createObserver());

    return service;
}