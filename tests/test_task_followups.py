"""Follow-up task registration safety tests."""
import copy
import importlib.util
import io
import json
from contextlib import redirect_stdout, redirect_stderr
from pathlib import Path
from unittest import TestCase
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("taskcli", ROOT / "tools/godseed_tasks.py")
cli = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cli)

class Followups(TestCase):
    def setUp(self):
        self.db = cli.load()
        self.common = ["godseed_tasks.py", "add", "--after", "INT-001",
            "--actor", "DOORKEEPER", "--area", "interiors", "--priority", "P1",
            "--title", "Give every household resident a safe bed",
            "--acceptance", "Deterministic tests confirm sleep, collision and saves for residents.",
            "--reason", "Interior playtesting identified missing sleeping capacity and household rules."]

    def execute(self, db, arguments):
        writes = []
        with patch.object(cli, "load", return_value=db), patch.object(
            cli, "replace_text", side_effect=lambda path, value: writes.append((path, value))
        ), patch("sys.argv", arguments), redirect_stdout(io.StringIO()):
            cli.main()
        loaded = json.loads(next(value for path, value in writes if path == cli.REGISTRY))
        self.assertEqual(next(value for path, value in writes if path == cli.BOARD), cli.render(loaded))
        return loaded

    def test_followup_waits_for_unverified_dependency(self):
        nextdb = self.execute(copy.deepcopy(self.db), self.common + ["--depends", "INT-001"])
        added = next(t for t in nextdb["tasks"] if t.get("origin_task") == "INT-001")
        self.assertEqual("INT-011", added["id"])
        self.assertEqual("planned", added["status"])
        self.assertEqual(None, added["owner"])
        self.assertEqual("DOORKEEPER", added["created_by"])
        self.assertEqual([], cli.validate(nextdb))

    def test_followup_without_dependencies_is_ready_but_unclaimed(self):
        nextdb = self.execute(copy.deepcopy(self.db), self.common)
        added = next(t for t in nextdb["tasks"] if t.get("origin_task") == "INT-001")
        self.assertEqual("ready", added["status"])
        self.assertIsNone(added["work_branch"])

    def test_other_bot_cannot_create_source_followup(self):
        args = list(self.common)
        args[args.index("--actor") + 1] = "OTHER-BOT"
        with patch.object(cli, "load", return_value=self.db), patch("sys.argv", args):
            with redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
                cli.main()

    def test_unfinished_source_cannot_add_followup(self):
        db = copy.deepcopy(self.db)
        source = next(t for t in db["tasks"] if t["id"] == "INT-001")
        source["status"] = "in_progress"
        source["status_history"].pop()
        with patch.object(cli, "load", return_value=db), patch("sys.argv", self.common):
            with redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
                cli.main()

    def test_one_followup_per_source_delivery(self):
        db = self.execute(copy.deepcopy(self.db), self.common)
        with patch.object(cli, "load", return_value=db), patch("sys.argv", self.common):
            with redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
                cli.main()
