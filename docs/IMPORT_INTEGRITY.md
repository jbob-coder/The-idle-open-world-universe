# Import inventory and provenance

Source: GODSEED v0.1 prototype produced on 2026-10-17 in this ChatGPT session and imported into `jbob-coder/The-idle-open-world-universe`.

The repository contains all useful source, docs, screenshots, the standalone HTML and debug APK. Generated `classes.dex`, compiled manifest and unsigned APK are reproducible from `android/build_apk.py` and intentionally excluded. The local debug `.jks` key is EXCLUDED due to public-source security. The previously generated local developer ZIP included that demo key, so **do not reuse its key as a trusted identity**.

To preserve a current-device save across a future signer change, export backup JSON as text and restore it after installing the newly signed app. Confirm device-specific import/export before deleting any app data.

The binary debug APK in this repository is for evaluation only; its SHA-256 is recorded in `dist/manifest.json` and should match the commit blob. APK header/signature checks cannot prove it will install or function on Android. A physical hardware acceptance test is required.
