"""Regression suite for bot task ownership and machine-readable status."""
import copy
import importlib.util
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("godseed_tasks",ROOT/"tools/godseed_tasks.py")
bot=importlib.util.module_from_spec(spec)
spec.loader.exec_module(bot)


class RegistryTests(unittest.TestCase):
    def setUp(self):
        self.db=bot.load()

    def test_registered_board_and_task_dag_are_valid(self):
        self.assertEqual([],bot.validate(self.db))
        self.assertEqual(bot.BOARD.read_text(encoding="utf-8"),bot.render(self.db))
        self.assertGreaterEqual(len(self.db["tasks"]),50)

    def test_no_two_bots_own_a_task(self):
        for t in self.db["tasks"]:
            if t["status"] in {"claimed","in_progress","in_review","verified","done"}:
                self.assertTrue(t["owner"] and t["work_branch"])
            self.assertEqual(t["status"],t["status_history"][-1]["to"])

    def test_prevent_duplicate_ids(self):
        bad=copy.deepcopy(self.db)
        bad["tasks"].append(copy.deepcopy(bad["tasks"][0]))
        self.assertTrue(any("Duplicate task" in e for e in bot.validate(bad)))

    def test_prevent_dependency_cycles(self):
        bad=copy.deepcopy(self.db)
        first=next(t for t in bad["tasks"] if t["id"]=="INT-001")
        second=next(t for t in bad["tasks"] if t["id"]=="INT-003")
        first["depends"]=["INT-003"]
        self.assertTrue(any("cycle" in e.lower() for e in bot.validate(bad)))

    def test_block_fake_verification_without_real_evidence(self):
        bad=copy.deepcopy(self.db)
        t=next(t for t in bad["tasks"] if t["id"]=="INT-001")
        t.update(status="done",owner="BOT-X",work_branch="feat/fake",evidence=[])
        t["status_history"].append({"from":t["status_history"][-1]["to"],"to":"done","date":"2026-10-18","actor":"BOT-X","reason":"fake"})
        self.assertTrue(any("evidence" in e.lower() or "illegal" in e.lower() for e in bot.validate(bad)))

    def test_no_unverified_physical_release_claim(self):
        hardware=next(t for t in self.db["tasks"] if t["id"]=="QA-004")
        self.assertEqual("blocked",hardware["status"])
        self.assertEqual(13,hardware["issue"])
        self.assertNotIn("done",[t["status"] for t in self.db["tasks"] if t["area"]=="release"])


if __name__=="__main__":
    unittest.main()
