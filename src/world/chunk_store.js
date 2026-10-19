/* GODSEED WLD-002: bounded, sparse, deterministic chunk edits and site persistence.
 * This optional world data layer does NOT replace the existing 64x48 save/runtime.
 * WLD-003/004/007 must explicitly integrate it before claiming live open-world play.
 */
(function (root, factory) {
  "use strict";
  const chunks = typeof module !== "undefined" && module.exports
    ? require("./chunks.js") : root.GodseedChunks;
  const api = factory(chunks);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.GodseedChunkStore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Chunks) {
  "use strict";
  if (!Chunks || typeof Chunks.generateChunk !== "function") {
    throw new Error("GodseedChunks must be loaded before GodseedChunkStore");
  }
  const SCHEMA = 1;
  const MAX_ACTIVE = 16;
  const DEFAULT_ACTIVE = 9;
  const MAX_PATCHED_CHUNKS = 256;
  const MAX_EDITED_TILES = 256;
  const MAX_SITES = 24;
  const MAX_SAVE_BYTES = 4000000; // ES2017-safe: older Android WebView lacks numeric separators.
  const ALLOWED_TILES = new Set(Object.values(Chunks.T));
  const SITE_KINDS = new Set(["settlement", "building", "road", "landmark"]);
  const IDENTIFIER = /^[a-z][a-z0-9:_-]{0,63}$/i;
  const SITE_TYPES = /^[a-z][a-z0-9_-]{0,39}$/i;

  function integer(value, label) {
    if (!Number.isSafeInteger(value)) throw new RangeError(label + " must be a safe integer");
  }
  function chunkKey(cx, cy) {
    return cx + "," + cy;
  }
  function location(x, y) {
    const at = Chunks.worldToChunk(x, y);
    if (at.localX < 0 || at.localX >= Chunks.SIZE ||
        at.localY < 0 || at.localY >= Chunks.SIZE ||
        !Number.isInteger(at.index)) throw new RangeError("unsafe world coordinates");
    Chunks.chunkToWorld(at.chunkX, at.chunkY, at.localX, at.localY);
    return at;
  }
  function siteFrom(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new TypeError("site must be an object");
    }
    if (typeof raw.id !== "string" || !IDENTIFIER.test(raw.id)) {
      throw new RangeError("invalid site id");
    }
    if (!SITE_KINDS.has(raw.kind)) throw new RangeError("invalid site kind");
    if (typeof raw.type !== "string" || !SITE_TYPES.test(raw.type)) {
      throw new RangeError("invalid site type");
    }
    if (typeof raw.label !== "string" || raw.label.length > 80) {
      throw new RangeError("invalid site label");
    }
    if (raw.townId !== null &&
        (typeof raw.townId !== "string" || !IDENTIFIER.test(raw.townId))) {
      throw new RangeError("invalid site townId");
    }
    location(raw.x, raw.y);
    return {id:raw.id,kind:raw.kind,type:raw.type,x:raw.x,y:raw.y,
            label:raw.label,townId:raw.townId};
  }
  function emptyPatch(cx, cy) {
    return {chunkX:cx, chunkY:cy, tiles:new Map(), sites:new Map()};
  }
  function siteCopy(site) {
    return {...site};
  }
  function sortPatch(a, b) {
    return a.chunkX - b.chunkX || a.chunkY - b.chunkY;
  }

  class Store {
    constructor(seed, options) {
      Chunks.tileAt(seed, 0, 0); // Validate exact uint32 seed in source generator.
      const maxActive = options && options.maxActive !== undefined
        ? options.maxActive : DEFAULT_ACTIVE;
      integer(maxActive, "maxActive");
      if (maxActive < 1 || maxActive > MAX_ACTIVE) {
        throw new RangeError("maxActive must be within 1..16");
      }
      this.seed = seed;
      this.maxActive = maxActive;
      this._active = new Map();    // Evictable 32x32 tile buffers.
      this._modified = new Map();  // Only terrain deltas and explicit sites.
    }

    _patch(cx, cy, create) {
      const key = chunkKey(cx, cy);
      let entry = this._modified.get(key);
      if (!entry && create) {
        if (this._modified.size >= MAX_PATCHED_CHUNKS) {
          throw new RangeError("modified chunk quota exceeded");
        }
        entry = emptyPatch(cx, cy);
        this._modified.set(key, entry);
      }
      return entry;
    }

    _forgetEmpty(entry) {
      if (entry && entry.tiles.size === 0 && entry.sites.size === 0) {
        this._modified.delete(chunkKey(entry.chunkX, entry.chunkY));
      }
    }

    _load(cx, cy) {
      const key = chunkKey(cx, cy);
      let tiles = this._active.get(key);
      if (tiles) {
        this._active.delete(key);
      } else {
        // Generate only a single 1024-byte chunk, never the whole world.
        tiles = Chunks.generateChunk(this.seed, cx, cy).tiles;
        const patch = this._patch(cx, cy, false);
        if (patch) for (const [index, tile] of patch.tiles) tiles[index] = tile;
      }
      this._active.set(key, tiles);
      while (this._active.size > this.maxActive) {
        this._active.delete(this._active.keys().next().value);
      }
      return tiles;
    }

    tileAt(x, y) {
      const at = location(x, y);
      return this._load(at.chunkX, at.chunkY)[at.index];
    }

    setTile(x, y, tile) {
      const at = location(x, y);
      if (!ALLOWED_TILES.has(tile)) throw new RangeError("unknown terrain tile");
      const old = this.tileAt(x, y);
      if (old === tile) return false;
      const natural = Chunks.tileAt(this.seed, x, y);
      const current = this._patch(at.chunkX, at.chunkY, false);
      if (tile !== natural && (!current || !current.tiles.has(at.index)) &&
          current && current.tiles.size >= MAX_EDITED_TILES) {
        throw new RangeError("sparse edit quota exceeded for chunk");
      }
      const patch = tile === natural ? current : this._patch(at.chunkX, at.chunkY, true);
      if (patch) {
        if (tile === natural) patch.tiles.delete(at.index);
        else patch.tiles.set(at.index, tile);
        this._forgetEmpty(patch);
      }
      this._load(at.chunkX, at.chunkY)[at.index] = tile;
      return true;
    }

    chunkAt(cx, cy) {
      // Return a copy, so callers cannot modify retained cache behind the delta ledger.
      Chunks.chunkToWorld(cx, cy, 0, 0);
      Chunks.chunkToWorld(cx, cy, Chunks.SIZE - 1, Chunks.SIZE - 1);
      return {chunkX:cx,chunkY:cy,width:Chunks.SIZE,height:Chunks.SIZE,
              tiles:new Uint8Array(this._load(cx, cy)),
              sites:this.sitesAt(cx, cy)};
    }

    putSite(raw) {
      const site = siteFrom(raw);
      const at = location(site.x, site.y);
      const key = chunkKey(at.chunkX, at.chunkY);
      // A stable ID cannot silently exist in two different chunks.
      for (const [otherKey, patch] of this._modified) {
        if (otherKey !== key && patch.sites.has(site.id)) {
          throw new RangeError("site id already belongs to another chunk");
        }
      }
      const patch = this._patch(at.chunkX, at.chunkY, false);
      if (patch && !patch.sites.has(site.id) && patch.sites.size >= MAX_SITES) {
        throw new RangeError("site quota exceeded for chunk");
      }
      this._patch(at.chunkX, at.chunkY, true).sites.set(site.id, site);
      return siteCopy(site);
    }

    removeSite(id) {
      if (typeof id !== "string" || !IDENTIFIER.test(id)) throw new RangeError("invalid site id");
      for (const patch of this._modified.values()) {
        if (!patch.sites.delete(id)) continue;
        this._forgetEmpty(patch);
        return true;
      }
      return false;
    }

    site(id) {
      if (typeof id !== "string" || !IDENTIFIER.test(id)) throw new RangeError("invalid site id");
      for (const patch of this._modified.values()) {
        if (patch.sites.has(id)) return siteCopy(patch.sites.get(id));
      }
      return null;
    }

    sitesAt(cx, cy) {
      Chunks.chunkToWorld(cx, cy, 0, 0);
      const patch = this._patch(cx, cy, false);
      return patch ? [...patch.sites.values()].map(siteCopy)
        .sort((a, b) => a.id.localeCompare(b.id)) : [];
    }

    evictAll() {
      this._active.clear();
    }

    stats() {
      let edits = 0, sites = 0;
      for (const patch of this._modified.values()) {
        edits += patch.tiles.size;
        sites += patch.sites.size;
      }
      return {activeChunks:this._active.size,modifiedChunks:this._modified.size,
              editedTiles:edits,sites,maxActive:this.maxActive};
    }

    snapshot() {
      const patches = [...this._modified.values()].sort(sortPatch).map(p => ({
        chunkX:p.chunkX,chunkY:p.chunkY,
        tiles:[...p.tiles].sort((a, b) => a[0] - b[0]),
        sites:[...p.sites.values()].map(siteCopy)
          .sort((a, b) => a.id.localeCompare(b.id))
      }));
      return {schemaVersion:SCHEMA,seed:this.seed,patches};
    }

    serialize() {
      const output = JSON.stringify(this.snapshot());
      if (output.length > MAX_SAVE_BYTES) throw new RangeError("chunk save quota exceeded");
      return output;
    }
  }

  function create(seed, options) {
    return new Store(seed, options);
  }

  function restore(raw, options) {
    if (typeof raw !== "string" || raw.length > MAX_SAVE_BYTES) {
      throw new RangeError("chunk save must be a bounded JSON string");
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
        parsed.schemaVersion !== SCHEMA || !Array.isArray(parsed.patches) ||
        parsed.patches.length > MAX_PATCHED_CHUNKS) {
      throw new RangeError("invalid chunk save schema");
    }
    // Work in a fresh instance. A rejected import must not alter a live store.
    const store = create(parsed.seed, options);
    const chunkKeys = new Set(), siteIds = new Set();
    for (const patch of parsed.patches) {
      if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
        throw new RangeError("invalid saved chunk");
      }
      integer(patch.chunkX, "chunkX");
      integer(patch.chunkY, "chunkY");
      Chunks.chunkToWorld(patch.chunkX, patch.chunkY, 0, 0);
      Chunks.chunkToWorld(patch.chunkX, patch.chunkY, 31, 31);
      const key = chunkKey(patch.chunkX, patch.chunkY);
      if (chunkKeys.has(key)) throw new RangeError("duplicate saved chunk");
      chunkKeys.add(key);
      if (!Array.isArray(patch.tiles) || patch.tiles.length > MAX_EDITED_TILES ||
          !Array.isArray(patch.sites) || patch.sites.length > MAX_SITES ||
          (patch.tiles.length === 0 && patch.sites.length === 0)) {
        throw new RangeError("invalid sparse chunk payload");
      }
      const indices = new Set();
      for (const pair of patch.tiles) {
        if (!Array.isArray(pair) || pair.length !== 2) throw new RangeError("invalid tile pair");
        integer(pair[0], "tile index");
        if (pair[0] < 0 || pair[0] >= Chunks.CELLS || indices.has(pair[0])) {
          throw new RangeError("invalid/duplicate tile index");
        }
        indices.add(pair[0]);
        const x = Chunks.chunkToWorld(patch.chunkX,patch.chunkY,pair[0]%32,
                                      Math.floor(pair[0]/32)).x;
        const y = Chunks.chunkToWorld(patch.chunkX,patch.chunkY,pair[0]%32,
                                      Math.floor(pair[0]/32)).y;
        if (pair[1] === Chunks.tileAt(store.seed,x,y)) {
          throw new RangeError("redundant tile delta in saved chunk");
        }
        store.setTile(x,y,pair[1]);
      }
      for (const rawSite of patch.sites) {
        const site = siteFrom(rawSite);
        const at = location(site.x,site.y);
        if (at.chunkX !== patch.chunkX || at.chunkY !== patch.chunkY ||
            siteIds.has(site.id)) {
          throw new RangeError("site location/ID conflicts with saved chunk");
        }
        siteIds.add(site.id);
        store.putSite(site);
      }
    }
    return store;
  }

  return Object.freeze({
    SCHEMA,DEFAULT_ACTIVE,MAX_ACTIVE,MAX_PATCHED_CHUNKS,
    MAX_EDITED_TILES,MAX_SITES,MAX_SAVE_BYTES,create,restore
  });
});
