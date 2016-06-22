import * as Rx from 'rx';
import {Service} from './syncedmap';
import * as encoder from 'map-encoder';

export function createObserver<TValue>() {

         let persist = Rx.Observer.create<Service<TValue>>(

            /* onNext:*/ async (service) => {
                let x = '';
                const values = service._values;
                await encoder.serializeToFile(service.location, values).catch(e => {
                    service.publish('save', e);
                });
                service.publish('save', true);
            },
            /*onError: */ e => {
                console.log(e);
            },
            /* onCompleted: */() => {
                console.log('Service: Events : Completed? ')
            })

            return persist
}