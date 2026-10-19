/* GODSEED WLD-004: autonomous, renderer-independent travel across seeded chunks.
 * Works with WLD-001/WLD-002 terrain and does not mutate the legacy v1 game.
 * Position is a real world tile; no teleportation, virtual arrival or player input.
 */
(function (root, factory) {
  "use strict";
  const chunks = typeof module !== "undefined" && module.exports
    ? require("./chunks.js") : root.GodseedChunks;
  const api = factory(chunks);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.GodseedChunkTravel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Chunks) {
  "use strict";
  if (!Chunks || typeof Chunks.worldToChunk !== "function") {
    throw new Error("GodseedChunks must be loaded before GodseedChunkTravel");
  }

  const MAX_COORD = 1000000;
  const MAX_ACTORS = 64;
  const MAX_EXPANSIONS = 4096;
  const MAX_ROUTE = 256;
  const MAX_TRAVEL_SAVE_BYTES = 64000;
  const DIRS = Object.freeze([[1,0],[0,1],[-1,0],[0,-1]]);
  const WATER = Chunks.T.WATER, STONE = Chunks.T.STONE;

  function coordinate(value, label) {
    if (!Number.isSafeInteger(value) || Math.abs(value) > MAX_COORD) {
      throw new RangeError(label + " must be an integer within the supported world");
    }
    return value;
  }
  function point(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new TypeError(label + " must be a point");
    }
    return {x:coordinate(value.x, label + ".x"), y:coordinate(value.y, label + ".y")};
  }
  function score(value, fallback, label) {
    if (value === undefined) return fallback;
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new RangeError(label + " must be between 0 and 100");
    }
    return value;
  }
  function terrainCost(tile, caution) {
    if (tile === WATER || tile === STONE) return Infinity;
    if (tile === Chunks.T.FOREST) return 1 + (caution >= 65 ? 5 : 2);
    return 1;
  }
  function validStore(store) {
    if (!store || typeof store.tileAt !== "function" || typeof store.stats !== "function") {
      throw new TypeError("a compatible chunk store is required");
    }
  }
  function taxi(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
  function key(x, y) { return x + "," + y; }

  // Stable priority queue: deterministic expansion order across V8/Node.
  class Heap {
    constructor() { this.values = []; this.sequence = 0; }
    push(node, priority) {
      const entry = {node, priority, sequence:this.sequence++};
      const values = this.values;
      values.push(entry);
      let i = values.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1, v = values[p];
        if (v.priority < priority || (v.priority === priority && v.sequence < entry.sequence)) break;
        values[i] = v; i = p;
      }
      values[i] = entry;
    }
    pop() {
      const values = this.values;
      const first = values[0], last = values.pop();
      if (values.length) {
        let i = 0;
        while (true) {
          const left = i * 2 + 1;
          if (left >= values.length) break;
          const right = left + 1;
          let child = left;
          if (right < values.length &&
              (values[right].priority < values[left].priority ||
               (values[right].priority === values[left].priority &&
                values[right].sequence < values[left].sequence))) child = right;
          const v = values[child];
          if (last.priority < v.priority ||
              (last.priority === v.priority && last.sequence < v.sequence)) break;
          values[i] = v; i = child;
        }
        values[i] = last;
      }
      return first.node;
    }
    get length() { return this.values.length; }
  }

  function findRoute(store, startInput, destinationInput, options) {
    validStore(store);
    const start = point(startInput, "start");
    const destination = point(destinationInput, "destination");
    const opts = options || {};
    const caution = score(opts.caution, 50, "caution");
    const expansions = opts.maxExpansions === undefined ? MAX_EXPANSIONS : opts.maxExpansions;
    if (!Number.isSafeInteger(expansions) || expansions < 1 || expansions > MAX_EXPANSIONS) {
      throw new RangeError("invalid maxExpansions");
    }
    const hazard = opts.isHazard;
    if (hazard !== undefined && typeof hazard !== "function") {
      throw new TypeError("isHazard must be a function");
    }
    const blocked = p => terrainCost(store.tileAt(p.x,p.y),caution) === Infinity ||
      !!(hazard && hazard(p.x,p.y));
    if (blocked(destination)) return {status:"blocked_destination",path:[],expanded:0};
    if (taxi(start,destination) === 0) return {status:"arrived",path:[],expanded:0};
    const originKey = key(start.x,start.y),bestByKey = new Map();
    const origin = {x:start.x,y:start.y,g:0,h:taxi(start,destination),parent:null};
    bestByKey.set(originKey,origin);
    const heap = new Heap(); heap.push(origin,origin.h);
    let best=origin,expanded=0,found=null;
    while (heap.length && expanded < expansions) {
      const current = heap.pop();
      if (bestByKey.get(key(current.x,current.y)) !== current) continue;
      expanded++;
      if (current.h === 0) { found=current; break; }
      if (current.h < best.h ||
          (current.h === best.h && current.g < best.g)) best=current;
      for (const [dx,dy] of DIRS) {
        const x=current.x+dx,y=current.y+dy;
        if (Math.abs(x)>MAX_COORD || Math.abs(y)>MAX_COORD) continue;
        // Bound the tile buffers and memory searched per planning call.
        if (Math.abs(x-start.x)+Math.abs(y-start.y)>MAX_ROUTE) continue;
        const tile=store.tileAt(x,y),cost=terrainCost(tile,caution);
        if (!Number.isFinite(cost) || (hazard && hazard(x,y))) continue;
        const g=current.g+cost;
        const k=key(x,y),prior=bestByKey.get(k);
        if (prior && prior.g<=g) continue;
        const node={x,y,g,h:Math.abs(x-destination.x)+Math.abs(y-destination.y),parent:current};
        bestByKey.set(k,node);
        heap.push(node,g+node.h);
      }
    }
    const end=found||best;
    if (end===origin) return {status:"no_progress",path:[],expanded};
    const reverse=[];
    for(let p=end;p && p!==origin;p=p.parent) reverse.push({x:p.x,y:p.y});
    reverse.reverse();
    return {status:found?"complete":"partial",path:reverse,expanded};
  }

  function citizen(raw) {
    if (!raw || typeof raw !== "object" || typeof raw.id !== "string" ||
        !/^[a-zA-Z][a-zA-Z0-9:_-]{0,63}$/.test(raw.id)) {
      throw new RangeError("citizen needs a stable id");
    }
    const pos = point(raw, "citizen");
    const home = point(raw.home || pos, "home");
    const work = raw.work === undefined || raw.work === null ? null : point(raw.work, "work");
    const traits = raw.traits || {};
    const curiosity = score(traits.curiosity,50,"curiosity");
    const caution = score(traits.caution,50,"caution");
    const intelligence = score(traits.intelligence,50,"intelligence");
    const phase = raw.phase === undefined ? "toWork" : raw.phase;
    if (!["toWork","toHome","explore"].includes(phase)) throw new RangeError("invalid phase");
    const expedition = raw.expedition === undefined ? 0 : raw.expedition;
    if (!Number.isSafeInteger(expedition) || expedition<0 || expedition>1000000)
      throw new RangeError("invalid expedition index");
    return {id:raw.id,x:pos.x,y:pos.y,home,work,
      traits:{curiosity,caution,intelligence},
      phase:work?phase:"explore",expedition,activity:"deciding"};
  }
  function expeditionGoal(actor) {
    const radius=16+Math.round(actor.traits.curiosity*0.8);
    // Person-specific preference, not a player order. No random calls affecting saves.
    let h=0x811c9dc5;
    for(let i=0;i<actor.id.length;i++)h=Math.imul(h^actor.id.charCodeAt(i),0x01000193);
    h=(Math.imul(h ^ actor.expedition,0x85ebca6b)>>>0);
    const dir=DIRS[h%4];
    return {x:Math.max(-MAX_COORD,Math.min(MAX_COORD,actor.x+dir[0]*radius)),
      y:Math.max(-MAX_COORD,Math.min(MAX_COORD,actor.y+dir[1]*radius))};
  }
  function nextGoal(actor) {
    if (!actor.work) return expeditionGoal(actor);
    return actor.phase==="toHome"?actor.home:actor.work;
  }

  function create(store, options) {
    validStore(store);
    const opts=options||{};
    const maxActors=opts.maxActors === undefined?32:opts.maxActors;
    if (!Number.isInteger(maxActors)||maxActors<1||maxActors>MAX_ACTORS)
      throw new RangeError("maxActors must be between 1 and 64");
    const hazard=opts.isHazard;
    if(hazard!==undefined&&typeof hazard!=="function")throw new TypeError("invalid isHazard");
    const actors=new Map(),routes=new Map();
    let time=0;
    function add(raw) {
      if (actors.size>=maxActors)throw new RangeError("actor quota exceeded");
      const actor=citizen(raw);
      if(actors.has(actor.id))throw new RangeError("duplicate citizen id");
      if (terrainCost(store.tileAt(actor.x,actor.y), actor.traits.caution)===Infinity)
        throw new RangeError("citizen cannot spawn in impassable terrain");
      actors.set(actor.id,actor);
      return {...actor,home:{...actor.home},work:actor.work&&{...actor.work},traits:{...actor.traits}};
    }
    function tick() {
      time++;
      const log=[];
      for (const actor of [...actors.values()].sort((a,b)=>a.id.localeCompare(b.id))) {
        const goal=nextGoal(actor);
        if (taxi(actor,goal)===0) {
          if(actor.work) actor.phase=actor.phase==="toHome"?"toWork":"toHome";
          else actor.expedition++;
          routes.delete(actor.id);
          actor.activity="arrived";
          log.push({tick:time,id:actor.id,type:"arrived",x:actor.x,y:actor.y});
          continue;
        }
        let route=routes.get(actor.id);
        // No path: stagger deterministic retries rather than running up to
        // 4096 A-star expansions for every stuck citizen on every game tick.
        if(route && route.target.x===goal.x && route.target.y===goal.y &&
           !route.steps.length && route.retryAt>time){
          actor.activity="waiting";
          log.push({tick:time,id:actor.id,type:"blocked",reason:route.status,x:actor.x,y:actor.y});
          continue;
        }
        if(!route || route.target.x!==goal.x || route.target.y!==goal.y ||
           !route.steps.length || !canStep(actor,route.steps[0],actor.traits.caution)) {
          const budget=512+Math.round(actor.traits.intelligence*35);
          const plan=findRoute(store,actor,goal,{caution:actor.traits.caution,
            maxExpansions:Math.min(MAX_EXPANSIONS,budget),isHazard:hazard});
          route={target:{...goal},steps:plan.path,status:plan.status,
            retryAt:plan.path.length?0:time+16};
          routes.set(actor.id,route);
        }
        const next=route.steps[0];
        if (!next || !canStep(actor,next,actor.traits.caution)) {
          // Preserve the scheduled retry for an exhausted route; only discard
          // a formerly valid step invalidated by a new dynamic obstacle.
          if (next) routes.delete(actor.id);
          actor.activity="waiting";
          log.push({tick:time,id:actor.id,type:"blocked",reason:route.status,x:actor.x,y:actor.y});
          continue;
        }
        const previous={x:actor.x,y:actor.y};
        actor.x=next.x;actor.y=next.y;
        route.steps.shift();
        actor.activity=actor.work?"traveling for work":"exploring";
        log.push({tick:time,id:actor.id,type:"step",from:previous,
          to:{x:actor.x,y:actor.y},chunk:Chunks.worldToChunk(actor.x,actor.y)});
      }
      return log;
    }
    function canStep(actor,p,caution) {
      return taxi(actor,p)===1 && terrainCost(store.tileAt(p.x,p.y),caution)<Infinity &&
        !(hazard&&hazard(p.x,p.y));
    }
    function snapshot() {
      return {schemaVersion:1,time,citizens:[...actors.values()]
        .sort((a,b)=>a.id.localeCompare(b.id)).map(a=>({
          id:a.id,x:a.x,y:a.y,home:{...a.home},work:a.work&&{...a.work},
          traits:{...a.traits},phase:a.phase,expedition:a.expedition
        }))};
    }
    function inspect(id) {
      const a=actors.get(id);
      return a?{...a,home:{...a.home},work:a.work&&{...a.work},traits:{...a.traits}}:null;
    }
    function serialize() {
      const serialized=JSON.stringify(snapshot());
      if(serialized.length>MAX_TRAVEL_SAVE_BYTES)throw new RangeError("travel save quota exceeded");
      return serialized;
    }
    return Object.freeze({add,tick,snapshot,serialize,
      inspect,stats:()=>({time,actors:actors.size,cachedRoutes:routes.size,
        activeChunks:store.stats().activeChunks})});
  }
  function restore(store,saved,options) {
    if(typeof saved==="string" && saved.length>MAX_TRAVEL_SAVE_BYTES)
      throw new RangeError("travel save quota exceeded");
    const raw=typeof saved==="string"?JSON.parse(saved):saved;
    if(!raw||raw.schemaVersion!==1||!Array.isArray(raw.citizens)||
       !Number.isSafeInteger(raw.time)||raw.time<0||raw.time>Number.MAX_SAFE_INTEGER)
      throw new RangeError("invalid travel snapshot");
    const runtime=create(store,options);
    for(const c of raw.citizens) runtime.add(c);
    // Tick offset is restored without advancing citizens or consuming resources.
    if(raw.time>0){
      // The logical tick is persisted by wrapping the exposed event stream.
      return withTimeOffset(runtime,raw.time);
    }
    return runtime;
  }
  function withTimeOffset(runtime,offset) {
    return Object.freeze({
      add:runtime.add,inspect:runtime.inspect,
      tick:()=>runtime.tick().map(e=>({...e,tick:e.tick+offset})),
      snapshot:()=>({...runtime.snapshot(),time:runtime.snapshot().time+offset}),
      serialize:()=>{
        const value=JSON.stringify({...runtime.snapshot(),time:runtime.snapshot().time+offset});
        if(value.length>MAX_TRAVEL_SAVE_BYTES)throw new RangeError("travel save quota exceeded");
        return value;
      },
      stats:()=>({...runtime.stats(),time:runtime.stats().time+offset})
    });
  }
  return Object.freeze({MAX_COORD,MAX_ACTORS,MAX_EXPANSIONS,MAX_ROUTE,
    MAX_TRAVEL_SAVE_BYTES,findRoute,create,restore});
});
