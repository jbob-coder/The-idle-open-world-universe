"""Screenshot and divine-touch smoke test for Android-sized LANDSCAPE Chromium.

Images are real browser captures of the HTML produced from this branch,
NOT emulator captures and NOT evidence of installation on an Android phone.
"""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "qa-screenshots"
OUT.mkdir(exist_ok=True)
URL = (ROOT / "GODSEED-Play.html").as_uri()
SIZES = [(640, 360), (720, 400), (960, 540)]

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, args=["--disable-dev-shm-usage"])
    evidence = []
    for width, height in SIZES:
        context = browser.new_context(viewport={"width": width, "height": height},
                                      device_scale_factor=1, reduced_motion="reduce")
        page = context.new_page()
        problems = []
        page.on("pageerror", lambda error: problems.append(str(error)))
        page.goto(URL, wait_until="load")
        page.wait_for_selector("#world")
        page.evaluate("window.GodseedDebug.newWorld(20261017)")
        page.evaluate("window.GodseedDebug.step(26)")
        page.wait_for_timeout(250)
        assert page.locator("#world").is_visible(), "world canvas not visible"
        assert page.locator("#androidDock").is_visible(), "landscape touch dock not visible"
        assert page.locator("#androidDock [data-power=inspire]").is_visible(), "missing Inspire"
        assert page.locator("#androidDock button").count() == 9, "dock must fit 9 controls"
        buttons_fit = page.evaluate("""() => {
          const dock=document.querySelector('#androidDock').getBoundingClientRect();
          return [...document.querySelectorAll('#androidDock button')]
            .every(b=>{const r=b.getBoundingClientRect();
              return r.left>=-1 && r.right<=window.innerWidth+1 &&
                r.top>=dock.top-1 && r.bottom<=window.innerHeight+1 &&
                r.width>=32 && r.height>=40;});
        }""")
        assert buttons_fit, f"touch controls clipped at {width}x{height}"
        path = OUT / f"godseed-medieval-observacion-{width}x{height}.png"
        page.screenshot(path=str(path))
        assert path.stat().st_size > 3000, "empty screenshot"

        # Player remains the god: select power then tap the traveler's world tile.
        page.evaluate("""() => {
          const s=window.GodseedDebug.getState();
          for(const p of s.npcs) s.seen[p.y*64+p.x]=1;
        }""")
        page.locator("#androidDock [data-power=inspire]").click()
        coords = page.evaluate("""() => {
          const s=window.GodseedDebug.getState(), p=s.npcs[0],
            r=document.querySelector('#world').getBoundingClientRect(),
            scale=Math.min(r.width/576,r.height/352),
            drawnWidth=576*scale, drawnHeight=352*scale,
            cameraX=Math.max(0,Math.min(64-36,s.bot.x-18)),
            cameraY=Math.max(0,Math.min(48-22,s.bot.y-11));
          return {x:r.left+(r.width-drawnWidth)/2+(p.x-cameraX+0.5)*16*scale,
                  y:r.top+(r.height-drawnHeight)/2+(p.y-cameraY+0.5)*16*scale,
                  before:s.faith, target:p.name};
        }""")
        page.mouse.click(coords["x"], coords["y"])
        result=page.evaluate("""() => {
          const s=window.GodseedDebug.getState();
          return {faith:s.faith, inspired:s.npcs.some(p=>p.favorUntil>s.tick),
                  log:s.log.some(e=>e.title==='Divine inspiration')};
        }""")
        assert result["faith"] == coords["before"]-5, f"inspire tap did not spend Faith at {width}x{height}: {result}"
        assert result["inspired"] and result["log"], "traveler not inspired"
        page.wait_for_timeout(250)
        path2 = OUT / f"godseed-medieval-inspirar-{width}x{height}.png"
        page.screenshot(path=str(path2))
        assert path2.stat().st_size > 3000
        assert not problems, f"browser runtime errors: {problems}"
        evidence.append({"resolution": f"{width}x{height}", "buttons": 9,
                         "inspired":coords["target"],"files":[path.name,path2.name],
                         "errors":problems})
        context.close()
    browser.close()

(OUT / "RESULTS.json").write_text(json.dumps({"source":"Chromium HTML preview, NOT Android emulator",
                                               "checks":evidence}, indent=2))
print(json.dumps(evidence,indent=2))
