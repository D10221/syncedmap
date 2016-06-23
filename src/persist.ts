import * as Rx from 'rx';
import {Service, KeyType, SvcAction } from './syncedmap';
import * as encoder from 'map-encoder';

export interface PersistsEvent {
     service: Service<any>;     
     eventId: KeyType 
}

async function onNext<TValue>(args: PersistsEvent ) {   
    
    if(!args.service || !args.eventId ){ 
        throw new Error('Invalid event must provide {service,eventId}')
    };
    //check service && eventId
    let service = args.service ;

    try {
        await encoder.serializeToFile(service.location, service.values )
    } catch (e) {
        console.log('Error: ${e.message}');
        service.publish('save', e);
    }   

    service.publish('save', args.eventId /* uuid */ );
}

function onCompleted(){
    console.log('Service: Events : Completed? ');
}

function onError(e){    
    console.log(e);
}

export function createObserver() {    
    return  Rx.Observer
    .create<PersistsEvent>(
        onNext,onError,onCompleted
        );
}


export function* getGen(_service){
    
    let service = _service;

    let onFail = e => {
        service.publish('save', e);
    };

    let publish = service => service.publish('save', true);

    service = yield  encoder.serializeToFile(service.location, service.values).catch(onFail).then(publish);
}