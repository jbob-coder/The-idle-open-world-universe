"""Offline Chromium acceptance for signed, bounded, optional WLD-003 God-view atlas.
No claim of playable cross-chunk Nim navigation or physical Android RAM performance.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SHOT=ROOT/'qa-screenshots'/'chunked-god-atlas-720x400.png'
SHOT.parent.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    options={'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'],**options)
    context=browser.new_context(offline=True,viewport={'width':720,'height':400},device_scale_factor=1)
    page=context.new_page()
    errors=[];external=[]
    page.on('pageerror',lambda error: errors.append(str(error)))
    page.on('request',lambda request: external.append(request.url)
        if request.url.startswith(('http://','https://')) and request.url!='http://godseed.test/' else None)
    page.route('http://godseed.test/',lambda route:route.fulfill(
        content_type='text/html',body=(ROOT/'GODSEED-Play.html').read_text(encoding='utf-8')))
    page.goto('http://godseed.test/',wait_until='load')
    page.evaluate('GodseedDebug.newWorld(41);GodseedDebug.setSpeed(0)')
    page.wait_for_function('GodseedDebug.getRenderStats().atlasesReady')
    before=page.evaluate('GodseedSim.serialize(GodseedDebug.getState())')
    assert page.locator('#chunkAtlasToggle').count()==1
    assert page.locator('#chunkAtlasCanvas').is_hidden()
    page.locator('#chunkAtlasToggle').click()
    assert page.locator('#chunkAtlasCanvas').is_visible()
    assert page.locator('#world').is_hidden()
    assert page.locator('#chunkAtlasToggle').get_attribute('aria-pressed')=='true'
    assert page.evaluate('GodseedChunkAtlas.isOpen()')
    assert 'terrain preview' in page.locator('#chunkAtlasControls').inner_text().lower()
    def details():
        return page.evaluate('GodseedChunkAtlas.stats()')
    initial=details()
    assert initial['camera']['width']==32 and initial['camera']['height']==20,initial
    assert initial['view']['store']['activeChunks']<=9
    assert initial['view']['fogChunks']<=9
    for x,y in [(31,31),(32,32),(64,64),(96,96),(128,128),(-1,-1),(-32,-32),(-65,65)]:
        page.evaluate('([x,y])=>GodseedChunkAtlas.setCenter(x,y)',[x,y])
        current=details()
        assert current['camera']['centerX']==x and current['camera']['centerY']==y,current
        assert current['view']['store']['activeChunks']<=9,current
        assert current['view']['fogChunks']<=9,current
        assert 'Chunk' in page.locator('#chunkAtlasStatus').inner_text()
    # Exercise each actual zoom and verify the native pixels and canvas size.
    for zoom,dimensions in [(0,(512,320)),(1,(384,240)),(2,(256,160))]:
        page.evaluate('(z)=>GodseedChunkAtlas.setZoom(z)',zoom)
        got=page.locator('#chunkAtlasCanvas').evaluate('(c)=>[c.width,c.height]')
        assert got==list(dimensions),(zoom,got)
        assert details()['camera']['zoom']==zoom
    page.evaluate('GodseedChunkAtlas.setZoom(0)')
    page.evaluate('GodseedChunkAtlas.setCenter(32,24)')
    page.locator('#chunkAtlasEast').click()
    assert details()['camera']['centerX']==48
    # Same-position drawing is a true clean frame, not a costly redraw.
    unchanged=page.evaluate('GodseedChunkAtlas.render().dirty')
    assert unchanged==0,unchanged
    drag_before=details()['camera']['centerX']
    box=page.locator('#chunkAtlasCanvas').bounding_box()
    page.mouse.move(box['x']+box['width']*.7,box['y']+box['height']*.5)
    page.mouse.down()
    page.mouse.move(box['x']+box['width']*.3,box['y']+box['height']*.5,steps=5)
    page.mouse.up()
    assert details()['camera']['centerX']>drag_before,'touch-drag/pointer pan should move atlas'
    inspected=page.evaluate('GodseedChunkAtlas.inspect(-1,-1)')
    assert inspected['x']==-1 and inspected['y']==-1
    page.evaluate('GodseedChunkAtlas.setCenter(-65,65)')
    page.screenshot(path=str(SHOT),full_page=True)
    # Opening/panning an atlas is read-only with respect to actual Nim and v1.
    assert page.evaluate('GodseedSim.serialize(GodseedDebug.getState())')==before
    page.locator('#chunkAtlasToggle').click()
    assert page.locator('#world').is_visible()
    assert page.locator('#chunkAtlasCanvas').is_hidden()
    page.locator('#save').click()
    page.reload()
    assert page.locator('#world').is_visible()
    assert page.evaluate('GodseedDebug.getState().version')==1
    assert not errors,errors
    assert not external,external
    context.close();browser.close()
print('PASS offline chunk atlas: signed 4+ borders, 3 zooms, pixel cache, fog bound, touch pan, v1 unchanged; zero JS errors/network')
print('SCREENSHOT:',SHOT)
