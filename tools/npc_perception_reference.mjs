// Development reference only; not production authorization or sensory simulation.
export function createPerceptionReference(worldId,checkpoint=null){
  const id=v=>typeof v==="string"&&/^[A-Za-z0-9_-]{1,40}$/.test(v);
  const tick=v=>Number.isSafeInteger(v)&&v>=0;
  if(!id(worldId))throw Error("invalid world identity");
  const receipts=new Map(), processed=new Set();let lastTick=0;
  const copyClaims=claims=>{
    if(!Array.isArray(claims)||claims.length===0||claims.length>100)throw Error("invalid claims");
    const keys=new Set();
    return claims.map(c=>{
      if(!c||typeof c.key!=="string"||c.key.length<1||c.key.length>128||typeof c.value!=="string"||c.value.length<1||c.value.length>2000||keys.has(c.key))throw Error("invalid claim");
      keys.add(c.key);return {key:c.key,value:c.value};
    });
  };
  function ingest(frame){
    // Privileged interface: frame comes from the authoritative action/access service, never cognition.
    if(!frame||frame.world_id!==worldId||!tick(frame.tick)||frame.tick<lastTick||!Array.isArray(frame.actors))throw Error("invalid frame");
    const e=frame.event;
    if(!e||!id(e.id)||e.world_id!==worldId||e.tick!==frame.tick||e.committed!==true||!["direct","report","record","internal"].includes(e.channel))throw Error("invalid event");
    if(processed.has(e.id))return 0;
    const actors=new Set(), pending=[];
    for(const a of frame.actors){
      if(!a||!id(a.actor_id)||actors.has(a.actor_id))throw Error("invalid actor context");
      actors.add(a.actor_id);
      if(a.world_id!==worldId||a.can_acquire!==true)continue;
      let claims;
      if(e.channel==="direct"){
        // Sensory facts must be evaluated at event time by the trusted spatial service.
        if(a.present!==true||a.in_range!==true||a.detected!==true||a.path_clear!==true)continue;
        claims=copyClaims(e.observable_claims);
      }else if(e.channel==="report"){
        if(!id(e.sender_id)||e.completed!==true||!Array.isArray(e.deliveries))continue;
        const deliveries=e.deliveries.filter(d=>d&&d.recipient_id===a.actor_id&&d.completed===true);
        if(deliveries.length!==1)continue;
        claims=copyClaims(deliveries[0].delivered_claims);
      }else if(e.channel==="record"){
        if(e.completed!==true||!Array.isArray(e.grants))continue;
        const grants=e.grants.filter(g=>g&&g.actor_id===a.actor_id&&g.authorized===true&&g.completed===true);
        if(grants.length!==1)continue;
        claims=copyClaims(grants[0].projected_claims);
      }else{
        if(e.subject_id!==a.actor_id)continue;
        claims=copyClaims(e.perceived_claims);
      }
      pending.push({actor_id:a.actor_id,claims});
    }
    // Validate and stage all projections before committing any receipt.
    for(const p of pending){
      const list=receipts.get(p.actor_id)||[];
      const n=list.length+1;
      const r={id:`r:${worldId}:${p.actor_id}:${n}`,world_id:worldId,actor_id:p.actor_id,tick:frame.tick,channel:e.channel,claims:p.claims};
      receipts.set(p.actor_id,[...list,r]);
    }
    processed.add(e.id);lastTick=frame.tick;
    return pending.length;
  }
  // Trusted caller binds an already authenticated simulation actor.
  // Returned capability has no actor selector, event lookup or access to private input.
  function bindActor(actorId){
    if(!id(actorId))throw Error("invalid actor identity");
    const view=()=>{
      const list=receipts.get(actorId)||[];
      return {schema_version:"0.1-proposal",world_id:worldId,actor_id:actorId,as_of_tick:lastTick,revision:list.length,observations:list.map((r,i)=>({id:`o${i+1}`,receipt_id:r.id,acquired_tick:r.tick,channel:r.channel,claims:r.claims.map(c=>({...c})),confidence:"medium"})),beliefs:[],memories:[]};
    };
    return Object.freeze({forCognition:view,forNarrative:view});
  }
  // Diagnostic export is privileged, never made available to actor capabilities.
  function exportReceipts(){return [...receipts.values()].flat().map(r=>({...r,claims:r.claims.map(c=>({...c}))}));}
  // Privileged checkpoint contract; the storage authority must authenticate its origin.
  function exportCheckpoint(){return {format:"perception-checkpoint-v1",world_id:worldId,last_tick:lastTick,processed_event_ids:[...processed],receipts:exportReceipts()}}
  if(checkpoint!==null){
    const exact=(o,keys)=>o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
    const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length&&Array.from({length:a.length},(_,i)=>Object.hasOwn(a,i)).every(Boolean);
    const ensure=(ok,m)=>{if(!ok)throw Error(m)};
    ensure(exact(checkpoint,["format","world_id","last_tick","processed_event_ids","receipts"])&&checkpoint.format==="perception-checkpoint-v1"&&checkpoint.world_id===worldId&&tick(checkpoint.last_tick)&&dense(checkpoint.processed_event_ids)&&dense(checkpoint.receipts),"invalid perception checkpoint");
    for(const eventId of checkpoint.processed_event_ids){ensure(id(eventId)&&!processed.has(eventId),"invalid checkpoint event identity");processed.add(eventId)}
    ensure(processed.size>0||(checkpoint.last_tick===0&&checkpoint.receipts.length===0),"checkpoint lacks processed events");
    let previousActor=null;
    for(const r of checkpoint.receipts){
      ensure(exact(r,["id","world_id","actor_id","tick","channel","claims"])&&r.world_id===worldId&&id(r.actor_id)&&tick(r.tick)&&r.tick<=checkpoint.last_tick&&["direct","report","record","internal"].includes(r.channel),"invalid checkpoint receipt");
      const list=receipts.get(r.actor_id)||[];
      ensure((previousActor===r.actor_id||list.length===0)&&r.id===`r:${worldId}:${r.actor_id}:${list.length+1}`&&list.length<processed.size&&(!list.length||r.tick>=list.at(-1).tick),"invalid receipt sequence");
      ensure(dense(r.claims)&&r.claims.every(c=>exact(c,["key","value"])),"invalid checkpoint claims");
      list.push({id:r.id,world_id:worldId,actor_id:r.actor_id,tick:r.tick,channel:r.channel,claims:copyClaims(r.claims)});receipts.set(r.actor_id,list);previousActor=r.actor_id;
    }
    lastTick=checkpoint.last_tick;
  }
  return Object.freeze({ingest,bindActor,exportReceipts,exportCheckpoint});
}
