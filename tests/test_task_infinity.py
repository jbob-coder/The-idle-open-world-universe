"""Regression of ♾️ next-task selection and independent review backlog."""
import copy
import importlib.util
import io
import json
from pathlib import Path
import unittest
from contextlib import redirect_stdout, redirect_stderr
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("godseed_infinity", ROOT / "tools/godseed_tasks.py")
tasks = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tasks)

class InfinityCycleTests(unittest.TestCase):
    def setUp(self):
        self.db=tasks.load()
        original=next(x for x in self.db["tasks"] if x["id"]=="GOV-001")
        for code in ("GOV-951","GOV-952","GOV-953"):
            t=copy.deepcopy(original)
            t.update(id=code,title="Synthetic infinity "+code,status="ready",
                     owner=None,work_branch=None,depends=[],evidence=[],pr=None)
            t["status_history"]=[
                {"date":"2026-10-18","from":None,"to":"planned","actor":"TEST","reason":"fixture"},
                {"date":"2026-10-18","from":"planned","to":"ready","actor":"TEST","reason":"fixture"}]
            self.db["tasks"].append(t)

    def mark_review(self, code, actor="CYCLE-BOT"):
        t=next(x for x in self.db["tasks"] if x["id"]==code)
        t.update(status="in_review",owner=actor,work_branch="feat/"+code,
                 evidence=["PR #9999; exact SHA abcdef123; CI https://github.com/example/actions/runs/9999"])
        t["status_history"] += [
            {"date":"2026-10-18","from":"ready","to":"claimed","actor":actor,"reason":"fixture"},
            {"date":"2026-10-18","from":"claimed","to":"in_progress","actor":actor,"reason":"fixture"},
            {"date":"2026-10-18","from":"in_progress","to":"in_review","actor":actor,"reason":"fixture"}]

    def next_claim(self):
        writes=[]
        argv=["godseed_tasks.py","transition","GOV-953","claimed","--expect","ready",
              "--actor","CYCLE-BOT","--branch","feat/GOV-953","--note","new independent loop cycle"]
        with patch.object(tasks,"load",return_value=self.db), \
             patch.object(tasks,"replace_text",side_effect=lambda p,v:writes.append((p,v))), \
             patch("sys.argv",argv),redirect_stdout(io.StringIO()):
            tasks.main()
        output=json.loads(next(v for p,v in writes if p==tasks.REGISTRY))
        self.assertEqual([],tasks.validate(output))
        self.assertEqual(next(v for p,v in writes if p==tasks.BOARD),tasks.render(output))
        return output

    def test_can_start_next_claim_with_one_handed_off_review(self):
        self.mark_review("GOV-951")
        updated=self.next_claim()
        claimed=next(t for t in updated["tasks"] if t["id"]=="GOV-953")
        self.assertEqual("claimed",claimed["status"])
        self.assertEqual("CYCLE-BOT",claimed["owner"])
        prior=next(t for t in updated["tasks"] if t["id"]=="GOV-951")
        self.assertEqual("in_review",prior["status"])
        self.assertEqual("CYCLE-BOT",prior["owner"])

    def test_review_backlog_of_two_stops_infinite_auto_claims(self):
        self.mark_review("GOV-951")
        self.mark_review("GOV-952")
        argv=["godseed_tasks.py","transition","GOV-953","claimed","--expect","ready",
              "--actor","CYCLE-BOT","--branch","feat/GOV-953","--note","too many reviews"]
        with patch.object(tasks,"load",return_value=self.db),patch("sys.argv",argv), \
             redirect_stderr(io.StringIO()),self.assertRaises(SystemExit):
            tasks.main()

    def test_other_bot_review_does_not_block_this_bot(self):
        self.mark_review("GOV-951",actor="ANOTHER-BOT")
        self.mark_review("GOV-952",actor="ANOTHER-BOT")
        updated=self.next_claim()
        self.assertEqual(next(t for t in updated["tasks"] if t["id"]=="GOV-953")["status"],"claimed")

if __name__=="__main__":
    unittest.main()
