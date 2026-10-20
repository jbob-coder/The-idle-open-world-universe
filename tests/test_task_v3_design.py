"""Documentation contract regression: V3 scope must stay auditable and explicitly unimplemented."""
import json
import re
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
DESIGN=ROOT/"docs/design"
DOCS=[
    "README.md","GODSEED_V3_VISION_AND_PLAYER_LOOP.md","GOD_VIEW_AND_DIVINE_POWERS_V3.md",
    "SIM_INTELLIGENCE_PERSONALITY_FAMILIES_V3.md","KINGDOMS_COLONIES_DYNASTIES_V3.md",
    "ANDROID_WORLD_SCALE_SAVE_V3.md","IMPLEMENTATION_TRACK_V3.md",
]
NEW_IDS=["GOV-004","GOD-006","GOD-007","SIM-011","SIM-012","SIM-013",
         "CIV-009","CIV-010","ART-007"]

class V3DesignContract(unittest.TestCase):
    def setUp(self):
        self.db=json.loads((ROOT/"docs/agents/tasks.json").read_text(encoding="utf-8"))
        self.content={n:(DESIGN/n).read_text(encoding="utf-8") for n in DOCS}

    def test_every_design_doc_exists_and_index_points_to_it(self):
        for doc in DOCS[1:]:
            self.assertIn(doc,self.content["README.md"])
            self.assertGreater(len(self.content[doc]),2800)

    def test_all_new_tasks_are_registered_and_have_testable_acceptance(self):
        tasks={t["id"]:t for t in self.db["tasks"]}
        for task_id in NEW_IDS:
            self.assertIn(task_id,tasks)
            self.assertGreater(len(tasks[task_id]["acceptance"]),50)
            self.assertIn(task_id,self.content["IMPLEMENTATION_TRACK_V3.md"])
            for dep in tasks[task_id]["depends"]:
                self.assertIn(dep,tasks)
        self.assertEqual(len(tasks),len(set(tasks)))

    def test_no_invented_completion_claim_in_vision(self):
        text=self.content["GODSEED_V3_VISION_AND_PLAYER_LOOP.md"]
        for concept in ["64×48","reinos","familia","offline","observa","no"]:
            self.assertIn(concept.lower(),text.lower())
        self.assertRegex(text,r"NO contenido jugable|NO es el juego V3")
        self.assertIn("PR #32",text)
        self.assertIn("PR #21",text)

    def test_individual_kingdom_save_and_ui_contracts_present(self):
        data="\n".join(self.content.values()).lower()
        for topic in ["inteligencia","curiosidad","personalidad","herencia",
                      "colonia","rey","sucesión","diplomacia","lod","save",
                      "casa","mundo","dios","revisión"]:
            self.assertIn(topic,data,topic)

    def test_local_links_refer_to_real_files(self):
        pattern=re.compile(r"(?<!!)\[[^\]]+\]\(([^)]+)\)")
        for name,content in self.content.items():
            for dest in pattern.findall(content):
                if dest.startswith(("http:","https:","#")):continue
                candidate=(DESIGN/dest.split("#")[0]).resolve()
                self.assertTrue(candidate.is_file(),name+" has broken "+dest)

if __name__=="__main__":
    unittest.main()
