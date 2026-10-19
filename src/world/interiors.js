/* GODSEED INT-003 — version-1 compatible, opt-in interior persistence.
 * This is spatial data only: moving a resident through a door belongs to INT-004.
 * No canvas, network, scheduled simulation, or physical-device claims.
 */
(function(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.GodseedInteriors = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  "use strict";

  const VERSION = 1;
  const MAX_INTERIORS = 24;
  const MAX_FURNITURE = 32;
  const MAX_REVISION = 1000000;
  const BUILDING_ID = /^[a-z][a-z0-9_-]{0,63}$/i;
  const ITEM_ID = /^[a-z][a-z0-9_-]{0,47}$/i;
  const TEMPLATE_ID = /^[a-z][a-z0-9_/-]{0,63}$/i;
  const DIRECTIONS = ["north", "south", "east", "west"];

  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
  function safeInt(value, name) {
    if (!Number.isSafeInteger(value)) throw new RangeError(name + " must be a safe integer");
    return value;
  }
  function point(raw, name) {
    if (!isObject(raw)) throw new TypeError(name + " must be a point");
    return {x:safeInt(raw.x,name+".x"), y:safeInt(raw.y,name+".y")};
  }
  function same(a,b) { return a.x===b.x && a.y===b.y; }
  function empty() { return {version:VERSION, interiors:{}}; }

  function catalog(living) {
    const buildings = new Map(), ambiguous = new Set();
    if (!isObject(living) || !Array.isArray(living.towns)) return buildings;
    for (const town of living.towns.slice(0,32)) {
      if (!isObject(town) || !Array.isArray(town.buildings)) continue;
      for (const b of town.buildings.slice(0,32)) {
        if (!isObject(b) || typeof b.id!=="string" || !BUILDING_ID.test(b.id)) continue;
        if (buildings.has(b.id)) ambiguous.add(b.id);
        else buildings.set(b.id,b);
      }
    }
    // Never silently bind an interior to one of two identically named buildings.
    for (const id of ambiguous) buildings.delete(id);
    return buildings;
  }

  function geometry(building) {
    if (!isObject(building) || !BUILDING_ID.test(building.id||"")) {
      throw new RangeError("interior requires an existing, uniquely identified building");
    }
    const x=safeInt(building.x,"building.x"), y=safeInt(building.y,"building.y");
    const w=safeInt(building.w,"building.w"), h=safeInt(building.h,"building.h");
    // A historical 1x1 hut has no enclosed 1m walkable arrival; leave it exterior.
    if (w<2 || h<2 || w>6 || h>6 || !Number.isSafeInteger(x+w+1) ||
        !Number.isSafeInteger(y+h+1)) {
      throw new RangeError("interior requires safe 2..6 tile building footprint");
    }
    return {x,y,w,h,width:w*2,height:h*2};
  }

  function entranceFrom(raw, building) {
    if (!isObject(raw) || !DIRECTIONS.includes(raw.orientation)) {
      throw new RangeError("invalid entrance orientation");
    }
    const geom=geometry(building), side=raw.orientation;
    const exterior=point(raw.thresholdWorld,"thresholdWorld");
    const approach=point(raw.approachWorld,"approachWorld");
    const inside=point(raw.thresholdInside,"thresholdInside");
    const arrival=point(raw.safeArrivalInside,"safeArrivalInside");
    let valid=false;
    if (side==="south") valid=
      exterior.y===geom.y+geom.h-1 && exterior.x>=geom.x && exterior.x<geom.x+geom.w &&
      same(approach,{x:exterior.x,y:exterior.y+1}) &&
      inside.y===geom.height-1 && inside.x>0 && inside.x<geom.width-1 &&
      same(arrival,{x:inside.x,y:inside.y-1});
    if (side==="north") valid=
      exterior.y===geom.y && exterior.x>=geom.x && exterior.x<geom.x+geom.w &&
      same(approach,{x:exterior.x,y:exterior.y-1}) &&
      inside.y===0 && inside.x>0 && inside.x<geom.width-1 &&
      same(arrival,{x:inside.x,y:inside.y+1});
    if (side==="east") valid=
      exterior.x===geom.x+geom.w-1 && exterior.y>=geom.y && exterior.y<geom.y+geom.h &&
      same(approach,{x:exterior.x+1,y:exterior.y}) &&
      inside.x===geom.width-1 && inside.y>0 && inside.y<geom.height-1 &&
      same(arrival,{x:inside.x-1,y:inside.y});
    if (side==="west") valid=
      exterior.x===geom.x && exterior.y>=geom.y && exterior.y<geom.y+geom.h &&
      same(approach,{x:exterior.x-1,y:exterior.y}) &&
      inside.x===0 && inside.y>0 && inside.y<geom.height-1 &&
      same(arrival,{x:inside.x+1,y:inside.y});
    if (!valid) throw new RangeError("entrance and return anchors must match building geometry");
    return {orientation:side,thresholdWorld:exterior,approachWorld:approach,
      thresholdInside:inside,safeArrivalInside:arrival};
  }

  function furnitureFrom(raw, geom, arrival) {
    if (!Array.isArray(raw) || raw.length>MAX_FURNITURE) {
      throw new RangeError("invalid furniture count");
    }
    const items=[],ids=new Set(),occupied=new Set();
    for (const item of raw) {
      if (!isObject(item) || typeof item.id!=="string" || !ITEM_ID.test(item.id) ||
          typeof item.kind!=="string" || !ITEM_ID.test(item.kind) ||
          ids.has(item.id)) throw new RangeError("duplicate or invalid furniture identity");
      const x=safeInt(item.x,"furniture.x"),y=safeInt(item.y,"furniture.y");
      const w=safeInt(item.w,"furniture.w"),h=safeInt(item.h,"furniture.h");
      // One-cell thick walls border the useful interior floor.
      if (x<1 || y<1 || w<1 || h<1 || x+w>=geom.width || y+h>=geom.height) {
        throw new RangeError("furniture escapes usable interior floor");
      }
      for (let py=y;py<y+h;py++) for (let px=x;px<x+w;px++) {
        const key=px+","+py;
        if (occupied.has(key) || same({x:px,y:py},arrival)) {
          throw new RangeError("furniture blocks arrival or overlaps another furnishing");
        }
        occupied.add(key);
      }
      ids.add(item.id);
      items.push({id:item.id,kind:item.kind,x,y,w,h});
    }
    return items.sort((a,b)=>a.id.localeCompare(b.id));
  }

  function make(building, spec) {
    if (!isObject(spec)) throw new TypeError("interior details must be an object");
    const geom=geometry(building);
    const entrance=entranceFrom(spec.entrance,building);
    const furniture=furnitureFrom(spec.furniture||[],geom,entrance.safeArrivalInside);
    const template=spec.template===undefined ? "medieval/default/v1" : spec.template;
    if (typeof template!=="string" || !TEMPLATE_ID.test(template)) {
      throw new RangeError("invalid interior template");
    }
    const revision=spec.revision===undefined?0:safeInt(spec.revision,"revision");
    if (revision<0 || revision>MAX_REVISION) throw new RangeError("invalid interior revision");
    return {version:VERSION,id:"interior:"+building.id,buildingId:building.id,safeZone:true,
      grid:{width:geom.width,height:geom.height,metersPerCell:1},
      template,entrance,furniture,revision};
  }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }

  function register(spaces, living, buildingId, spec) {
    if (!isObject(spaces) || spaces.version!==VERSION ||
        !isObject(spaces.interiors)) throw new RangeError("spaces state is invalid");
    if (typeof buildingId!=="string" || !BUILDING_ID.test(buildingId)) {
      throw new RangeError("invalid building ID");
    }
    const b=catalog(living).get(buildingId);
    if (!b) throw new RangeError("building missing or identity ambiguous");
    const entry=make(b,spec),id=entry.id;
    if (!Object.prototype.hasOwnProperty.call(spaces.interiors,id) &&
        Object.keys(spaces.interiors).length>=MAX_INTERIORS) {
      throw new RangeError("interior quota exceeded");
    }
    // Validate fully before modifying the durable registry.
    spaces.interiors[id]=entry;
    return copy(entry);
  }

  function find(spaces, id) {
    if (!isObject(spaces) || !isObject(spaces.interiors) ||
        typeof id!=="string" || !id.startsWith("interior:") ||
        !Object.prototype.hasOwnProperty.call(spaces.interiors,id)) return null;
    return copy(spaces.interiors[id]);
  }

  function restore(raw, living) {
    const result=empty();
    if (!isObject(raw) || raw.version!==VERSION ||
        !isObject(raw.interiors)) return result;
    const keys=Object.keys(raw.interiors);
    if (keys.length>MAX_INTERIORS) return result;
    const buildings=catalog(living);
    for (const key of keys.sort()) {
      const entry=raw.interiors[key];
      if (!isObject(entry) || typeof entry.buildingId!=="string") continue;
      const b=buildings.get(entry.buildingId);
      if (!b || key!=="interior:"+b.id || entry.id!==key ||
          entry.version!==VERSION || entry.safeZone!==true) continue;
      try {
        const clean=make(b,entry);
        if (!isObject(entry.grid) || entry.grid.width!==clean.grid.width ||
            entry.grid.height!==clean.grid.height ||
            entry.grid.metersPerCell!==1) continue;
        result.interiors[key]=clean;
      } catch (_) {
        // An untrusted optional room must never invalidate a complete v1 world.
      }
    }
    return result;
  }

  return Object.freeze({VERSION,MAX_INTERIORS,MAX_FURNITURE,empty,register,find,restore});
});
