// Development-only validator. Does not register actors or create runtime state.
// Source pins are intentional; changed source docs require review and explicit migration.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

function validateDrafts(pack, sourceFiles) {
  const fail=m=>{throw new Error(m)};
  const equal=(a,b)=>a===b;
  const check=(v,m)=>{if(!v)fail(m)};
  const keys=(o,expected)=>o!==null&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===expected.length&&expected.every(k=>Object.hasOwn(o,k));
  const nonempty=s=>typeof s==="string"&&s.trim().length>0;
  const int=n=>Number.isSafeInteger(n)&&n>=0;
  const pin="f75bdd14827bd6ea8555f6ca428132e91cff97c3";
  const hashes={"docs/POPULATION_AND_EMPLOYMENT.md":"a679c453ab66cc7d98ab776bac3bfc3ef125d607","docs/LOCAL_LIFE.md":"dd53a8762380708d9e8a209249bb1f90a1f3a101","docs/WORLD.md":"31df1d9d01f2dba2acf9fa3d344f368c22bf6070"};
  const required=["identity.birth_date","identity.origin","identity.world_id","definitions","biography.events","biography.education","personality.traits","biology.condition","biology.needs","capabilities.attributes","capabilities.skills","capabilities.ability","spatial.current","spatial.access","social.family","social.relationships","economic.accounts","economic.assets","economic.agreement","knowledge.packet","goals.active","execution.schedule_rng","history.receipts"];
  check(keys(pack,["schema_version","status","activation_allowed","source_commit","sources","required_unresolved","profiles"]),"pack keys");
  check(pack.schema_version==="0.1-proposal"&&pack.status==="draft_reference_only"&&pack.activation_allowed===false,"draft-only envelope");
  check(pack.source_commit===pin,"source commit pin");
  check(Array.isArray(pack.sources)&&pack.sources.length===3&&new Set(pack.sources.map(s=>s.path)).size===3,"source manifest");
  for(const s of pack.sources){
    check(keys(s,["path","blob_sha"])&&Object.hasOwn(hashes,s.path)&&s.blob_sha===hashes[s.path],"source manifest pin");
    check(sourceFiles[s.path]?.blob_sha===hashes[s.path]&&nonempty(sourceFiles[s.path]?.content),"source readback pin");
  }
  check(Array.isArray(pack.required_unresolved)&&pack.required_unresolved.length===required.length&&new Set(pack.required_unresolved).size===required.length&&required.every(k=>pack.required_unresolved.includes(k)),"required blocker manifest");
  const rows=(s,re)=>s.split("\n").filter(l=>re.test(l)).map(l=>l.split("|").slice(1,-1).map(v=>v.trim()));
  const population=sourceFiles["docs/POPULATION_AND_EMPLOYMENT.md"].content;
  const life=sourceFiles["docs/LOCAL_LIFE.md"].content;
  const world=sourceFiles["docs/WORLD.md"].content;
  const roster=rows(population,/^\| NPC-\d+ \|/);
  const households=rows(life,/^\| HH-\d+ \|/);
  const shifts=rows(life,/^\| NPC-\d+ \|/);
  const orgs=rows(population,/^\| ORG-\d+ \|/);
  const locs=rows(world,/^\| LOC-\d+ \|/);
  check(roster.length===12&&households.length===12&&shifts.length===12&&orgs.length===6&&locs.length===26,"source table counts");
  for(const list of [roster,households,shifts,orgs,locs])check(new Set(list.map(x=>x[0])).size===list.length,"source unique row keys");
  check(Array.isArray(pack.profiles)&&pack.profiles.length===12,"profile count");
  const ids=new Set(),homes=new Set(),houseIds=new Set();
  let cash=0,rent=0,payroll=0,workers=0,blockers=0;
  function tag(o,state,value,source){
    check(keys(o,state==="known"?["state","value","source"]:["state","source"])&&o.state===state&&o.source===source&&(state!=="known"||equal(o.value,value)),"tag state/value/source");
  }
  const refKeys=["name","age_years","household_id","home_id","employer","occupation","workplace","gross_rate_cr_per_hour","weekly_hours","weekly_gross_cr","reference_window","unpaid_break_hours","monthly_rent_cr","opening_clean_cash_cr","opening_dirty_cash_cr","reference_goal","reference_consideration"];
  for(const p of pack.profiles){
    check(keys(p,["actor_id","record_status","control","reference","history_requirements","unresolved"]),"profile keys");
    check(p.record_status==="draft"&&p.control==="npc_autonomous","inactive autonomous profile");
    check(typeof p.actor_id==="string"&&/^NPC-\d{4}$/.test(p.actor_id)&&!ids.has(p.actor_id),"unique actor");
    ids.add(p.actor_id);
    const n=roster.find(x=>x[0]===p.actor_id),matching=households.filter(x=>x[1].startsWith(p.actor_id+" ")),s=shifts.find(x=>x[0]===p.actor_id);
    check(n&&matching.length===1&&s,"source joins");
    const h=matching[0],f=p.reference;
    check(keys(f,refKeys),"reference-only fields");
    check(f.name===n[1]&&f.age_years===Number(n[2])&&int(f.age_years)&&f.age_years>=18,"source identity");
    check(f.household_id===h[0]&&!houseIds.has(f.household_id),"household reference");
    check(f.home_id===h[2].split(" ")[0]&&f.home_id!=="LOC-0001"&&locs.some(l=>l[0]===f.home_id)&&!homes.has(f.home_id),"residence reference");
    houseIds.add(f.household_id);homes.add(f.home_id);
    check(f.occupation===n[4]&&f.reference_goal===n[6]&&f.reference_consideration===n[7],"source occupation and motives");
    const unemployed=n[3]==="—";
    if(unemployed){
      tag(f.employer,"absent",undefined,"population");tag(f.workplace,"not_applicable",undefined,"local_life");tag(f.gross_rate_cr_per_hour,"not_applicable",undefined,"population");
      check(s[1]==="None"&&n[5]==="—"&&f.weekly_hours===0&&f.weekly_gross_cr===0,"unemployed source reference");
    }else{
      tag(f.employer,"known",n[3],"population");tag(f.workplace,"known",s[1],"local_life");tag(f.gross_rate_cr_per_hour,"known",Number(n[5]),"population");
      check(orgs.some(o=>o[0]===n[3]&&o[2]===s[1])&&locs.some(l=>l[0]===s[1]),"employer and workplace join");
      check(int(f.gross_rate_cr_per_hour.value)&&f.gross_rate_cr_per_hour.value>0&&f.weekly_hours*f.gross_rate_cr_per_hour.value===f.weekly_gross_cr,"reference wage arithmetic");workers++;
    }
    check(f.reference_window===s[2]&&f.unpaid_break_hours===Number(s[3])&&f.weekly_hours===Number(s[4])&&f.weekly_gross_cr===Number(s[5]),"source shift");
    check(f.monthly_rent_cr===Number(h[3])&&f.opening_clean_cash_cr===Number(h[4])&&f.opening_dirty_cash_cr===0,"source financial references");
    check([f.unpaid_break_hours,f.weekly_hours,f.weekly_gross_cr,f.monthly_rent_cr,f.opening_clean_cash_cr,f.opening_dirty_cash_cr].every(int),"nonnegative integer references");
    check(nonempty(p.history_requirements),"history questions");
    check(Array.isArray(p.unresolved)&&p.unresolved.length===required.length&&new Set(p.unresolved.map(x=>x.field)).size===required.length&&required.every(k=>p.unresolved.some(x=>x.field===k)),"complete unresolved inventory");
    for(const u of p.unresolved)check(keys(u,["field","state","blocking","reason"])&&u.state==="unknown"&&u.blocking===true&&nonempty(u.reason),"unresolved must be blocking, unknown, and valueless");
    cash+=f.opening_clean_cash_cr;rent+=f.monthly_rent_cr;payroll+=f.weekly_gross_cr;blockers+=p.unresolved.length;
  }
  check(ids.size===12&&workers===11&&cash===38900&&rent===7940&&payroll===9655&&blockers===276,"reference reconciliation");
  return {profiles:ids.size,workers,unresolved_fields_per_profile:required.length,blocking_field_instances:blockers,reference_cash_cr:cash,reference_rent_cr_month:rent,reference_payroll_cr_week:payroll,activation_allowed:false};
}

function runChecks(pack,sourceFiles){
  const baseline=validateDrafts(pack,sourceFiles);
  const cases=[
    ["activate envelope",p=>p.activation_allowed=true],
    ["active status",p=>p.status="active"],
    ["activate profile",p=>p.profiles[0].record_status="active"],
    ["player-controlled NPC",p=>p.profiles[0].control="player"],
    ["missing profile",p=>p.profiles.pop()],
    ["duplicate actor",p=>p.profiles[1].actor_id=p.profiles[0].actor_id],
    ["replace actor identity",p=>p.profiles[0].actor_id="NPC-9999"],
    ["changed reference age",p=>p.profiles[0].reference.age_years++],
    ["B2 residence assignment",p=>p.profiles[0].reference.home_id="LOC-0001"],
    ["duplicate household",p=>p.profiles[1].reference.household_id=p.profiles[0].reference.household_id],
    ["wrong workplace",p=>p.profiles[0].reference.workplace.value="LOC-0008"],
    ["invented wage",p=>{p.profiles[0].reference.gross_rate_cr_per_hour.value=99;p.profiles[0].reference.weekly_gross_cr=3960;}],
    ["invented cash",p=>p.profiles[0].reference.opening_clean_cash_cr++],
    ["negative cash",p=>p.profiles[0].reference.opening_dirty_cash_cr=-1],
    ["unemployed has employer",p=>p.profiles[11].reference.employer={state:"known",value:"ORG-0001",source:"population"}],
    ["missing blocker",p=>p.profiles[0].unresolved.pop()],
    ["duplicate blocker",p=>p.profiles[0].unresolved[1]=p.profiles[0].unresolved[0]],
    ["coordinated blocker removal",p=>{const k=p.required_unresolved.pop();for(const n of p.profiles)n.unresolved=n.unresolved.filter(u=>u.field!==k);}],
    ["nonblocking unknown",p=>p.profiles[0].unresolved[0].blocking=false],
    ["invented birth date",p=>Object.assign(p.profiles[0].unresolved[0],{state:"known",value:"2000-01-01"})],
    ["unknown carrying a value",p=>p.profiles[0].unresolved[0].value="2000-01-01"],
    ["invented runtime knowledge",p=>p.profiles[0].knowledge={claims:[]}],
    ["changed source hash",p=>p.sources[0].blob_sha="0".repeat(40)],
    ["missing provenance",p=>p.sources.pop()],
    ["changed source commit",p=>p.source_commit="0".repeat(40)],
    ["changed source readback",(_p,s)=>s["docs/WORLD.md"].blob_sha="0".repeat(40)]
  ];
  for(const [name,mutate] of cases){
    const p=JSON.parse(JSON.stringify(pack)),s=JSON.parse(JSON.stringify(sourceFiles));mutate(p,s);
    let rejected=false;try{validateDrafts(p,s)}catch{rejected=true}
    if(!rejected)throw new Error("Accepted malformed draft: "+name);
  }
  return {positive:1,negative:cases.length,total:cases.length+1,baseline};
}

const pack=JSON.parse(readFileSync(new URL('../data/npcs/b2_draft_profiles.json',import.meta.url),'utf8'));
const sourceFiles={};
for(const path of ['docs/POPULATION_AND_EMPLOYMENT.md','docs/LOCAL_LIFE.md','docs/WORLD.md']){
  const bytes=readFileSync(new URL('../'+path,import.meta.url));
  const blob_sha=createHash('sha1').update('blob '+bytes.length+'\\0'.replace('\\0','\0')).update(bytes).digest('hex');
  sourceFiles[path]={content:bytes.toString('utf8'),blob_sha};
}
console.log(JSON.stringify(runChecks(pack,sourceFiles),null,2));
