"""Regression suite for bot task ownership and machine-readable status."""
import copy
import importlib.util
from pathlib import Path
import unittest
import json
from unittest.mock import patch
import io
from contextlib import redirect_stderr, redirect_stdout

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


    def test_independent_reviewer_keeps_original_owner(self):
        current=copy.deepcopy(self.db)
        t=next(t for t in current["tasks"] if t["id"]=="INT-001")
        self.assertEqual(t["status"],"in_review")
        self.assertEqual(t["owner"],"DOORKEEPER")
        writes=[]
        with patch.object(bot,"load",return_value=current), \
             patch.object(bot,"replace_text",side_effect=lambda path,value:writes.append((path,value))), \
             patch("sys.argv",["godseed_tasks.py","transition","INT-001","verified",
                 "--expect","in_review","--actor","REVIEW-01","--note","CI and spec reviewed",
                 "--evidence","PR #22; SHA 123456; CI https://github.com/example/actions/runs/100"]), \
             redirect_stdout(io.StringIO()):
            bot.main()
        updated=json.loads(next(value for path,value in writes if path==bot.REGISTRY))
        item=next(x for x in updated["tasks"] if x["id"]=="INT-001")
        self.assertEqual(item["status"],"verified")
        self.assertEqual(item["owner"],"DOORKEEPER")
        self.assertEqual(item["verified_by"],"REVIEW-01")
        self.assertEqual(item["status_history"][-1]["actor"],"REVIEW-01")

    def test_owner_cannot_self_verify(self):
        current=copy.deepcopy(self.db)
        with patch.object(bot,"load",return_value=current), \
             patch("sys.argv",["godseed_tasks.py","transition","INT-001","verified",
                 "--expect","in_review","--actor","DOORKEEPER","--note","self-review",
                 "--evidence","PR #22; CI passed"]), \
             redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit):
                bot.main()

    def test_integrator_does_not_erase_implementation_owner(self):
        current=copy.deepcopy(self.db)
        task=next(x for x in current["tasks"] if x["id"]=="INT-001")
        task["status"]="verified"
        task["verified_by"]="REVIEW-01"
        task["status_history"].append({
            "date":"2026-10-18","from":"in_review","to":"verified",
            "actor":"REVIEW-01","reason":"independent review"})
        writes=[]
        with patch.object(bot,"load",return_value=current), \
             patch.object(bot,"replace_text",side_effect=lambda path,value:writes.append((path,value))), \
             patch("sys.argv",["godseed_tasks.py","transition","INT-001","done",
                 "--expect","verified","--actor","INTEGRATOR","--note","Merged and accepted",
                 "--evidence","merged PR #22 into approved integration branch with CI"]), \
             redirect_stdout(io.StringIO()):
            bot.main()
        updated=json.loads(next(value for path,value in writes if path==bot.REGISTRY))
        task=next(x for x in updated["tasks"] if x["id"]=="INT-001")
        self.assertEqual(task["owner"],"DOORKEEPER")
        self.assertEqual(task["integrated_by"],"INTEGRATOR")
        self.assertEqual(task["status"],"done")

    def test_one_bot_cannot_claim_multiple_active_tasks(self):
        current=copy.deepcopy(self.db)
        # Synthetic isolated ready tasks; real agents may claim the actual
        # ready IDs at any time, which must not make this regression flaky.
        for suffix in ("901","902"):
            t=copy.deepcopy(next(x for x in current["tasks"] if x["id"]=="GOV-001"))
            t.update(id="GOV-"+suffix,status="ready",owner=None,work_branch=None,depends=[],evidence=[])
            t["status_history"]=[
                {"date":"2026-10-18","from":None,"to":"planned","actor":"TEST","reason":"fixture"},
                {"date":"2026-10-18","from":"planned","to":"ready","actor":"TEST","reason":"fixture"}]
            current["tasks"].append(t)
        active=next(t for t in current["tasks"] if t["id"]=="GOV-901")
        active.update(status="in_progress",owner="ACTIVE-BOT",work_branch="feat/one")
        active["status_history"].extend([
            {"date":"2026-10-18","from":"ready","to":"claimed","actor":"ACTIVE-BOT","reason":"fixture"},
            {"date":"2026-10-18","from":"claimed","to":"in_progress","actor":"ACTIVE-BOT","reason":"fixture"}])
        with patch.object(bot,"load",return_value=current), \
             patch("sys.argv",["godseed_tasks.py","transition","GOV-902","claimed",
                 "--expect","ready","--actor","ACTIVE-BOT","--branch","feat/two",
                 "--note","second concurrent task"]), \
             redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit):
                bot.main()


if __name__=="__main__":
    unittest.main()
