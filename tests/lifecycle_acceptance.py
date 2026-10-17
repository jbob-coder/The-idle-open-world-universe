"""Real offline Chromium clock, storage and lifecycle checks (not Android hardware)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
    browser=pw.chromium.launch(**({'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}),headless=True,args=['--no-sandbox'])
    context=browser.new_context(offline=True,viewport={'width':640,'height':360})
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('http://godseed.test/',lambda route:route.fulfill(status=200,content_type='text/html',body=(ROOT/'GODSEED-Play.html').read_text()))
    page.goto('http://godseed.test/')
    page.evaluate('GodseedDebug.newWorld(41);GodseedDebug.setSpeed(0)')
    tick=lambda:page.evaluate('GodseedDebug.getState().tick')
    page.wait_for_timeout(600);assert tick()==0
    page.evaluate('GodseedDebug.setSpeed(8)');page.wait_for_timeout(600)
    assert 10<=tick()<=25,tick()
    page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))")
    stopped=tick();page.wait_for_timeout(600);assert tick()==stopped
    assert page.evaluate("JSON.parse(localStorage.getItem('godseed-one-small-life-v1')).tick")==stopped
    page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));document.dispatchEvent(new Event('visibilitychange'))")
    page.wait_for_timeout(600);assert 10<=tick()-stopped<=25
    page.evaluate('GodseedDebug.setSpeed(0)')
    old=page.evaluate('GodseedSim.serialize(GodseedDebug.getState())')
    page.evaluate("localStorage.setItem('godseed-one-small-life-v1',GodseedSim.serialize(GodseedDebug.getState()))")
    page.reload();page.evaluate('GodseedDebug.setSpeed(0)');assert tick()>=stopped
    assert not errors,errors
    browser.close()
print('PASS offline clock: pause, 8x, background save, repeated resume, reload; 0 JS errors')
