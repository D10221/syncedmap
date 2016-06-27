import { Service } from './syncedmap';
import { KeyType } from './common';
/** Static Factory */
export declare function create<TValue>(key: (x: TValue) => KeyType, storePath: string): Service<TValue>;
