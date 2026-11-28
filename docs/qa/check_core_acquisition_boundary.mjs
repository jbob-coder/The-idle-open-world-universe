// GODSEED synthetic cross-domain acceptance oracle. Not production gameplay.
// Run: node docs/qa/check_core_acquisition_boundary.mjs
// No real actor, RNG probabilities, meteorite type, or canonical grant.
// Trusted fixtures supply milestone eligibility and actual resolved evidence.
const ok=(v,m="assertion")=>{if(!v)throw Error(m)};
const copy=v=>JSON.parse(JSON.stringify(v));
const canon=v=>JSON.stringify(v,(_,x)=>x&&typeof x==="object"&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const eq=(a,b)=>canon(a)===canon(b);
const actor=(intended)=>({intended,core:null,milestone:"pending",acquisition:null});
const fixture=()=>({world:"W",epoch:1,revision:0,phenomenon:17,now:18,actors:{A:actor("candidateA"),B:actor("candidateB")},meteor:{id:"M",type:"T",owner:null,consumed:false},ops:[],evidence:[]});
const types={T:"candidateC"}; // synthetic reviewed-type mapping for this fixture only
const proof={naturalA:{actor:"A",kind:"natural",eligible:true,success:true},naturalFail:{actor:"A",kind:"natural",eligible:true,success:false},naturalB:{actor:"B",kind:"natural",eligible:true,success:true},pre:{actor:"A",kind:"natural",eligible:false,success:false},claimA:{actor:"A",kind:"claim",meteor:"M"},claimB:{actor:"B",kind:"claim",meteor:"M"},unlockA:{actor:"A",kind:"unlock",meteor:"M",eligible:true},unlockB:{actor:"B",kind:"unlock",meteor:"M",eligible:true},badUnlock:{actor:"A",kind:"unlock",meteor:"M",eligible:false}};
function stage(root,cmd,fail=false){
 ok(cmd&&Object.keys(cmd).sort().join(",")==="actor,epoch,expected,id,kind,proof,world"&&typeof cmd.id==="string"&&cmd.id.length>0&&cmd.world===root.world&&cmd.epoch===root.epoch,"invalid scope");
 const prior=root.ops.find(x=>x.id===cmd.id);
 if(prior){ok(eq(prior.cmd,cmd),"divergent retry");return {next:root,receipt:copy(prior.receipt),replayed:true}}
 ok(cmd.expected===root.revision&&Object.hasOwn(root.actors,cmd.actor),"stale revision or actor");
 ok(Object.hasOwn(proof,cmd.proof)&&!root.evidence.includes(cmd.proof),"invalid or duplicate proof");
 const p=proof[cmd.proof];ok(p.actor===cmd.actor&&p.kind===cmd.kind,"wrong evidence scope");
 const n=copy(root),a=n.actors[cmd.actor];let effect;
 if(cmd.kind==="natural"){
   ok(a.milestone==="pending","already resolved milestone");
   // Only synthetic authorized milestone evidence. Older-at-phenomenon NPC policy is not modeled.
   if(!p.eligible){ok(n.now<n.phenomenon,"unavailable proof only before phenomenon");a.milestone="unavailable_pre_phenomenon"}
   else{ok(n.now>=n.phenomenon,"phenomenon not reached");
    if(a.core!==null)a.milestone="skipped_already_acquired";
    else if(p.success){a.core=a.intended;a.acquisition=cmd.proof;a.milestone="resolved_awakened"}
    else a.milestone="resolved_no_awakening";}
   effect={kind:"milestone",status:a.milestone};
 }else if(cmd.kind==="claim"){
   ok(n.now>=n.phenomenon&&p.meteor===n.meteor.id&&!n.meteor.consumed&&n.meteor.owner===null,"unavailable meteor");
   n.meteor.owner=cmd.actor;effect={kind:"claim"}; // possession is not acquisition
 }else if(cmd.kind==="unlock"){
   ok(n.now>=n.phenomenon&&a.core===null&&p.eligible&&p.meteor===n.meteor.id&&n.meteor.owner===cmd.actor&&!n.meteor.consumed&&Object.hasOwn(types,n.meteor.type),"invalid acquisition");
   a.core=types[n.meteor.type];a.acquisition=cmd.proof;n.meteor.consumed=true;
   effect={kind:"core_granted",core:a.core};
 }else throw Error("unknown action");
 if(fail)throw Error("injected late fault");
 n.evidence.push(cmd.proof);n.revision++;
 const receipt={id:cmd.id,epoch:cmd.epoch,revision:n.revision,actor:cmd.actor,effect};
 n.ops.push({id:cmd.id,cmd:copy(cmd),receipt:copy(receipt)});
 return {next:n,receipt,replayed:false};
}
const command=(s,actor,kind,proof,id="op"+s.revision)=>({world:s.world,epoch:s.epoch,expected:s.revision,id,actor,kind,proof});
const apply=(s,a,k,p)=>stage(s,command(s,a,k,p)).next;
const reject=(s,c,fail=false)=>{const before=canon(s);let threw=false;try{stage(s,c,fail)}catch{threw=true}ok(threw&&canon(s)===before,"atomic rejection")};
const tests=[];const test=(name,f)=>{f();tests.push(name);console.log("PASS "+name)};
test("intended candidates are locked initially",()=>{const s=fixture();ok(s.actors.A.intended==="candidateA"&&s.actors.A.core===null)});
test("natural successful milestone grants intended core",()=>{const s=apply(fixture(),"A","natural","naturalA");ok(s.actors.A.core==="candidateA"&&s.actors.B.core===null)});
test("failed milestone cannot reroll",()=>{const s=apply(fixture(),"A","natural","naturalFail");ok(s.actors.A.core===null&&s.actors.A.milestone==="resolved_no_awakening");reject(s,command(s,"A","natural","naturalA"))});
test("pre-phenomenon unavailable is not failed roll",()=>{const s=fixture();s.now=16;const n=apply(s,"A","natural","pre");ok(n.actors.A.milestone==="unavailable_pre_phenomenon"&&n.actors.A.core===null)});
test("successful natural proof cannot awaken before phenomenon",()=>{const s=fixture();s.now=16;reject(s,command(s,"A","natural","naturalA"))});
test("meteor claim alone grants no core",()=>{const s=apply(fixture(),"A","claim","claimA");ok(s.meteor.owner==="A"&&s.actors.A.core===null&&!s.meteor.consumed)});
test("same-revision claimant conflict cannot double allocate",()=>{const s=fixture(),b=command(s,"B","claim","claimB","other"),n=apply(s,"A","claim","claimA");reject(n,b);reject(n,command(n,"B","claim","claimB"))});
test("reverse serialized order preserves exclusivity without mandated winner",()=>{const s=apply(fixture(),"B","claim","claimB");reject(s,command(s,"A","claim","claimA"));ok(s.meteor.owner==="B")});
test("failed actual eligibility does not consume meteor",()=>{const s=apply(fixture(),"A","claim","claimA");reject(s,command(s,"A","unlock","badUnlock"));ok(!s.meteor.consumed&&s.actors.A.core===null)});
test("type-specific grant can differ from intended after natural failure",()=>{let s=apply(fixture(),"A","natural","naturalFail");s=apply(s,"A","claim","claimA");s=apply(s,"A","unlock","unlockA");ok(s.actors.A.core==="candidateC"&&s.actors.A.intended==="candidateA"&&s.meteor.consumed)});
test("natural-first excludes second core",()=>{let s=apply(fixture(),"A","natural","naturalA");s=apply(s,"A","claim","claimA");reject(s,command(s,"A","unlock","unlockA"));ok(s.actors.A.core==="candidateA"&&!s.meteor.consumed)});
test("meteor-first excludes natural replacement",()=>{let s=apply(fixture(),"A","claim","claimA");s=apply(s,"A","unlock","unlockA");s=apply(s,"A","natural","naturalA");ok(s.actors.A.core==="candidateC"&&s.actors.A.milestone==="skipped_already_acquired")});
test("foreign actor cannot use another actor's evidence",()=>{const s=fixture();reject(s,command(s,"B","natural","naturalA"))});
test("unowned meteor cannot unlock",()=>{const s=fixture();reject(s,command(s,"A","unlock","unlockA"))});
test("late fault preserves owner and locked core",()=>{const s=apply(fixture(),"A","claim","claimA");reject(s,command(s,"A","unlock","unlockA"),true);ok(s.actors.A.core===null&&!s.meteor.consumed)});
test("exact replay returns original grant",()=>{const s=apply(fixture(),"A","claim","claimA"),c=command(s,"A","unlock","unlockA"),v=stage(s,c),again=stage(copy(v.next),c);ok(again.replayed&&eq(v.receipt,again.receipt)&&eq(v.next,again.next))});
test("divergent retry is rejected",()=>{const s=fixture(),c=command(s,"A","natural","naturalA"),n=stage(s,c).next;reject(n,{...c,proof:"naturalFail"})});
test("old timeline command rejected before receipt lookup",()=>{const s=fixture(),c=command(s,"A","natural","naturalA"),n=stage(s,c).next;reject({...n,epoch:2},c)});
test("consumed meteor cannot grant to another character",()=>{let s=apply(fixture(),"A","claim","claimA");s=apply(s,"A","unlock","unlockA");reject(s,command(s,"B","claim","claimB"));reject(s,command(s,"B","unlock","unlockB"));ok(s.actors.B.core===null)});
test("independent actor can still awaken naturally",()=>{let s=apply(fixture(),"A","natural","naturalA");s=apply(s,"B","natural","naturalB");ok(s.actors.A.core==="candidateA"&&s.actors.B.core==="candidateB")});
console.log(tests.length+"/"+tests.length+" PASS");
// Limits: no real clock, RNG, actor age, actual physical proof, actual concurrency,
// persistent database, rewind, secret projection, approved meteor depletion or tie policy.
// Serialized ordering tests an invariant, NOT a fairness algorithm or NPC eligibility decision.
