#!/usr/bin/env python3
"""Independent V3 APK static acceptance, without launching Android or network access.

This checks the *APK actually built*, not merely the source manifest. A PASS
does not demonstrate that WebGL ran on a phone or an emulator.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import zipfile

REPO = Path(__file__).resolve().parents[1]
EXPECTED_PACKAGE = "io.godseed.v3preview"
EXPECTED_LAUNCHER = "io.godseed.v3preview.MainActivity"


def android_binary(name: str) -> Path:
    sdk = os.environ.get("ANDROID_HOME") or os.environ.get("ANDROID_SDK_ROOT")
    if not sdk:
        raise RuntimeError("Android SDK not available; cannot inspect binary manifest/signature")
    folder = Path(sdk) / "build-tools"
    candidates = sorted(folder.glob("*/" + name), reverse=True)
    if not candidates:
        raise RuntimeError("SDK build-tools missing " + name)
    return candidates[0]


def command(*args: str) -> str:
    result = subprocess.run(args, text=True, capture_output=True, check=False, timeout=60)
    if result.returncode != 0:
        raise RuntimeError("Command failed: " + args[0] + "\n" + result.stdout + "\n" + result.stderr)
    return result.stdout + result.stderr


def check(apk: Path, html: Path) -> dict:
    if not apk.is_file() or not html.is_file():
        raise FileNotFoundError("Missing actual APK or reference offline V3 HTML")
    raw = apk.read_bytes()
    if len(raw) < 8000:
        raise ValueError("APK is unexpectedly small")
    expected_html = html.read_bytes()
    with zipfile.ZipFile(apk) as z:
        broken = z.testzip()
        if broken is not None:
            raise ValueError("Damaged APK entry: " + broken)
        names = z.namelist()
        if len(names) != len(set(names)):
            raise ValueError("Duplicate ZIP entries are ambiguous")
        if "AndroidManifest.xml" not in names:
            raise ValueError("APK has no binary AndroidManifest")
        if not any(re.fullmatch(r"classes[0-9]*\.dex", p) for p in names):
            raise ValueError("APK has no DEX executable")
        if "assets/index.html" not in names:
            raise ValueError("APK does not include offline V3 HTML")
        bundled = z.read("assets/index.html")
        if bundled != expected_html:
            raise ValueError("APK HTML does not exactly match source V3 HTML")
        if not all(value in bundled for value in (b"GodseedV3Sim", b"GodseedV3View", b"GodseedV3Debug")):
            raise ValueError("Required V3 simulation/view/controls missing from bundled HTML")
    aapt = str(android_binary("aapt"))
    signer = str(android_binary("apksigner"))
    badging = command(aapt, "dump", "badging", str(apk))
    permissions = command(aapt, "dump", "permissions", str(apk))
    pkg_match = re.search(r"^package: name='([^']+)'", badging, re.MULTILINE)
    launcher_match = re.search(r"^launchable-activity: name='([^']+)'", badging, re.MULTILINE)
    if not pkg_match or pkg_match.group(1) != EXPECTED_PACKAGE:
        raise ValueError("APK package identity is not isolated GODSEED V3")
    if not launcher_match or launcher_match.group(1) != EXPECTED_LAUNCHER:
        raise ValueError("APK does not launch the isolated V3 activity")
    if re.search(r"^\s*uses-permission", permissions, re.MULTILINE):
        raise ValueError("APK requests runtime/install permissions: " + permissions)
    signing = command(signer, "verify", "--verbose", str(apk))
    if not re.search(r"Verified using v2 scheme .*: true", signing):
        raise ValueError("Expected APK v2 signature was not verified")
    return {
        "result": "PASS",
        "scope": "offline APK binary/static acceptance only; no Android startup/WebGL proof",
        "package": pkg_match.group(1),
        "launcher": launcher_match.group(1),
        "requested_permissions": 0,
        "apk_bytes": len(raw),
        "apk_sha256": hashlib.sha256(raw).hexdigest(),
        "html_sha256": hashlib.sha256(expected_html).hexdigest(),
        "apk_v2_signature": True,
    }


if __name__ == "__main__":
    apk = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("v3-android-apk/app-debug.apk")
    html = Path(sys.argv[2]) if len(sys.argv) > 2 else REPO / "GODSEED-V3-Play.html"
    try:
        report = check(apk.resolve(), html.resolve())
        print(json.dumps(report, sort_keys=True, indent=2))
    except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired, zipfile.BadZipFile) as exc:
        print("FAIL V3 APK static acceptance: " + str(exc), file=sys.stderr)
        sys.exit(1)
