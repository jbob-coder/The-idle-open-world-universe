const test = require('node:test');
const assert = require('node:assert/strict');
const Needs = require('../src/needs.js');

test('all six independent needs start within 0..100, retain JSON-safe shape', () => {
 const n = Needs.normalize();
 assert.deepEqual(Object.keys(n), [...Needs.KEYS]);
 assert.ok(Object.values(n).every(v => Number.isInteger(v) && v >= 0 && v <= 100));
 assert.deepEqual(Needs.normalize(JSON.parse(JSON.stringify(n))), n);
});

test('malformed imported needs are rejected without corrupting the bounded state', () => {
 const n = Needs.normalize({hunger:-100,energy:Infinity,comfort:1e9,safety:NaN,
  social:'70',hygiene:35.7,untrusted:{payload:'ignored'}});
 assert.equal(n.hunger,0); assert.equal(n.energy,Needs.DEFAULTS.energy);
 assert.equal(n.comfort,100); assert.equal(n.safety,Needs.DEFAULTS.safety);
 assert.equal(n.social,Needs.DEFAULTS.social); assert.equal(n.hygiene,36);
 assert.equal(Object.hasOwn(n,'untrusted'),false);
});

test('needs decline deterministically with work and danger without becoming negative', () => {
 let a = Needs.normalize(), b = Needs.normalize();
 for(let i=0;i<200;i++){
  a = Needs.decay(a,{working:true,danger:i%7===0});
  b = Needs.decay(b,{working:true,danger:i%7===0});
 }
 assert.deepEqual(a,b);
 assert.deepEqual(a,{hunger:0,energy:0,comfort:0,safety:0,social:0,hygiene:0});
});

test('safety and subsistence override work, social choices and divine advice', () => {
 const p={hunger:0,energy:0,comfort:0,safety:0,social:0,hygiene:0};
 assert.equal(Needs.priority(p).action,'seek_safety');
 assert.equal(Needs.priority({...p,safety:60}).action,'eat');
 assert.equal(Needs.priority({...p,safety:60,hunger:60}).action,'sleep');
 assert.equal(Needs.priority({...p,safety:60,hunger:60,energy:60}).action,'wash');
 assert.equal(Needs.priority(Needs.normalize(),{danger:true}).action,'seek_safety');
 assert.equal(Needs.priority(Needs.normalize()),null);
});

test('physical preconditions gate recovery: no magical food, washing or sleep', () => {
 const n={hunger:10,energy:10,comfort:10,safety:10,social:10,hygiene:10};
 for(const a of ['eat','sleep','seek_safety','wash','warm','socialize']) {
  const r = Needs.act(n,a,{});
  assert.equal(r.performed,false,a);
  assert.deepEqual(r.needs,n);
 }
 assert.equal(Needs.act(n,'eat',{foodAvailable:true}).needs.hunger,55);
 assert.equal(Needs.act(n,'sleep',{sheltered:true}).needs.energy,52);
 assert.equal(Needs.act(n,'seek_safety',{sheltered:true}).needs.safety,56);
 assert.equal(Needs.act(n,'wash',{atWell:true}).needs.hygiene,56);
 assert.equal(Needs.act(n,'warm',{sheltered:true}).needs.comfort,50);
 assert.equal(Needs.act(n,'socialize',{company:true}).needs.social,54);
});

test('no action mutates callers or overflows numeric budgets after thousands of recoveries', () => {
 const start=Needs.normalize({hunger:99});let n=start;
 for(let i=0;i<1000;i++)n=Needs.act(n,'eat',{foodAvailable:true}).needs;
 assert.equal(n.hunger,100);assert.equal(start.hunger,99);
 assert.ok(Object.values(n).every(v=>v<=100&&v>=0));
});
