"""Chromium simulation of the native-only offline storage UI.

Mocks the Android bridge: checks UI behavior, NOT Android SAF/dialog/security.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
    launch={'headless':True,'args':['--no-sandbox']}
    if Path('/usr/bin/chromium').exists(): launch['executable_path']='/usr/bin/chromium'
    browser=pw.chromium.launch(**launch)
    context=browser.new_context(offline=True,viewport={'width':640,'height':360})
    context.add_init_script("""
        window.nativeCalls={choose:0,removed:[],regions:[]};
        window.GodseedStorage={
            status:()=>JSON.stringify({
                core_bytes_estimate:250000,optional_used_bytes:1024,
                optional_limit_bytes:5000000000,app_managed_limit_bytes:6000000000,
                phone_free_bytes:800000000,core_target_bytes:1000000000,
                packs:[{pack_id:'mossveil_lore_sample',bytes:1024}]
            }),
            chooseLorePack:()=>{window.nativeCalls.choose++;},
            removeLorePack:id=>window.nativeCalls.removed.push(id),
            loreForRegion:id=>{
                window.nativeCalls.regions.push(id);
                return JSON.stringify([{region_id:id,title:'Pixel lore',text:'<img src=x onerror=alert(1)> Protected lore'}]);
            }
        };
    """)
    page=context.new_page();errors=[];network=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda req:network.append(req.url) if req.url.startswith(('http://','https://')) and req.url!='http://godseed.test/' else None)
    page.route('http://godseed.test/',lambda route:route.fulfill(status=200,content_type='text/html',body=(ROOT/'GODSEED-Play.html').read_text(encoding='utf-8')))
    page.goto('http://godseed.test/')
    assert page.locator('#nativeStoragePanel').is_visible()
    assert page.locator('#nativeStorageBody').is_hidden()
    page.locator('#nativeStorageToggle').click()
    assert page.locator('#nativeStorageBody').is_visible()
    assert '5.000 GB' in page.locator('#nativeStorageMetrics').inner_text()
    assert '0.800 GB' in page.locator('#nativeStorageMetrics').inner_text()
    page.locator('#nativeStorageInstall').click()
    assert page.evaluate('nativeCalls.choose')==1
    page.locator('#nativeStoragePacks button').click()
    assert page.evaluate('nativeCalls.removed')==['mossveil_lore_sample']
    # Extra text stays hidden until Nim has discovered the region.
    assert page.locator('#nativeStorageRegion option[value="R03"]').count()==0
    page.evaluate("GodseedDebug.getState().regions.discovered.push('R03')")
    page.locator('#nativeStorageRefresh').click()
    assert page.locator('#nativeStorageRegion option[value="R03"]').count()==1
    page.locator('#nativeStorageRegion').select_option('R03')
    page.locator('#nativeStorageShowLore').click()
    assert 'Pixel lore' in page.locator('#nativeStorageLore').inner_text()
    assert page.locator('#nativeStorageLore img').count()==0,'Lore must never become HTML'
    assert page.evaluate('nativeCalls.regions')==['R03']
    page.evaluate("window.dispatchEvent(new CustomEvent('godseed:storage',{detail:{ok:true,message:'Installed sample'}}))")
    assert 'Installed sample' in page.locator('#nativeStorageNotice').inner_text()
    assert not network,network
    assert not errors,errors
    browser.close()
print('PASS native storage UI mock: opt-in, size/pack display, discovered lore, XSS-safe text, no network/errors')
