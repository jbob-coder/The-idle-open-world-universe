"""Prove the first chapter is visible and finishes in the REAL offline Chromium game.
This is browser evidence, not Android physical device evidence.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SHOT=ROOT/'qa-screenshots'/'chapter-one-completed-640x360.png'
SHOT.parent.mkdir(exist_ok=True,parents=True)

with sync_playwright() as pw:
    kwargs={'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**kwargs)
    ctx=browser.new_context(offline=True,viewport={'width':640,'height':360})
    page=ctx.new_page()
    errors=[];requests=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:requests.append(r.url) if not r.url.startswith('http://godseed.test/') else None)
    page.route('http://godseed.test/',lambda route:route.fulfill(
        status=200,content_type='text/html',body=(ROOT/'GODSEED-Play.html').read_text()))
    page.goto('http://godseed.test/')
    page.evaluate('GodseedDebug.newWorld(41);GodseedDebug.setSpeed(0)')
    page.locator('#godviewTab-lives').click()
    page.locator('#godviewLifeDetails summary').click()
    assert page.locator('#chapterPanel').is_visible()
    title=page.locator('#chapterTitle').inner_text()
    assert 'MOSSBOUND OATH' in title,title
    assert page.locator('#chapterProgress').get_attribute('aria-valuenow')=='0'
    assert 'camp' in page.locator('#chapterObjective').inner_text().lower()
    page.evaluate("""() => {
      const s=GodseedDebug.getState();
      s.camp={x:s.bot.x,y:s.bot.y};s.bot.tool=1;
      GodseedDebug.step(1);
    }""")
    assert page.locator('#chapterProgress').get_attribute('aria-valuenow')=='1'
    page.evaluate("""() => {
      const s=GodseedDebug.getState();
      s.npcs[0].met=true;
      GodseedDebug.step(1);
    }""")
    assert page.locator('#chapterProgress').get_attribute('aria-valuenow')=='2'
    page.evaluate("""() => {
      const s=GodseedDebug.getState();
      s.bot.ruins=1;s.shrinesVisited=[GodseedSim.idx(20,31)];
      GodseedDebug.step(1);
    }""")
    assert page.locator('#chapterProgress').get_attribute('aria-valuenow')=='3'
    assert 'COMPLETED' in page.locator('#chapterStep').inner_text()
    assert 'Completed.' in page.locator('#chapterObjective').inner_text()
    assert page.evaluate('GodseedDebug.getState().chapter.rewarded') is True
    assert page.evaluate('GodseedDebug.getState().log.filter(e=>e.title==="Chapter I complete").length')==1
    assert page.evaluate('GodseedDebug.getCamera().width')==32
    assert page.evaluate('GodseedDebug.getCamera().height')==20
    page.screenshot(path=str(SHOT),full_page=True)
    assert not errors,errors
    assert not requests,requests
    browser.close()

print('PASS genuine offline Chromium Chapter I HUD, 3 stages, one-time reward, 32x20 camera, zero JS errors / network requests')
print('RUNNING GAME SCREENSHOT:',SHOT)
