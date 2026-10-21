#!/usr/bin/env python3
"""World-only offline acceptance. Not a claim of physical Android performance."""
from pathlib import Path
from time import monotonic
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/"GODSEED-V3-Play.html").resolve()
CAPTURE=ROOT/"qa-screenshots"

def ready(page, timeout_seconds=35):
    deadline=monotonic()+timeout_seconds
    while monotonic()<deadline:
        if page.evaluate("() => !!window.GodseedV3Debug"):
            return
        page.wait_for_timeout(80)
    raise AssertionError("World mode did not expose GodseedV3Debug")

def offline(page):
    page.route("http://**/*",lambda route:route.abort())
    page.route("https://**/*",lambda route:route.abort())

def run():
    assert HTML.is_file(), "build_v3.py must produce the offline HTML"
    CAPTURE.mkdir(exist_ok=True)
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True,args=[
            "--enable-webgl","--use-gl=angle","--use-angle=swiftshader",
            "--enable-unsafe-swiftshader","--ignore-gpu-blocklist"
        ])
        # A fresh browser context per mode proves storage cannot accidentally
        # cross the filesystem/origin boundary used by our acceptance.
        for fallback in (False,True):
            context=browser.new_context(viewport={"width":640 if fallback else 960,
                "height":360 if fallback else 540})
            page=context.new_page()
            errors=[]
            page.on("pageerror",lambda error:errors.append(str(error)))
            offline(page)
            page.goto(HTML.as_uri()+"?mode=world"+("&renderer=2d" if fallback else ""),wait_until="load")
            ready(page)
            assert page.evaluate("GodseedV3Debug.mode()")=="world"
            assert page.evaluate("GodseedV3Debug.storageKey")=="godseed-v3-large-world-v1"
            assert page.evaluate("GodseedV3Debug.rendererMode()")==(
                "canvas-2d-fallback" if fallback else "webgl-3d")
            start=page.evaluate("""() => {
                const d=GodseedV3Debug;const state=d.newWorld(14);d.pause();return state;
            }""")
            assert start["tick"]==0 and start["world"]["tileCount"]==1048576
            # One deterministic jump, not a frame-sensitive race.
            advanced=page.evaluate("() => GodseedV3Debug.fastForward(1400)")
            assert advanced["tick"]==1400
            assert advanced["expedition"]["explorer"]["name"]=="Taren"
            assert advanced["expedition"]["explorer"]["alive"]
            assert advanced["expedition"]["discoveries"]
            assert advanced["expedition"]["camps"]
            assert advanced["outpost"]["status"]=="unfounded"
            assert advanced["world"]["homelandCitizens"]==3
            assert advanced["world"]["camps"]==len(advanced["expedition"]["camps"])
            assert page.locator("#stats").inner_text().find("Lugares descubiertos")>=0
            assert page.evaluate("GodseedV3Debug.worldMetrics().cachedChunks")<=48
            before=page.evaluate("GodseedV3Debug.getState().tick")
            # Pan to negative global coordinates via the god camera; no discovery.
            page.evaluate("GodseedV3Debug.observe(-300,-300)")
            center=page.evaluate("GodseedV3Debug.camera()")
            assert abs(center["x"]+300)<2 and abs(center["z"]+300)<2
            assert page.evaluate("GodseedV3Debug.getState().tick")==before
            assert page.evaluate("GodseedV3Debug.getState().expedition.discoveries.length")==len(
                advanced["expedition"]["discoveries"])
            page.locator("#atlasToggle").click()
            assert page.locator("#atlas").is_visible()
            assert page.evaluate("GodseedV3Debug.getState().tick")==before
            page.locator("#atlasClose").click()
            page.screenshot(path=str(CAPTURE/(
                "godseed-v3-large-world-canvas-640x360.png" if fallback
                else "godseed-v3-large-world-webgl-960x540.png")))
            assert page.evaluate("GodseedV3Debug.save()")
            page.reload(wait_until="load")
            ready(page)
            assert page.evaluate("GodseedV3Debug.isPaused()")
            assert page.evaluate("GodseedV3Debug.getState()")==advanced
            assert not errors, "world browser errors: "+"; ".join(errors)
            print("PASS large world "+("Canvas2D fallback" if fallback else "WebGL 3D")+
                  ": autonomous Taren, camps, negative camera, atlas, isolated save/reload")
            context.close()

        # Import a historical society save only by copy. Browser pagehide
        # auto-save would overwrite an injected fixture on reload, so call
        # the real load() function explicitly and reload only after migrating.
        context=browser.new_context(viewport={"width":640,"height":360})
        page=context.new_page()
        errors=[]
        page.on("pageerror",lambda error:errors.append(str(error)))
        offline(page)
        page.goto(HTML.as_uri()+"?mode=world&renderer=2d",wait_until="load")
        ready(page)
        fixture=(ROOT/"tests/fixtures/v3_society_schema2_seed14.json").read_text(encoding="utf-8")
        assert page.evaluate("""raw => {
            localStorage.removeItem("godseed-v3-large-world-v1");
            localStorage.setItem("godseed-v3-society-v1",raw);
            return GodseedV3Debug.load();
        }""",fixture)
        state=page.evaluate("GodseedV3Debug.getState()")
        assert state["schemaVersion"]==3 and state["tick"]==2500
        assert state["expedition"]["explorer"] is None
        assert state["outpost"]["status"]=="unfounded"
        assert page.evaluate("localStorage.getItem('godseed-v3-society-v1')")==fixture
        moved=page.evaluate("() => GodseedV3Debug.fastForward(100)")
        assert moved["tick"]==2600 and moved["expedition"]["explorer"] is not None
        assert page.evaluate("GodseedV3Debug.save()")
        page.reload(wait_until="load")
        ready(page)
        assert page.evaluate("GodseedV3Debug.getState()")==moved
        assert page.evaluate("localStorage.getItem('godseed-v3-society-v1')")==fixture
        assert not errors, "historical society import errors: "+"; ".join(errors)
        print("PASS historical society schema-2 copied into isolated large world, no source mutation")
        context.close()
        browser.close()

if __name__=="__main__":
    run()
