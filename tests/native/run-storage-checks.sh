#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
javac -d "$WORK" \
    android/gradle/app/src/main/java/io/godseed/one/StorageQuota.java \
    tests/native/StorageQuotaChecks.java
java -cp "$WORK" io.godseed.one.StorageQuotaChecks
python3 tests/native/test_lore_pack_generator.py
