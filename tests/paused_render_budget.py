"""Low-RAM render budget regression on actual offline Chromium Canvas.
Counts screen draws, not FPS/device memory. Physical Android QA still required.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
    kwargs={'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'],**kwargs)
    context=browser.new_context(offline=True,viewport={'width':640,'height':360})
    page=context.new_page()
    errors=[]
    external=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:external.append(r.url) if r.url.startswith(('https://','http://')) and r.url!='http://godseed.test/' else None)
    page.route('http://godseed.test/',lambda r:r.fulfill(content_type='text/html',body=(ROOT/'GODSEED-Play.html').read_text(encoding='utf-8')))
    page.goto('http://godseed.test/',wait_until='load')
    page.evaluate('GodseedDebug.newWorld(41);GodseedDebug.setSpeed(0)')
    page.wait_for_timeout(180)
    get=lambda:page.evaluate('GodseedDebug.getRenderStats().screenRedraws')
    before=get()
    original_tick=page.evaluate('GodseedDebug.getState().tick')
    page.wait_for_timeout(850)
    idle_draws=get()-before
    assert idle_draws<=2,('paused idle Canvas draws exceeded budget',idle_draws)
    assert page.evaluate('GodseedDebug.getState().tick')==original_tick

    # Pointer preview and camera zoom must draw immediately despite throttling.
    before=get()
    page.evaluate("""() => {
        const c=document.getElementById('world'),r=c.getBoundingClientRect();
        c.dispatchEvent(new PointerEvent('pointermove',{
            bubbles:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2
        }));
    }""")
    assert get()>before,'paused pointer preview must draw immediately'
    before=get()
    page.evaluate("document.getElementById('zoomDock').click()")
    assert get()>before,'paused zoom must draw immediately'
    assert page.evaluate('GodseedDebug.getCamera().width')==24

    # Divine effects remain animated at normal cadence while the world is paused.
    page.evaluate("""() => {
        const s=GodseedDebug.getState();s.faith=50;
        const r=GodseedSim.power(s,'bless',s.bot.x,s.bot.y);
        if(!r.ok)throw Error('Divine effect not accepted');
        GodseedDebug.draw();
    }""")
    assert page.evaluate('GodseedDebug.getRenderStats().activeEffects')>=1
    before=get()
    page.wait_for_timeout(320)
    fx_draws=get()-before
    assert fx_draws>=2,('divine FX animation should stay responsive',fx_draws)

    # Unpaused world returns to normal redraw cadence and autonomous time.
    page.evaluate('GodseedDebug.setSpeed(1)')
    before=get()
    page.wait_for_timeout(550)
    running_draws=get()-before
    assert running_draws>=4,('running world render cadence',running_draws)
    assert page.evaluate('GodseedDebug.getState().tick')>original_tick
    assert not errors,errors
    assert not external,external
    context.close()
    browser.close()
print('PASS offline paused Canvas budget; immediate pointer/zoom, animated FX, 1x resume')
