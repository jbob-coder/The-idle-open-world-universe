"""No-Android checks for the deterministic, offline sample .gspack manifest."""
from pathlib import Path
import hashlib
import json
import tempfile
import zipfile

from make_sample_lore_pack import build_pack

with tempfile.TemporaryDirectory() as folder:
    first = build_pack(Path(folder) / "first.gspack")
    second = build_pack(Path(folder) / "second.gspack")
    assert first.read_bytes() == second.read_bytes(), "ZIP must be deterministic"
    assert first.stat().st_size < 8 * 1024 * 1024
    with zipfile.ZipFile(first) as z:
        assert z.namelist() == ["manifest.json", "lore.json"]
        meta = json.loads(z.read("manifest.json"))
        contents = z.read("lore.json")
        lore = json.loads(contents)
        assert meta["schema_version"] == 1
        assert meta["game_min_version"] == 1
        assert meta["optional"] is True
        assert meta["content_type"] == "lore"
        assert meta["installed_bytes"] == len(contents)
        assert meta["sha256"] == hashlib.sha256(contents).hexdigest()
        assert meta["pack_id"] == "mossveil_lore_sample"
        assert all(entry["region_id"] in ["R03", "R06"] for entry in lore["entries"])
print("PASS deterministic offline .gspack manifest/sha256/region compatibility")
