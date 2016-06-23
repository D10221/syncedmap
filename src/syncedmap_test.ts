import {assert} from 'chai';
import * as Rx from 'rx';
import * as path from 'path';
import * as fs from 'fs';
import * as encoder from 'map-encoder';
import * as syncedmap from './';

function generate<T>(from:number, to:Number, fty:(n:number)=> T){
    let out = new Array();
    for(let i = from ; i <= to ; i++){
        out.push(fty(i));
    }
    return out;
}

const storePath = path.join(process.cwd(), 'users.db');

describe('syncedmap', () => {
    
    beforeEach(()=>{
        // 
    });

    it('isError',()=>{        
        assert.isTrue('Error' == syncedmap.errors.Empty.name );
    }) 

    it('add/set/remove => sync to file', async () => {
        
        this.timeout = 3000;

        let service = syncedmap.factory.create<User>( user=> user.name , storePath);
        service.timeOut = 0;
               
        await service.clear();

        const max  = 100000 ; 
        await service.add(generate(0, max, n=> {
            let x = n.toString();
             return { name: x, email: x, password: x, roles: ['user']}
            }))
        
        let remove = service.query.where(user=> Number.parseInt(user.name) > 10 ).toArray();
        await service.remove(remove);

        assert.equal(service.size, 11);

        let other = readStore(service.location);
        assert.equal(other.length, 11);


        console.log('OK');
    })

})

 function readStore<T>(storePath) : T[] {
    let json = fs.readFileSync(storePath, 'utf-8');
    let map =  encoder.deserialize<string,T>(json);
    return map ? Array.from(map.values()) : [] ;    
}

interface User {
    name?: string;
    email?: string;
    password?: string;
    roles?: string[];
}

