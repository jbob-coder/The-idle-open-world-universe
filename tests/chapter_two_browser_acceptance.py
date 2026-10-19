"""Verify genuine OFFLINE Chromium Chapter II HUD and once-only completed story."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SHOT=ROOT/'qa-screenshots'/'chapter-two-cartographer-640x360.png'
SHOT.parent.mkdir(parents=True,exist_ok=True)

with sync_playwright() as pw:
    kwargs={'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**kwargs)
    ctx=browser.new_context(offline=True,viewport={'width':640,'height':360})
    page=ctx.new_page();errors=[];network=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda req:network.append(req.url) if not req.url.startswith('http://godseed.test/') else None)
    page.route('http://godseed.test/',lambda r:r.fulfill(status=200,content_type='text/html',body=(ROOT/'GODSEED-Play.html').read_text()))
    page.goto('http://godseed.test/')
    page.evaluate('GodseedDebug.newWorld(41);GodseedDebug.setSpeed(0)')
    page.locator('#godviewTab-lives').click()
    page.locator('#godviewLifeDetails summary').click()
    assert page.locator('#chapterTwoPanel').is_hidden()
    page.evaluate("""() => {
      const s=GodseedDebug.getState();s.chapter={version:1,stage:3,completedAt:s.tick,rewarded:true};
      s.camp={x:s.bot.x,y:s.bot.y};s.bot.tool=1;
      s.regions.discovered=['R00','R01','R02'];
      GodseedDebug.step(1);
    }""")
    assert page.locator('#chapterTwoPanel').is_visible()
    assert page.locator('#chapterTwoProgress').get_attribute('aria-valuenow')=='1'
    assert 'CARTOGRAPHER' in page.locator('#chapterTwoTitle').inner_text()
    page.evaluate("""() => {
      const s=GodseedDebug.getState();s.regions.discovered.push('R05');s.bot.ruins=2;
      GodseedDebug.step(1);
    }""")
    assert page.locator('#chapterTwoProgress').get_attribute('aria-valuenow')=='2'
    page.evaluate("""() => {
      const s=GodseedDebug.getState();s.npcs.find(p=>p.name==='Mera').met=true;
      s.shrinesVisited=[GodseedSim.idx(20,31),GodseedSim.idx(42,19)];
      GodseedDebug.step(1);
    }""")
    assert page.locator('#chapterTwoProgress').get_attribute('aria-valuenow')=='3'
    assert 'COMPLETED' in page.locator('#chapterTwoStep').inner_text()
    assert page.evaluate('GodseedDebug.getState().chapterTwo.rewarded') is True
    assert page.evaluate('GodseedDebug.getState().log.filter(e=>e.title==="Chapter II complete").length')==1
    assert page.evaluate('GodseedDebug.getCamera().width')==32
    page.screenshot(path=str(SHOT),full_page=True)
    assert not errors,errors
    assert not network,network
    browser.close()
print('PASS real offline Chromium Chapter II, 3 milestones, 32x20, 0 JS errors/remote requests')
print('RUNNING GAME SCREENSHOT:',SHOT)
