"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const chai_1 = require('chai');
const path = require('path');
const fs = require('fs');
const encoder = require('map-encoder');
const syncedmap = require('./');
function generate(from, to, fty) {
    let out = new Array();
    for (let i = from; i <= to; i++) {
        out.push(fty(i));
    }
    return out;
}
const storePath = path.join(process.cwd(), 'users.db');
describe('syncedmap', () => {
    beforeEach(() => {
        // 
    });
    it('isError', () => {
        chai_1.assert.isTrue('Error' == syncedmap.errors.Empty.name);
    });
    it('add/set/remove => sync to file', () => __awaiter(this, void 0, void 0, function* () {
        this.timeout = 3000;
        let service = syncedmap.factory.create(user => user.name, storePath);
        service.timeOut = 0;
        yield service.clear();
        const max = 100000;
        yield service.add(generate(0, max, n => {
            let x = n.toString();
            return { name: x, email: x, password: x, roles: ['user'] };
        }));
        let remove = service.query.where(user => Number.parseInt(user.name) > 10).toArray();
        yield service.remove(remove);
        chai_1.assert.equal(service.size, 11);
        let other = readStore(service.location);
        chai_1.assert.equal(other.length, 11);
        console.log('OK');
    }));
    it('add/set/remove => sync to file', () => __awaiter(this, void 0, void 0, function* () {
        this.timeout = 3000;
        let service = syncedmap.factory.create(user => user.name, storePath);
        service.timeOut = 0;
        yield service.clear();
        yield service.add({ name: 'admin', password: 'admin', email: 'admin@mail', roles: ['admin'] });
        let admin = yield service.get('admin');
        chai_1.assert.equal(admin.name, 'admin');
        service.dispose();
        //reload from fs 
        service = syncedmap.factory.create(user => user.name, storePath);
        let other = yield service.get('admin');
        let eq = other.name == admin.name;
        chai_1.assert.isTrue(eq);
        chai_1.assert.deepEqual(admin, other);
        console.log('OK');
    }));
});
function readStore(storePath) {
    let json = fs.readFileSync(storePath, 'utf-8');
    let map = encoder.deserialize(json);
    return map ? Array.from(map.values()) : [];
}
//# sourceMappingURL=syncedmap_test.js.map