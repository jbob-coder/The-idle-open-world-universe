// Independent QA proposal only; no runtime imports, canonical data, RNG or gameplay.
// Run: node docs/qa/check_clock_boundary.mjs
// Inputs: world-calendar.md at #77 97ccbce13999416c4eb757619947ef55bf31abe5;
// abilities.md at #78 a3caeaeac33691f4df6c2b67ac80129119609062.
// Candidate integer millisecond representation, pending domain/owner review.
// Milliseconds represent instants, not a requirement to simulate every millisecond.
const MAX_SECONDS=315537897599, MAX_MS=MAX_SECONDS*1000+999;
const COSMIC_SECONDS=63790876800, AGE18_SECONDS=63822412800;
const valid=(x,max)=>Number.isSafeInteger(x)&&x>=0&&x<=max;
function check(ok,message){if(!ok)throw Error(message);}
function toMs(second,offset=0){
  check(valid(second,MAX_SECONDS)&&valid(offset,999),"invalid instant");
  return second*1000+offset;
}
function splitMs(ms){
  check(valid(ms,MAX_MS),"invalid millisecond instant");
  return {second:Math.floor(ms/1000),offset:ms%1000};
}
function advance(ms,duration){
  check(valid(ms,MAX_MS)&&valid(duration,MAX_MS-ms),"invalid duration or overflow");
  return ms+duration;
}
function chronology(opening,due){
  check(valid(opening,MAX_MS)&&valid(due,MAX_MS),"invalid chronology");
  return opening<due?"pending":opening===due?"entry_boundary":"prehistory_required";
}
// Scheduling classifications, NOT acquisition probabilities or eligibility.
// Older actors still require reviewed rules; never draw before the phenomenon.
function age18Chronology(age18,cosmic){
  check(valid(age18,MAX_MS)&&valid(cosmic,MAX_MS),"invalid milestone");
  return age18<cosmic?"pre_phenomenon_unavailable":age18===cosmic?"same_tick_dependency_review":"post_phenomenon_eligibility_review";
}
// Arithmetic oracle: millijoules/second x milliseconds, exact intermediate BigInt.
// Output JSON safe. Remainder in thousandths of a millijoule; domain must define
// ownership, cap, rollback and persistence. No thermal rule is approved here.
function rateOracle(rate,duration,remainder=0){
  check(valid(rate,1000000000)&&valid(duration,MAX_MS)&&valid(remainder,999),"invalid rate inputs");
  const numerator=BigInt(rate)*BigInt(duration)+BigInt(remainder);
  const whole=numerator/1000n;
  check(whole<=BigInt(Number.MAX_SAFE_INTEGER),"energy overflow");
  return {whole:Number(whole),remainder:Number(numerator%1000n)};
}
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const tests=[];
function test(name,fn){try{check(fn()===true,"assertion failed");tests.push({name,pass:true});}catch(e){tests.push({name,pass:false,error:String(e)});}}
function rejects(fn){try{fn();return false;}catch{return true;}}
const C=toMs(COSMIC_SECONDS),A=toMs(AGE18_SECONDS);
test("full calendar milliseconds fit safe integer",()=>MAX_MS===315537897599999&&Number.isSafeInteger(MAX_MS));
test("full calendar microseconds exceed safe integer",()=>BigInt(MAX_SECONDS)*1000000n+999999n>BigInt(Number.MAX_SAFE_INTEGER));
test("epoch round trip",()=>eq(splitMs(0),{second:0,offset:0}));
test("last millisecond round trip",()=>eq(splitMs(MAX_MS),{second:MAX_SECONDS,offset:999}));
test("all 11 source seconds vectors at 0 and 999 ms",()=>[0,86400,59931705600,63087379200,63087465600,63254419200,63633110400,63664646400,COSMIC_SECONDS,AGE18_SECONDS,MAX_SECONDS].every(second=>[0,999].every(offset=>eq(splitMs(toMs(second,offset)),{second,offset}))));
test("all 1000 offsets at cosmic second",()=>Array.from({length:1000},(_,offset)=>eq(splitMs(toMs(COSMIC_SECONDS,offset)),{second:COSMIC_SECONDS,offset})).every(Boolean));
test("1000 ms crossing boundary",()=>eq(splitMs(advance(C,1000)),{second:COSMIC_SECONDS+1,offset:0}));
test("last ms overflow rejected",()=>rejects(()=>advance(MAX_MS,1)));
test("negative duration rejected",()=>rejects(()=>advance(C,-1)));
test("fractional duration rejected",()=>rejects(()=>advance(C,0.5)));
test("invalid offset rejected",()=>rejects(()=>toMs(COSMIC_SECONDS,1000)));
test("string instant rejected",()=>rejects(()=>splitMs("1000")));
test("NaN and infinity rejected",()=>[NaN,Infinity,-Infinity].every(x=>rejects(()=>splitMs(x))));
test("JSON round trip retains final instant",()=>JSON.parse(JSON.stringify(MAX_MS))===MAX_MS);
test("distinct subsecond events preserve order",()=>advance(C,125)<advance(C,350));
test("seconds-only rounding loses distinction",()=>splitMs(advance(C,125)).second===splitMs(advance(C,350)).second);
test("partitioned elapsed time equivalent",()=>advance(advance(C,125),375)===advance(C,500));
test("one ms before cosmic is pending",()=>chronology(C-1,C)==="pending");
test("exact cosmic entry boundary",()=>chronology(C,C)==="entry_boundary");
test("one ms after cosmic requires prehistory",()=>chronology(C+1,C)==="prehistory_required");
test("age18 entry boundary",()=>chronology(A,A)==="entry_boundary");
test("prior age18 has no pre-phenomenon chance",()=>age18Chronology(C-1,C)==="pre_phenomenon_unavailable");
test("same tick age18 requires explicit causal ordering",()=>age18Chronology(C,C)==="same_tick_dependency_review");
test("later age18 leaves domain eligibility explicit",()=>age18Chronology(A,C)==="post_phenomenon_eligibility_review");
test("invalid chronology cannot be classified",()=>rejects(()=>age18Chronology(-1,C)));
test("rate partition retains fractional residue",()=>{let first=rateOracle(3,333),second=rateOracle(3,667,first.remainder);return eq({whole:first.whole+second.whole,remainder:second.remainder},rateOracle(3,1000));});
test("per-boundary flooring loses energy relative to exact partition",()=>Math.floor(3*333/1000)+Math.floor(3*667/1000)!==rateOracle(3,1000).whole);
test("unsafe rate multiplication has actual rounding error despite safe output",()=>{const n=1000000000n*9007199254n+999n;return BigInt(Number(n))!==n&&eq(rateOracle(1000000000,9007199254,999),{whole:9007199254000000,remainder:999});});
test("unsafe final energy rejected",()=>rejects(()=>rateOracle(1000000000,MAX_MS)));
test("invalid remainder rejected",()=>rejects(()=>rateOracle(3,1,1000)));
console.log(JSON.stringify({scope:"proposal-only QA; not gameplay",passed:tests.filter(t=>t.pass).length,total:tests.length,tests},null,2));
if(tests.some(t=>!t.pass))throw Error("clock boundary QA failed");
