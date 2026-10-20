#!/usr/bin/env bash
# Execute as one process: reactivecircus/android-emulator-runner runs inline
# script lines separately, so multiline shell loops must live in a file.
set -euo pipefail

APK="v3-android-apk/app-debug.apk"
LOG="qa-screenshots/v3-android-webgl-log.txt"
SCREEN="qa-screenshots/v3-android-emulator.png"
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
  sleep 2
done
# Capture screenshot and log even when GPU context failed; preserve evidence.
adb shell screencap -p /sdcard/godseed-v3-preview.png
adb pull /sdcard/godseed-v3-preview.png "$SCREEN"
test -s "$SCREEN"
if [[ "$found" -ne 1 ]]; then
  echo "FAIL: V3 APK launched but never reported a verified WebGL context" >&2
  cat "$LOG" >&2
  exit 1
fi
adb shell pidof "$PACKAGE" >/dev/null
echo "PASS: isolated V3 APK installed and launched with real Android WebGL context"
