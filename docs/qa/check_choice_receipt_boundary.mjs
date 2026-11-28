// Synthetic QA oracle only; not a production controller, persistence or gameplay.
// Run: node docs/qa/check_choice_receipt_boundary.mjs
// Source proposals: #77 world.md 97ccbce13999416c4eb757619947ef55bf31abe5,
// #80 narrative.md 04ec522a2ee541a843234f3ea1fa0c01216c42b2.
// Command/result shapes below are fixture-local, not approved shared schemas.
// Uses V1 canonical serializer solely as a tested utility.
import {canonicalWorldJson as canon} from '../../tools/world_persistence_reference.mjs';
const copy=x=>JSON.parse(canon(x));
const eq=(a,b)=>canon(a)===canon(b);
const exact=(x,ks)=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.keys(x).length===ks.length&&ks.every(k=>Object.hasOwn(x,k));
const id=x=>typeof x==="string"&&/^[A-Za-z0-9_-]{1,40}$/.test(x);
const canary="PRIVATE_CANARY_NOT_RENDERABLE";
function fixture(){
 let state={world:"fixture",epoch:"E1",revision:7,actor:"P",actorRevision:4,knowledgeRevision:2,tick:100,credit:0,privateReason:canary};
 const journal=new Map(), prepared=new Map();
 const visible=()=>({world:state.world,epoch:state.epoch,revision:state.revision,actor:state.actor,actorRevision:state.actorRevision,knowledgeRevision:state.knowledgeRevision,tick:state.tick});
 const key=c=>c.world+"|"+c.epoch+"|"+c.commandId;
 const reject=code=>({status:"rejected",code,receipt:null});
 function prepare(choiceId,kind){
   const row={...visible(),choiceId,validUntil:state.tick,label:"Fixture "+kind};
   prepared.set(choiceId,{public:copy(row),kind});
   return copy(row);
 }
 function submit(c,{fault=false,loseAck=false}={}){
   if(!exact(c,["world","epoch","revision","actor","actorRevision","knowledgeRevision","tick","choiceId","commandId"])||![c.world,c.epoch,c.actor,c.choiceId,c.commandId].every(id)||![c.revision,c.actorRevision,c.knowledgeRevision,c.tick].every(x=>Number.isSafeInteger(x)&&x>=0))return reject("MALFORMED");
   if(c.world!==state.world||c.epoch!==state.epoch||c.actor!==state.actor)return reject("STALE_OR_FOREIGN");
   const prior=journal.get(key(c));
   if(prior)return prior.bytes===canon(c)?{status:"replayed",receipt:copy(prior.receipt),head:visible()}:reject("ID_CONFLICT");
   const row=prepared.get(c.choiceId);
   if(!row||!eq(visible(),{world:c.world,epoch:c.epoch,revision:c.revision,actor:c.actor,actorRevision:c.actorRevision,knowledgeRevision:c.knowledgeRevision,tick:c.tick})||!eq(row.public,{...visible(),choiceId:c.choiceId,validUntil:row.public.validUntil,label:row.public.label})||state.tick>row.public.validUntil)return reject("STALE_OR_FOREIGN");
   if(row.kind==="unavailable")return reject("UNAVAILABLE");
   const next=copy(state);
   const outcome=row.kind==="partial"?"interrupted":row.kind==="miss"?"unsuccessful":"completed";
   const elapsed=row.kind==="partial"?3:5;
   const earned=outcome==="completed"?5:outcome==="interrupted"?2:0;
   next.tick+=elapsed;next.credit+=earned;next.revision++;next.actorRevision++;
   const receipt={id:c.commandId,world:next.world,epoch:next.epoch,revision:next.revision,actor:next.actor,outcome,startTick:state.tick,endTick:next.tick,ownCreditDelta:earned,visibleEvidence:["fixture_"+c.commandId],contentVersion:1};
   if(fault)return reject("TECHNICAL_FAILURE");
   // Test-only synchronous publication; real storage must atomically commit both.
   state=next;journal.set(key(c),{bytes:canon(c),receipt:copy(receipt)});
   return loseAck?{status:"unknown"}:{status:"committed",receipt:copy(receipt),head:visible()};
 }
 function recover(c){
   if(c.world!==state.world||c.epoch!==state.epoch||c.actor!==state.actor)return reject("STALE_OR_FOREIGN");
   const prior=journal.get(key(c));
   if(!prior)return {status:"unknown",head:visible()};
   return prior.bytes===canon(c)?{status:"replayed",receipt:copy(prior.receipt),head:visible()}:reject("ID_CONFLICT");
 }
 return {prepare,submit,recover,visible,diagnostic:()=>canon({state,journal:[...journal],prepared:[...prepared]}),advance:()=>{state.revision++;state.knowledgeRevision++;},fork:()=>{state.epoch="E2";state.revision=7;state.actorRevision=4;state.knowledgeRevision=2;state.tick=100;state.credit=0;prepared.clear();}};
}
const command=(row,commandId)=>({world:row.world,epoch:row.epoch,revision:row.revision,actor:row.actor,actorRevision:row.actorRevision,knowledgeRevision:row.knowledgeRevision,tick:row.tick,choiceId:row.choiceId,commandId});
// Renderer assumes trusted authority-issued receipts, never client-created objects.
function presentation(epoch,actor,world="fixture") {
 const segments=new Map();
 return {append(receipt){
   if(!receipt||receipt.world!==world||receipt.epoch!==epoch||receipt.actor!==actor||!["completed","interrupted","unsuccessful"].includes(receipt.outcome)||receipt.contentVersion!==1)return false;
   const key=canon([receipt.world,receipt.epoch,receipt.id,0]);
   const segment={key,version:receipt.contentVersion,source:copy(receipt.visibleEvidence),outcome:receipt.outcome,elapsed:receipt.endTick-receipt.startTick,credit:receipt.ownCreditDelta};
   if(segments.has(key)){if(!eq(segments.get(key),segment))throw Error("divergent render receipt");return false;}
   segments.set(key,segment);return true;
 },view:()=>copy([...segments.values()])};
}
const tests=[];
function test(name,fn){try{if(fn()!==true)throw Error("assertion failed");tests.push({name,pass:true});}catch(e){tests.push({name,pass:false,error:String(e)});}}
const setup=(kind="complete")=>{const f=fixture(),row=f.prepare("choice1",kind),c=command(row,"cmd1");return {f,row,c};};
test("reading and selection have no domain mutation",()=>{const {f,row}=setup(),before=f.diagnostic();let selected=row.choiceId;selected=null;selected=row.choiceId;f.visible();return selected==="choice1"&&before===f.diagnostic();});
test("successful Continue commits actual time and delta",()=>{const {f,c}=setup(),x=f.submit(c);return x.status==="committed"&&x.receipt.endTick===105&&x.receipt.ownCreditDelta===5&&f.visible().revision===8;});
test("duplicate Continue cannot repeat effects",()=>{const {f,c}=setup(),a=f.submit(c),before=f.diagnostic(),b=f.submit(c);return b.status==="replayed"&&eq(a.receipt,b.receipt)&&before===f.diagnostic();});
test("lost acknowledgement recovered under same command",()=>{const {f,c}=setup(),a=f.submit(c,{loseAck:true}),before=f.diagnostic(),b=f.recover(c);return a.status==="unknown"&&b.status==="replayed"&&b.receipt.ownCreditDelta===5&&before===f.diagnostic();});
test("retry after later commit returns original receipt and current head",()=>{const {f,c}=setup(),a=f.submit(c),row=f.prepare("choice2","complete");f.submit(command(row,"cmd2"));const before=f.diagnostic(),b=f.submit(c);return eq(a.receipt,b.receipt)&&b.head.revision===9&&before===f.diagnostic();});
test("divergent same ID rejected",()=>{const {f,c}=setup();f.submit(c);const before=f.diagnostic();return f.submit({...c,choiceId:"other"}).code==="ID_CONFLICT"&&before===f.diagnostic();});
test("new command with stale choice cannot double apply",()=>{const {f,c}=setup();f.submit(c);const before=f.diagnostic();return f.submit({...c,commandId:"new"}).code==="STALE_OR_FOREIGN"&&before===f.diagnostic();});
test("stale revision and knowledge rejected",()=>{const {f,c}=setup();f.advance();const before=f.diagnostic();return f.submit(c).code==="STALE_OR_FOREIGN"&&before===f.diagnostic();});
test("foreign actor rejected",()=>{const {f,c}=setup(),before=f.diagnostic();return f.submit({...c,actor:"NPC"}).code==="STALE_OR_FOREIGN"&&before===f.diagnostic();});
test("foreign world rejected",()=>{const {f,c}=setup(),before=f.diagnostic();return f.submit({...c,world:"other"}).code==="STALE_OR_FOREIGN"&&before===f.diagnostic();});
test("arbitrary client effect rejected",()=>{const {f,c}=setup(),before=f.diagnostic();return f.submit({...c,credit:999}).code==="MALFORMED"&&before===f.diagnostic();});
test("invalid numeric revision rejected",()=>{const {f,c}=setup(),before=f.diagnostic();return f.submit({...c,revision:NaN}).code==="MALFORMED"&&before===f.diagnostic();});
test("unavailable action is rejection with no time",()=>{const {f,c}=setup("unavailable"),before=f.diagnostic();return f.submit(c).code==="UNAVAILABLE"&&before===f.diagnostic();});
test("committed unsuccessful action consumes actual time",()=>{const {f,c}=setup("miss"),x=f.submit(c);return x.status==="committed"&&x.receipt.outcome==="unsuccessful"&&x.receipt.endTick===105&&x.receipt.ownCreditDelta===0;});
test("interrupted action reports partial actual effects",()=>{const {f,c}=setup("partial"),x=f.submit(c);return x.receipt.outcome==="interrupted"&&x.receipt.endTick===103&&x.receipt.ownCreditDelta===2;});
test("late technical fault rolls back and retry remains possible",()=>{const {f,c}=setup(),before=f.diagnostic();return f.submit(c,{fault:true}).code==="TECHNICAL_FAILURE"&&before===f.diagnostic()&&f.submit(c).status==="committed";});
test("old epoch command and recovery fenced",()=>{const {f,c}=setup();f.submit(c);f.fork();const before=f.diagnostic();return f.submit(c).code==="STALE_OR_FOREIGN"&&f.recover(c).code==="STALE_OR_FOREIGN"&&before===f.diagnostic();});
test("new epoch can use same command ID without old receipt",()=>{const {f,c}=setup();f.submit(c);f.fork();const x=f.submit(command(f.prepare("choice1","miss"),c.commandId));return x.status==="committed"&&x.receipt.epoch==="E2"&&x.receipt.ownCreditDelta===0;});
test("render dedup after retry",()=>{const {f,c}=setup(),p=presentation("E1","P"),a=f.submit(c),b=f.recover(c);return p.append(a.receipt)&&!p.append(b.receipt)&&p.view().length===1;});
test("reconstruct missing passage from recovered receipt",()=>{const {f,c}=setup("partial");f.submit(c,{loseAck:true});const p=presentation("E1","P"),q=presentation("E1","P"),r=f.recover(c).receipt;p.append(r);q.append(r);return eq(p.view(),q.view())&&p.view()[0].credit===2;});
test("old epoch receipt cannot enter current narrative",()=>{const {f,c}=setup(),r=f.submit(c).receipt;f.fork();const p=presentation("E2","P");return !p.append(r)&&p.view().length===0;});
test("foreign world receipt cannot render",()=>{const {f,c}=setup(),r=f.submit(c).receipt,p=presentation("E1","P","other");return !p.append(r)&&p.view().length===0;});
test("foreign actor receipt cannot render",()=>{const {f,c}=setup(),r=f.submit(c).receipt,p=presentation("E1","NPC");return !p.append(r)&&p.view().length===0;});
test("rejection and uncertain acknowledgement do not render outcome",()=>{const a=setup("unavailable"),b=setup(),p=presentation("E1","P");return !p.append(a.f.submit(a.c).receipt)&&!p.append(b.f.submit(b.c,{loseAck:true}).receipt)&&p.view().length===0;});
test("divergent same receipt cannot silently replace paragraph",()=>{const {f,c}=setup(),r=f.submit(c).receipt,p=presentation("E1","P");p.append(r);try{p.append({...r,ownCreditDelta:999});return false;}catch{return p.view()[0].credit===5;}});
test("private canary absent from all fixture public results",()=>{const {f,c,row}=setup(),x=f.submit(c),p=presentation("E1","P");p.append(x.receipt);return f.diagnostic().includes(canary)&&![row,f.visible(),x,f.recover(c),p.view(),f.submit({...c,choiceId:"other"})].some(y=>canon(y).includes(canary));});
console.log(JSON.stringify({scope:"synthetic choice/receipt oracle only",passed:tests.filter(x=>x.pass).length,total:tests.length,tests},null,2));
if(tests.some(x=>!x.pass))throw Error("choice receipt QA failed");
