# Origin and provenance of new GODSEED art

Four original procedural starter PNG atlases were produced specifically for GODSEED using `scripts/generate_starter_assets.mjs` and the original `assets/palettes/medieval-fantasy.json`. They are not third-party or copyrighted franchise sprite sheets. The three new `godseed-*.svg` pixel-square references are original concept scenes, **not running Android screenshots**.

The repository owner controls final licensing. Any future external asset must declare exact creator, source URL, license and redistribution terms before inclusion. No third-party font is part of this handoff.

Rebuild via `node scripts/generate_starter_assets.mjs`; check via `node scripts/validate_asset_manifest.mjs` and `git diff --exit-code -- assets/generated/`.
