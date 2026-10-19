"""Real offline Chrome living-settlement / non-puppeting guidance acceptance."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
SHOT=ROOT/'qa-screenshots'/'living-settlements-god-view-720x400.png'
SHOT.parent.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    opts={'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'],**opts)
    ctx=browser.new_context(offline=True,viewport={'width':720,'height':400},device_scale_factor=1)
    page=ctx.new_page();errors=[];outbound=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda req:outbound.append(req.url) if req.url.startswith(('http:','https:')) and req.url!='http://godseed.test/' else None)
    page.route('http://godseed.test/',lambda route:route.fulfill(content_type='text/html',body=(ROOT/'GODSEED-Play.html').read_text(encoding='utf-8')))
    page.goto('http://godseed.test/',wait_until='load')
    page.evaluate('GodseedDebug.newWorld(41);GodseedDebug.setSpeed(0)')
    page.wait_for_function("window.GodseedDebug.getRenderStats().atlasesReady")
    initial=page.evaluate("""() => ({
      towns:GodseedDebug.getState().living.towns.length,
      buildings:GodseedDebug.getState().living.towns.map(t=>t.buildings.length),
      citizens:GodseedDebug.getState().living.citizens.length,
      nim:[GodseedDebug.getState().bot.x,GodseedDebug.getState().bot.y],
      tick:GodseedDebug.getState().tick
    })""")
    assert initial['towns']==2 and initial['citizens']==4 and min(initial['buildings'])>=2,initial
    assert 'Briarford' in page.locator('#townStatus').inner_text()
    assert 'Elin' in page.locator('#citizenLives').inner_text()
    page.locator('#godMessage').fill('Por favor protejan los pueblos contra lobos')
    page.locator('#godSubmit').click()
    assert 'protect residents' in page.locator('#godFeedback').inner_text(),page.locator('#godFeedback').inner_text()
    assert page.evaluate('GodseedDebug.getState().tick')==initial['tick'],'God whisper may not advance autonomous time'
    assert page.evaluate('()=>[GodseedDebug.getState().bot.x,GodseedDebug.getState().bot.y]')==initial['nim'],'God whisper may not teleport Nim'
    page.evaluate('GodseedDebug.step(2500)')
    towns=page.evaluate('GodseedDebug.getState().living.towns.map(t=>({age:t.age,buildings:t.buildings.length}))')
    assert all(t['buildings']>=6 for t in towns),towns
    assert page.evaluate('GodseedDebug.getState().living.citizens.every(c=>c.skill>1)')
    choices=page.evaluate("""() => GodseedDebug.getState().living.citizens.map(c => c.choice)""")
    assert len(choices)==4 and all(c and c['why'] and c['consequence'] and len(c['alternatives'])==2 for c in choices),choices
    decision_text=page.locator('#citizenLives').inner_text()
    assert all(label in decision_text for label in ['Why:', 'Alternative:', 'Result:', 'Mind I:', 'Plan ']),decision_text
    assert page.evaluate('GodseedSim.finaleStatus(GodseedDebug.getState()).completed')
    page.evaluate("window.scrollTo(0,0)")
    page.screenshot(path=str(SHOT),full_page=True)
    page.locator('#save').click()
    page.reload()
    assert page.evaluate('GodseedDebug.getState().living.towns.every(t=>t.buildings.length>=6)')
    assert page.evaluate('GodseedDebug.getState().living.citizens.length')==4
    assert page.evaluate('GodseedDebug.getState().living.whispers.length')==1
    assert not errors,errors
    assert not outbound,outbound
    browser.close()
print('PASS offline living settlements: 4 residents, growth, free-text guidance, independence, save/reload, zero external requests')
print('SCREENSHOT:',SHOT)
