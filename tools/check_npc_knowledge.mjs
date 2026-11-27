// Development-only reference checks; no engine choice. Run with Node.js: node tools/check_npc_knowledge.mjs
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const schema = JSON.parse(readFileSync(new URL("../schemas/npc_knowledge.schema.json", import.meta.url),"utf8"));
const {cases,receipts} = JSON.parse(readFileSync(new URL("../tests/fixtures/npc_knowledge.json", import.meta.url),"utf8"));
function checkShape(value,s,path="$",errors=[]){
 const fail=(code)=>errors.push(code+":"+path);
 if(s.type==="object"){if(!value||typeof value!=="object"||Array.isArray(value)){fail("type");return errors}for(const k of s.required||[])if(!Object.hasOwn(value,k))errors.push("required:"+path+"."+k);for(const [k,v] of Object.entries(value)){if(Object.hasOwn(s.properties,k))checkShape(v,s.properties[k],path+"."+k,errors);else if(s.additionalProperties===false)errors.push("extra:"+path+"."+k)}}
 else if(s.type==="array"){if(!Array.isArray(value)){fail("type");return errors}if(s.uniqueItems&&new Set(value.map(x=>JSON.stringify(x))).size!==value.length)fail("duplicate");value.forEach((v,i)=>checkShape(v,s.items,path+"["+i+"]",errors))}
 else if(s.type==="string"){if(typeof value!=="string"){fail("type");return errors}if(s.minLength!==undefined&&[...value].length<s.minLength)fail("length");if(s.maxLength!==undefined&&[...value].length>s.maxLength)fail("length")}
 else if(s.type==="integer"){if(!Number.isSafeInteger(value)){fail("integer");return errors}if(s.minimum!==undefined&&value<s.minimum)fail("minimum")}
 if(s.enum&&!s.enum.includes(value))fail("enum");return errors
}
export function validate(packet,schema,receipts){
 const errors=checkShape(packet,schema);if(errors.length)return errors;
 const add=(c)=>errors.push(c), same=(a,b)=>a.length===b.length&&a.every((v,i)=>v.key===b[i].key&&v.value===b[i].value);
 const byId=new Map(), used=new Set();
 for(const o of packet.observations){
  if(byId.has(o.id))add("duplicate-observation");byId.set(o.id,o);
  if(used.has(o.receipt_id))add("duplicate-receipt");used.add(o.receipt_id);
  const rs=receipts.filter(r=>r.id===o.receipt_id);const r=rs[0];
  if(rs.length!==1||r.actor_id!==packet.actor_id||r.world_id!==packet.world_id){add("receipt-scope");continue}
  if(o.acquired_tick!==r.tick||o.acquired_tick>packet.as_of_tick)add("observation-time");
  if(o.channel!==r.channel||!same(o.claims,r.claims))add("projection-mismatch");
 }
 for(const [kind,records] of [["belief",packet.beliefs],["memory",packet.memories]]){
  const seen=new Set();
  for(const r of records){
   if(seen.has(r.id))add("duplicate-"+kind);seen.add(r.id);
   const refs=kind==="belief"?[...r.support_ids,...r.contradict_ids]:r.observation_ids;
   if(refs.length===0)add("missing-evidence");
   if(refs.some(id=>!byId.has(id)))add("foreign-evidence");
   if(kind==="belief"){
    if(r.updated_tick>packet.as_of_tick||refs.some(id=>byId.has(id)&&byId.get(id).acquired_tick>r.updated_tick))add("belief-time");
    if(r.support_ids.some(id=>r.contradict_ids.includes(id)))add("overlap-evidence");
    if(refs.some(id=>byId.has(id)&&!byId.get(id).claims.some(c=>c.key===r.claim_key)))add("claim-mismatch");
    if(r.status==="contested"&&(!r.support_ids.length||!r.contradict_ids.length))add("contested-evidence");
    if(r.status==="supported"&&(!r.support_ids.length||r.contradict_ids.length))add("supported-evidence");
   }else{
    if(r.acquired_tick>r.last_recalled_tick||r.last_recalled_tick>packet.as_of_tick||refs.some(id=>byId.has(id)&&byId.get(id).acquired_tick>r.acquired_tick))add("memory-time");
   }
  }
 }
 return errors
}
function runCases(cases,schema,receipts){return cases.map(c=>{const errors=validate(c.packet,schema,receipts);return {name:c.name,pass:c.expected==="PASS"?errors.length===0:errors.some(e=>e.startsWith(c.expected)),expected:c.expected,errors}})}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
const results=runCases(cases,schema,receipts);
console.log(JSON.stringify(results,null,2));
console.log(results.filter(r=>r.pass).length+"/"+results.length+" passed");
if(results.some(r=>!r.pass))process.exitCode=1;
}
