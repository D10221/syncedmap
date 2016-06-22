try keep on sync map with a json file :
		
	it('add/set/remove => sync to file', async () => {        

        let service = syncedmap.factory.create<User>(
            // what's the key 
             user=> user.name ,
             //where To save it ? 
             storePath);        

        // should throw/reject on anything taking longer than this     
        //service.timeOut = 1500;

        // Clear the map               
        await service.clear();
		
		// add a bunch of things
        const max  = 100000 ; 
        await service.add(generate(0, max, n=> {
            let x = n.toString();
             return { name: x, email: x, password: x, roles: ['user']}
            }))       

        // howto query ? jscript query 'expression'... , wait a sec... , it is jscript :)
        let items= service.query.where(user=> Number.parseInt(user.name) > 10 ).toArray();        
        await service.remove(items);
        assert.equal(service.size, 11);

        //read the file from outside the 'service' 
        let other = readStore(service.location);
        assert.equal(other.length, 11);
        console.log('OK');
    })