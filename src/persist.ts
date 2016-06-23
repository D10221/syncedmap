import * as Rx from 'rx';
import {Service} from './syncedmap';
import { StoreEvent  } from './common';
import * as encoder from 'map-encoder';


export async function onNext(event: StoreEvent ) {   
    
    if(!event.sender || event.sender.name == 'Service' || !event.args.value ){ 
        throw new Error('Invalid event must provide {service,eventId}')
    };
    //check service && eventId
    let service = event.sender as Service<any> ;

    try {
        await encoder.serializeToFile(service.location, service.values )
    } catch (e) {
        console.log('Error: ${e.message}');
        service.notify(this,'save', e);
    }   

    service.notify(this, 'save', event.args.value /* uuid */ );
}

export function onCompleted(){
    console.log('Service: Events : Completed? ');
}

export function onError(e){    
    console.log(e);
}

// export function createObserver() {    
//     return  Rx.Observer.create<StoreEvent>(onNext,onError,onCompleted);
// }