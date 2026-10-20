"""Standalone V3 debug APK: distinct identity, real game bundle and offline safety."""
from pathlib import Path
import hashlib
import json
import subprocess
import zipfile

P = Path(__file__).resolve().parents[1]
APK = P / "dist/GODSEED-V3-preview.apk"
HTML = P / "GODSEED-V3-Play.html"
META = P / "dist/GODSEED-V3-preview-manifest.json"
assert APK.is_file() and HTML.is_file()
metadata = json.loads(META.read_text(encoding="utf-8"))
assert metadata["application_id"] == "io.godseed.v3preview"
assert metadata["physical_device_test"] == "NOT_RUN"
assert metadata["apk_sha256"] == hashlib.sha256(APK.read_bytes()).hexdigest()
with zipfile.ZipFile(APK) as z:
    assert z.testzip() is None
    paths = z.namelist()
    assert {"classes.dex", "AndroidManifest.xml", "assets/index.html",
            "META-INF/MANIFEST.MF"} <= set(paths)
    assert any(p.startswith("META-INF/") and p.endswith(".RSA") for p in paths)
    dex, manifest, html = (z.read(p) for p in ("classes.dex", "AndroidManifest.xml",
                                               "assets/index.html"))
    assert dex.startswith(b"dex\n035\x00")
    assert b"Lio/godseed/v3preview/MainActivity;" in dex
    assert b"io.godseed.v3preview" in manifest
    assert b"GODSEED V3 Preview" in manifest
    assert b"hardwareAccelerated" in manifest
    assert b"android.permission.INTERNET" not in manifest
    assert html == HTML.read_bytes()
    assert b"GodseedV3Sim" in html and b"GodseedV3Debug" in html
    assert b"godseed-v3-prototype-v1" in html
    assert b"godseed-one-small-life-v1" not in html
    assert b"Content-Security-Policy" in html
    assert metadata["web_sha256"] == hashlib.sha256(html).hexdigest()
result = subprocess.run(["jarsigner", "-verify", str(APK)],
                        capture_output=True, text=True)
assert result.returncode == 0, result.stdout + result.stderr
print("PASS isolated offline V3 APK, exact HTML, distinct package and debug signature")
