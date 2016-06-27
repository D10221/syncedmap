import { StoreEvent } from './common';
export declare function onNext(event: StoreEvent): Promise<void>;
export declare function onCompleted(): void;
export declare function onError(e: any): void;
