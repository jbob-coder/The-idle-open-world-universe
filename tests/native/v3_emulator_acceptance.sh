#!/usr/bin/env bash
# Execute as one process: reactivecircus/android-emulator-runner runs inline
# script lines separately, so multiline shell loops must live in a file.
set -euo pipefail

APK="v3-android-apk/app-debug.apk"
LOG="qa-screenshots/v3-android-webgl-log.txt"
SCREEN="qa-screenshots/v3-android-emulator.png"
SYSTEM="qa-screenshots/v3-android-emulator-system.txt"
PACKAGE="io.godseed.v3preview"
mkdir -p qa-screenshots
test -s "$APK"

adb install -r "$APK"
adb logcat -c
adb shell am start -W -n "$PACKAGE/.MainActivity"

found=0
for attempt in $(seq 1 45); do
  adb logcat -d -s GODSEED_V3:I > "$LOG"
  if grep -q 'WEBGL_CONTEXT=true' "$LOG"; then
    found=1
    break
  fi
  if grep -q 'RENDERER_MODE=.*canvas-2d-fallback' "$LOG"; then
    found=2
    break
  fi
  sleep 2
done
# Capture screenshot and log even when GPU context failed; preserve evidence.
# Capture device/rendering environment regardless of the result.
{
  echo '=== Graphics version ==='
  adb shell getprop ro.opengles.version || true
  echo '=== Active WebView provider ==='
  adb shell dumpsys webviewupdate || true
  echo '=== Foreground activity ==='
  adb shell dumpsys activity activities | grep -E 'mResumedActivity|topResumedActivity' || true
  echo '=== App process ==='
  adb shell pidof "$PACKAGE" || true
} > "$SYSTEM" 2>&1
adb shell screencap -p /sdcard/godseed-v3-preview.png
adb pull /sdcard/godseed-v3-preview.png "$SCREEN"
test -s "$SCREEN"

# Independently verify Activity onPause -> V3 local save -> full process
# restart -> paused state restore, even on an emulator without usable WebGL.
# The simulated world does not need the graphics pipeline to stay persistent.
adb shell input keyevent 3
saved=""
for attempt in $(seq 1 15); do
  adb logcat -d -s GODSEED_V3:I > "$LOG"
  saved="$(sed -n 's/.*STATE_SAVED=//p' "$LOG" | tail -n 1)"
  if [[ -n "$saved" ]]; then break; fi
  sleep 1
done
if [[ -z "$saved" ]]; then
  echo "FAIL: Android V3 onPause did not record saved state" >&2
  cat "$LOG" >&2
  exit 1
fi
adb shell am force-stop "$PACKAGE"
adb shell am start -W -n "$PACKAGE/.MainActivity"
restored=""
for attempt in $(seq 1 20); do
  adb logcat -d -s GODSEED_V3:I > "$LOG"
  restored="$(sed -n 's/.*STATE_LOADED=//p' "$LOG" | tail -n 1)"
  count="$(grep -c 'STATE_LOADED=' "$LOG" || true)"
  if [[ "$count" -ge 2 && -n "$restored" ]]; then break; fi
  sleep 1
done
if [[ "$saved" != "$restored" || "$count" -lt 2 ]]; then
  echo "FAIL: native V3 world changed or was lost across Activity restart" >&2
  echo "SAVED=$saved RESTORED=$restored LOADED_COUNT=$count" >&2
  cat "$LOG" >&2
  exit 1
fi
echo "PASS: Android lifecycle preserved seed,tick,harvest,spent,wood,shelters"
if [[ "$found" -eq 0 ]]; then
  echo "FAIL: V3 APK launched but neither WebGL nor Canvas2D was available" >&2
  cat "$LOG" >&2
  cat "$SYSTEM" >&2
  exit 1
fi
adb shell pidof "$PACKAGE" >/dev/null
if [[ "$found" -eq 1 ]]; then
  echo "PASS: native V3 APK installed with real WebGL GPU context"
else
  echo "PASS DEGRADED: native V3 APK installed with projected Canvas2D; NOT GPU 3D"
fi
