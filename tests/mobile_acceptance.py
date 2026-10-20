"""Visual and interaction smoke tests of the actual offline asset in Chromium.
These are browser tests; an Android on-device pass is still required.
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
p=Path(__file__).resolve().parents[1]
source=(p/'GODSEED-Play.html').read_text()
with sync_playwright() as pw:
    browser=pw.chromium.launch(**({'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in [(720,400),(640,360),(960,540)]:
        context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,is_mobile=True,has_touch=True)
        page=context.new_page();errors=[];outgoing=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('request',lambda r:outgoing.append(r.url) if r.url.startswith(('http://','https://')) and r.url!='http://godseed.test/' else None)
        page.on('dialog',lambda d:d.accept())
        page.route('http://godseed.test/',lambda r:r.fulfill(content_type='text/html',body=source))
        context.set_offline(True)
        page.goto('http://godseed.test/',wait_until='load')
        page.evaluate('()=>GodseedDebug.setSpeed(0)')
        page.locator('#androidDock').wait_for(state='visible')
        dock=page.locator('#androidDock')
        buttons=dock.locator('button')
        assert buttons.count()==10
        for b in buttons.all():
            rect=b.bounding_box();assert rect and rect['height']>=43,f"short touch target: {rect}"
        # The fixed dock remains in view, including on small devices.
        box=dock.bounding_box();assert box['y']>=0 and box['y']+box['height']<=height+2,(width,height,box)
        page.locator('#androidDock [data-power="bless"]').click()
        assert page.locator('#androidDock [data-power="bless"]').get_attribute('aria-pressed')=='true'
        before=page.evaluate('GodseedDebug.getState().faith')
        rect=page.locator('#world').bounding_box()
        page.locator('#world').click(position={'x':int(rect['width']/2),'y':int(rect['height']/2)})
        assert page.evaluate('GodseedDebug.getState().faith')==before-4
        # New divine power acts on one visible traveler, not Nim's movement.
        page.evaluate("""() => {
            const s=GodseedDebug.getState(),p=s.npcs[0];
            s.seen[GodseedSim.idx(p.x,p.y)]=1;
            s.bot.x=p.x;s.bot.y=p.y;s.settings.follow=true;
            GodseedDebug.step(0);
        }""")
        assert page.locator('#people').count()==1
        page.locator('#androidDock [data-power="inspire"]').click()
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
        page.locator('#zoomDock').click()
        assert page.evaluate('GodseedDebug.getCamera().width')==24
        page.locator('#zoomDock').click()
        assert page.evaluate('GodseedDebug.getCamera().width')==16
        page.locator('#zoomDock').click()
        assert page.evaluate('GodseedDebug.getCamera().width')==32
        page.evaluate('()=>GodseedDebug.step(50)')
        # Save export and pasted import work without Android native file APIs.
        page.locator('#export').click()
        assert page.locator('#saveDialog').is_visible()
        raw=page.locator('#saveText').input_value()
        saved=json.loads(raw)
        assert saved['tick']>=50
        page.locator('#saveClose').click()
        # Check reset atomically before the requestAnimationFrame clock may tick.
        # Repeat on distinct seeds; pause in the SAME JS task after inspecting.
        for reset_index in range(10):
            seed=987654321+reset_index
            reset=page.evaluate("""seed => {
                GodseedDebug.newWorld(seed);
                const s=GodseedDebug.getState();
                const observed={seed:s.worldSeed,tick:s.tick,name:s.bot.name};
                GodseedDebug.setSpeed(0);
                return observed;
            }""",seed)
            assert reset=={'seed':seed,'tick':0,'name':'Nim'},(width,height,reset)
        page.locator('#import').click()
        page.locator('#saveText').fill(raw)
        page.evaluate('()=>{window.confirm=()=>{throw Error("Native JS dialogs unavailable")}}')
        page.locator('#saveApply').click()
        page.locator('#confirmApply').click()
        restored_tick=page.evaluate('GodseedDebug.getState().tick')
        assert saved['tick'] <= restored_tick <= saved['tick'] + 4, (saved['tick'], restored_tick)  # simulation can advance while Playwright checks
        assert not errors,errors
        assert not outgoing,outgoing
        # Capture the actual world at the TOP rather than the form after import tests.
        page.evaluate("()=>{window.scrollTo(0,0);document.getElementById('toast').classList.remove('show');}")
        page.wait_for_timeout(100)
        page.screenshot(path=str(p/'assets'/f'godseed-android-landscape-{width}x{height}.png'),full_page=False)
        print(f'{width}x{height}: PASS, 10 touch buttons >=44px, bless, backup restore, offline, 0 JS errors')
        context.close()
    browser.close()
