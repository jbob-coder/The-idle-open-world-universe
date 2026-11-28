# D2/D6 amendment: private revision fencing, actor-visible choice identity

Review-only amendment to [choice_receipt_contract_candidate.json](choice_receipt_contract_candidate.json), baseline candidate blob b2df2a846772f876d4e781bc8b373809233afb21, #99 head be5b5dd6fe40232454772293976a7d55e629a14d. Main f75bdd14827bd6ea8555f6ca428132e91cff97c3. Related #77, #80, #85, #83, #103, #86 QA-K02. No approved schema change, ownership transfer, production modification or gameplay.

## Defect in the proposed contract

The candidate exposes world_revision in public_head and prepared_choice. Its first boundary exposes 8. In two hypothetical worlds with identical authorized actor facts, visible time and actions, an unrelated private transaction can advance this number to 9. A player can distinguish the worlds by reading or refreshing alone. If confirmation requires equality with the old global revision, an unrelated hidden change can also invalidate an otherwise identical feasible choice. This is a design-level counterexample, not a measured production leak. Global revision must still exist privately for atomic CAS. Removing only the numeric field while retaining globally stale public outcomes is insufficient.

## Proposed amendment for review

- Separate public actor view from private world head. Public view: world scope (opaque if needed), epoch fence, authorized actor, current fictional tick, actor-visible view version, allowed facts and opaque prepared choice IDs. Do not expose global commit counters, raw private actor revisions, hidden event/aggregate IDs, private digests or diagnostic values. A visible view version changes only on a change in authorized projection/meaningful choice context, not every hidden write. Its implementation must not encode a private event count. Use existing epoch fencing; review whether epoch identity itself needs an opaque scope.
- Trusted coordinator stores binding {choice_id, world_id, epoch_id, actor_id, public_context_version, definition_id/version, authorized selectors, expiry, private_dependency_refs, issued_at}. These are private records. Opaque choice identity is scoped to actor and epoch, collision checked, and stable across identical authorized refreshes while valid. Neither a private-state digest nor an embedded global revision is a public ID. No claim that opacity alone provides authorization. Require authenticated caller binding; never accept arbitrary actor IDs, private dependencies, effect payloads or client-provided execution facts.
- Public submit: immutable operation ID, opaque choice ID and actor/session scope as supplied by trusted adapter; no raw world_revision. On Continue, verify scope, original public contract, expiry and canonical retry identity. Read current authoritative head. Revalidate actual dependencies and domain access privately; an unrelated private commit does not by itself require a new player selection. If accepted, stage effects against CURRENT global revision and actual pre-stage subject revisions; publish only on CAS success. Do not rebind a stale observed decision to a different action or undisclosed price. A genuine change in authorized choice context invalidates it. If a concurrent write wins CAS, discard entire staged candidate and revalidate the SAME immutable request within bounded technical work, without advancing time or drawing extra RNG. Never overwrite concurrent changes or issue a second player action. Unknown acknowledgement recovers original committed outcome; old epoch public recovery denied. This requires revision of #77/#80 prepared-choice contract before binding.
- Actual changed permission, availability or target condition must be enforced even when not observed; do not bypass a real restriction to maintain indistinguishability. Public preview/selection remains independent of private predicates where safe. At actual admission/outcome disclose only authorized generic unavailability or observed refusal/effects under reviewed access rules. Rejection may still be an inference channel; paired-world tests must cover allowed distinctions, error shapes, retry behavior, choice presence/order and repeated probing, not just the JSON keys. Do not fabricate elapsed time, fake action, secret-revealing message, or guaranteed success to hide a rejection.
- Private event and effect links remain in atomic journal. Actor evidence references should be opaque, scope-checked and linked to authorized acquisition; public receipt cannot list other actors' private event IDs. Receipt ordering uses actor-authorized segment identifiers/ordinals, not global commit sequence. Publication and rendering semantics otherwise follow existing #99 candidate. No production token generation, authentication, evidence policy, latency mitigation or CAS implemented here.

## Executed design counterexample / candidate model

Exact candidate public_head was fetched; the following compact independent model uses its world_revision and scope. Hypothetical private-work bit and view version are test-only; no actual world was run. V8 10/10 design assertions passed. The first two confirm the flaw, not success of the original contract. Actual runtime tests NOT RUN.

```js
const h = {rev:8, epoch:"E1", visibleRevision:1, permission:true, privateWork:0};
const hidden = {...h,rev:h.rev+1,privateWork:1};
const view = x => ({world:"W",epoch:x.epoch,actor:"P",tick:63700000002000,view_revision:x.visibleRevision});
const binding = {world:"W",epoch:h.epoch,actor:"P",visibleRevision:1,choiceId:"Q-test"};
const admit = (x,b,actor="P") => {
 if(actor!==b.actor||b.world!=="W"||x.epoch!==b.epoch||x.visibleRevision!==b.visibleRevision)
   return {status:"refresh_required"};
 if(!x.permission)return {status:"unavailable"};
 return {status:"admitted",privateCAS:x.rev};
};
const eq = (a,b) => JSON.stringify(a)===JSON.stringify(b);
const choice = x => ({...view(x),choice_id:"Q-test",label:"Walk to the lobby"});
const old = x => ({...view(x),world_revision:x.rev});
const oldAdmit = x => x.rev===h.rev?"admitted":"stale";
const denied={...hidden,permission:false};
const checks=[
 !eq(old(h),old(hidden)),
 oldAdmit(h)==="admitted"&&oldAdmit(hidden)==="stale",
 eq(view(h),view(hidden)),
 eq(choice(h),choice(hidden)),
 admit(hidden,binding).status==="admitted"&&admit(hidden,binding).privateCAS===hidden.rev,
 admit({...hidden,visibleRevision:2},binding).status==="refresh_required",
 admit({...h,epoch:"E2"},binding).status==="refresh_required",
 admit(h,binding,"N").status==="refresh_required",
 admit(denied,binding).status==="unavailable",
 eq(choice(hidden),choice(denied))
];
if(checks.some(x=>!x))throw Error("revision privacy model failed");
```

The old comparison above retains the original global revision exposure; actual executed model used the exact fetched public_head with the hypothetical revision overwritten. Neither model implements a real token store or independently authenticates actor identity. The admission model deliberately distinguishes actual access denial from admission; therefore it is NOT proof of complete noninterference.

## Required review / adoption tests

01: confirm private CAS and dependency revalidation, bounded conflict/retry semantics, exact command binding, version migration. 02/03: define which dependency changes require observed choice refresh versus generic actual unavailability, with approved access/effect semantics. 04: define actor-visible version and stable choice/render cursor, no raw private revision in all UI or errors. Review relationship preview #85 and attribution #95 together. Paired-world tests compare entire public view/choice/render/error responses; private revision changes must not affect public choice without authorized cause. Test same actor vs foreign actor/world/epoch, expired token, actual target access revocation, changed public price, concurrent CAS, replay and normal close/reopen. Verify original checkpoint compatibility and actual Node/SQLite then Android. Do not alter existing #99 fixture/checker to silently imply this amendment already adopted. D2/D6 remain open; owner documentation approval and affected peer review still required.