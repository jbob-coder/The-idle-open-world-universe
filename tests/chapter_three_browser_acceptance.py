"""Real offline Chapter III story/HUD and persistent ending in Chromium."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SHOT=ROOT/'qa-screenshots'/'chapter-three-moonwell-dawn-640x360.png'
SHOT.parent.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    kwargs={'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'],**kwargs)
    context=browser.new_context(offline=True,viewport={'width':640,'height':360})
    page=context.new_page();errors=[];external=[]
    page.on('pageerror',lambda err:errors.append(str(err)))
    page.on('request',lambda r:external.append(r.url) if not r.url.startswith('http://godseed.test/') else None)
    page.route('http://godseed.test/',lambda route:route.fulfill(status=200,content_type='text/html',body=(ROOT/'GODSEED-Play.html').read_text(encoding='utf-8')))
    page.goto('http://godseed.test/',wait_until='load')
    page.evaluate('GodseedDebug.newWorld(41);GodseedDebug.setSpeed(0)')
    assert page.locator('#finalePanel').is_hidden()
    page.evaluate('GodseedDebug.step(1100)')
    assert page.evaluate('GodseedSim.finaleStatus(GodseedDebug.getState()).completed')
    assert page.locator('#finalePanel').is_visible()
    assert page.locator('#finaleProgress').get_attribute('aria-valuenow')=='3'
    assert 'THE END' in page.locator('#finaleStep').inner_text()
    assert 'world remains alive' in page.locator('#finaleObjective').inner_text().lower()
    snap=page.evaluate("""() => ({
      ending:GodseedDebug.getState().finale.completedAt,
      rewards:GodseedDebug.getState().finale.rewarded,
      position:[GodseedDebug.getState().bot.x,GodseedDebug.getState().bot.y]
    })""")
    assert snap['rewards'] and snap['ending']>0
    page.screenshot(path=str(SHOT),full_page=True)
    page.evaluate('GodseedDebug.step(150)')
    assert page.evaluate('GodseedDebug.getState().finale.completedAt')==snap['ending']
    # Use the actual visible Save button and reload, not a fabricated history marker.
    page.locator('#save').click()
    page.reload()
    assert page.evaluate('GodseedSim.finaleStatus(GodseedDebug.getState()).completed')
    assert page.locator('#finalePanel').is_visible()
    assert 'THE END' in page.locator('#finaleStep').inner_text()
    assert not errors,errors
    assert not external,external
    browser.close()
print('PASS offline Moonwell finale, 3 chapters, save/reload, pixel HUD, 0 JS errors or network requests')
print('SCREENSHOT:',SHOT)
