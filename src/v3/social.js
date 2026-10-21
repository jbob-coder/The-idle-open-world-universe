/* GODSEED: actual-encounter NPC social ties, independent from rendering.
 * No remote contacts or forced scripted dialogue. Finite reproducible state. */
(function(root,factory){"use strict";const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.GodseedV3Social=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
 const MAX_TIES=32,MEET_RADIUS=2,COOLDOWN=60;
 const integer=n=>Number.isSafeInteger(n)&&n>=0;
 const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
 const create=()=>({ties:[]});
 function advance(s,tick,record){
   if(!s||!s.social||!s.explorer||!s.settlers||!s.settlers[0])return false;
   const a=s.explorer,b=s.settlers[0];
   if(!a.alive||!b.alive||dist(a,b)>MEET_RADIUS||
      a.energy<4||b.energy<4||a.hunger<45||b.hunger<45)return false;
   // Their own curiosity/security influences whether either person wishes to talk.
   const am=a.mind&&a.mind.preferences,bm=b.mind&&b.mind.preferences;
   const preference=(p,k,fallback)=>p&&p[k]!==undefined?p[k]:fallback;
   const welcome=preference(am,"curiosity",55)+preference(bm,"curiosity",50)-
     Math.floor(preference(am,"security",50)/2)-
     Math.floor(preference(bm,"security",50)/2);
   if(welcome<35)return false;
   let tie=s.social.ties.find(t=>t.a===a.id&&t.b===b.id);
   if(tie&&tick-tie.lastAt<COOLDOWN)return false;
   if(!tie){
     if(s.social.ties.length>=MAX_TIES)return false;
     tie={a:a.id,b:b.id,trust:20,meetings:0,firstAt:tick,lastAt:tick};
     s.social.ties.push(tie);
   }
   tie.meetings++;tie.trust=Math.min(100,20+tie.meetings*3);tie.lastAt=tick;
   record(s,tick,"meet",{with:b.id,trust:tie.trust},a.id);
   record(s,tick,"settler_meet",{with:a.id,trust:tie.trust},b.id);
   return true;
 }
 function validate(state,explorer,settlers,tick){
   if(!state||!Array.isArray(state.ties)||state.ties.length>MAX_TIES)return false;
   const b=settlers&&settlers[0];
   for(const t of state.ties){
     if(!explorer||!b||!t||t.a!==explorer.id||t.b!==b.id||
       !integer(t.firstAt)||!integer(t.lastAt)||
       t.firstAt<Math.max(explorer.bornAt,b.bornAt)||
       t.lastAt>tick||t.lastAt<t.firstAt||
       !integer(t.meetings)||t.meetings<1||
       t.meetings>Math.floor((t.lastAt-t.firstAt)/COOLDOWN)+1||
       t.trust!==Math.min(100,20+t.meetings*3))return false;
   }
   return state.ties.length<=1;
 }
 return Object.freeze({create,advance,validate,MAX_TIES});
});