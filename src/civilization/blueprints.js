/* GODSEED CIV-001 — metric medieval blueprints and deterministic site zoning.
 * Opt-in planning library: does not modify the old 64x48 simulation, NPCs or v1 saves.
 * Exterior: 2m x 2m per tile. Interior: 1m x 1m per cell.
 * Browser global and CommonJS; no remote requests or mutable world singleton.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.GodseedBlueprints = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const OUTSIDE_METERS = 2, INSIDE_METERS = 1;
  const T = Object.freeze({GRASS:0, FOREST:1, WATER:2, STONE:3, BERRY:4,
    RUIN:5, MEADOW:6, CAMP:7, ROAD:8, VILLAGE:9, SHRINE:10});
  const BUILDABLE = Object.freeze([T.GRASS, T.MEADOW]);
  const APPROACHABLE = Object.freeze([T.GRASS, T.FOREST, T.STONE,
    T.BERRY, T.MEADOW, T.ROAD, T.VILLAGE]);
  const OFFSETS = Object.freeze({north:[0,-1], south:[0,1], east:[1,0], west:[-1,0]});
  const DIRECTIONS = Object.freeze(['north','south','east','west']);

  function freezeRecord(spec) {
    spec.styles = Object.freeze(spec.styles);
    spec.materials = Object.freeze(spec.materials);
    spec.allowedTerrain = BUILDABLE;
    spec.roadAccess = Object.freeze({required:true, maximumStepsFromApproach:1});
    return Object.freeze(spec);
  }
  // Costs are explicit catalog requirements, not an automatic stock deduction.
  const CATALOG = Object.freeze({
    cottage: freezeRecord({id:'cottage',kind:'home',label:'Cottage',w:3,h:3,
      defaultOrientation:'south',styles:['timber','moss'],materials:{wood:4,stone:1}}),
    family_home: freezeRecord({id:'family_home',kind:'home',label:'Family Home',w:4,h:4,
      defaultOrientation:'south',styles:['timber','stone','moss'],materials:{wood:7,stone:3}}),
    large_home: freezeRecord({id:'large_home',kind:'home',label:'Large Home',w:5,h:4,
      defaultOrientation:'south',styles:['timber','stone'],materials:{wood:10,stone:5}}),
    smithy: freezeRecord({id:'smithy',kind:'workshop',label:'Smithy',w:5,h:5,
      defaultOrientation:'south',styles:['stone','timber'],materials:{wood:9,stone:11}}),
    tavern: freezeRecord({id:'tavern',kind:'service',label:'Tavern',w:6,h:5,
      defaultOrientation:'south',styles:['timber','stone'],materials:{wood:14,stone:8}}),
    granary: freezeRecord({id:'granary',kind:'storage',label:'Granary',w:5,h:5,
      defaultOrientation:'south',styles:['timber','stone'],materials:{wood:12,stone:4}}),
    chapel: freezeRecord({id:'chapel',kind:'civic',label:'Chapel',w:6,h:6,
      defaultOrientation:'south',styles:['stone','moss'],materials:{wood:12,stone:20}}),
    communal_hall: freezeRecord({id:'communal_hall',kind:'civic',label:'Communal Hall',w:6,h:6,
      defaultOrientation:'south',styles:['timber','stone'],materials:{wood:18,stone:13}})
  });

  function safeInt(value) { return Number.isSafeInteger(value); }
  function safeAdd(a,b) {
    const value = a+b;
    if (!safeInt(value)) throw new RangeError('world coordinate exceeds safe integer range');
    return value;
  }
  function point(x,y) { return {x,y}; }
  function equalsPoint(a,b) { return a && b && a.x === b.x && a.y === b.y; }
  function geometry(blueprint,x,y,orientation) {
    const w=blueprint.w,h=blueprint.h;
    const midX=Math.floor((w-1)/2), midY=Math.floor((h-1)/2);
    let doorX,doorY;
    if (orientation==='north' || orientation==='south') {
      doorX=safeAdd(x,midX);
      doorY=safeAdd(y,orientation==='north'?0:h-1);
    } else {
      doorX=safeAdd(x,orientation==='west'?0:w-1);
      doorY=safeAdd(y,midY);
    }
    const dir=OFFSETS[orientation], approach=point(safeAdd(doorX,dir[0]),safeAdd(doorY,dir[1]));
    // One exterior 2m threshold spans TWO adjacent 1m interior cells.
    const pair = (orientation==='north'||orientation==='south')
      ? [point(2*midX,orientation==='north'?0:2*h-1),
         point(2*midX+1,orientation==='north'?0:2*h-1)]
      : [point(orientation==='west'?0:2*w-1,2*midY),
         point(orientation==='west'?0:2*w-1,2*midY+1)];
    const arrival=pair.map(p=>point(p.x-dir[0],p.y-dir[1]));
    return {edgeWorld:point(doorX,doorY),approachWorld:approach,
      thresholdInside:pair,safeArrivalInside:arrival, widthMeters:2};
  }

  function planAt(blueprintId,x,y,options={}) {
    const bp=CATALOG[blueprintId];
    if (!bp) throw new RangeError('unknown blueprint ID');
    if (!safeInt(x)||!safeInt(y)) throw new RangeError('origin must be safe integers');
    if (!options || typeof options!=='object'||Array.isArray(options)) throw new TypeError('invalid options');
    const orientation=options.orientation===undefined?bp.defaultOrientation:options.orientation;
    const style=options.style===undefined?bp.styles[0]:options.style;
    if (!DIRECTIONS.includes(orientation)) throw new RangeError('invalid door orientation');
    if (!bp.styles.includes(style)) throw new RangeError('style not permitted by blueprint');
    if (options.buildingId!==undefined &&
       (typeof options.buildingId!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,63}$/.test(options.buildingId))) {
      throw new RangeError('building ID must be a short stable identifier');
    }
    safeAdd(x,bp.w); safeAdd(y,bp.h);
    const interiorW=2*bp.w, interiorH=2*bp.h;
    return {
      blueprintId, buildingId:options.buildingId===undefined?null:options.buildingId,
      kind:bp.kind, style, orientation,
      footprint:{x,y,w:bp.w,h:bp.h,metersPerTile:OUTSIDE_METERS},
      metrics:{exteriorWidthMeters:interiorW,exteriorHeightMeters:interiorH,
        grossAreaM2:interiorW*interiorH, interiorWidthCells:interiorW,
        interiorHeightCells:interiorH, interiorMetersPerCell:INSIDE_METERS,
        interiorUsefulAreaM2:(interiorW-2)*(interiorH-2)},
      materials:{...bp.materials},
      entrance:geometry(bp,x,y,orientation)
    };
  }

  function bad(reason,details) { return {ok:false,reason,...(details?{details}:{})}; }
  function rectOf(building) {
    if (!building || typeof building!=='object') return null;
    const rect=building.footprint||building;
    if (!rect || ![rect.x,rect.y,rect.w,rect.h].every(safeInt) ||
        rect.w<1||rect.h<1 || !safeInt(rect.x+rect.w)||!safeInt(rect.y+rect.h)) return null;
    return rect;
  }
  function overlap(a,b) {
    return a.x < b.x+b.w && b.x < a.x+a.w &&
           a.y < b.y+b.h && b.y < a.y+a.h;
  }
  function within(p,r) { return p.x>=r.x && p.x<r.x+r.w && p.y>=r.y && p.y<r.y+r.h; }
  function sameCells(a,b) { return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((p,i)=>equalsPoint(p,b[i])); }

  /**
   * world.tileAt(x,y) is the preferred infinite/chunk-aware terrain adapter.
   * Alternative: world={width,height,tiles,originX?,originY?} for small maps.
   * world.existingBuildings is an optional array of 2D occupied rectangles.
   * world.isOccupied/isProtected are optional extra world constraints.
   * All callbacks are read only. Neither placement nor evaluation modifies game state.
   */
  function validateSite(site,world) {
    if (!site || typeof site!=='object' || !world || typeof world!=='object') return bad('invalid_input');
    let expected;
    try {
      if (!site.footprint) return bad('invalid_site');
      expected=planAt(site.blueprintId,site.footprint.x,site.footprint.y,
        {orientation:site.orientation,style:site.style,buildingId:site.buildingId===null?undefined:site.buildingId});
    } catch (_) { return bad('invalid_site'); }
    const a=site.footprint, b=expected.footprint;
    if (a.w!==b.w||a.h!==b.h||a.metersPerTile!==OUTSIDE_METERS||
        site.kind!==expected.kind||site.buildingId!==expected.buildingId||
        !site.entrance||site.entrance.widthMeters!==2||!site.metrics||!site.materials||
        !equalsPoint(site.entrance.edgeWorld,expected.entrance.edgeWorld)||
        !equalsPoint(site.entrance.approachWorld,expected.entrance.approachWorld)||
        !sameCells(site.entrance.thresholdInside,expected.entrance.thresholdInside)||
        !sameCells(site.entrance.safeArrivalInside,expected.entrance.safeArrivalInside)||
        Object.keys(expected.metrics).some(k=>site.metrics[k]!==expected.metrics[k])||
        Object.keys(expected.materials).some(k=>site.materials[k]!==expected.materials[k])) return bad('invalid_site');
    const rects=world.existingBuildings===undefined?[]:world.existingBuildings;
    if (!Array.isArray(rects)) return bad('invalid_world');
    for (const placed of rects) {
      const rect=rectOf(placed);
      if (!rect) return bad('invalid_existing_footprint');
      if (site.buildingId && placed.buildingId===site.buildingId) return bad('duplicate_building_id');
      if (placed.entrance!==undefined && (!placed.entrance.approachWorld ||
          !safeInt(placed.entrance.approachWorld.x)||!safeInt(placed.entrance.approachWorld.y)))
        return bad('invalid_existing_entrance');
      if (overlap(a,rect)) return bad('building_overlap');
      if (within(site.entrance.approachWorld,rect)) return bad('door_approach_blocked');
      if (placed.entrance?.approachWorld && within(placed.entrance.approachWorld,a))
        return bad('blocks_existing_door');
    }
    if (world.isOccupied!==undefined && typeof world.isOccupied!=='function') return bad('invalid_world');
    if (world.isProtected!==undefined && typeof world.isProtected!=='function') return bad('invalid_world');
    if (world.roadAt!==undefined && typeof world.roadAt!=='function') return bad('invalid_world');
    if (world.tileAt!==undefined && typeof world.tileAt!=='function') return bad('invalid_world');
    let tileAt=world.tileAt;
    let xmin=null,xmax=null,ymin=null,ymax=null;
    if (world.width!==undefined || world.height!==undefined || world.tiles!==undefined) {
      if (!safeInt(world.width)||!safeInt(world.height)||world.width<1||world.height<1||
          world.width>4096||world.height>4096||!safeInt(world.originX??0)||!safeInt(world.originY??0)) return bad('invalid_world');
      xmin=world.originX??0; ymin=world.originY??0;
      xmax=xmin+world.width; ymax=ymin+world.height;
      if (!safeInt(xmax)||!safeInt(ymax)) return bad('invalid_world');
      if (!tileAt) {
        if (!world.tiles || world.tiles.length!==world.width*world.height) return bad('invalid_world');
        tileAt=(x,y)=>world.tiles[(y-ymin)*world.width+x-xmin];
      }
    }
    if (!tileAt) return bad('invalid_world');
    const at=(x,y)=>{
      if (xmin!==null&&(x<xmin||x>=xmax||y<ymin||y>=ymax)) return null;
      return tileAt(x,y);
    };
    const inside=(x,y)=>xmin===null||(x>=xmin&&x<xmax&&y>=ymin&&y<ymax);
    const obstructed=(x,y)=>Boolean(world.isOccupied?.(x,y)||world.isProtected?.(x,y));
    try {
      for(let y=a.y;y<a.y+a.h;y++)for(let x=a.x;x<a.x+a.w;x++) {
        if (!inside(x,y)) return bad('out_of_bounds');
        if (!CATALOG[site.blueprintId].allowedTerrain.includes(at(x,y))) return bad('unsafe_terrain',{x,y});
        if (obstructed(x,y)) return bad('protected_or_occupied',{x,y});
      }
      const approach=site.entrance.approachWorld;
      if (!inside(approach.x,approach.y)) return bad('approach_out_of_bounds');
      if (!APPROACHABLE.includes(at(approach.x,approach.y))||obstructed(approach.x,approach.y))
        return bad('door_approach_blocked');
      // A door is usable only if approach touches an existing road (or IS a road).
      const near=[approach, ...Object.values(OFFSETS).map(([dx,dy])=>point(approach.x+dx,approach.y+dy))];
      const road=near.some(p=>safeInt(p.x)&&safeInt(p.y)&&inside(p.x,p.y)&&!within(p,a)&&
        !rects.some(e=>within(p,rectOf(e))) && !obstructed(p.x,p.y) &&
        (at(p.x,p.y)===T.ROAD || world.roadAt?.(p.x,p.y)===true));
      if (!road) return bad('road_access_required');
    } catch (_) { return bad('invalid_world_callback'); }
    return {ok:true,reason:null,site};
  }

  function reserveSite(site,world) {
    const result=validateSite(site,world);
    if (!result.ok) return result;
    // A new collection, not a mutation of the caller's world or a v1 save.
    return {ok:true,reason:null,site,existingBuildings:[...(world.existingBuildings||[]),site]};
  }

  return Object.freeze({OUTSIDE_METERS,INSIDE_METERS,T,CATALOG,planAt,validateSite,reserveSite});
});