#!/usr/bin/env python3
"""Actual headless Chromium acceptance for GODSEED V3's offline WebGL preview."""
from pathlib import Path
from time import monotonic
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/"GODSEED-V3-Play.html").resolve()
CAPTURE=ROOT/"qa-screenshots"

def wait_for_state(page, expression, timeout_seconds=25):
    """Poll with page.evaluate: no wait_for_function eval under restrictive CSP."""
    deadline=monotonic()+timeout_seconds
    while monotonic()<deadline:
        if page.evaluate(expression):
            return
        page.wait_for_timeout(80)
    raise AssertionError("Timed out waiting for state: "+expression)

def run():
    assert HTML.exists(), "run python build_v3.py before browser tests"
    CAPTURE.mkdir(exist_ok=True)
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True,args=[
            "--enable-webgl","--use-gl=angle","--use-angle=swiftshader",
            "--enable-unsafe-swiftshader","--ignore-gpu-blocklist",
        ])
        for width,height in ((960,540),(640,360)):
            page=browser.new_page(viewport={"width":width,"height":height})
            # Older Android WebViews do not implement replaceChildren().
            # Verify the actual app still initializes when it is unavailable.
            page.add_init_script("""Object.defineProperty(Element.prototype,
                'replaceChildren', {value: undefined, configurable: true});""")
            failures=[]
            page.on("pageerror",lambda error: failures.append(str(error)))
            page.route("http://**/*",lambda route: route.abort())
            page.route("https://**/*",lambda route: route.abort())
            page.goto(HTML.as_uri(),wait_until="load")
            wait_for_state(page,"() => Boolean(window.GodseedV3Debug)",20)
            assert page.evaluate("GodseedV3Debug.hasWebGL()"), "WebGL 3D context unavailable"
            assert page.evaluate("typeof Element.prototype.replaceChildren") == "undefined"
            assert page.locator("#stats dt").count() == 7
            assert page.locator("#citizens .person").count() == 2
            initial=page.evaluate("""() => {
                const s=GodseedV3Debug.newWorld(14);
                GodseedV3Debug.pause();
                return s;
            }""")
            assert initial["tick"]==0, "reset must be atomic before frame-driven stepping"
            assert len(initial["citizens"])==2
            page.get_by_role("button",name="Acercar +").click()
            page.get_by_role("button",name="Alejar −").click()
            page.mouse.move(150,180)
            page.mouse.down()
            page.mouse.move(260,220,steps=4)
            page.mouse.up()
            page.get_by_role("button",name="Continuar").click()
            page.get_by_role("button",name="Velocidad ×1").click()
            page.get_by_role("button",name="Velocidad ×4").click()
            wait_for_state(page,"() => GodseedV3Debug.getState().structures.length === 1",30)
            page.evaluate("GodseedV3Debug.pause()")
            built=page.evaluate("GodseedV3Debug.getState()")
            assert built["spent"]==4 and built["wood"]==built["harvested"]-4
            assert len(built["structures"])==1
            assert page.evaluate("GodseedV3Debug.save()"), "V3 persistence failed"
            page.reload(wait_until="load")
            wait_for_state(page,"() => Boolean(window.GodseedV3Debug)",20)
            assert page.evaluate("GodseedV3Debug.isPaused()"), "restored world must be paused"
            restored=page.evaluate("GodseedV3Debug.getState()")
            assert restored==built, "save/load must preserve exact authoritative state"
            assert page.evaluate("GodseedV3Debug.hasWebGL()"), "3D lost after reload"
            page.screenshot(path=str(CAPTURE/f"godseed-v3-chromium-{width}x{height}.png"))
            assert not failures, "Chromium page errors: "+"; ".join(failures)
            print(f"PASS GODSEED V3 WebGL offline {width}x{height}; tick={built['tick']} harvested={built['harvested']}")
            page.close()
        browser.close()

if __name__=="__main__":
    run()
