// Inactive draft catalog validation only; no gameplay effects.
import {readFileSync} from 'node:fs';
const load=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const pilot=load('../data/abilities/pilot_00001_00003.json');
const schema=load('../schemas/ability_draft.schema.json');
// Intentional small schema subset for this frozen schema, not a general JSON Schema engine.
function validateShape(value,s,path="$"){
  const fail=why=>{throw new Error(path+": "+why)};
  if(s.oneOf){let n=0;for(const variant of s.oneOf){try{validateShape(value,variant,path);n++}catch{}}if(n!==1)fail("oneOf");}
  if(Object.hasOwn(s,"const")&&value!==s.const)fail("const");
  if(s.enum&&!s.enum.includes(value))fail("enum");
  if(s.type==="object"){
    if(value===null||typeof value!=="object"||Array.isArray(value))fail("object");
    for(const k of s.required??[])if(!Object.hasOwn(value,k))fail("missing "+k);
    for(const k of Object.keys(value)){if(!Object.hasOwn(s.properties,k)){if(s.additionalProperties===false)fail("extra "+k)}else validateShape(value[k],s.properties[k],path+"."+k)}
  }else if(s.type==="array"){
    if(!Array.isArray(value))fail("array");
    if(value.length<(s.minItems??0)||value.length>(s.maxItems??Infinity))fail("array size");
    if(s.uniqueItems&&new Set(value.map(v=>JSON.stringify(v))).size!==value.length)fail("duplicate item");
    value.forEach((v,i)=>validateShape(v,s.items,path+"["+i+"]"));
  }else if(s.type==="string"){
    if(typeof value!=="string"||value.length<(s.minLength??0)||(s.pattern&&!new RegExp(s.pattern).test(value)))fail("string");
  }else if(s.type==="integer"){
    if(!Number.isSafeInteger(value)||value<s.minimum||value>s.maximum)fail("integer bounds");
  }else if(s.type==="boolean"&&typeof value!=="boolean")fail("boolean");
  else if(s.type==="null"&&value!==null)fail("null");
}
function validate(p,schema){
  validateShape(p,schema);
  const unique=(set,key,error)=>{if(set.has(key))throw Error(error);set.add(key)};
  const normalized=s=>s.normalize("NFKC").trim().replace(/\s+/g," ").toLowerCase();
  const signatures={
    traction_bias:["material-interface","existing_contact","directional_friction_adjustment","controlled_contact_transition"],
    echo_measurement:["information","returned_self_emitted_sound","boundary_arrival_estimate","verified_echo_estimate"],
    heat_relay:["energy-transfer","two_touched_nonliving_solids","bounded_heat_transfer","verified_bounded_heat_transfer"]
  };
  const ids=new Set(),names=new Set(),mechanisms=new Set();
  for(const a of p.abilities){
    unique(ids,a.id,"duplicate ID");unique(names,normalized(a.name),"duplicate name");
    const m=a.mechanism,signature=signatures[m.primitive];
    if(a.category!==signature[0]||m.target!==signature[1]||m.operation!==signature[2])throw Error("unregistered mechanism");
    unique(mechanisms,[m.primitive,m.target,m.operation].join("|"),"duplicate mechanism");
    const nodes=new Map(),conds=new Map(),levels=new Set(),used=new Set();
    for(const c of a.conditions){
      if(!c.id.startsWith(a.id+"-H")||conds.has(c.id)||c.evidence!==signature[3])throw Error("condition identity/evidence");
      conds.set(c.id,c);
    }
    for(const n of a.nodes){
      if(!n.id.startsWith(a.id+"-N")||nodes.has(n.id)||n.parameters.kind!==m.primitive)throw Error("node identity/primitive");
      unique(levels,normalized(n.name)+"|"+n.level,"duplicate technique level");nodes.set(n.id,n);
      const v=n.parameters;
      if(v.kind==="traction_bias"&&v.deltaPermille===0)throw Error("no traction effect");
      if(v.kind==="echo_measurement"&&v.uncertaintyMm>v.maxRangeMm)throw Error("invalid echo uncertainty");
      for(const c of n.conditions){if(!conds.has(c))throw Error("unknown condition");used.add(c)}
    }
    const root=nodes.get(a.root);
    if(!root||root.level!==1||root.masteryTier!==1||root.requires.length||root.conditions.length)throw Error("invalid root");
    if(used.size!==conds.size)throw Error("orphan condition");
    const done=new Set(),visiting=new Set();
    function visit(id){
      if(visiting.has(id))throw Error("cycle");if(done.has(id))return;
      const n=nodes.get(id);if(!n)throw Error("foreign node");
      if(id!==a.root&&!n.requires.length)throw Error("unreachable");
      visiting.add(id);
      for(const dep of n.requires){visit(dep);if(nodes.get(dep).masteryTier>n.masteryTier)throw Error("tier regression")}
      if(n.level>1&&!n.requires.some(d=>normalized(nodes.get(d).name)===normalized(n.name)&&nodes.get(d).level===n.level-1))throw Error("missing prior level");
      visiting.delete(id);done.add(id);
    }
    for(const n of a.nodes)visit(n.id);
  }
  return true;
}
function runChecks(pilot,schema){
  const tests=[
    ["valid draft",p=>{},true],
    ["duplicate ID",p=>p.abilities[1].id=p.abilities[0].id,false],
    ["duplicate mechanism",p=>{p.abilities[1]=JSON.parse(JSON.stringify(p.abilities[0]).replaceAll("AB-00001","AB-00002"));p.abilities[1].name="Renamed mechanism"},false],
    ["unknown condition",p=>p.abilities[0].nodes[1].conditions=["AB-00001-H99"],false],
    ["cycle",p=>p.abilities[0].nodes[1].requires=[p.abilities[0].nodes[1].id],false],
    ["invalid tier",p=>p.abilities[0].nodes[1].masteryTier=8,false],
    ["unreachable",p=>p.abilities[0].nodes[1].requires=[],false],
    ["missing prior level",p=>p.abilities[0].nodes[2].requires=[p.abilities[0].nodes[1].id],false],
    ["cross-tree reference",p=>p.abilities[0].nodes[1].requires=[p.abilities[1].root],false],
    ["duplicate name",p=>p.abilities[1].name=p.abilities[0].name,false],
    ["active status",p=>p.status="active",false],
    ["empty catalog",p=>p.abilities=[],false],
    ["missing counterplay",p=>delete p.abilities[0].counterplay,false],
    ["root tier 7",p=>p.abilities[0].nodes[0].masteryTier=7,false],
    ["duplicate prerequisite",p=>p.abilities[0].nodes[1].requires.push(p.abilities[0].root),false],
    ["empty evidence",p=>p.abilities[0].conditions[0].evidence="",false],
    ["blank counterplay",p=>p.abilities[0].counterplay=["   "],false],
    ["unknown property",p=>p.abilities[0].mana=50,false],
    ["wrong primitive",p=>p.abilities[0].nodes[0].parameters=p.abilities[1].nodes[0].parameters,false],
    ["out-of-bound rate",p=>p.abilities[2].nodes[0].parameters.maxRateMilliJPerSecond=1000000001,false],
    ["negative range",p=>p.abilities[1].nodes[0].parameters.maxRangeMm=-1,false],
    ["echo uncertainty above range",p=>p.abilities[1].nodes[0].parameters.uncertaintyMm=3001,false],
    ["no-op traction",p=>p.abilities[0].nodes[0].parameters.deltaPermille=0,false],
    ["wrong evidence kind",p=>p.abilities[0].conditions[0].evidence="verified_echo_estimate",false],
    ["orphan condition",p=>{const c=JSON.parse(JSON.stringify(p.abilities[0].conditions[0]));c.id="AB-00001-H99";p.abilities[0].conditions.push(c)},false],
    ["normalized duplicate name",p=>p.abilities[1].name="  CONTACT   BIAS ",false],
    ["duplicate technique level",p=>{p.abilities[0].nodes[1].name=p.abilities[0].nodes[0].name},false],
    ["tier regression",p=>{p.abilities[0].nodes[1].masteryTier=3;p.abilities[0].nodes[2].requires.push(p.abilities[0].nodes[1].id)},false],
    ["bad version",p=>p.version="0.1.0",false],
    ["out-of-catalog ID",p=>p.abilities[0].id="AB-10001",false],
    ["missing numeric parameter",p=>delete p.abilities[2].nodes[0].parameters.maxTransferMilliJ,false],
    ["noninteger rate",p=>p.abilities[2].nodes[0].parameters.maxRateMilliJPerSecond=1.5,false],
    ["unregistered mechanism",p=>p.abilities[0].mechanism.target="unrelated",false],
    ["duplicate condition reference",p=>p.abilities[0].nodes[1].conditions.push(p.abilities[0].conditions[0].id),false],
    ["valid alternate draft values",p=>p.abilities[0].nodes[0].parameters.patchMm2=1500,true]
  ];
  for(const [name,mutate,expected] of tests){const q=JSON.parse(JSON.stringify(pilot));mutate(q);let valid=false;try{valid=validate(q,schema)}catch{}if(valid!==expected)throw Error("failed: "+name)}
  return tests.map(t=>t[0]);
}
const results=runChecks(pilot,schema);
console.log(results.length+'/'+results.length+' draft structural checks passed');
