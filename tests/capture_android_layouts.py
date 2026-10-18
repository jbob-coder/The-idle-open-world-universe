"""Running Chromium evidence; controlled revealed scenes, NOT physical Android."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-screenshots';OUT.mkdir(exist_ok=True)
with sync_playwright() as pw:
    browser=pw.chromium.launch(**({'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}),headless=True,args=['--no-sandbox'])
    evidence=[]
    for width,height in [(640,360),(720,400),(960,540)]:
        context=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce',offline=True)
        page=context.new_page();errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.route('http://godseed.test/',lambda r:r.fulfill(content_type='text/html',body=(ROOT/'GODSEED-Play.html').read_text()))
        page.goto('http://godseed.test/')
        page.evaluate('GodseedDebug.newWorld(20261017);GodseedDebug.step(100);GodseedDebug.setSpeed(0)')
        assert page.evaluate('GodseedDebug.getCamera().width')==32
        for zoom,tiles in enumerate([(32,20),(24,15),(16,10)]):
            page.evaluate("(z)=>{GodseedDebug.newWorld(20261017);GodseedDebug.step(100);GodseedDebug.setSpeed(0);GodseedDebug.setZoom(z);document.querySelector('#toast').classList.remove('show');window.scrollTo(0,0)}",zoom)
            camera=page.evaluate('GodseedDebug.getCamera()');assert (camera['width'],camera['height'])==tiles
            assert page.locator('#androidDock button').count()==10
            assert page.evaluate("[...document.querySelectorAll('#androidDock button')].every(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&r.height>=40})")
            page.screenshot(path=str(OUT/f'chromium-{width}x{height}-{tiles[0]}x{tiles[1]}.png'))
            # Every camera maps an actual click to the intended visible NPC.
            page.evaluate('()=>{const s=GodseedDebug.getState(),p=s.npcs[0];s.bot.x=p.x;s.bot.y=p.y;s.seen[GodseedSim.idx(p.x,p.y)]=1;s.faith=50;p.favorUntil=0;GodseedDebug.step(0)}')
            page.locator('#androidDock [data-power=inspire]').click()
            pos=page.evaluate("()=>{const p=GodseedDebug.getState().npcs[0];return GodseedCamera.worldToPointer(GodseedDebug.getCamera(),document.querySelector('#world').getBoundingClientRect(),p.x,p.y)}")
            page.mouse.click(pos['x'],pos['y']);assert page.evaluate('GodseedDebug.getState().faith')==45,(width,height,zoom,pos,page.locator('#toast').inner_text(),page.evaluate('(p)=>document.elementFromPoint(p.x,p.y)?.id',pos))
        # Regional scenes use revealed QA setup; gameplay itself still uses fog.
        for region,x,y in [('village',25,21),('forest',10,13),('ruins',31,7),('grove',20,31),('fen',50,39)]:
            page.evaluate('([x,y])=>{const s=GodseedDebug.getState();s.seen.fill(1);s.bot.x=x;s.bot.y=y;GodseedDebug.setZoom(1);GodseedDebug.step(0)}',[x,y])
            page.screenshot(path=str(OUT/f'chromium-{width}x{height}-{region}.png'))
        assert not errors,errors
        evidence.append({'viewport':[width,height],'zooms':3,'touch_targets':10,'errors':errors})
        context.close()
    browser.close()
(OUT/'RESULTS.json').write_text(json.dumps({'source':'Running desktop Chromium, not Android; regional scenes reveal fog for QA','checks':evidence},indent=2)+'\n')
print(json.dumps(evidence))
