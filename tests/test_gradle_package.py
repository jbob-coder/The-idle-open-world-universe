"""Validate the separate compiled Android host; does not install or run it."""
from pathlib import Path
import argparse
import hashlib
import json
import os
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--apk', type=Path, default=ROOT / 'android/gradle/app/build/outputs/apk/debug/app-debug.apk')
parser.add_argument('--report', type=Path)
args = parser.parse_args()
sdk = Path(os.environ.get('ANDROID_HOME', os.environ.get('ANDROID_SDK_ROOT', '')))
build_tools = sdk / 'build-tools/35.0.0'
assert build_tools.is_dir(), 'Set ANDROID_HOME to an SDK with build-tools 35.0.0'

with zipfile.ZipFile(args.apk) as apk:
    assert apk.testzip() is None
    assert apk.read('assets/index.html') == (ROOT / 'GODSEED-Play.html').read_bytes()
    dex = b''.join(apk.read(n) for n in apk.namelist() if n.endswith('.dex'))
    for name in (b'MainActivity', b'PackBridge', b'PackStore', b'StoragePolicy', b'PackManifest', b'GodseedNativePacks', b'file:///android_asset/index.html'):
        assert name in dex, name
    assert not any(n.startswith('lib/') for n in apk.namelist())
    assert not any(n.endswith('.godseed.json') for n in apk.namelist()), 'Optional lore must not be installed implicitly'

def run(*arguments):
    return subprocess.check_output([str(build_tools / arguments[0]), *arguments[1:]], text=True)

badging = run('aapt', 'dump', 'badging', str(args.apk))
assert "package: name='io.godseed.one' versionCode='6'" in badging
assert "sdkVersion:'26'" in badging and "targetSdkVersion:'28'" in badging
assert 'uses-permission:' not in badging, 'No network or broad storage permissions are needed'
signature = run('apksigner', 'verify', '--verbose', '--print-certs', str(args.apk))
assert 'Verified using v2 scheme (APK Signature Scheme v2): true' in signature
report = {
    'artifact': args.apk.name,
    'bytes': args.apk.stat().st_size,
    'sha256': hashlib.sha256(args.apk.read_bytes()).hexdigest(),
    'embeddedHtmlSha256': hashlib.sha256((ROOT / 'GODSEED-Play.html').read_bytes()).hexdigest(),
    'applicationId': 'io.godseed.one', 'versionCode': 6,
    'minSdk': 26, 'targetSdk': 28,
    'permissions': [], 'signature': 'debug; apksigner verification passed (including v2)',
    'deviceInstallLaunchLifecycleStorage': 'NOT VERIFIED',
    'physicalAndroidRamFps': 'NOT VERIFIED'
}
if args.report:
    args.report.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
print('PASS compiled host, exact offline HTML, no permissions, debug APK signature. Device execution NOT VERIFIED.')
