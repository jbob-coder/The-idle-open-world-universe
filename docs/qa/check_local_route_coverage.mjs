// Independent QA proposal for #87 / #84; not a gameplay implementation or approved map.
// Baseline f75bdd14827bd6ea8555f6ca428132e91cff97c3; WORLD.md blob 31df1d9d01f2dba2acf9fa3d344f368c22bf6070.
// Run: node docs/qa/check_local_route_coverage.mjs from a checkout of this branch.
// Source graph is authoritative design data, not proof of actual access or service availability.
// Access, actor knowledge, movement modes, state revisions below are synthetic fixtures only.
import {readFileSync} from "node:fs";
function runChecks(world){
 const locations=new Map(),routes=new Map(),checks=[];
 const check=(name,pass)=>checks.push({name,pass:!!pass});
 const loc=/^LOC-\d{4}$/,rte=/^RTE-\d{4}$/;
 function put(map,id,row){if(map.has(id))throw Error("duplicate "+id);map.set(id,row)}
 for(const line of world.split("\n")){
  const c=line.split("|").slice(1,-1).map(v=>v.trim());
  if(loc.test(c[0]??"")){
   put(locations,c[0],{id:c[0],name:c[1],coordinates:c.slice(2,5).map(Number)});
   if(rte.test(c[6]??""))put(routes,c[6],{id:c[6],a:c[0],b:c[5],distance:Number(c[7]),modes:["walk"]});
  }else if(rte.test(c[0]??""))put(routes,c[0],{id:c[0],a:c[1],b:c[2],distance:Number(c[3]),modes:c[4].split("/")});
 }
 check("26 location anchors and 25 route records",locations.size===26&&routes.size===25);
 check("valid distinct endpoints and positive integer distances",[...routes.values()].every(r=>locations.has(r.a)&&locations.has(r.b)&&r.a!==r.b&&Number.isSafeInteger(r.distance)&&r.distance>0));
 const pairs=[...routes.values()].map(r=>[r.a,r.b].sort().join(":"));
 check("no duplicate undirected routes",new Set(pairs).size===routes.size);
 check("unique finite 3D positions",new Set([...locations.values()].map(l=>l.coordinates.join(":"))).size===locations.size&&[...locations.values()].every(l=>l.coordinates.length===3&&l.coordinates.every(Number.isFinite)));
 check("route length not shorter than 3D endpoint separation",[...routes.values()].every(r=>Math.hypot(...locations.get(r.a).coordinates.map((x,i)=>x-locations.get(r.b).coordinates[i]))<=r.distance));
 // Design-only topology; every authored link is bidirectional. No implicit edges.
 const outgoing=node=>[...routes.values()].filter(r=>r.a===node||r.b===node).map(r=>({...r,from:node,to:r.a===node?r.b:r.a})).sort((a,b)=>a.id.localeCompare(b.id));
 function path(from,to,allow=()=>true){
  const queue=[{node:from,legs:[],distance:0}],seen=new Set();
  while(queue.length){queue.sort((a,b)=>a.distance-b.distance);const p=queue.shift();if(seen.has(p.node))continue;seen.add(p.node);if(p.node===to)return p;
   for(const r of outgoing(p.node))if(allow(r)&&!seen.has(r.to))queue.push({node:r.to,legs:[...p.legs,r.id],distance:p.distance+r.distance});
  }
  return null;
 }
 const directed=[...locations.keys()].flatMap(outgoing);
 check("50 directed leg opportunities under full synthetic knowledge",directed.length===50&&new Set(directed.map(r=>r.id+":"+r.from)).size===50);
 check("every directed leg has an authored reverse",directed.every(r=>directed.some(t=>t.id===r.id&&t.from===r.to&&t.to===r.from&&t.distance===r.distance)));
 check("all 26 anchors reachable from B2 in topology",[...locations.keys()].every(l=>path("LOC-0001",l)!==null));
 const references={"LOC-0008":353,"LOC-0009":403,"LOC-0010":383,"LOC-0011":453,"LOC-0012":533,"LOC-0013":753,"LOC-0014":283};
 check("all seven published B2 service distances",Object.entries(references).every(([l,d])=>path("LOC-0001",l)?.distance===d));
 check("each service return path has equal distance",Object.entries(references).every(([l,d])=>path(l,"LOC-0001")?.distance===d));
 check("no direct B2-grocery shortcut",!outgoing("LOC-0001").some(r=>r.to==="LOC-0008"));
 // Synthetic actor-known routes, known permissions and observed closures; no private state.
 // A prepared attempt is not a promise of success or entry. Actual authority revalidates.
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const allKnown=[...routes.keys()];
 const actor={id:"P",location:"LOC-0005",epoch:"E1",revision:7,knownRoutes:allKnown,knownAllowedDestinations:[...locations.keys()].filter(l=>!["LOC-0016","LOC-0017","LOC-0018","LOC-0019","LOC-0026"].includes(l)),observedClosed:[],modes:["walk"]};
 function prepare(a){
  if(a.location===null)return [];
  return outgoing(a.location).filter(r=>a.knownRoutes.includes(r.id)&&a.knownAllowedDestinations.includes(r.to)&&!a.observedClosed.includes(r.id)).flatMap(r=>r.modes.filter(m=>a.modes.includes(m)).map(mode=>({route_id:r.id,from:r.from,to:r.to,mode,epoch:a.epoch,revision:a.revision})));
 }
 const original=JSON.stringify(actor),choices=prepare(actor);
 check("preparing and rereading choices do not change actor state",JSON.stringify(actor)===original&&same(prepare(actor),choices));
 check("only outgoing authored edges and supported modes",choices.every(c=>outgoing(actor.location).some(r=>r.id===c.route_id&&r.to===c.to&&r.modes.includes(c.mode))&&c.mode==="walk"));
 check("private residence destinations excluded in synthetic policy",!choices.some(c=>["LOC-0016","LOC-0017","LOC-0018","LOC-0019","LOC-0026"].includes(c.to)));
 check("unknown route not offered",!prepare({...actor,knownRoutes:allKnown.filter(r=>r!=="RTE-0010")}).some(c=>c.route_id==="RTE-0010"));
 check("observed closed route not offered",!prepare({...actor,observedClosed:["RTE-0010"]}).some(c=>c.route_id==="RTE-0010"));
 check("no unrelated node travel while in transit",prepare({...actor,location:null}).length===0);
 const chosen=choices.find(c=>c.route_id==="RTE-0010");
 function admit(a,c,actual){
  if(!prepare(a).some(p=>same(p,c)))return "stale_or_invalid";
  if(actual.closed.includes(c.route_id)||!actual.allowed.includes(c.to))return "unavailable";
  return "admitted";
 }
 const open={closed:[],allowed:[...locations.keys()]},secretClosure={closed:["RTE-0010"],allowed:[...locations.keys()]};
 // Trusted boundary deliberately separates the actor projection from private actual state.
 const publicChoices=fixture=>prepare(fixture.actor);
 const worlds=[{actor,actual:open},{actor,actual:secretClosure}];
 check("same scoped projection despite unobserved actual closure",same(publicChoices(worlds[0]),publicChoices(worlds[1]))&&admit(actor,chosen,open)==="admitted"&&admit(actor,chosen,secretClosure)==="unavailable");
 check("old revision and old epoch rejected",admit({...actor,revision:8},chosen,open)==="stale_or_invalid"&&admit({...actor,epoch:"E2"},chosen,open)==="stale_or_invalid");
 check("altered destination and unsupported mode rejected",admit(actor,{...chosen,to:"LOC-0008"},open)==="stale_or_invalid"&&admit(actor,{...chosen,mode:"road vehicle"},open)==="stale_or_invalid");
 check("actual access revalidated without revealing private reason",admit(actor,chosen,{closed:[],allowed:[]})==="unavailable"&&JSON.stringify(actor)===original);
 // Service closure is not route closure. Source calls these school/harbor approach anchors.
 // This test models a facility service flag distinct from the public approach; no new map nodes.
 const facilityState={closedServices:new Set(["LOC-0011","LOC-0013"]),closedRoutes:new Set()};
 const serviceAvailable=(state,id)=>!state.closedServices.has(id);
 const publicApproach=state=>r=>!state.closedRoutes.has(r.id);
 check("school closure need not sever inland homes",!serviceAvailable(facilityState,"LOC-0011")&&path("LOC-0005","LOC-0022",publicApproach(facilityState))?.distance===385&&path("LOC-0005","LOC-0023",publicApproach(facilityState))?.distance===385);
 check("harbor closure need not sever waterfront homes",!serviceAvailable(facilityState,"LOC-0013")&&path("LOC-0012","LOC-0024",publicApproach(facilityState))?.distance===280&&path("LOC-0012","LOC-0025",publicApproach(facilityState))?.distance===290);
 check("actual connector closure does sever dependent approach paths",path("LOC-0005","LOC-0022",publicApproach({...facilityState,closedRoutes:new Set(["RTE-0010"])}))===null&&path("LOC-0012","LOC-0024",publicApproach({...facilityState,closedRoutes:new Set(["RTE-0012"])}))===null);
 // Departure can use the player's actual residence, not a fixed B2 start.
 const other={...actor,location:"LOC-0022",knownAllowedDestinations:["LOC-0011","LOC-0022"]};
 check("non-B2 residence has its own authored departure",prepare(other).length===1&&prepare(other)[0].route_id==="RTE-0021"&&prepare(other)[0].to==="LOC-0011");
 return {checks,anchors:locations.size,links:routes.size,directed:directed.length,serviceDistances:references};
}
const result=runChecks(readFileSync(new URL("../../docs/WORLD.md",import.meta.url),"utf8"));
for(const c of result.checks)console.log(c.pass?"PASS":"FAIL",c.name);
console.log(JSON.stringify(result));
if(result.checks.some(c=>!c.pass))process.exitCode=1;
