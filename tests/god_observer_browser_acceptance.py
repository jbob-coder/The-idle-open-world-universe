"""GOD-004: real offline Chromium observatory acceptance (not physical Android evidence)."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SCREENSHOT=ROOT/'qa-screenshots'/'god-004-observatory-640x360.png'
SCREENSHOT.parent.mkdir(parents=True,exist_ok=True)

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(
        headless=True,args=['--no-sandbox','--disable-dev-shm-usage'],
        **({'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}))
    context=browser.new_context(viewport={'width':640,'height':360},is_mobile=True,has_touch=True)
    context.set_offline(True)
    page=context.new_page()
    errors=[];outbound=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('request',lambda request:outbound.append(request.url)
        if request.url.startswith(('http:','https:')) and request.url!='http://godseed.test/' else None)
    page.route('http://godseed.test/',lambda route:route.fulfill(
        content_type='text/html',body=(ROOT/'GODSEED-Play.html').read_text(encoding='utf-8')))
    page.goto('http://godseed.test/',wait_until='load')
    page.evaluate('GodseedDebug.newWorld(41);GodseedDebug.setSpeed(0)')
    page.wait_for_selector('#observerTarget',state='attached')
    page.locator('#godviewTab-lives').click()
    assert page.locator('#godObservatory').is_visible()
    assert page.locator('#godObservatory').count()==1
    assert page.locator('#observerTarget option').count()>=10
    before=page.evaluate('GodseedSim.serialize(GodseedDebug.getState())')
    page.locator('#observerTarget').select_option('person:citizen:20')
    assert 'Elin' in page.locator('#observerDetails').inner_text()
    assert 'Profession skill' in page.locator('#observerDetails').inner_text()
    page.locator('#observerTarget').select_option('town:briarford')
    assert 'Food' in page.locator('#observerDetails').inner_text()
    assert 'Briarford' in page.locator('#observerDetails').inner_text()
    building=page.evaluate('GodseedDebug.getState().living.towns[0].buildings[0].id')
    page.locator('#observerTarget').select_option('building:'+building)
    assert '16 m²' in page.locator('#observerDetails').inner_text()
    assert 'Not yet implemented' in page.locator('#observerDetails').inner_text()
    page.locator('#observerTarget').select_option('person:nim')
    assert 'Independent protagonist' in page.locator('#observerDetails').inner_text()
    assert page.evaluate('GodseedSim.serialize(GodseedDebug.getState())')==before, 'Inspecting must not mutate the world'
    # Untrusted activity/memory strings are rendered as text, never HTML.
    page.evaluate("""() => {
        const p=GodseedDebug.getState().living.citizens[0];
        p.activity='<img src=x onerror=window.__observerXss=1>';
    }""")
    page.locator('#observerTarget').select_option('person:citizen:20')
    assert '<img src=x' in page.locator('#observerDetails').inner_text()
    assert page.locator('#godObservatory img').count()==0
    assert page.evaluate('window.__observerXss||0')==0
    page.evaluate("GodseedDebug.getState().living.citizens[0].activity='Getting ready'")
    page.locator('#observerTarget').select_option('overview')
    page.screenshot(path=str(SCREENSHOT),full_page=True)
    assert not errors,errors
    assert not outbound,outbound
    browser.close()
print('PASS GOD-004: offline 640x360 observer, person/town/building, XSS safety, no world mutation')
print('SCREENSHOT:',SCREENSHOT)
