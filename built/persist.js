"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const encoder = require('map-encoder');
function onNext(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.sender || event.sender.name == 'Service' || !event.args.value) {
            throw new Error('Invalid event must provide {service,eventId}');
        }
        ;
        //check service && eventId
        let service = event.sender;
        try {
            yield encoder.serializeToFile(service.location, service.values);
        }
        catch (e) {
            console.log('Error: ${e.message}');
            service.notify(this, 'save', e);
        }
        service.notify(this, 'save', event.args.value /* uuid */);
    });
}
exports.onNext = onNext;
function onCompleted() {
    console.log('Service: Events : Completed? ');
}
exports.onCompleted = onCompleted;
function onError(e) {
    console.log(e);
}
exports.onError = onError;
// export function createObserver() {    
//     return  Rx.Observer.create<StoreEvent>(onNext,onError,onCompleted);
// } 
//# sourceMappingURL=persist.js.map