"""WLD-007: actual Chromium offline import of v1 save into signed 32x32 chunks."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SHOT=ROOT/"qa-screenshots"/"wld-007-legacy-window-640x360.png"
SHOT.parent.mkdir(exist_ok=True,parents=True)

with sync_playwright() as p:
    opts={"executable_path":"/usr/bin/chromium"} if Path("/usr/bin/chromium").exists() else {}
    browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"],**opts)
    context=browser.new_context(viewport={"width":640,"height":360},
                                is_mobile=True,has_touch=True,offline=True)
    page=context.new_page()
    errors=[];outbound=[]
    page.on("pageerror",lambda error:errors.append(str(error)))
    page.on("request",lambda req:outbound.append(req.url) if
            req.url.startswith(("http:","https:")) and req.url!="http://godseed.test/" else None)
    page.route("http://godseed.test/",lambda route:route.fulfill(
        content_type="text/html",body=(ROOT/"GODSEED-Play.html").read_text(encoding="utf-8")))
    page.goto("http://godseed.test/",wait_until="load")
    page.wait_for_function("window.GodseedDebug!==undefined && window.GodseedLegacyWorld!==undefined")
    page.evaluate("GodseedDebug.newWorld(41);GodseedDebug.setSpeed(0)")
    page.wait_for_function("GodseedDebug.getRenderStats().atlasesReady")
    result=page.evaluate("""() => {
      const Sim=GodseedSim,Chunks=GodseedChunks,Bridge=GodseedLegacyWorld;
      const before=Sim.serialize(GodseedDebug.getState());
      const old=Sim.restore(before);
      const imported=Bridge.importLegacy(before,{maxActive:2});
      let mismatches=0;
      for(let y=0;y<48;y++)for(let x=0;x<64;x++)
        if(imported.tileAt(x,y)!==old.map[y*64+x])mismatches++;
      const frontier=imported.tileAt(-33,80);
      const different=frontier===Chunks.T.GRASS?Chunks.T.STONE:Chunks.T.GRASS;
      imported.setTile(-33,80,different);
      imported.putSite({id:"new_colony",kind:"settlement",type:"village",
        x:-33,y:80,label:"North Vale",townId:null});
      imported.evictAll();
      const after=Bridge.restoreExpanded(imported.serialize(),{maxActive:1});
      const recovered=after.legacyState();
      let rejected=false;
      try{after.setTile(12,12,Chunks.T.GRASS)}catch(e){rejected=true}
      return {mismatches,seedBefore:old.worldSeed,seedAfter:recovered.worldSeed,
        tickBefore:old.tick,tickAfter:recovered.tick,botBefore:old.bot,
        botAfter:recovered.bot,townsBefore:old.living.towns,
        townsAfter:recovered.living.towns,chapter:old.chapter,
        reloadedChapter:recovered.chapter,chapterTwo:old.chapterTwo,
        reloadedChapterTwo:recovered.chapterTwo,finale:old.finale,
        reloadedFinale:recovered.finale,
        persisted:after.tileAt(-33,80)===different&&after.site("new_colony").id==="new_colony",
        rejectLegacyOverwrite:rejected,unchangedCurrentGame:Sim.serialize(GodseedDebug.getState())===before,
        overlaySites:after.sitesAt(0,0).filter(s=>s.id.startsWith("legacy:")).length};
    }""")
    assert result["mismatches"]==0,result
    assert result["seedBefore"]==result["seedAfter"]
    assert result["tickBefore"]==result["tickAfter"]
    assert result["botBefore"]==result["botAfter"]
    assert result["townsBefore"]==result["townsAfter"]
    assert result["chapter"]==result["reloadedChapter"]
    assert result["chapterTwo"]==result["reloadedChapterTwo"]
    assert result["finale"]==result["reloadedFinale"]
    assert result["persisted"] and result["rejectLegacyOverwrite"]
    assert result["unchangedCurrentGame"] and result["overlaySites"]>=2
    page.screenshot(path=str(SHOT),full_page=True)
    assert not errors,errors
    assert not outbound,outbound
    browser.close()
print("PASS WLD-007: 3072 exact v1 tiles, Nim/towns/3 chapters, extended chunks, offline 640x360")
print("SCREENSHOT:",SHOT)
