// Review-only deterministic stream candidate for #77 section 7. Not gameplay.
// Run: node docs/qa/check_rng_stream_candidate.mjs
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const SIZE=4294967296, MAX=Number.MAX_SAFE_INTEGER;
// Candidate restricts tuple fields to explicit ASCII tokens; no Unicode ambiguity.
const token=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(x);
function draw(version,seed,domain,origin,index){
  assert([version,seed,domain,origin].every(token));
  assert(Number.isSafeInteger(index)&&index>=0);
  const digest=createHash('sha256').update(JSON.stringify([version,seed,domain,origin,index]),'utf8').digest();
  return {hex:digest.toString('hex'),word:digest.readUInt32BE(0)};
}
function sample(tuple,index,bound,budget=64){
  assert(Array.isArray(tuple)&&tuple.length===4&&tuple.every(token));
  assert(Number.isSafeInteger(index)&&index>=0&&index<MAX);
  assert(Number.isSafeInteger(bound)&&bound>=1&&bound<=SIZE);
  assert(Number.isInteger(budget)&&budget>=1&&budget<=64);
  const limit=SIZE-SIZE%bound;
  const evidence=[];
  for(let n=0;n<budget;n++){
    assert(index<MAX,'index exhausted');
    const word=draw(...tuple,index).word;
    evidence.push({index,word});index++;
    if(word<limit)return {value:word%bound,nextIndex:index,evidence};
  }
  throw Error('draw budget exhausted');
}
// Golden vectors independently calculated with Python hashlib and compact JSON.
const vectors=[
 ['g1','fixture-seed','npc','actor-A',0,'39d4b21ae6542aab68c2d8a4d22c52eb942bfc444505eb4e3519fe2d85ae0a76',970240538],
 ['g1','fixture-seed','npc','actor-A',1,'38ead10e8eeac7036cf88e43a8815461a6f9e6646a15fa94ba2ddfa10056a87e',954913038],
 ['g1','fixture-seed','npc','actor-B',0,'bd19d7689e4f9c436a7c0605808325f2e9fcb34a0df81ffbbb107485dcf3e698',3172587368],
 ['g1','fixture-seed','awakening','actor-A',0,'c8f547e4f39f612d6f51577d62c0e61cf6fcb8c22fd2d5f4ac1c92cec3749ce0',3371517924],
 ['g2','fixture-seed','npc','actor-A',0,'39fd784a628ddf4e9e9f48b07a687b371bfe6e3dfc0f3f4421dde65784f9233e',972912714],
 ['g1','other-seed','npc','actor-A',0,'9466eb5b7522e20ec4f6216af972dd271ffdd8490f749d6afa3ba984e151438c',2489772891]
];
let count=0;function check(name,fn){fn();count++;console.log('PASS '+name);}
for(const [v,s,d,o,i,hex,word] of vectors)check('golden '+[v,s,d,o,i].join('/'),()=>assert.deepEqual(draw(v,s,d,o,i),{hex,word}));
const t=vectors[0].slice(0,4),b=2147483649;
check('rejection consumes index',()=>assert.deepEqual(sample(t,2,b),{value:170573020,nextIndex:4,evidence:[{index:2,word:2492252971},{index:3,word:170573020}]}));
check('bound one',()=>assert.equal(sample(t,0,1).value,0));
check('full uint32 bound',()=>assert.equal(sample(t,0,SIZE).value,970240538));
check('budget exhaustion fails closed',()=>assert.throws(()=>sample(t,2,b,1),/budget exhausted/));
check('independent stream order',()=>{const before=sample(t,0,100);sample(vectors[2].slice(0,4),0,100);sample(vectors[3].slice(0,4),0,100);assert.deepEqual(sample(t,0,100),before);});
check('pure retry and restored counter',()=>{const first=sample(t,2,b),snapshot=JSON.parse(JSON.stringify({index:2}));assert.deepEqual(sample(t,snapshot.index,b),first);assert.deepEqual(sample(t,first.nextIndex,b),sample(t,4,b));});
check('discarded candidate cannot mutate caller counter',()=>{const state=Object.freeze({index:2});sample(t,state.index,b);assert.equal(state.index,2);assert.deepEqual(sample(t,state.index,b),sample(t,2,b));});
check('epoch not in tuple',()=>{const a={epoch:'E1',index:2},c={...a,epoch:'E2'};assert.deepEqual(sample(t,a.index,b),sample(t,c.index,b));});
check('last representable next index',()=>assert.equal(sample(t,MAX-1,1).nextIndex,MAX));
check('exhausted index rejected',()=>assert.throws(()=>sample(t,MAX,1)));
for(const x of [0,-1,1.5,SIZE+1,NaN])check('invalid bound '+x,()=>assert.throws(()=>sample(t,0,x)));
for(const x of [-1,1.5,MAX+1])check('invalid index '+x,()=>assert.throws(()=>sample(t,x,1)));
check('invalid token',()=>assert.throws(()=>sample(['g1','seed','npc','actor A'],0,1)));
check('invalid budget',()=>assert.throws(()=>sample(t,0,1,65)));
console.log(count+' checks passed; candidate only, no real state, CAS, or Android.');
