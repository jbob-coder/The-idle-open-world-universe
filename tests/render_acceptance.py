"""Atlas decode, pure rendering, cache invalidation and desktop timing evidence."""
from pathlib import Path
import json,subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
    browser=pw.chromium.launch(**({'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}),headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':960,'height':540})
    page.set_content((ROOT/'GODSEED-Play.html').read_text());page.wait_for_function('GodseedAssets.ready')
    page.evaluate('GodseedDebug.newWorld(42);GodseedDebug.setSpeed(0)')
    result=page.evaluate('''() => {
      const d=GodseedDebug,s=d.getState();s.seen.fill(1);d.draw();
      const raw=GodseedSim.serialize(s),before=d.getRenderStats().sceneryRedraws;
      const start=performance.now();for(let i=0;i<100;i++)d.draw();const ms=performance.now()-start;
      if(GodseedSim.serialize(s)!==raw)throw Error('renderer mutated simulation');
      if(d.getRenderStats().sceneryRedraws!==before)throw Error('cache rebuilt unchanged scenery');
      const cam=d.getCamera(),n=GodseedSim.idx(cam.x,cam.y);s.map[n]=s.map[n]===0?4:0;d.draw();
      if(d.getRenderStats().sceneryRedraws!==before+1)throw Error('stale terrain');
      s.seen[n]=0;d.draw();if(d.getRenderStats().sceneryRedraws!==before+2)throw Error('stale fog');
      return {hundredCachedDrawsMs:ms,decodedBytes:d.getRenderStats().decodedBytes,atlases:GodseedAssets.images.length,cacheRebuildsFor100UnchangedDraws:0};
    }''')
    assert result['atlases']==4 and result['decodedBytes']<4*1024*1024
    old=subprocess.check_output(['git','show','d99cd52:GODSEED-Play.html'],cwd=ROOT,text=True)
    old=old.replace('window.GodseedDebug={','window.GodseedDebug={draw,')
    page.set_content(old);page.evaluate('GodseedDebug.newWorld(42);GodseedDebug.setSpeed(0)')
    result['baselineHundredCachedDrawsMs']=page.evaluate('()=>{GodseedDebug.getState().seen.fill(1);GodseedDebug.draw();const t=performance.now();for(let i=0;i<100;i++)GodseedDebug.draw();return performance.now()-t}')
    browser.close()
result['source']='Desktop Chromium timings; not Android FPS or resident memory'
(ROOT/'qa-screenshots/render-metrics.json').write_text(json.dumps(result,indent=2)+'\n')
print(result)
