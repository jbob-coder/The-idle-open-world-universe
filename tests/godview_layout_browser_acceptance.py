"""ART-007: real offline Chromium acceptance of map-first God-view at target sizes.
This verifies UI hierarchy, read-only inspector, touch controls, and existing saves.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-screenshots'
OUT.mkdir(exist_ok=True)
with sync_playwright() as pw:
    launch={'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'],**launch)
    for width,height in [(640,360),(720,400),(960,540)]:
        ctx=browser.new_context(viewport={'width':width,'height':height},
            device_scale_factor=1,is_mobile=True,has_touch=True,offline=True)
        page=ctx.new_page()
        errs=[];outbound=[]
        page.on('pageerror',lambda error:errs.append(str(error)))
        page.on('request',lambda req:outbound.append(req.url)
            if req.url.startswith(('http://','https://')) and req.url!='http://godseed.test/' else None)
        page.route('http://godseed.test/',lambda route:route.fulfill(
            content_type='text/html',body=(ROOT/'GODSEED-Play.html').read_text(encoding='utf-8')))
        page.goto('http://godseed.test/',wait_until='load')
        page.wait_for_function("window.GodseedMapFirst && window.GodseedObservatory && window.GodseedDebug")
        page.evaluate("GodseedDebug.newWorld(41);GodseedDebug.setSpeed(0);GodseedMapFirst.refresh()")
        page.wait_for_function("GodseedDebug.getRenderStats().atlasesReady")
        before=page.evaluate("GodseedSim.serialize(GodseedDebug.getState())")
        assert page.locator('body').evaluate("(el)=>el.classList.contains('godseed-mapfirst')")
        assert page.locator('#godviewTabs button').count()==7
        assert page.locator('#androidDock').is_hidden(),'old 10-button power dock cannot obstruct map'
        assert page.locator('#godviewDrawer').is_hidden(),'no contextual sheet over map initially'
        assert page.locator('#world').is_visible()
        assert page.locator('#world').evaluate("(c)=>c.width") == 512
        dims=page.evaluate("""() => {
            const s=document.querySelector('.worldframe').getBoundingClientRect(),
                w=document.querySelector('#world').getBoundingClientRect();
            return {viewport:[innerWidth,innerHeight],
              map:[w.width,w.height],stage:[s.width,s.height],
              ratio:(w.width*w.height)/(s.width*s.height),
              bodyWidth:document.documentElement.scrollWidth,
              bodyHeight:document.documentElement.scrollHeight};
        }""")
        assert dims['ratio']>=0.65,(width,height,dims)
        assert dims['bodyWidth']<=width+1,(width,height,dims)
        assert dims['bodyHeight']<=height+1,(width,height,dims)
        assert page.locator('#godviewTabs button').evaluate_all(
            "(bs)=>bs.every(b=>b.getBoundingClientRect().height>=44)"),'touch targets'
        assert page.locator('#godviewTabs canvas').count()==7
        assert page.locator('#godviewTabs canvas').evaluate_all(
            "(cs)=>cs.every(c=>c.width===8&&c.height===8&&getComputedStyle(c).imageRendering!=='auto')"),'native-square pixel icons'
        page.screenshot(path=str(OUT/f'godview-world-{width}x{height}.png'),full_page=False)
        # Real read-only observer is a single contextual inspector, not a modal that edits stats.
        page.locator('#godviewTab-lives').click()
        assert page.locator('#godviewDrawer').is_visible()
        assert page.locator('#godObservatory').count()==1
        assert page.locator('#godObservatory').is_visible()
        assert page.locator('#portrait').is_visible()
        portrait=page.locator('#portrait').bounding_box()
        assert portrait['width']>=30 and portrait['height']>=40,portrait
        assert page.locator('#observerTarget option').count()>=10
        page.locator('#observerTarget').select_option('person:citizen:20')
        assert 'Elin' in page.locator('#observerDetails').inner_text()
        assert 'Profession skill' in page.locator('#observerDetails').inner_text()
        page.locator('#observerTarget').select_option('town:briarford')
        assert 'Briarford' in page.locator('#observerDetails').inner_text()
        page.screenshot(path=str(OUT/f'godview-life-{width}x{height}.png'),full_page=False)
        assert page.evaluate("GodseedSim.serialize(GodseedDebug.getState())")==before,'inspection mutated the world'
        # A real village map and supplies, not invented political borders.
        page.locator('#godviewTab-villages').click()
        assert page.locator('#minimap').is_visible()
        assert page.locator('#townStatus').is_visible()
        assert 'not yet simulated' in page.locator('#godviewVillages').inner_text()
        page.locator('#godviewTab-chronicle').click()
        assert page.locator('#events').is_visible()
        page.locator('#godviewTab-council').click()
        assert page.locator('#godMessage').is_visible()
        assert page.locator('#godSubmit').is_visible()
        page.locator('#godviewTab-miracles').click()
        assert page.locator('#powers .power').count()>=7
        assert 'Prototype divine powers' in page.locator('#godviewMiracles').inner_text()
        page.locator('#godviewTab-settings').click()
        assert page.locator('#save').is_visible() and page.locator('#zoom').is_visible()
        assert page.locator('#export').is_visible() and page.locator('#import').is_visible()
        page.locator('#godviewTab-world').click()
        assert page.locator('#godviewDrawer').is_hidden()
        assert page.locator('#world').is_visible()
        assert page.evaluate("GodseedSim.serialize(GodseedDebug.getState())")==before,'tab navigation must not edit saves/stats'
        # Accessible top pause controls delegate to old time button, not hidden simulation logic.
        page.locator('#godviewPause').click()
        assert page.evaluate("GodseedDebug.getState().settings.speed") == 1
        page.locator('#godviewPause').click()
        assert page.evaluate("GodseedDebug.getState().settings.speed") == 0
        # Save is the old authoritative export flow moved into the settings panel.
        page.locator('#godviewTab-settings').click()
        page.locator('#save').click()
        assert page.evaluate("JSON.parse(localStorage.getItem('godseed-one-small-life-v1')).version") == 1
        page.locator('#godviewDrawerClose').click()
        assert page.locator('#godviewDrawer').is_hidden()
        assert not errs,(width,height,errs)
        assert not outbound,(width,height,outbound)
        ctx.close()
    browser.close()
print('PASS ART-007: real 640x360,720x400,960x540 map-first UI >65% stage, one read-only inspector, 7 tabs, icons, save, pause, no network/JS errors')
print('SCREENSHOTS: qa-screenshots/godview-world-*.png and godview-life-*.png')
