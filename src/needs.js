/* GODSEED citizen needs: deterministic, bounded and JSON-compatible. Offline UMD. */
(function(root, factory) {
 const api = factory();
 if (typeof module !== 'undefined' && module.exports) module.exports = api;
 root.GodseedNeeds = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
 'use strict';
 const KEYS = Object.freeze(['hunger', 'energy', 'comfort', 'safety', 'social', 'hygiene']);
 const DEFAULTS = Object.freeze({hunger:82, energy:84, comfort:74, safety:85, social:76, hygiene:78});
 const LIMIT = 100;
 function normalize(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const result = {};
  for (const key of KEYS) {
   const n = Object.prototype.hasOwnProperty.call(source, key) ? source[key] : undefined;
   result[key] = typeof n === 'number' && Number.isFinite(n) ?
    Math.max(0, Math.min(LIMIT, Math.round(n))) : DEFAULTS[key];
  }
  return result;
 }
 function decay(raw, context) {
  const p = normalize(raw), c = context || {};
  for (const key of KEYS) p[key] = Math.max(0, p[key] - 1);
  if (c.working) {p.energy = Math.max(0, p.energy - 1); p.hygiene = Math.max(0, p.hygiene - 1);}
  if (c.danger) p.safety = Math.max(0, p.safety - 7);
  return p;
 }
 function priority(raw, context) {
  const p = normalize(raw), c = context || {};
  // Risk to life always outranks chores, companionship and divine suggestions.
  if (c.danger || p.safety <= 30) return {key:'safety', action:'seek_safety', reason:'Unsafe surroundings or insufficient safety'};
  if (p.hunger <= 32) return {key:'hunger', action:'eat', reason:'Needs food before work'};
  if (p.energy <= 28) return {key:'energy', action:'sleep', reason:'Needs sleep before work'};
  if (p.hygiene <= 24) return {key:'hygiene', action:'wash', reason:'Needs to wash'};
  if (p.comfort <= 26) return {key:'comfort', action:'warm', reason:'Needs shelter and warmth'};
  if (p.social <= 26) return {key:'social', action:'socialize', reason:'Needs companionship'};
  return null;
 }
 const EFFECTS = Object.freeze({
  eat:{hunger:45,comfort:3},
  sleep:{energy:42,comfort:10,safety:5},
  seek_safety:{safety:46,comfort:4},
  wash:{hygiene:46,comfort:3},
  warm:{comfort:40,energy:4},
  socialize:{social:44,comfort:4}
 });
 function act(raw, action, context) {
  const needs = normalize(raw), c = context || {};
  const available = action === 'eat' ? c.foodAvailable === true :
   action === 'wash' ? c.atWell === true :
   action === 'socialize' ? c.company === true :
   ['sleep','warm','seek_safety'].includes(action) ? c.sheltered === true : false;
  if (!available) return {needs, performed:false};
  for (const [key, points] of Object.entries(EFFECTS[action])) {
   needs[key] = Math.min(LIMIT, needs[key] + points);
  }
  return {needs, performed:true};
 }
 return Object.freeze({KEYS, DEFAULTS, normalize, decay, priority, act});
});
