"""Structural checks for GODSEED V3 causal QA acceptance; not gameplay certification."""
import re
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / "docs/qa/GODSEED_V3_CAUSAL_ACCEPTANCE.md"
DATA = ROOT / "docs/agents/tasks.json"
CASE_IDS = {f"VAC-{i:02d}" for i in range(1, 15)}

class CausalAcceptanceDocumentationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.text = QA.read_text(encoding="utf-8")
        cls.tasks = {task["id"] for task in json.loads(DATA.read_text(encoding="utf-8"))["tasks"]}

    def test_all_fourteen_cross_domain_scenarios_are_documented_once_in_matrix(self):
        section = self.text.split("## 2. Matriz de situaciones")[1].split("## 3.")[0]
        labels = re.findall(r"\*\*(VAC-\d\d)\*\*", section)
        self.assertEqual(CASE_IDS, set(labels))
        self.assertEqual(14, len(labels), "Matrix must not duplicate or silently drop acceptance cases")

    def test_causal_simulation_domains_and_performance_are_explicit(self):
        for marker in [
            "NOT_IMPLEMENTED", "PASS_EMULATED", "PASS_PHYSICAL",
            "SIM-011", "SIM-012", "SIM-013", "GOD-006", "CIV-009",
            "CIV-010", "ART-007", "QA-004", "sourceEventId", "LOD",
            "consumo", "balanceFinal", "inteligencia", "personalidad",
            "familia", "colonia", "reino", "save",
        ]:
            self.assertIn(marker.lower(), self.text.lower(), marker)

    def test_every_relative_markdown_reference_resolves_within_repository(self):
        links = re.findall(r"\]\((\.\./[^)#]+)\)", self.text)
        self.assertGreaterEqual(len(links), 7)
        for link in links:
            target = (QA.parent / link).resolve()
            self.assertTrue(target.is_relative_to(ROOT.resolve()), link)
            self.assertTrue(target.is_file(), "Broken local document reference: " + link)

    def test_no_claim_that_design_means_runtime_feature_is_complete(self):
        opening = self.text[:1800].lower()
        self.assertIn("no simulación implementada", opening)
        self.assertIn("no nuevos ids del tablero", self.text.lower())
        for task_id in ("GOD-006", "SIM-011", "SIM-012", "SIM-013", "CIV-009", "CIV-010"):
            self.assertIn(task_id, self.tasks, "Reference actual task registry ID, not invented work")

if __name__ == "__main__":
    unittest.main()
