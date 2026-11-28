import {decideNpcReference as decide} from "../../tools/npc_cognition_reference.mjs";
import {createPlanningReference as planner} from "../../tools/npc_planning_reference.mjs";
import {selectPlanAwareCandidate} from "./bounded_plan_selector.mjs";
import {createIndexedDecisionScope,selectIndexedPlanCandidate} from "./indexed_plan_selector.mjs";

function runIndexChecks(decide,planner,selectPlanAwareCandidate,createIndexedDecisionScope,selectIndexedPlanCandidate){
 const checks=[],ck=(name,pass)=>checks.push({name,pass:!!pass}),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const throws=f=>{try{f();return false}catch{return true}};
 const dims=(resources=0,growth=0)=>({safety:0,resources,growth,connection:0,duty:0,rest:0});
 const p={world_id:"W",actor_id:"A",actor_revision:0,now:10,life_status:"active",risk_aversion:0,stress:0,needs:dims(10,1),values:dims(10,0),goals:[{id:"learn",dimension:"growth",status:"active",urgency:5}]};
 const self={world_id:"W",actor_id:"A",actor_revision:0,as_of_tick:10,capabilities:["work","study","observe","move","communicate"]};
 const obs=(id,key,value="open",channel="direct",acquired_tick=10)=>({id,acquired_tick,channel,claims:[{key,value}]});
 const k=(observations,extra={})=>({schema_version:"0.1-proposal",world_id:"W",actor_id:"A",as_of_tick:10,revision:observations.length,observations,...extra});
 const data=k([...Array.from({length:1000},(_,i)=>obs("s"+i,"opp:shift:S"+String(i).padStart(4,"0"))),...Array.from({length:9000},(_,i)=>obs("m"+i,"memory:repeated","same","record"))]);
 const snapshot=JSON.stringify(data);
 let oldScans=0,oldClaims=0;
 const old=(p,k,o)=>{oldScans++;oldClaims+=k.observations.reduce((n,r)=>n+r.claims.length,0);return decide(p,k,o)};
 const oldMetric={generated:0,maxScoreBatch:0},metric={generated:0,maxScoreBatch:0};
 const oldResult=selectPlanAwareCandidate(p,data,self,old,oldMetric);
 const scope=createIndexedDecisionScope(),newResult=selectIndexedPlanCandidate(p,data,self,scope,metric);
 const count=scope.metrics();
 ck("1000 opportunities exact old winner",same(oldResult,newResult)&&oldMetric.generated===metric.generated&&metric.generated===1001);
 ck("one claim scan instead of repeated batch scans",count.indexBuilds===1&&count.observationVisits===10000&&count.claimVisits===10000&&oldScans>=16&&oldClaims===oldScans*10000);
 ck("compact index stores 1001 distinct keys, not 10000 rows",count.maxIndexedKeys===1001);
 ck("64 score batch boundary and unchanged complete history",metric.maxScoreBatch<=64&&JSON.stringify(data)===snapshot);
 const cases=[
 k([obs("a","opp:job:J"),obs("b","opp:job:J","closed","internal")]),
 k([obs("a","opp:rift:R","open","report",0),obs("b","opp:rift:R","open","internal",10)]),
 k([obs("a","opp:lesson:L","open","record",0),obs("b","opp:shift:S","closed"),obs("c","opp:shift:S","open")]),
 k([obs("a","opp:offer:O","open","report"),obs("b","opp:route:R","open","internal")]),
 k([obs("a","opp:shift:S","open","direct",0),obs("b","opp:shift:S","open","report",10)]),
 k([])
 ];
 ck("conflict, channel, freshness, investigate and empty fixtures match",cases.every(x=>same(selectPlanAwareCandidate(p,x,self,decide,{generated:0,maxScoreBatch:0}),selectIndexedPlanCandidate(p,x,self,createIndexedDecisionScope(),{generated:0,maxScoreBatch:0}))));
 const spec={world_id:"W",actor_id:"A",plan_id:"planA",goal_id:"learn",steps:[{id:"learn",units:1,requires:[],options:[{opportunity_id:"study__LAST",action_id:"study"}]},...Array.from({length:5},(_,i)=>({id:"work"+i,units:1,requires:["learn"],options:Array.from({length:16},(_,j)=>({opportunity_id:"work__S"+String(i*16+j).padStart(4,"0"),action_id:"work"}))}))]};
 const known=k([...data.observations.slice(0,80),obs("lesson","opp:lesson:LAST")]),s2=createIndexedDecisionScope(),p1=planner(spec,decide),p2=planner(spec,s2.decide),before=p2.snapshot();
 const a=selectPlanAwareCandidate(p,known,self,decide,{generated:0,maxScoreBatch:0},p1),b=selectIndexedPlanCandidate(p,known,self,s2,{generated:0,maxScoreBatch:0},p2);
 ck("plan prerequisite selection exact parity",same(a,b)&&b[0]?.id==="study__LAST"&&same(before,p2.snapshot())&&s2.metrics().indexBuilds===1);
 const deferred={...p,goals:[{...p.goals[0],status:"deferred"}]};
 ck("deferred reserved plan options remain excluded",same(selectPlanAwareCandidate(deferred,known,self,decide,{generated:0,maxScoreBatch:0},p1),selectIndexedPlanCandidate(deferred,known,self,s2,{generated:0,maxScoreBatch:0},p2)));
 ck("new knowledge with same revision never reuses old index",scope.decide(p,k([],{revision:data.revision}),[]).kind==="wait"&&scope.metrics().indexBuilds===2);
 ck("foreign knowledge rejected during scope",throws(()=>scope.withSnapshot(p,data,()=>scope.decide(p,{...data},[]))));
 ck("scope cleaned after exception",scope.decide(p,k([]),[]).kind==="wait");
 ck("nested scope rejected",throws(()=>scope.withSnapshot(p,k([]),()=>scope.withSnapshot(p,k([]),()=>null))));
 ck("malformed irrelevant observation fails closed",throws(()=>selectIndexedPlanCandidate(p,k([obs("bad id","unrelated")]),self,createIndexedDecisionScope(),{generated:0,maxScoreBatch:0})));
 ck("duplicate observation IDs fail closed",throws(()=>selectIndexedPlanCandidate(p,k([obs("x","a"),obs("x","b")]),self,createIndexedDecisionScope(),{generated:0,maxScoreBatch:0})));
 return {checks,observed:{oldScans,oldClaims,newIndex:count,generated:metric.generated,maxBatch:metric.maxScoreBatch}};
}

const result=runIndexChecks(decide,planner,selectPlanAwareCandidate,createIndexedDecisionScope,selectIndexedPlanCandidate);
for(const c of result.checks)console.log(c.pass?"PASS":"FAIL",c.name);
console.log(JSON.stringify(result.observed));
if(result.checks.some(c=>!c.pass))process.exitCode=1;
