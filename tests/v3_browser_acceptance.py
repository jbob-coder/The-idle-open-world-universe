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
            assert page.locator("#stats dt").count() == 10
            assert page.locator("#citizens .person").count() == 1
            initial=page.evaluate("""() => {
                const s=GodseedV3Debug.newWorld(14);
                GodseedV3Debug.pause();
                return s;
            }""")
            assert initial["tick"]==0, "reset must be atomic before frame-driven stepping"
            assert len(initial["citizens"])==1 and initial["citizens"][0]["alive"]
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
            assert len(built["structures"])==1 and len(built["citizens"])==1 and built["citizens"][0]["alive"]
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
        # Software-projected renderer acceptance: not a claim of native GPU 3D.
        page=browser.new_page(viewport={"width":640,"height":360})
        errors=[]
        page.on("pageerror",lambda error: errors.append(str(error)))
        page.route("http://**/*",lambda route: route.abort())
        page.route("https://**/*",lambda route: route.abort())
        page.goto(HTML.as_uri()+"?renderer=2d",wait_until="load")
        wait_for_state(page,"() => Boolean(window.GodseedV3Debug)",20)
        assert page.evaluate("GodseedV3Debug.rendererMode()") == "canvas-2d-fallback"
        assert not page.evaluate("GodseedV3Debug.hasWebGL()")
        assert page.evaluate("""() => {
            const c=document.getElementById('scene'),ctx=c.getContext('2d');
            if (!ctx) return false;
            const d=ctx.getImageData(0,0,c.width,c.height).data;
            const first=d.slice(0,4).join(',');
            for(let i=4;i<d.length;i+=400)
                if(d.slice(i,i+4).join(',')!==first)return true;
            return false;
        }"""), "Fallback must paint non-uniform world pixels"
        built=page.evaluate("""() => {
            const d=GodseedV3Debug;
            d.newWorld(14);d.pause();
            for(let n=0;n<240;n++)d.step();
            return d.getState();
        }""")
        assert len(built["structures"]) == 1, "Autonomous shelter remains functional"
        assert built["wood"] == built["harvested"]-4
        assert len(built["citizens"])==1 and built["citizens"][0]["alive"]
        assert page.evaluate("GodseedV3Debug.save()")
        page.reload(wait_until="load")
        wait_for_state(page,"() => Boolean(window.GodseedV3Debug)",20)
        assert page.evaluate("GodseedV3Debug.rendererMode()") == "canvas-2d-fallback"
        assert page.evaluate("GodseedV3Debug.getState()") == built
        assert not errors, "Fallback JavaScript errors: " + "; ".join(errors)
        page.screenshot(path=str(CAPTURE/"godseed-v3-canvas-fallback-640x360.png"))
        print("PASS V3 Canvas2D fallback, autonomous shelter, offline save/restore")
        page.close()
        browser.close()

if __name__=="__main__":
    run()
