"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../src/divine/lifecycle.js");

function fixture(intent = "housing", accepted = true) {
  const s = {tick:0, living:{whispers:[]}};
  const entry = {
    tick:0, intent,
    people:[{id:"worker-1", name:"Ada", agree:accepted, reason:"Individual choice"}],
    decisions:[{name:"Briarford", agree:accepted, reason:"Town choice"}]
  };
  s.living.whispers.push(entry);
  L.attach(s,entry,[{id:"worker-1",name:"Ada",x:2,y:3}]);
  s.tick=1;
  return {s,entry,person:{id:"worker-1",name:"Ada"},town:{name:"Briarford"}};
}

test("GOD-003: merely considering a suggestion never invents a completed action",()=>{
  const {s,entry,person,town}=fixture();
  assert.equal(L.observe(s,person,{kind:"recover",resource:"energy",amount:1}),0);
  assert.equal(L.observeTown(s,town,{kind:"build",buildingType:"farm",buildingId:"farm-1",amount:1}),0);
  assert.ok(L.summary(entry).every(x=>x.status==="considered" && x.result===null));
});

test("GOD-003: build claims require a measurable completed construction, not a cosmetic intention",()=>{
  const {s,entry,town}=fixture();
  for(const incomplete of [
    {kind:"build",buildingType:"house"},
    {kind:"build",buildingType:"house",amount:0,buildingId:"home-1"},
    {kind:"build",buildingType:"house",amount:1},
    {kind:"build",buildingType:"house",amount:Infinity,buildingId:"home-1"}
  ]) assert.equal(L.observeTown(s,town,incomplete),0);
  assert.equal(entry.lifecycle.towns[0].status,"considered");
  assert.equal(L.observeTown(s,town,{kind:"build",buildingType:"house",amount:1,buildingId:"home-1",detail:"Resources consumed; house built"}),1);
  assert.equal(entry.lifecycle.towns[0].result.status,"observed");
  assert.equal(L.observeTown(s,town,{kind:"build",buildingType:"house",amount:1,buildingId:"home-1"}),0,"same witness not credited twice");
});

test("GOD-003: measured action is actor-specific and cannot override a refusal",()=>{
  const {s,entry,person}=fixture("food",false);
  assert.equal(L.observe(s,person,{kind:"produce",resource:"food",amount:3}),0);
  assert.equal(entry.lifecycle.people[0].status,"declined");
  const yes=fixture("food");
  assert.equal(L.observe(yes.s,{id:"not-worker"}, {kind:"produce",resource:"food",amount:3}),0);
  assert.equal(L.observe(yes.s,yes.person,{kind:"produce",resource:"food",amount:0}),0);
  assert.equal(L.observe(yes.s,yes.person,{kind:"produce",resource:"food",amount:3,detail:"Collected 3 food"}),1);
  assert.equal(L.observe(yes.s,yes.person,{kind:"produce",resource:"food",amount:3}),0);
  assert.equal(yes.entry.lifecycle.people[0].result.status,"observed");
});

test("GOD-003: restored declined records cannot forge success or future action evidence",()=>{
  const {s,entry}=fixture("food");
  const saved=JSON.parse(JSON.stringify(s));
  const person=saved.living.whispers[0].lifecycle.people[0];
  person.accepted=false;
  person.status="result";
  person.events.push({type:"action",tick:1,summary:"Forged",proof:"delta=500"});
  person.result={status:"observed",tick:1,summary:"Forged success",proof:"delta=500"};
  L.restore(saved);
  assert.ok(saved.living.whispers[0].lifecycle.people.every(p=>p.accepted || p.status!=="result"));
  assert.equal(saved.living.whispers[0].lifecycle.people.some(p=>p.result?.status==="observed"),false);
});

test("GOD-003: expiration distinguishes unobserved advice from real progress and persists",()=>{
  const {s,entry}=fixture("rest");
  s.tick=entry.lifecycle.until+1;
  assert.equal(L.expire(s),2);
  assert.equal(L.expire(s),0);
  assert.ok(L.summary(entry).every(x=>x.result?.status==="unobserved"));
  const restored=JSON.parse(JSON.stringify(s));
  L.restore(restored);
  assert.deepEqual(L.summary(restored.living.whispers[0]),L.summary(entry));
});

test("GOD-003: malformed or old saves normalize without awarding fictitious results",()=>{
  const {s,entry}=fixture("food");
  entry.lifecycle.people[0].status="result";
  entry.lifecycle.people[0].result={status:"observed",tick:1,summary:"fake",proof:""};
  L.restore(s);
  assert.equal(entry.lifecycle.people.length,0,"a result without any actual action evidence must be discarded");
  const old={tick:1,living:{whispers:[{intent:"food",tick:0}]}};
  assert.doesNotThrow(()=>L.restore(old));
  assert.equal(old.living.whispers[0].lifecycle,undefined);
});
