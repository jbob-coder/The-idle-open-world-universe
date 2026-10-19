"""ART-007: actual offline mobile interactions with map-first HUD and legacy powers.
Tests keep the original bless/inspire, zoom and backup behavior authoritative.
An Android physical device acceptance is still separately required.
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json

p=Path(__file__).resolve().parents[1]
source=(p/'GODSEED-Play.html').read_text()
with sync_playwright() as pw:
    browser=pw.chromium.launch(
        **({'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}),
        headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in [(720,400),(640,360),(960,540)]:
        context=browser.new_context(viewport={'width':width,'height':height},
            device_scale_factor=1,is_mobile=True,has_touch=True,offline=True)
        page=context.new_page();errors=[];outgoing=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('request',lambda r:outgoing.append(r.url)
            if r.url.startswith(('http://','https://')) and r.url!='http://godseed.test/' else None)
        page.on('dialog',lambda d:d.accept())
        page.route('http://godseed.test/',lambda r:r.fulfill(content_type='text/html',body=source))
        page.goto('http://godseed.test/',wait_until='load')
        page.wait_for_function("typeof GodseedMapFirst==='object'")
        page.evaluate('GodseedDebug.setSpeed(0)')
        assert page.locator('#androidDock').is_hidden(),'old dock obscures map'
        assert page.locator('#godviewDrawer').is_hidden()
        buttons=page.locator('#godviewTabs button')
        assert buttons.count()==7
        for b in buttons.all():
            rect=b.bounding_box()
            assert rect and rect['height']>=44,f"short touch target: {rect}"
            assert rect['x']>=0 and rect['x']+rect['width']<=width+1,rect
        page.locator('#godviewTab-miracles').click()
        page.locator('#powers [data-power="bless"]').click()
        assert page.locator('#godviewDrawer').is_hidden()
        assert page.locator('#powers [data-power="bless"]').get_attribute('aria-pressed')=='true'
        before=page.evaluate('GodseedDebug.getState().faith')
        rect=page.locator('#world').bounding_box()
        page.locator('#world').click(position={'x':int(rect['width']/2),'y':int(rect['height']/2)})
        assert page.evaluate('GodseedDebug.getState().faith')==before-4
        # Inspiration changes exactly one observed traveler, not Nim's location.
        page.evaluate("""() => {
            const s=GodseedDebug.getState(),p=s.npcs[0];
            s.seen[GodseedSim.idx(p.x,p.y)]=1;
            s.bot.x=p.x;s.bot.y=p.y;s.settings.follow=true;
            GodseedDebug.step(0);
        }""")
        page.locator('#godviewTab-miracles').click()
        page.locator('#powers [data-power="inspire"]').click()
        faith_before=page.evaluate('GodseedDebug.getState().faith')
        bot_before=page.evaluate('() => {const b=GodseedDebug.getState().bot;return [b.x,b.y]}')
        page.evaluate("""() => {
            const s=GodseedDebug.getState(),p=s.npcs[0],world=document.getElementById('world');
            const r=world.getBoundingClientRect(),scale=Math.min(r.width/world.width,r.height/world.height);
            const cam=GodseedDebug.getCamera(),camX=cam.x,camY=cam.y;
            const left=r.left+(r.width-world.width*scale)/2;
            const top=r.top+(r.height-world.height*scale)/2;
            world.dispatchEvent(new MouseEvent('click',{
                bubbles:true,clientX:left+(p.x-camX+.5)*16*scale,
                clientY:top+(p.y-camY+.5)*16*scale
            }));
        }""")
        assert page.evaluate('GodseedDebug.getState().faith')==faith_before-5
        assert page.evaluate('GodseedDebug.getState().npcs[0].mood')=='hopeful'
        assert page.evaluate('() => {const b=GodseedDebug.getState().bot;return [b.x,b.y]}')==bot_before
        # Zoom is now a conscious settings control, not an obstruction over the map.
        page.locator('#godviewTab-settings').click()
        for expected in [24,16,32]:
            page.locator('#zoom').click()
            assert page.evaluate('GodseedDebug.getCamera().width')==expected
        page.evaluate('GodseedDebug.step(50)')
        page.locator('#export').click()
        assert page.locator('#saveDialog').is_visible()
        raw=page.locator('#saveText').input_value()
        saved=json.loads(raw)
        assert saved['tick']>=50
        page.locator('#saveClose').click()
        page.evaluate('GodseedDebug.newWorld(987654321)')
        assert page.evaluate('GodseedDebug.getState().tick')==0
        page.locator('#import').click()
        page.locator('#saveText').fill(raw)
        page.evaluate('()=>{window.confirm=()=>{throw Error("Native JS dialogs unavailable")}}')
        page.locator('#saveApply').click()
        page.locator('#confirmApply').click()
        restored_tick=page.evaluate('GodseedDebug.getState().tick')
        assert saved['tick']<=restored_tick<=saved['tick']+4,(saved['tick'],restored_tick)
        assert not errors,errors
        assert not outgoing,outgoing
        page.locator('#godviewTab-world').click()
        page.evaluate("document.getElementById('toast').classList.remove('show')")
        page.screenshot(path=str(p/'assets'/f'godseed-android-landscape-{width}x{height}.png'),full_page=False)
        print(f'{width}x{height}: PASS, 7 nav touch controls >=44px, bless/inspire, backup restore, offline, 0 JS errors')
        context.close()
    browser.close()
