const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const script=fs.readFileSync(path.resolve(__dirname,'../src/splash.js'),'utf8');

function mount(query=''){
 const elements={};
 function el(id){
  return elements[id]||(elements[id]={
   hidden:id==='splashRetry'||id==='splashEnter',textContent:'',
   style:{},attributes:{},handlers:{},
   setAttribute(key,value){this.attributes[key]=value;},
   getAttribute(key){return this.attributes[key];},
   addEventListener(event,fn){this.handlers[event]=fn;},
   click(){this.handlers.click();}
  });
 }
 const root={},location={search:query,reload(){root.reloaded=true}};
 vm.runInNewContext(script,{
  window:root,document:{getElementById:el},
  URLSearchParams,location,requestAnimationFrame:callback=>callback(),
 });
 return {splash:root.GodseedSplash,el,root};
}
test('real startup stages never roll back or fake completion',()=>{
 const {splash,el}=mount();
 assert.equal(splash.getState().progress,0);
 splash.step(42,'Preparando mundo...');
 splash.step(12,'Old event');
 assert.equal(splash.getState().progress,42);
 assert.equal(el('splashStatus').textContent,'Old event');
 assert.equal(el('splashProgress').getAttribute('aria-valuenow'),'42');
 assert.equal(el('splashFill').style.width,'42%');
 splash.complete();
 assert.equal(splash.getState().ready,true);
 assert.equal(splash.getState().progress,100);
 assert.equal(el('godseedSplash').hidden,true);
 splash.step(20,'Incorrect late progress');
 assert.equal(splash.getState().progress,100);
});
test('QA preview holds fully loaded art until player dismisses it',()=>{
 const {splash,el}=mount('?splashPreview=1');
 splash.step(75,'Preparing');
 splash.complete();
 assert.equal(splash.getState().preview,true);
 assert.equal(el('godseedSplash').hidden,false);
 assert.equal(el('splashEnter').hidden,false);
 el('splashEnter').click();
 assert.equal(el('godseedSplash').hidden,true);
});
test('asset decode failure does not reveal a broken world',()=>{
 const {splash,el,root}=mount();
 splash.step(70,'Decoding');
 splash.fail('missing sprites');
 assert.equal(splash.getState().error,true);
 assert.equal(splash.getState().ready,false);
 assert.equal(el('splashRetry').hidden,false);
 assert.match(el('splashStatus').textContent,/missing sprites/);
 splash.complete();
 assert.equal(el('godseedSplash').hidden,false);
 el('splashRetry').click();
 assert.equal(root.reloaded,true);
});
