# Separate conventional WebView experiment

This project supplements the SDK-free builder. See [storage and compatibility notes](../../docs/STORAGE_IMPLEMENTATION.md) before switching APKs.

Prerequisites: JDK 17 or newer, Android SDK platform 35 and build-tools 35.0.0. Set `ANDROID_HOME` or create an ignored `local.properties` with `sdk.dir`. The Gradle 8.13 wrapper pins the distribution SHA256. Build dependencies require network access on first build; the game does not.

From the repository root:

```sh
python build.py
android/gradle/gradlew -p android/gradle --no-daemon --max-workers=2 testDebugUnitTest assembleDebug
python tests/test_gradle_package.py
```

Output: `android/gradle/app/build/outputs/apk/debug/app-debug.apk`. For the checked-in experimental artifact:

```sh
cp android/gradle/app/build/outputs/apk/debug/app-debug.apk dist/GODSEED-v1-gradle-experimental.apk
python tests/test_gradle_package.py --apk dist/GODSEED-v1-gradle-experimental.apk --report dist/gradle-manifest.json
```

The build uses AGP 8.9.2, compile SDK 35, min SDK 26 and target SDK 28. Debug keys stay outside Git. A successful build and signature check do not prove that an Android device installed or executed the application. Device testing is NOT VERIFIED.
