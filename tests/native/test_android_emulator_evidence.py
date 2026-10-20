"""QA-003: fail closed when emulator evidence is incomplete or misattributed."""
import hashlib
from pathlib import Path
import tempfile
import unittest

from android_emulator_evidence import make_report


class EvidenceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.files = [root / name for name in (
            "app.apk", "app-test.apk", "screenshot.png", "instrumentation.txt",
            "meminfo.txt", "logcat.txt"
        )]
        for path in self.files:
            path.write_bytes(b"evidence bytes")
        self.files[2].write_bytes(b"\x89PNG\r\n\x1a\n" + b"test-pixels")
        self.files[3].write_text("INSTRUMENTATION_STATUS: numtests=7\nOK (7 tests)\n")
        self.source = "a" * 40
        self.checkout = "b" * 40

    def report(self, **kwargs):
        params = dict(source_sha=self.source, checkout_sha=self.checkout,
                      sdk="29", run_id="39100000000")
        params.update(kwargs)
        return make_report(params["source_sha"], params["checkout_sha"],
                           params["sdk"], *self.files, params["run_id"])

    def test_manifest_binds_distinct_source_and_tested_shas_to_exact_files(self):
        result = self.report()
        self.assertEqual(result["source_head_sha"], self.source)
        self.assertEqual(result["tested_checkout_sha"], self.checkout)
        self.assertEqual(result["instrumentation_passed"], 7)
        self.assertEqual(result["app_apk_sha256"],
                         hashlib.sha256(b"evidence bytes").hexdigest())
        self.assertEqual(result["github_run_id"], "39100000000")
        self.assertFalse(result["physical_low_ram_verified"])

    def test_rejects_wrong_sha_api_and_incomplete_native_test_run(self):
        for bad in (dict(source_sha="1"), dict(checkout_sha="g" * 40),
                    dict(sdk="35")):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                self.report(**bad)
        self.files[3].write_text("OK (6 tests)\n")
        with self.assertRaisesRegex(ValueError, "seven tests"):
            self.report()
        self.files[3].write_text("OK (7 tests)\nINSTRUMENTATION_FAILED")
        with self.assertRaisesRegex(ValueError, "failure"):
            self.report()

    def test_rejects_missing_empty_or_fake_captures(self):
        self.files[2].write_bytes(b"not-a-png")
        with self.assertRaisesRegex(ValueError, "not a PNG"):
            self.report()
        self.files[2].write_bytes(b"")
        with self.assertRaisesRegex(ValueError, "Missing or empty"):
            self.report()
        self.files[2].write_bytes(b"\x89PNG\r\n\x1a\n" + b"pixels")
        self.files[1].unlink()
        with self.assertRaisesRegex(ValueError, "Missing or empty"):
            self.report()


if __name__ == "__main__":
    unittest.main()
