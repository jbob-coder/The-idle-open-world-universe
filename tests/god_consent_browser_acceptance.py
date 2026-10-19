"""GOD-002 offline browser acceptance: per-person consent is visible and never puppets NPCs."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SCREEN=ROOT/'qa-screenshots'/'god-002-consent-640x360.png'
SCREEN.parent.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'],
        **({'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}))
    context=browser.new_context(offline=True,viewport={'width':640,'height':360},is_mobile=True,
                                has_touch=True,device_scale_factor=1)
    page=context.new_page()
    errors=[];external=[]
    page.on('pageerror',lambda error: errors.append(str(error)))
    page.on('request',lambda req:external.append(req.url)
            if req.url.startswith(('https://','http://')) and req.url!='http://godseed.test/' else None)
    page.route('http://godseed.test/',lambda route:route.fulfill(
        content_type='text/html',body=(ROOT/'GODSEED-Play.html').read_text(encoding='utf-8')))
    page.goto('http://godseed.test/',wait_until='load')
    page.evaluate("GodseedDebug.newWorld(41);GodseedDebug.setSpeed(0)")
    before=page.evaluate("""() => {
        const s=GodseedDebug.getState();
        return {tick:s.tick,steps:s.bot.steps,faith:s.faith,buildings:s.living.towns.map(t=>t.buildings.length),
                agendas:s.living.towns.map(t=>t.agenda),story:s.story.completed};
    }""")
    page.locator('#godMessage').fill('Sera: explore the woods')
    page.locator('#godSubmit').click()
    result=page.evaluate("""() => {
        const s=GodseedDebug.getState(),w=s.living.whispers.at(-1);
        return {tick:s.tick,steps:s.bot.steps,faith:s.faith,buildings:s.living.towns.map(t=>t.buildings.length),
                agendas:s.living.towns.map(t=>t.agenda),story:s.story.completed,
                people:w.people,decisions:w.decisions,target:w.target};
    }""")
    assert result['target']=={'kind':'person','id':'sera','name':'Sera'},result
    assert len(result['people'])==1 and result['people'][0]['name']=='Sera',result
    assert result['people'][0]['state'] in ('considering','declined')
    assert result['people'][0]['reason']
    assert result['decisions']==[], 'individual advice must not set town policy'
    assert all(result[k]==before[k] for k in ('tick','steps','faith','buildings','agendas','story')), result
    assert 'Sera' in page.locator('#godFeedback').inner_text()
    assert result['people'][0]['state'] in page.locator('#godFeedback').inner_text()
    page.locator('#save').click()
    page.reload()
    saved=page.evaluate("""() => {
        const s=GodseedDebug.getState();
        return [s.living.whispers.at(-1).people[0].state,
                s.living.citizens.find(p=>p.name==='Sera').divineBelief.history.at(-1).state,
                s.version];
    }""")
    assert saved==[result['people'][0]['state'],result['people'][0]['state'],1], saved
    page.evaluate('GodseedDebug.setSpeed(0)')
    snapshot=page.evaluate('GodseedSim.serialize(GodseedDebug.getState())')
    page.locator('#godMessage').fill("Don't build homes")
    page.locator('#godSubmit').click()
    assert page.evaluate('GodseedSim.serialize(GodseedDebug.getState())')==snapshot
    assert 'no order issued' in page.locator('#godFeedback').inner_text().lower()
    page.screenshot(path=str(SCREEN),full_page=True)
    assert not errors,errors
    assert not external,external
    browser.close()
print('PASS GOD-002: offline mobile consent, individual refusal and acceptance, no puppet actions, v1 persistence')
print('SCREENSHOT:',SCREEN)
