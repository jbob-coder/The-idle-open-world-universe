"""Browser bridge-contract test with a fake host; not proof of Android execution."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
    browser=pw.chromium.launch(**({'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}),headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':720,'height':400})
    page.set_content((ROOT/'GODSEED-Play.html').read_text());assert page.locator('#packImport').is_disabled()
    source=(ROOT/'GODSEED-Play.html').read_text()
    fake="""<script>window.packCalls=[];window.GodseedNativePacks={usage:()=>JSON.stringify({coreBytes:50000,mutableBytes:20000,optionalBytes:1000,freeBytes:2000000000,cacheBytes:10,maxPackBytes:1048576,packs:[{id:'sample',title:'Local history',bytes:1000}]}),requestImport:()=>packCalls.push('import'),requestRemove:id=>packCalls.push('remove:'+id),lore:()=>JSON.stringify({title:'Local history',entries:[{region_id:'R00',text:'Known hearth tale'},{region_id:'R07',text:'Secret fen tale'}]})};</script>"""
    page.set_content(source.replace('<script>/*',fake+'<script>/*',1) if '<script>/*' in source else source.replace('<script>',fake+'<script>',1))
    page.evaluate('GodseedDebug.newWorld(42);GodseedDebug.setSpeed(0)')
    assert page.evaluate('packCalls.length')==0,'no automatic install or removal'
    assert '2.000 GB' in page.locator('#storageUsage').inner_text()
    page.locator('#packImport').click();assert page.evaluate('packCalls')==['import']
    page.locator('#packList button').first.click();text=page.locator('#packLore').inner_text();assert 'Known hearth tale' in text and 'Secret fen tale' not in text
    page.locator('#packList button').last.click();assert page.evaluate('packCalls')==['import','remove:sample']
    browser.close()
print('PASS optional-storage UI bridge contract: no auto actions, accounting, discovered lore, explicit requests (fake host)')
