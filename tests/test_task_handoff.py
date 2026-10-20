"""Checks that one chat can retire without corrupting its task or forging success."""
import copy
import datetime as dt
import importlib.util
import io
import json
import tempfile
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("handoff_tool", ROOT / "tools/godseed_handoff.py")
tool = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tool)
SHA = "a" * 40
COORD = "b" * 40

class ChatHandoffTests(unittest.TestCase):
    def setUp(self):
        self.db = tool.read_registry()
        self.db = copy.deepcopy(self.db)
        self.db["tasks"].append({
            "id": "GOV-999", "status": "in_progress", "owner": "RELAY-TEST",
            "work_branch": "feat/gov-999-relay", "depends": [], "evidence": [],
        })
        self.arguments = [
            "write", "--task", "GOV-999", "--actor", "RELAY-TEST",
            "--reason", "context_limit", "--coordination-sha", COORD,
            "--work-branch", "feat/gov-999-relay", "--work-sha", SHA,
            "--summary", "Code is pushed to the recorded SHA, but its integration is unfinished.",
            "--save-notes", "No save schema changes were made.",
            "--file", "tools/godseed_handoff.py",
            "--test", "NOT_RUN: Real Android hardware unavailable in this test.",
            "--next", "Read the full master prompt and then validate all task state transitions.",
            "--risk", "Review the current SHA before modifying gameplay."
        ]

    def captured_write(self, args=None, db=None):
        writes = []
        with patch.object(tool, "read_registry", return_value=db or self.db), \
             patch.object(tool, "atomic_json", side_effect=lambda path, value:writes.append((path, value))), \
             redirect_stdout(io.StringIO()):
            tool.main(args or self.arguments)
        return writes

    def test_retirement_creates_complete_machine_readable_record_without_releasing_task(self):
        before = copy.deepcopy(self.db)
        writes = self.captured_write()
        self.assertEqual(1, len(writes))
        path, value = writes[0]
        self.assertEqual("GOV-999.json", path.name)
        self.assertEqual([], tool.validate_handoff(value, "GOV-999"))
        self.assertEqual("RELAY-TEST", value["retiring_bot"])
        self.assertEqual(SHA, value["work_sha"])
        self.assertEqual(before, self.db, "Handoff itself must not change ownership or status")

    def test_no_work_sha_requires_explicit_unpublished_warning(self):
        without = list(self.arguments)
        i = without.index("--work-sha")
        del without[i:i + 2]
        with patch.object(tool, "read_registry", return_value=self.db), \
             redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            tool.main(without)
        writes = self.captured_write(without + ["--unpublished"])
        self.assertTrue(writes[0][1]["unpublished_changes"])
        self.assertIsNone(writes[0][1]["work_sha"])

    def test_cannot_claim_handoff_for_another_bots_task(self):
        args = list(self.arguments)
        args[args.index("--actor") + 1] = "INTRUDER"
        with patch.object(tool, "read_registry", return_value=self.db), \
             redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            tool.main(args)

    def test_owner_can_handoff_independently_verified_unmerged_task(self):
        """Verification keeps task ownership; it must not prohibit a truthful retirement."""
        db = copy.deepcopy(self.db)
        task = next(t for t in db["tasks"] if t["id"] == "GOV-999")
        task.update(status="verified", evidence=["Independent review at exact source SHA"])
        writes = self.captured_write(db=db)
        self.assertEqual(1, len(writes))
        self.assertEqual("verified", writes[0][1]["last_known_status"])
        self.assertEqual([], tool.validate_handoff(writes[0][1], "GOV-999"))
        self.assertEqual("verified", task["status"], "retirement does not release a verified task")
        self.assertEqual("RELAY-TEST", task["owner"])

    def test_nonexistent_task_rejected(self):
        args = list(self.arguments)
        args[args.index("--task") + 1] = "GOV-998"
        with patch.object(tool, "read_registry", return_value=self.db), \
             redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            tool.main(args)

    def test_released_task_handoff_remains_valid_for_new_chat(self):
        value = self.captured_write()[0][1]
        task = next(t for t in self.db["tasks"] if t["id"] == "GOV-999")
        task.update(status="ready", owner=None, work_branch=None)
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / "GOV-999.json"
            file.write_text(json.dumps(value), encoding="utf-8")
            with patch.object(tool, "read_registry", return_value=self.db), \
                 patch.object(tool, "handoff_file", return_value=file), \
                 redirect_stdout(io.StringIO()) as output:
                tool.main(["check", "--task", "GOV-999"])
            self.assertIn("VALID GOV-999.json | registry: ready", output.getvalue())

    def test_schema_catches_misleading_or_unusable_handoff(self):
        value = self.captured_write()[0][1]
        for key, invalid in [
            ("task_id", "GOV-888"), ("coordination_sha", "not-an-actual-SHA"),
            ("next_actions", []), ("tests", ["Everything works!"]),
            ("starting_documents", []), ("created_utc", "tomorrow")]:
            changed = copy.deepcopy(value)
            changed[key] = invalid
            self.assertTrue(tool.validate_handoff(changed, "GOV-999"), key)

    def test_sensitive_local_path_not_used_as_destination(self):
        with self.assertRaises(ValueError):
            tool.handoff_file("../../secrets")
        with self.assertRaises(ValueError):
            tool.handoff_file("GOV-999/../../secrets")

if __name__ == "__main__":
    unittest.main()
