"""Offline Chromium: a divine suggestion, an autonomous settlement and pixel houses."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SHOT=ROOT/'qa-screenshots'/'living-settlements-god-whisper-720x400.png'
SHOT.parent.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    kw={'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}
    browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'],**kw)
    ctx=browser.new_context(offline=True,viewport={'width':720,'height':400})
    page=ctx.new_page();errors=[];network=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:network.append(r.url) if not r.url.startswith('http://godseed.test/') else None)
    page.route('http://godseed.test/',lambda r:r.fulfill(content_type='text/html',body=(ROOT/'GODSEED-Play.html').read_text(encoding='utf-8')))
    page.goto('http://godseed.test/',wait_until='load')
    page.evaluate('GodseedDebug.newWorld(41);GodseedDebug.setSpeed(0)')
    assert page.locator('#godLetters').is_visible()
    assert page.locator('#townStatus').count()==1
    assert page.evaluate('GodseedDebug.getState().life.buildings.length')==2
    page.locator('#divineTarget').select_option('Ira')
    page.locator('#divineMessage').fill('Cultiva alimentos para los habitantes')
    page.locator('#sendGuidance').click()
    assert 'farm' in page.locator('#lettersStatus').inner_text().lower()
    assert 'considering' in page.locator('#lettersStatus').inner_text().lower()
    page.evaluate('GodseedDebug.step(1000)')
    assert page.evaluate('GodseedDebug.getState().life.buildings.length')>=5
    assert page.evaluate('GodseedDebug.getState().life.age')>=1
    assert 'Aldea' in page.locator('#townStatus').inner_text() or 'Artesanos' in page.locator('#townStatus').inner_text()
    assert 'acted' in page.locator('#lettersStatus').inner_text().lower()
    assert 'Ira' in page.locator('#lifeDiary').inner_text()
    # Unrecognized language is rejected clearly and without issuing a command.
    before=page.evaluate('GodseedDebug.getState().life.letters.length')
    page.locator('#divineMessage').fill('silent galaxies are blue')
    page.locator('#sendGuidance').click()
    assert page.evaluate('GodseedDebug.getState().life.letters.length')==before
    assert 'Not understood offline' in page.locator('#toast').inner_text()
    page.evaluate("()=>{window.scrollTo(0,0);document.getElementById('toast').classList.remove('show');}")
    page.screenshot(path=str(SHOT),full_page=True)
    assert not errors,errors
    assert not network,network
    ctx.close();browser.close()
print('PASS offline citizen life, settlements, Spanish god letters, refusal and square-pixel homes')
print('SCREENSHOT:',SHOT)
