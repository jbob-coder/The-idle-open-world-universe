// Review-only D1/D2/D4 diagnostic. No runtime migration or canon.
// Legacy abstract tick = second ONLY for these paired fixtures.
// Run: node docs/qa/check_duration_compatibility.mjs
import {createExecutionReference as executor} from '../../tools/npc_execution_reference.mjs';
import {generateNpcOpportunities as generate} from '../../tools/npc_opportunity_reference.mjs';
import {decideNpcReference as decide} from '../../tools/npc_cognition_reference.mjs';
const ok=(v,m="assertion")=>{if(!v)throw Error(m)};
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),copy=x=>JSON.parse(JSON.stringify(x));
const rejects=fn=>{try{fn();return false}catch{return true}};
const MAX=315537897599999,valid=(x,max=MAX)=>Number.isSafeInteger(x)&&x>=0&&x<=max;
const addDuration=(instant,duration)=>{ok(valid(instant)&&valid(duration,MAX-instant),"time range");return instant+duration};
const delay=(now,ms)=>{ok(valid(ms)&&ms>0,"positive duration");return addDuration(now,ms)};
const fresh=(now,observed,ttl)=>{ok(valid(now)&&valid(observed)&&observed<=now,"observation time");return now<=addDuration(observed,ttl)};
function credit(rate,elapsed,carry=0,remaining=10000){
 ok(valid(rate,Number.MAX_SAFE_INTEGER)&&valid(elapsed)&&valid(carry,999)&&valid(remaining,Number.MAX_SAFE_INTEGER),"invalid rate");
 const n=BigInt(rate)*BigInt(elapsed)+BigInt(carry),whole=n/1000n;
 // Saturation discards remainder belonging to this finished activity, not another job.
 if(whole>=BigInt(remaining))return {units:remaining,carry:0};
 return {units:Number(whole),carry:Number(n%1000n)};
}
function probe(duration,elapsed,rate,restore=false){
 const initial={world_id:"W",now:0,actors:[{actor_id:"N",revision:0,knowledge_revision:0,resources:100,life_status:"active"}]};
 let x=executor(initial);
 x.publishOffer({world_id:"W",actor_id:"N",actor_revision:0,knowledge_revision:0,opportunity_id:"work",action_id:"work",kind:"action",valid_until:0,feasible:true,exclusive_target:null,credit_cap:10000,phases:[{kind:"execution",duration,cost:0,interruptible:true,credit_per_tick:rate}]});
 x.admit({kind:"intent",world_id:"W",actor_id:"N",actor_revision:0,knowledge_revision:0,decision_tick:0,opportunity_id:"work",action_id:"work",disposition:"action"},"attempt");
 const terminal=x.advanceTo(elapsed);
 if(restore)x=executor(initial,copy(x.exportCheckpoint()));
 return (terminal[0]??x.stop("N","attempt","interrupted")).credited_units;
}
const dims=(o={})=>({safety:0,resources:0,growth:0,connection:0,duty:0,rest:0,...o});
function legacyChoice(now,observed){
 const p={world_id:"W",actor_id:"N",actor_revision:0,now,life_status:"active",risk_aversion:0,stress:0,needs:dims({resources:8}),values:dims(),goals:[]};
 const k={schema_version:"0.1-proposal",world_id:"W",actor_id:"N",revision:1,as_of_tick:now,observations:[{id:"obs",acquired_tick:observed,channel:"direct",claims:[{key:"opp:shift:job",value:"open"}]}]};
 const self={world_id:"W",actor_id:"N",actor_revision:0,as_of_tick:now,capabilities:["work","rest"]};
 return decide(p,k,generate(p,k,self)).action_id??"wait";
}
const rows=[];function test(name,fn){fn();rows.push(name);console.log("PASS "+name)}
test("legacy credit five",()=>ok(probe(10,5,1)===5));
test("naive milliseconds overcredit reproduced",()=>ok(probe(10000,5000,1)===5000));
test("fractional per-tick rate rejected by V1",()=>ok(rejects(()=>probe(10000,5000,.001))));
test("legacy half-hour fixture accepted",()=>ok(probe(1800,1800,1)===1800));
test("millisecond half-hour exceeds V1 duration limit",()=>ok(rejects(()=>probe(1800000,1800000,1))));
test("legacy restoration preserves legacy credit",()=>ok(probe(10,5,1,true)===5&&probe(10000,5000,1,true)===5000));
test("same physical observation age changes V1 decision if blindly converted",()=>ok(legacyChoice(109,100)==="work"&&legacyChoice(109000,100000)==="wait"));
test("legacy endpoint inclusive",()=>ok(legacyChoice(110,100)==="work"&&legacyChoice(111,100)==="wait"));
test("candidate physical freshness endpoint inclusive",()=>ok(fresh(109000,100000,10000)&&fresh(110000,100000,10000)&&!fresh(110001,100000,10000)));
test("candidate preserves five work units at five seconds",()=>ok(eq(credit(1,5000),{units:5,carry:0})));
test("partitioned fractional carry",()=>{let a=credit(1,333),b=credit(1,667,a.carry);ok(eq({units:a.units+b.units,carry:b.carry},credit(1,1000)))});
test("serialized carry preserves continuation",()=>{const a=copy(credit(3,333)),b=credit(3,667,a.carry);ok(eq({units:a.units+b.units,carry:b.carry},credit(3,1000)))});
test("cap discards excess credit and residual",()=>ok(eq(credit(3,999,0,1),{units:1,carry:0})));
test("zero eligible duration adds no units",()=>ok(eq(credit(1,0,123),{units:0,carry:123})));
test("exact intermediate safe output",()=>ok(eq(credit(1000000000,9007199254,999,Number.MAX_SAFE_INTEGER),{units:9007199254000000,carry:999})));
test("candidate half-hour valid clock interval",()=>ok(addDuration(0,1800000)===1800000));
test("reject calendar overflow and negative/fractional duration",()=>ok(rejects(()=>addDuration(MAX,1))&&rejects(()=>addDuration(0,-1))&&rejects(()=>addDuration(0,.1))));
test("explicit positive review delay",()=>ok(delay(100000,1000)===101000&&rejects(()=>delay(100000,0))));
test("reject invalid carry and future observation",()=>ok(rejects(()=>credit(1,1000,1000))&&rejects(()=>fresh(1,2,1000))));
test("candidate configured review cadence invariant",()=>{const series=(start,interval,end)=>{const a=[];for(let t=start;t<=end;t+=interval)a.push(t);return a};ok(eq(series(0,2,10).map(t=>t*1000),series(0,2000,10000)))});
console.log(rows.length+"/"+rows.length+" PASS");
// Candidate arithmetic is not an executor replacement or a policy for wage rounding.
// No real scheduler replay/migration, checkpoint schema, actual capacity, domain receipt,
// native SQLite or approved rates. D1 consumers must be reviewed before adoption.
