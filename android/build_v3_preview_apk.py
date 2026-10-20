#!/usr/bin/env python3
"""Package the proven GODSEED V3 WebGL HTML as a separate experimental APK."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import tempfile
import zipfile
from build_apk import Axml, Dex, P

PACKAGE = "io.godseed.v3preview"
HTML = P / "GODSEED-V3-Play.html"
DIST = P / "dist"
APK = DIST / "GODSEED-V3-preview.apk"
EVIDENCE = DIST / "GODSEED-V3-preview-manifest.json"

def build():
    if not HTML.is_file():
        raise FileNotFoundError("Run python build_v3.py first")
    html = HTML.read_bytes()
    if b"GodseedV3Sim" not in html or b"GodseedV3Debug" not in html:
        raise ValueError("V3 WebGL game code is missing")
    if b"godseed-one-small-life-v1" in html:
        raise ValueError("V3 must not include the old save identity")
    dex = Dex(owner="Lio/godseed/v3preview/MainActivity;").build()
    axml = Axml(package=PACKAGE, label="GODSEED V3 Preview",
                version_code=1, version_name="0.1.0-preview").build()
    DIST.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="godseed-v3-") as folder:
        tmp = Path(folder)
        unsigned = tmp / "unsigned.apk"
        key = tmp / "debug.jks"
        with zipfile.ZipFile(unsigned, "w") as zip:
            zip.writestr("AndroidManifest.xml", axml, compress_type=zipfile.ZIP_STORED)
            zip.writestr("classes.dex", dex, compress_type=zipfile.ZIP_STORED)
            zip.writestr("assets/index.html", html,
                         compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
        subprocess.run([
            "keytool", "-genkeypair", "-alias", "godseedv3", "-keyalg", "RSA",
            "-keysize", "2048", "-validity", "365", "-keystore", str(key),
            "-storepass", "local-preview-only", "-keypass", "local-preview-only",
            "-dname", "CN=GODSEED V3 Local Debug, O=Experimental, C=US", "-noprompt"
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        shutil.copyfile(unsigned, APK)
        subprocess.run([
            "jarsigner", "-keystore", str(key), "-storepass", "local-preview-only",
            "-keypass", "local-preview-only", "-digestalg", "SHA-256",
            "-sigalg", "SHA256withRSA", str(APK), "godseedv3"
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    checked = subprocess.run(["jarsigner", "-verify", str(APK)],
                             capture_output=True, text=True)
    if checked.returncode:
        raise RuntimeError("Invalid debug signature: " + checked.stdout + checked.stderr)
    evidence = {
        "application_id": PACKAGE,
        "apk": APK.name,
        "apk_sha256": hashlib.sha256(APK.read_bytes()).hexdigest(),
        "web_asset": "assets/index.html",
        "web_sha256": hashlib.sha256(html).hexdigest(),
        "min_sdk": 26,
        "target_sdk": 28,
        "signing": "JAR v1 temporary debug key; NOT upgrade-stable",
        "offline": True,
        "physical_device_test": "NOT_RUN"
    }
    EVIDENCE.write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(evidence, indent=2))

if __name__ == "__main__":
    build()
