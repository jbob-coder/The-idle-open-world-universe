#!/usr/bin/env python3
"""Generate a SMALL, offline GODSEED lore pack for the native Gradle host.

The starter format supports only JSON lore. It is NOT a way to reserve 5 GB.
Uses the standard library and reproducible ZIP member timestamps/order.
"""
from pathlib import Path
import argparse
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
EXAMPLE = ROOT / "assets/packs/mossveil-sample.json"


def encode_pack(contents: dict) -> tuple[bytes, bytes]:
    lore_bytes = (json.dumps(contents, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + "\n").encode("utf-8")
    manifest = {
        "schema_version": 1,
        "pack_id": "mossveil_lore_sample",
        "game_min_version": 1,
        "content_type": "lore",
        "optional": True,
        "installed_bytes": len(lore_bytes),
        "sha256": hashlib.sha256(lore_bytes).hexdigest(),
        "dependencies": [],
    }
    manifest_bytes = (json.dumps(manifest, separators=(",", ":"), sort_keys=True) + "\n").encode("utf-8")
    return manifest_bytes, lore_bytes


def build_pack(output: Path) -> Path:
    import io
    manifest, lore = encode_pack(json.loads(EXAMPLE.read_text(encoding="utf-8")))
    if len(lore) > 2 * 1024 * 1024:
        raise ValueError("Lore pack too large")
    b = io.BytesIO()
    with zipfile.ZipFile(b, "w") as z:
        for name, content in (("manifest.json", manifest), ("lore.json", lore)):
            info = zipfile.ZipInfo(name, (2020, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o600 << 16
            z.writestr(info, content)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(b.getvalue())
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create original GODSEED offline lore example")
    parser.add_argument("output", nargs="?", type=Path, default=ROOT / "dist/mossveil-sample.gspack")
    out = build_pack(parser.parse_args().output)
    print(f"Generated {out}: {out.stat().st_size} bytes (optional, no network)")
