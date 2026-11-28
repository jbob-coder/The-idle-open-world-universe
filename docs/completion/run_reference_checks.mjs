// Development QA runner; does not activate gameplay, invoke CI or touch real saves.
// Run from any directory: node docs/completion/run_reference_checks.mjs --storage|--npc-reference|--baseline|--self-test
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../../', import.meta.url));
const storage = ['tools/check_durable_world_store.mjs','docs/completion/check_storage_boundary.mjs'];
const baseline = ['check_npc_knowledge','check_npc_perception','check_npc_cognition','check_npc_opportunity','check_npc_planning','check_npc_execution','check_world_scheduler','check_world_persistence','check_world_transaction','check_execution_checkpoints','check_world_checkpoints','check_integrated_checkpoints','check_durable_world_store','check_durable_world_recovery','check_integrated_world_recovery','check_durable_checkpoints','check_world_journal_segments'].map(x=>`tools/${x}.mjs`);
const modules = ['durable_world_store','npc_cognition_reference','npc_execution_reference','npc_opportunity_reference','npc_perception_reference','npc_planning_reference','world_journal_segments','world_persistence_reference','world_scheduler_reference','world_transaction_reference'].map(x=>`tools/${x}.mjs`);
// Partial group deliberately excludes perception-only, execution and scheduler suites.
const npc = ['check_npc_cognition','check_npc_opportunity','check_npc_planning','check_world_checkpoints'].map(x=>`tools/${x}.mjs`);
const npcDeps = ['npc_cognition_reference','npc_perception_reference','npc_opportunity_reference','npc_planning_reference'].map(x=>`tools/${x}.mjs`);
// Counts pinned to the verified reference baseline, not a substitute for source review.
const expectedCounts = Object.fromEntries([...npc,...storage].map((path,i)=>[path,[48,53,51,33,20,8][i]]));
const storageDeps = ['tools/durable_world_store.mjs','tools/world_journal_segments.mjs','tools/world_persistence_reference.mjs'];
const hash = path => {
  const bytes = readFileSync(resolve(root,path));
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
};
// No kill, subprocess timeout, output maxBuffer or watchdog. All children exit normally.
async function run(args, echo=false, expectedCount=null) {
  return new Promise(done=>{
    const child=spawn(process.execPath,args,{cwd:root,stdio:['ignore','pipe','pipe']});
    const summaries=[];let launchError=null;
    const lines=createInterface({input:child.stdout,crlfDelay:Infinity});
    lines.on('line',line=>{
      if(echo)console.log(line);
      const m=/^(\d+)\/(\d+) passed(?: \(native adapter-only; not gameplay or replay verification\))?$/.exec(line.trim());
      if(m)summaries.push([Number(m[1]),Number(m[2])]);
    });
    child.stderr.on('data',chunk=>{if(echo)process.stderr.write(chunk)});
    child.on('error',e=>{launchError=String(e)});
    child.on('close',(code,signal)=>{
      const [passed,total]=summaries.length===1?summaries[0]:[null,null];
      const ok=!launchError&&code===0&&signal===null&&Number.isSafeInteger(passed)&&Number.isSafeInteger(total)&&total>0&&passed===total&&(expectedCount===null||total===expectedCount);
      done({status:ok?'PASS':'FAIL',code,signal,passed,total,summaryCount:summaries.length,expectedCount,launchError});
    });
  });
}
async function selfTest(){
  const cases=[
    ['valid count','console.log("2/2 passed")','PASS'],
    ['failure with successful exit','console.log("1/2 passed")','FAIL'],
    ['failure with perfect-looking count','console.log("2/2 passed");process.exitCode=1','FAIL'],
    ['missing count','console.log("hello")','FAIL'],
    ['zero cases','console.log("0/0 passed")','FAIL'],
    ['multiple summaries','console.log("1/1 passed\\n1/1 passed")','FAIL'],
    ['unsafe count','console.log("9007199254740992/9007199254740992 passed")','FAIL'],
    ['adapter count','console.log("8/8 passed (native adapter-only; not gameplay or replay verification)")','PASS']
  ];
  cases.push(['shortened suite','console.log("1/1 passed")','FAIL',2],['matching pinned count','console.log("2/2 passed")','PASS',2]);
  for(const [name,source,expected,count] of cases){const actual=await run(['-e',source],false,count??null);assert.equal(actual.status,expected,name);console.log('PASS',name)}
  console.log(`${cases.length}/${cases.length} runner checks passed`);
}
const mode=process.argv[2];
if(process.argv.length!==3||!['--storage','--npc-reference','--baseline','--self-test'].includes(mode)){
  console.error('Choose exactly one explicit mode: --storage, --npc-reference, --baseline or --self-test');process.exitCode=2;
}else if(mode==='--self-test')await selfTest();
else{
  const suites=mode==='--storage'?storage:mode==='--npc-reference'?npc:baseline;
  const required=[...new Set([...suites,...(mode==='--storage'?storageDeps:mode==='--npc-reference'?npcDeps:[...modules,'schemas/npc_knowledge.schema.json','tests/fixtures/npc_knowledge.json'])])];
  const missing=required.filter(p=>!existsSync(resolve(root,p)));
  const [major,minor]=process.versions.node.split('.').map(Number);
  const supported=major>22||(major===22&&minor>=16);
  if(missing.length||!supported){
    console.log(JSON.stringify({mode,node:process.version,status:'NOT_RUN',missing,unsupportedNode:!supported,suites:suites.map(path=>({path,status:'NOT_RUN'}))},null,2));process.exitCode=2;
  }else{
    const sources=Object.fromEntries(required.map(p=>[p,hash(p)])),results=[];
    console.log(JSON.stringify({mode,node:process.version,sources}));
    for(const path of suites){console.log(`RUN ${path}`);results.push({path,...await run([resolve(root,path)],true,expectedCounts[path]??null)})}
    const changed=required.filter(p=>!existsSync(resolve(root,p))||hash(p)!==sources[p]);
    const ok=changed.length===0&&results.every(r=>r.status==='PASS');
    console.log(JSON.stringify({mode,status:ok?'PASS':'FAIL',changed,suites:results,passedSuites:results.filter(r=>r.status==='PASS').length,totalSuites:suites.length,passedCases:results.reduce((n,r)=>n+(r.status==='PASS'?r.passed:0),0)},null,2));
    if(!ok)process.exitCode=1;
  }
}
