#!/usr/bin/env bash
set -euo pipefail
APK="android/gradle/app/build/outputs/apk/debug/app-debug.apk"
TEST_APK="android/gradle/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk"
mkdir -p qa-screenshots
test -s "$APK"
test -s "$TEST_APK"
adb install -r "$APK"
adb install -r "$TEST_APK"
adb shell pm list packages | grep -q 'package:io.godseed.one'
set +e
adb shell am instrument -w -r io.godseed.one.test/androidx.test.runner.AndroidJUnitRunner | tee qa-screenshots/android-emulator-instrumentation.txt
res=${PIPESTATUS[0]}
set -e
# Capture WebView console/crash details even when instrumentation fails.
# Otherwise the artifact contains only an assertion and the real JS fault is lost.
adb logcat -d -t 1800 > qa-screenshots/android-emulator-logcat.txt || true
if [ "$res" -ne 0 ]; then
  echo 'Native instrumentation failed; WebView/logcat diagnostics:'
  grep -Ei 'chromium|CONSOLE|Uncaught|SyntaxError|Godseed|E/WebView' qa-screenshots/android-emulator-logcat.txt | tail -100 || true
  exit "$res"
fi
grep -q 'OK (7 tests)' qa-screenshots/android-emulator-instrumentation.txt
adb shell am force-stop io.godseed.one || true
adb shell am start -n io.godseed.one/.MainActivity
sleep 12
adb exec-out screencap -p > qa-screenshots/android-emulator-skyworld.png
adb shell dumpsys meminfo io.godseed.one > qa-screenshots/android-emulator-memory.txt
adb logcat -d -t 1200 > qa-screenshots/android-emulator-logcat.txt
test -s qa-screenshots/android-emulator-skyworld.png
test -s qa-screenshots/android-emulator-memory.txt
if grep -F 'FATAL EXCEPTION' qa-screenshots/android-emulator-logcat.txt | grep -q 'io.godseed.one'; then
  echo "Detected app crash in emulator logcat"
  exit 1
fi
echo "PASS: Android emulator installed and launched APK; 7 instrumentation tests; screenshot captured"
echo "EMULATOR ONLY: physical 2 GB/3 GB Android phone QA remains NOT VERIFIED"
