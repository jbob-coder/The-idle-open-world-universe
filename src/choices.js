/* GODSEED utility-based citizen choices. Offline, deterministic, bounded v1 trace. */
(function(root, factory) {
 const api = factory();
 if (typeof module !== 'undefined' && module.exports) module.exports = api;
 root.GodseedChoices = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
 'use strict';
 const INTENTS = Object.freeze(['work', 'explore', 'help', 'rest',
  'seek_safety', 'eat', 'sleep', 'wash', 'warm', 'socialize']);
 const ALLOWED = new Set(INTENTS);
 function bounded(n, low, high, fallback) {
  return typeof n === 'number' && Number.isFinite(n) ?
   Math.max(low, Math.min(high, n)) : fallback;
 }
 function short(s, limit) {
  return typeof s === 'string' ? s.slice(0, limit) : '';
 }
 function decide(person, context) {
  const p = person || {}, c = context || {};
  const diligence = bounded(p.diligence, 0, 1, .5);
  const kindness = bounded(p.kindness, 0, 1, .5);
  const independence = bounded(p.independence, 0, 1, .5);
  const energy = bounded(p.needs && p.needs.energy, 0, 100, 80);
  const phase = bounded(c.phase, 0, 239, 0);
  const working = c.working === true;
  const company = c.company === true;
  const options = [
   {intent:'work', score: working ? 150 + Math.round(20*diligence) : -10,
    why:'Scheduled work and diligence support the village'},
   {intent:'explore', score: phase >= 185 ? 5 :
     (50 + 45*independence + (phase >= 90 ? 10 : 0) - (energy < 40 ? 80 : 0)),
    why:'Independence and curiosity favor surveying nearby land'},
   {intent:'help', score: company ?
     (33 + 45*kindness + (phase >= 90 && phase < 185 ? 15 : 0) + 8) : -100,
    why:'Kindness favors checking on another resident'},
   {intent:'rest', score: 36 + .7*(100-energy) + (phase >= 185 ? 80 : 0),
    why:'Energy and the time of day favor resting at home'}
  ];
  options.sort((a,b) => b.score-a.score ||
   INTENTS.indexOf(a.intent)-INTENTS.indexOf(b.intent));
  let chosen = options[0];
  const urgent = c.priority;
  if (urgent && ALLOWED.has(urgent.action) &&
      !['work','explore','help','rest'].includes(urgent.action)) {
   chosen = {intent:urgent.action,score:999,
    why:short(urgent.reason, 120) || 'Immediate wellbeing takes priority'};
  }
  return {
   intent:chosen.intent, score:Math.round(chosen.score), why:chosen.why,
   alternatives:options.filter(o=>o.intent!==chosen.intent).slice(0,2)
    .map(o=>({intent:o.intent,score:Math.round(o.score)}))
  };
 }
 function normalizeTrace(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) ||
      !ALLOWED.has(raw.intent)) return null;
  const options = Array.isArray(raw.alternatives) ? raw.alternatives : [];
  return {
   tick:Number.isInteger(raw.tick) && raw.tick>=0 ? Math.min(raw.tick, 1000000000) : 0,
   intent:raw.intent,
   score:Math.round(bounded(raw.score,-1000,1000,0)),
   why:short(raw.why,120),
   alternatives:options.filter(o=>o && typeof o==='object' && ALLOWED.has(o.intent) &&
    o.intent!==raw.intent).slice(0,2).map(o=>({
     intent:o.intent,score:Math.round(bounded(o.score,-1000,1000,0))
    })),
   consequence:short(raw.consequence,140)
  };
 }
 return Object.freeze({INTENTS,decide,normalizeTrace});
});
