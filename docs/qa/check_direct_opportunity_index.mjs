// Run from root: node docs/qa/check_direct_opportunity_index.mjs
import {createDirectOpportunityIndex as create} from './direct_opportunity_index.mjs';
import {generateNpcOpportunities as generate} from '../../tools/npc_opportunity_reference.mjs';
import {decideNpcReference as decide} from '../../tools/npc_cognition_reference.mjs';
const ok=(v,m="assertion")=>{if(!v)throw Error(m)},eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),copy=x=>JSON.parse(JSON.stringify(x));
const rejects=f=>{try{f();return false}catch{return true}};
const scope={world_id:"W",epoch_id:"E1",actor_id:"A"},key="opp:shift:S",other="opp:shift:T";
const dims=(o={})=>({safety:0,resources:0,growth:0,connection:0,duty:0,rest:0,...o});
function packet(rows){return {schema_version:"0.1-proposal",world_id:"W",actor_id:"A",as_of_tick:rows.at(-1)?.acquired_tick??0,revision:rows.length,observations:rows}}
function decision(k,now=k.as_of_tick){
 const p={world_id:"W",actor_id:"A",actor_revision:0,now,life_status:"active",risk_aversion:0,stress:0,needs:dims({resources:10}),values:dims(),goals:[]};
 const self={world_id:"W",actor_id:"A",actor_revision:0,as_of_tick:now,capabilities:["work"]};
 return {offers:generate(p,k,self).map(x=>x.id),chosen:decide(p,k,generate(p,k,self)).action_id??"wait"};
}
function fixture(rows=[]){
 const x=create(scope),archive=[];
 const push=(t,value,channel="direct",k=key)=>add(t,[{key:k,value}],channel);
 function add(t,claims,channel="direct"){
  const observation={id:"o"+(archive.length+1),acquired_tick:t,channel,claims:copy(claims)};
  x.append({...scope,revision:archive.length+1,observation});archive.push(observation);
 }
 for(const [t,v,ch,k] of rows)push(t,v,ch,k);
 return {x,archive,push,add};
}
let n=0;function test(name,f){f();n++;console.log("PASS "+name)}
test("actual legacy reopening failure reproduced",()=>{const f=fixture([[1,"open"],[2,"closed"],[3,"open"]]);ok(decision(packet(f.archive)).chosen==="wait")});
test("indexed direct reopening restores actual V1 work choice",()=>{const f=fixture([[1,"open"],[2,"closed"],[3,"open"]]);ok(eq(decision(f.x.project([key])),{offers:["work__S"],chosen:"work"})&&f.archive.length===3)});
test("new direct closure disables previous open",()=>{const f=fixture([[1,"open"],[2,"closed"]]);ok(decision(f.x.project([key])).chosen==="wait")});
test("same tick contradictory states remain uncertain in both orders",()=>{for(const states of [["open","closed"],["closed","open"]]){const f=fixture(states.map(v=>[2,v]));ok(decision(f.x.project([key])).chosen==="wait"&&f.x.project([key]).observations.length===2)}});
test("multiple distinct same tick values retain open and conflict",()=>{const f=fixture([[2,"open"],[2,"z"],[2,"a"],[2,"b"]]);ok(f.x.stats().retained_witnesses===2&&decision(f.x.project([key])).chosen==="wait")});
test("later direct state resolves same tick conflict",()=>{const f=fixture([[2,"open"],[2,"closed"],[3,"open"]]);ok(decision(f.x.project([key])).chosen==="work")});
test("repeated same-value evidence retains latest acquired ordinal",()=>{const f=fixture([[2,"open"],[2,"open"]]);ok(f.x.project([key]).observations[0].id==="o2"&&f.x.stats().retained_witnesses===1)});
test("actual legacy freshness still applies to projected evidence",()=>{const f=fixture([[1,"open"]]);ok(decision(f.x.project([key]),11).chosen==="work"&&decision(f.x.project([key]),12).chosen==="wait")});
test("fresh observation renews after expiry",()=>{const f=fixture([[1,"open"],[12,"open"]]);ok(decision(f.x.project([key]),12).chosen==="work")});
test("mixed direct report requires separate resolver",()=>{const f=fixture([[1,"open"],[2,"closed","report"],[3,"open"]]);ok(rejects(()=>f.x.project([key]))&&f.archive.length===3)});
test("record and internal evidence not treated as direct",()=>{for(const ch of ["record","internal"]){const f=fixture([[1,"open",ch]]);ok(rejects(()=>f.x.project([key])))}}); 
test("mixed unrelated key does not affect requested direct key",()=>{const f=fixture([[1,"open"],[2,"open","report",other]]);ok(decision(f.x.project([key])).chosen==="work"&&rejects(()=>f.x.project([key,other])))});
test("group same observation claims without duplicate observation ID",()=>{const f=fixture();f.add(1,[{key,value:"open"},{key:other,value:"open"}]);const p=f.x.project([other,key]);ok(p.observations.length===1&&p.observations[0].claims.length===2&&decision(p).offers.length===2)});
test("projection order independent of requested key order",()=>{const f=fixture([[1,"open"],[2,"open","direct",other]]);ok(eq(f.x.project([key,other]),f.x.project([other,key])))});
test("projection result mutation cannot alter derived index",()=>{const f=fixture([[1,"open"]]),p=f.x.project([key]);p.observations[0].claims[0].value="closed";ok(decision(f.x.project([key])).chosen==="work")});
test("foreign world epoch or actor rejected without cursor mutation",()=>{const f=fixture();for(const [k,v] of [["world_id","X"],["epoch_id","E2"],["actor_id","B"]])ok(rejects(()=>f.x.append({...scope,[k]:v,revision:1,observation:{id:"o1",acquired_tick:1,channel:"direct",claims:[{key,value:"open"}]}})));ok(f.x.stats().cursor===0)});
test("noncontiguous duplicate or backwards evidence rejected",()=>{const f=fixture([[2,"open"]]);for(const [revision,id,t] of [[1,"o1",2],[3,"o3",3],[2,"o2",1],[2,"o1",2]])ok(rejects(()=>f.x.append({...scope,revision,observation:{id,acquired_tick:t,channel:"direct",claims:[{key,value:"closed"}]}})));ok(f.x.stats().cursor===1&&decision(f.x.project([key])).chosen==="work")});
test("invalid second claim does not partially mutate index",()=>{const f=fixture([[1,"open"]]),before=f.x.project([key]);ok(rejects(()=>f.x.append({...scope,revision:2,observation:{id:"o2",acquired_tick:2,channel:"direct",claims:[{key,value:"closed"},{key,value:"open"}]}}))&&eq(before,f.x.project([key])))});
test("unknown key contains no fabricated observations",()=>{const f=fixture([[1,"open"]]);ok(f.x.project([other]).observations.length===0&&decision(f.x.project([other])).chosen==="wait")});
test("bounded relevant key list rejects duplicate oversized and non-opportunity keys",()=>{const f=fixture();ok(rejects(()=>f.x.project([key,key]))&&rejects(()=>f.x.project(Array.from({length:65},(_,i)=>"opp:shift:S"+i)))&&rejects(()=>f.x.project(["seen:1"])))});
test("long actor archive retained while bounded projection enables decision",()=>{const f=fixture([[1,"open"],[2,"closed"]]);for(let i=0;i<10001;i++)f.push(2,"yes","direct","seen:"+i);f.push(3,"open");ok(f.archive.length===10004&&rejects(()=>decision(packet(f.archive)))&&f.x.stats().cursor===10004&&f.x.stats().retained_witnesses===1&&decision(f.x.project([key])).chosen==="work")});
test("rebuild from authoritative archive yields same projection",()=>{const f=fixture([[1,"open"],[2,"closed"],[3,"open"]]),rebuilt=create(scope);f.archive.forEach((observation,i)=>rebuilt.append({...scope,revision:i+1,observation}));ok(eq(rebuilt.project([key]),f.x.project([key])))});
test("rewind candidate rebuild from prefix does not retain abandoned future",()=>{const f=fixture([[1,"open"],[2,"closed"],[3,"open"]]),nextScope={...scope,epoch_id:"E2"},x=create(nextScope);f.archive.slice(0,2).forEach((observation,i)=>x.append({...nextScope,revision:i+1,observation}));ok(decision(x.project([key])).chosen==="wait"&&rejects(()=>x.append({...scope,revision:3,observation:f.archive[2]})))});
console.log(n+"/"+n+" PASS");
// Actual cognition/generator, derived direct-only index. No authenticated
// acquisition, mixed-source resolver, complete relevant-key selection,
// SQLite index, durable archive, real rewind, production or Android tested.
