# GODSEED V3 — isolated experimental APK

The V3 WebGL HTML is bundled in a separate Android application, **io.godseed.v3preview**, not the legacy io.godseed.one package. It has its own godseed-v3-prototype-v1 save key and no INTERNET permission.

Build with: python build_v3.py; python android/build_v3_preview_apk.py; python tests/test_v3_android_package.py.

Result: dist/GODSEED-V3-preview.apk, a minimal WebView launcher with hardware acceleration, exact standalone offline HTML, and a JSON SHA256 evidence manifest. This uses the established local DEX/binary-AndroidManifest compiler rather than changing the legacy Gradle app.

**Important:** this is an experimental JAR-v1 signed debug artifact with a *temporary key that changes per build*. It does **not** support guaranteed in-place upgrade or save preservation across installations. A stable release signer must be kept securely by the owner; do not commit it. APK structural verification and Chromium WebGL success are **not** Android physical install, GPU, performance, save-on-exit or Play Store certification. The original Android application and its saves are untouched.
