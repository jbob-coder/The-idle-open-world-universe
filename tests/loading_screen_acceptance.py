"""Real offline Chromium acceptance for the integrated GODSEED loading scene."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "GODSEED-Play.html"
OUT = ROOT / "qa-screenshots"
OUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    chromium = {"executable_path": "/usr/bin/chromium"} if Path("/usr/bin/chromium").exists() else {}
    browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"], **chromium)
    for width, height in ((720, 400), (640, 360)):
        context = browser.new_context(
            viewport={"width": width, "height": height},
            device_scale_factor=1, offline=True,
            reduced_motion="reduce",
        )
        page = context.new_page()
        errors = []
        blocked_network = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("request", lambda request:
            blocked_network.append(request.url) if request.url.split("?")[0] != "http://godseed.test/" else None)
        page.route("http://godseed.test/**", lambda route: route.fulfill(
            status=200, content_type="text/html; charset=utf-8",
            body=HTML.read_text(encoding="utf-8"),
        ))
        page.goto("http://godseed.test/?splashPreview=1", wait_until="load")
        page.wait_for_function("() => window.GodseedSplash && window.GodseedSplash.getState().ready === true",
                               timeout=12000)
        state = page.evaluate("GodseedSplash.getState()")
        assert state["ready"] and state["progress"] == 100 and not state["error"], state
        assert page.locator("#godseedSplash").is_visible(), "preview should keep the finished splash visible"
        assert page.locator("#splashProgress").get_attribute("aria-valuenow") == "100"
        assert page.locator("#splashEnter").is_visible()
        assert page.locator("#splashRetry").is_hidden()
        assert page.locator(".splash-scene svg").count() == 1
        assert page.locator("#godseedSplash .splash-title").inner_text() == "GODSEED"
        assert page.evaluate("GodseedDebug.getRenderStats().atlasesReady") is True
        assert page.evaluate("GodseedDebug.getState().settings.speed") >= 0
        page.screenshot(path=str(OUT / f"godseed-splash-{width}x{height}.png"))
        page.locator("#splashEnter").click()
        assert page.locator("#godseedSplash").is_hidden()
        # App is interactive once the splash has been dismissed.
        page.locator("#step").click()
        assert page.evaluate("GodseedDebug.getState().tick") > 0
        assert not errors, errors
        assert not blocked_network, blocked_network
        context.close()

    # Standard startup must exit automatically without user interaction.
    context = browser.new_context(viewport={"width": 720, "height": 400}, offline=True)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.route("http://godseed.test/**", lambda route: route.fulfill(
        status=200, content_type="text/html; charset=utf-8",
        body=HTML.read_text(encoding="utf-8")))
    page.goto("http://godseed.test/", wait_until="load")
    page.wait_for_function("() => window.GodseedSplash && window.GodseedSplash.getState().ready === true",
                           timeout=12000)
    page.locator("#godseedSplash").wait_for(state="hidden", timeout=5000)
    assert page.locator("#world").is_visible()
    assert not errors, errors
    context.close()
    browser.close()

print("PASS: GODSEED offline medieval splash, true asset readiness, mobile layouts and automatic exit")
