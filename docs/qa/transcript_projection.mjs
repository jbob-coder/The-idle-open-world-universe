// Portable review candidate, not yet a production consumer or authorization layer.
// Trusted storage must supply a single actor-scoped immutable prefix and enforce
// unique (world, epoch, actor, receipt, paragraph) keys across all pages.
const id = x => typeof x === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(x);
const nat = x => Number.isSafeInteger(x) && x >= 0;
const exact = (x, fields) => x !== null && typeof x === 'object' && !Array.isArray(x) && Object.keys(x).length === fields.length && fields.every(k => Object.hasOwn(x,k));
const check = (ok, message) => { if (!ok) throw new Error(message); };
const SCOPE = ['world_id','epoch_id','actor_id'];
const RECORD = [...SCOPE,'ordinal','receipt_id','paragraph','content_version','template_id','variant_index'];
const CURSOR = [...SCOPE,'after','through'];
export const MAX_PAGE_SIZE = 64;
const scopeValid = s => exact(s,SCOPE) && SCOPE.every(k=>id(s[k]));
const sameScope = (a,b) => SCOPE.every(k=>a[k]===b[k]);

// Open a fixed prefix. Appends after through do not change earlier pages.
export function openTranscriptCursor(scope,through) {
  check(scopeValid(scope) && nat(through),'invalid transcript scope or head');
  return Object.freeze({...scope,after:0,through});
}

// Caller supplies at most one exact, contiguous page from trusted committed
// storage. Pending/rejected actions must never create segment records.
// resolveText is a trusted immutable content-version resolver, not user text.
// This does NOT authenticate receipts, verify actual effects, or persist rows.
export function projectTranscriptPage(scope,cursor,limit,records,resolveText) {
  check(scopeValid(scope) && exact(cursor,CURSOR) && sameScope(scope,cursor) && nat(cursor.after) && nat(cursor.through) && cursor.after<=cursor.through,'invalid or foreign cursor');
  check(Number.isSafeInteger(limit)&&limit>=1&&limit<=MAX_PAGE_SIZE,'invalid page size');
  check(typeof resolveText==='function','missing content resolver');
  const count=Math.min(limit,cursor.through-cursor.after);
  check(Array.isArray(records)&&records.length===count,'missing or excess committed segments');
  const segments=[],keys=new Set();
  for(let i=0;i<count;i++) {
    const r=records[i];
    check(exact(r,RECORD)&&sameScope(scope,r)&&r.ordinal===cursor.after+i+1&&id(r.receipt_id)&&nat(r.paragraph)&&id(r.content_version)&&id(r.template_id)&&nat(r.variant_index),'invalid segment scope or order');
    const key=[r.world_id,r.epoch_id,r.actor_id,r.receipt_id,r.paragraph].join(':');
    check(!keys.has(key),'duplicate segment identity'); keys.add(key);
    const text=resolveText(r.content_version,r.template_id,r.variant_index);
    check(typeof text==='string'&&text.length>0&&text.length<=32768,'missing or invalid versioned content');
    segments.push(Object.freeze({key,ordinal:r.ordinal,text}));
  }
  const next=Object.freeze({...scope,after:cursor.after+count,through:cursor.through});
  return Object.freeze({segments:Object.freeze(segments),next,done:next.after===next.through});
}
