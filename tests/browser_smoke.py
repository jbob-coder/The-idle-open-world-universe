from playwright.sync_api import sync_playwright
from pathlib import Path
p=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in [(1280,800),(720,400),(390,844)]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)))
        outgoing=[]
        page.on('request',lambda r: outgoing.append(r.url) if r.url.startswith(('http://','https://')) else None)
        page.set_content((p/'GODSEED-Play.html').read_text(),wait_until='load')
        page.wait_for_timeout(900)
        title=page.locator('h1').inner_text()
        state=page.evaluate("()=>({level:GodseedDebug.getState().bot.level,tick:GodseedDebug.getState().tick,steps:GodseedDebug.getState().bot.steps})")
        assert 'GODSEED' in title
        assert state['tick']>=1, state
        assert not errors,errors
        assert not outgoing,outgoing
        page.screenshot(path=str(p/'assets'/f'screenshot-{width}x{height}.png'),full_page=True)
        assert page.locator('[data-power]').count()==12
        # Advance enough to confirm autonomy, independent of wall clock.
        page.evaluate('()=>{GodseedDebug.setSpeed(0);GodseedDebug.step(120)}')
        s=page.evaluate("()=>({tick:GodseedDebug.getState().tick,steps:GodseedDebug.getState().bot.steps,energy:GodseedDebug.getState().bot.energy})")
        assert s['steps']>3,s
        # Bless Nim, then verify Faith spent; proceed through UI click and world event.
        initial=page.evaluate('GodseedDebug.getState().faith')
        page.locator('[data-power="bless"]').first.click()
        box=page.locator('#world').bounding_box()
        page.locator('#world').click(position={'x':int(box['width']/2),'y':int(box['height']/2)})
        after=page.evaluate('GodseedDebug.getState().faith')
        assert after==initial-4,(initial,after)
        assert not errors,errors
        print({'viewport':f'{width}x{height}','first_state':state,'after_120_steps':s,'faith_spent':initial-after,'js_errors':len(errors),'external_requests':len(outgoing)})
        page.close()
    browser.close()
