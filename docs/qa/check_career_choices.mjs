// Synthetic acceptance projection, NOT production domain rules or an autonomous lifecycle.
// Run: node docs/qa/check_career_choices.mjs
// All tuition, utilities and needs are illustrative; no activation of canonical NPCs.
import {decideNpcReference as decide} from '../../tools/npc_cognition_reference.mjs';
const dims=(x={})=>({safety:0,resources:0,growth:0,connection:0,duty:0,rest:0,...x});
function choose(s){
 const p={world_id:"W",actor_id:s.actor,actor_revision:s.rev??0,now:10,life_status:"active",risk_aversion:0,stress:0,needs:dims(s.needs),values:dims(s.values),goals:s.goals??[]};
 const k={schema_version:"0.1-proposal",world_id:"W",actor_id:s.actor,as_of_tick:10,revision:0,observations:s.known.map((key,i)=>({id:"o"+i,acquired_tick:10,channel:"direct",claims:[{key,value:"open"}]}))};
 const make=(id,effects,goal,condition,req=null)=>({id,world_id:"W",actor_id:s.actor,kind:"action",action_id:id,goal_ids:p.goals.filter(g=>g.dimension===goal).map(g=>g.id),effects:dims(effects),risk:0,effort:1,requirements:req?[{key:req,value:"open",channels:["direct"]}]:[],perceived_feasible:condition,valid_until:10});
 // Fixture supplies own balance, enrollment and qualification only. "Open" observations
 // establish actor-known opportunities; actual admission still needs authoritative checks.
 const choices=[make("work",{resources:6,rest:-2},"resources",true,"basic"),make("enroll",{growth:6,resources:-2},"growth",s.cash>=30&&!s.enrolled&&!s.qualified,"course"),make("study",{growth:7,rest:-1},"growth",s.enrolled&&!s.qualified,"course"),make("qualified_work",{resources:8,growth:2,rest:-2},"resources",s.qualified,"advanced"),make("rest",{rest:7},"rest",true)];
 return decide(p,k,choices).action_id??"wait";
}
const b={actor:"A",cash:40,enrolled:false,qualified:false,known:["basic","course","advanced"],needs:{growth:8,resources:1},values:{},goals:[]};
const t=[];function test(name,s,expected){const before=JSON.stringify(s),actual=choose(s);t.push({name,expected,actual,pass:actual===expected&&JSON.stringify(s)===before})}
test("growth-oriented funded actor enrolls",b,"enroll");
test("same options resource-oriented actor works",{...b,actor:"B",needs:{growth:1,resources:8}},"work");
test("unfunded growth-oriented actor works instead",{...b,cash:0},"work");
test("enrolled actor studies",{...b,cash:10,enrolled:true},"study");
test("qualified actor with income need chooses advanced work",{...b,qualified:true,needs:{resources:8,growth:1}},"qualified_work");
test("qualified actor without advanced opening evidence chooses basic work",{...b,qualified:true,known:["basic","course"],needs:{resources:8,growth:1}},"work");
test("unknown course cannot enroll",{...b,known:["basic","advanced"]},"work");
test("tired enrolled actor chooses rest",{...b,enrolled:true,needs:{growth:2,rest:10}},"rest");
test("no pressure may wait",{...b,needs:{}},"wait");
test("deferred growth goal does not force enrollment",{...b,needs:{resources:8},goals:[{id:"learn",dimension:"growth",status:"deferred",urgency:10}]},"work");
test("active growth goal may change decision",{...b,needs:{resources:3},goals:[{id:"learn",dimension:"growth",status:"active",urgency:10}]},"enroll");
test("qualified actor may prioritize rest",{...b,qualified:true,needs:{resources:1,rest:10}},"rest");
for(const result of t)console.log(result.pass?"PASS":"FAIL",result.name,result.actual);
console.log(t.filter(v=>v.pass).length+"/"+t.length+" PASS");
if(t.some(v=>!v.pass))throw Error("career choice fixture failed");
