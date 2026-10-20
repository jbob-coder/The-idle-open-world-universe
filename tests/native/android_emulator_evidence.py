#!/usr/bin/env python3
"""Write evidence for a real API-29 Android emulator run, not physical hardware."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "qa-screenshots"
APP_APK = ROOT / "android/gradle/app/build/outputs/apk/debug/app-debug.apk"
TEST_APK = ROOT / "android/gradle/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk"
HEX_SHA = re.compile(r"[0-9a-f]{40}\Z")
TEST_COUNT = 7


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(65536), b""):
            digest.update(block)
    return digest.hexdigest()


def make_report(source_sha: str, checkout_sha: str, sdk: str,
                app_apk: Path, test_apk: Path, screenshot: Path,
                instrumentation: Path, memory: Path, logcat: Path,
                run_id: str | None = None) -> dict:
    for name, value in (("source_sha", source_sha), ("checkout_sha", checkout_sha)):
        if not HEX_SHA.fullmatch(value):
            raise ValueError(f"{name} must be an exact 40-character Git SHA")
    if sdk.strip() != "29":
        raise ValueError("QA-003 acceptance requires an Android API-29 emulator")
    for path in (app_apk, test_apk, screenshot, instrumentation, memory, logcat):
        if not path.is_file() or path.stat().st_size == 0:
            raise ValueError(f"Missing or empty evidence: {path}")
    with screenshot.open("rb") as screen:
        if screen.read(8) != b"\x89PNG\r\n\x1a\n":
            raise ValueError("Emulator screenshot is not a PNG")
    output = instrumentation.read_text(encoding="utf-8", errors="replace")
    if not re.search(r"(?m)^OK \(7 tests\)\s*$", output):
        raise ValueError("Native instrumentation did not report all seven tests passing")
    if "INSTRUMENTATION_FAILED" in output or "FAILURES!!!" in output:
        raise ValueError("Instrumentation log reports failure")
    return {
        "schema_version": 1,
        "environment": "Android emulator API 29; not a physical 2-3GB RAM test",
        "source_head_sha": source_sha,
        "tested_checkout_sha": checkout_sha,
        "github_run_id": run_id or None,
        "instrumentation_passed": TEST_COUNT,
        "app_apk_sha256": sha256(app_apk),
        "test_apk_sha256": sha256(test_apk),
        "screenshot_sha256": sha256(screenshot),
        "instrumentation_log_sha256": sha256(instrumentation),
        "memory_snapshot_sha256": sha256(memory),
        "logcat_sha256": sha256(logcat),
        "physical_low_ram_verified": False,
    }


def main() -> None:
    checkout = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    expected = os.environ.get("GODSEED_TESTED_SHA", checkout)
    if expected != checkout:
        raise ValueError("Checkout SHA differs from the CI commit under test")
    source = os.environ.get("GODSEED_SOURCE_SHA", checkout)
    sdk = subprocess.check_output(["adb", "shell", "getprop", "ro.build.version.sdk"], text=True).strip()
    report = make_report(
        source, checkout, sdk, APP_APK, TEST_APK,
        OUT / "android-emulator-skyworld.png",
        OUT / "android-emulator-instrumentation.txt",
        OUT / "android-emulator-memory.txt",
        OUT / "android-emulator-logcat.txt",
        os.environ.get("GITHUB_RUN_ID"),
    )
    destination = OUT / "android-emulator-evidence.json"
    destination.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"PASS: exact-SHA emulator provenance: {destination}")


if __name__ == "__main__":
    main()
