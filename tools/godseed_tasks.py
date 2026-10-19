#!/usr/bin/env python3
"""GODSEED's single source of truth for task ownership and lifecycle.

Run from repository checkout. Commit BOTH generated files after transitions.
Concurrently working bots must update the coordination branch using optimistic
Git blob SHA checks; a conflict requires refetch/re-evaluate, never force push.
"""
from __future__ import annotations
import argparse
import datetime as dt
import json
import difflib
import os
from pathlib import Path
import re
import tempfile

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "docs/agents/tasks.json"
BOARD = ROOT / "docs/agents/TASK_BOARD.md"
STATUS = {"planned", "ready", "claimed", "in_progress", "blocked", "in_review", "verified", "done", "cancelled"}
EDGES = {
 "planned": {"ready", "blocked", "cancelled"},
 "ready": {"claimed", "blocked", "cancelled"},
 "claimed": {"in_progress", "ready", "blocked"},
 "in_progress": {"in_review", "blocked", "ready"},
 "blocked": {"ready", "cancelled"},
 "in_review": {"verified", "in_progress", "blocked"},
 "verified": {"done", "in_progress"},
 "done": set(),
 "cancelled": set(),
}
PRIORITIES = ("P0", "P1", "P2")
AREA_PREFIX = {
 "governance":"GOV", "interiors":"INT", "world":"WLD", "people":"SIM",
 "civilization":"CIV", "divine":"GOD", "art":"ART", "qa":"QA", "release":"REL",
}
# One discoverable follow-up per delivered source task. Further ideas can
# be proposed to the coordinator without silently multiplying backlog items.

STAGES = ("planned", "ready", "claimed", "in_progress", "blocked", "in_review", "verified", "done", "cancelled")


def load():
    return json.loads(REGISTRY.read_text(encoding="utf-8"))


def validate(db):
    errors = []
    if db.get("schema_version") != 1:
        errors.append("Schema version must be 1")
    tasks = db.get("tasks")
    if not isinstance(tasks, list):
        return ["tasks must be a list"]
    ids = [t.get("id") for t in tasks]
    if len(set(ids)) != len(ids):
        errors.append("Duplicate task IDs")
    byid = {t["id"]: t for t in tasks if isinstance(t.get("id"), str)}
    if "GOV-001" not in byid:
        errors.append("Missing governance task")
    for t in tasks:
        ident = t.get("id", "?")
        if not re.fullmatch(r"[A-Z]{2,4}-\d{3}", ident):
            errors.append(f"{ident}: invalid ID")
        if t.get("status") not in STATUS:
            errors.append(f"{ident}: unknown status")
        if t.get("priority") not in PRIORITIES:
            errors.append(f"{ident}: invalid priority")
        if not t.get("title") or not t.get("acceptance"):
            errors.append(f"{ident}: incomplete task definition")
        deps = t.get("depends")
        if not isinstance(deps, list):
            errors.append(f"{ident}: depends is not a list")
            continue
        if len(set(deps)) != len(deps):
            errors.append(f"{ident}: duplicate dependencies")
        if ident in deps:
            errors.append(f"{ident}: depends on itself")
        for dep in deps:
            if dep not in byid:
                errors.append(f"{ident}: dependency not found: {dep}")
        if t["status"] in {"claimed", "in_progress", "in_review", "verified", "done"}:
            if not t.get("owner") or not t.get("work_branch"):
                errors.append(f"{ident}: status {t['status']} requires owner + work_branch")
        if t["status"] in {"in_review", "verified", "done"} and not t.get("evidence"):
            errors.append(f"{ident}: review and completion require real evidence")
        if t["status"] == "done" and not any("merged" in str(e).lower() for e in t.get("evidence", [])):
            errors.append(f"{ident}: done requires explicit merged evidence")
        if t.get("origin_task"):
            if t["origin_task"] not in byid:
                errors.append(f"{ident}: follow-up origin task missing")
            if not t.get("created_by") or not t.get("new_task_reason"):
                errors.append(f"{ident}: follow-up lacks proposer and justification")
        history = t.get("status_history", [])
        if not isinstance(history, list) or not history or history[-1].get("to") != t["status"]:
            errors.append(f"{ident}: history/status mismatch")
        if history:
            for prev, cur in zip(history, history[1:]):
                if prev["to"] != cur.get("from") or cur.get("to") not in EDGES.get(prev["to"], set()):
                    errors.append(f"{ident}: illegal history transition {prev['to']} -> {cur.get('to')}")
    visiting, visited = set(), set()
    def visit(node):
        if node in visiting:
            errors.append(f"Dependency cycle around {node}")
            return
        if node in visited:
            return
        visiting.add(node)
        for dependency in byid[node].get("depends", []):
            if dependency in byid and dependency not in visiting:
                visit(dependency)
            elif dependency in visiting:
                errors.append(f"Dependency cycle: {node} <-> {dependency}")
        visiting.remove(node)
        visited.add(node)
    for ident in byid:
        visit(ident)
    return errors


def render(db):
    tasks = db["tasks"]
    counts = {status: sum(t["status"] == status for t in tasks) for status in STAGES}
    lines = [
        "# GODSEED — Task Board (generated)",
        "",
        "> **Source of truth:** `docs/agents/tasks.json`. NEVER manually edit this board; regenerate with `python tools/godseed_tasks.py board --write` and commit BOTH files.",
        "> The status is about a TASK, not the percentage of the whole game. `in_review` or a green PR is **not** `done` until integration is merged and accepted.",
        "",
        f"**Tracked work:** {len(tasks)} tasks · " + " · ".join(f"{k}: {v}" for k, v in counts.items()) + ".",
        "",
        "**Coordination branch:** `" + db["coordinator_branch"] + "`  ",
        "**Implementation baseline:** `" + db["implementation_base"] + "` (PR #" + str(db["baseline_pr"]) + ").",
        "",
        "## Confirmed baseline, not outstanding task completion",
        "",
        "- PR #16: autonomous Chapters I–III (narrative vertical slice).",
        "- PR #17: richer living settlements, 8 visible people, relationships and God whispers.",
        "- PR #21: six pixel-square 2×2 building variants and footprint-safe architecture; 82 Node tests and 6 native Android emulator tests passed on PR head. PRs remain **unmerged**.",
        "- PR #20 is an **alternative** experimental society engine; do not merge #20 and #17/#21 into the same runtime.",
        "- **Missing:** real interiors, working entry/exit doors, household jobs at home, true chunked open world, deep BitLife-style generations and physical low-RAM certification.",
        "",
        "## Registered tasks",
        "",
        "| ID | P | Area | State | Owner | Depends on | Definition of done (short) |",
        "|---|---|---|---|---|---|---|",
    ]
    def esc(x):
        return str(x or "—").replace("|", "\\|").replace("\n", " ")
    for t in sorted(tasks, key=lambda t: (PRIORITIES.index(t["priority"]), t["area"], t["id"])):
        issue = f" · [#{t['issue']}](https://github.com/jbob-coder/The-idle-open-world-universe/issues/{t['issue']})" if t.get("issue") else ""
        lines.append(f"| **{t['id']}** | {t['priority']} | {esc(t['area'])} | **{t['status']}** | {esc(t['owner'])} | {esc(', '.join(t['depends']))} | {esc(t['title'])}{issue} |")
    lines += [
        "", "## How bots update states", "",
        "```bash",
        "python tools/godseed_tasks.py validate",
        "python tools/godseed_tasks.py transition INT-001 claimed --expect ready --actor ARCH-01 --branch feat/safe-interiors-contract --note 'Owning the metric / door contract'",
        "python tools/godseed_tasks.py transition INT-001 in_progress --expect claimed --actor ARCH-01 --note 'Reviewing existing simulation and saves'",
        "python tools/godseed_tasks.py transition INT-001 in_review --expect in_progress --actor ARCH-01 --note 'Implementation verified, needs review' --evidence 'PR #NN, commit SHA, CI run URL'",
        "python tools/godseed_tasks.py board --write",
        "```",
        "",
        "Commits updating task status belong on the **coordination branch**, not on main. If another bot already claimed the task, do not overwrite it; consult `docs/agents/TASK_WORKFLOW.md`.",
        "",
        "## Optional new task after delivery", "",
        "After your OWN task reaches `in_review`, `verified` or `done` **with evidence**, you may propose **one** necessary follow-up. The new task is never automatically yours. First verify no equivalent ID/scope exists in the registry, open issues or PRs.",
        "",
        "```bash",
        "python tools/godseed_tasks.py add --after SIM-001 --actor LIFE-01 --area people --priority P1 --title 'Sim occupational fatigue and recuperation' --acceptance 'Measured exhaustion affects job decisions and preserves version 1 saves in seeded tests.' --depends SIM-001 --reason 'Observed repeated work without adequate rest in the submitted acceptance tests.'",
        "python tools/godseed_tasks.py validate",
        "```",
        "",
        "The CLI assigns the next unique ID, checks provenance and exact-title duplicates, and picks `ready` only if prerequisites are verified; otherwise `planned`. It updates `tasks.json` and this generated board together. Commit/push both on the coordination branch. No automatic claiming or implementation of the new task.",
        "",
        "## Hardware and release truth", "",
        "2–3 GB refers to **total physical device RAM**; target app PSS approximately 128–192 MiB with provisional 256 MiB soft limit, unverified. The game remains offline. The previous 1 GB core / up to 5 GB optional content are *disk targets*, not completed content or RAM allocation. Hardware QA = **BLOCKED** until real measurements in issue #13.",
        "",
    ]
    return "\n".join(lines)


def replace_text(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent, delete=False) as f:
            f.write(value)
            temp = f.name
        os.replace(temp, path)
    finally:
        if temp and os.path.exists(temp):
            os.unlink(temp)


def main():
    p = argparse.ArgumentParser(description="Safe, auditable GODSEED task lifecycle")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("validate")
    show = sub.add_parser("board")
    show.add_argument("--write", action="store_true")
    add = sub.add_parser("add", help="Propose one justified follow-up from a delivered task")
    add.add_argument("--after", required=True, help="Your in_review, verified or done source task ID")
    add.add_argument("--actor", required=True, help="Must be the source task owner")
    add.add_argument("--area", required=True, choices=tuple(AREA_PREFIX))
    add.add_argument("--priority", required=True, choices=PRIORITIES)
    add.add_argument("--title", required=True)
    add.add_argument("--acceptance", required=True)
    add.add_argument("--reason", required=True, help="Why this needed work was discovered")
    add.add_argument("--depends", action="append", default=[], help="Real prerequisite ID; repeat for multiples")
    change = sub.add_parser("transition")
    change.add_argument("task_id")
    change.add_argument("to_status", choices=STAGES)
    change.add_argument("--expect", required=True, choices=STAGES)
    change.add_argument("--actor", required=True)
    change.add_argument("--branch")
    change.add_argument("--note", required=True)
    change.add_argument("--evidence", action="append", default=[])
    args = p.parse_args()
    db = load()
    errors = validate(db)
    if errors:
        p.error("Existing task registry invalid:\n- " + "\n- ".join(errors))
    if args.cmd == "validate":
        generated = render(db)
        if not BOARD.exists() or BOARD.read_text(encoding="utf-8") != generated:
            actual = BOARD.read_text(encoding="utf-8") if BOARD.exists() else ""
            diff = "".join(difflib.unified_diff(actual.splitlines(True), generated.splitlines(True), fromfile="committed", tofile="generated"))
            p.error("Task board is stale: run 'board --write' then commit both documents. Diff:\n" + diff[:5000])
        print("PASS: task schema, dependency DAG, status history and generated board match")
        return
    if args.cmd == "board":
        out = render(db)
        if args.write:
            replace_text(BOARD, out)
            print(f"Wrote {BOARD}")
        else:
            print(out)
        return
    if args.cmd == "add":
        source = next((t for t in db["tasks"] if t["id"] == args.after), None)
        if not source:
            p.error("Unknown source task")
        if source.get("owner") != args.actor or source["status"] not in {"in_review", "verified", "done"}:
            p.error("A bot may propose a follow-up only after delivering its OWN task")
        if not source.get("evidence"):
            p.error("The delivered source task needs real PR/test evidence")
        if any(t.get("origin_task") == args.after for t in db["tasks"]):
            p.error("A follow-up already exists for this delivery; ask the coordinator for more")
        title = " ".join(args.title.split())
        acceptance = " ".join(args.acceptance.split())
        reason = " ".join(args.reason.split())
        if not 12 <= len(title) <= 160 or len(acceptance) < 30 or len(reason) < 25:
            p.error("Need a specific title (12-160 chars), measurable acceptance (30+) and reason (25+)")
        normalized = lambda x: " ".join(x.casefold().split())
        if any(normalized(t["title"]) == normalized(title) for t in db["tasks"]):
            p.error("Equivalent task title already exists; inspect registry and open PR/issues for duplicates")
        if len(args.depends) != len(set(args.depends)):
            p.error("Duplicate dependency IDs")
        byid = {t["id"]: t for t in db["tasks"]}
        if any(dep not in byid for dep in args.depends):
            p.error("Unknown dependency: register or verify the prerequisite first")
        prefix = AREA_PREFIX[args.area]
        seq = max([int(t["id"].split("-")[1]) for t in db["tasks"]
                   if t["id"].startswith(prefix + "-")] or [0]) + 1
        if seq > 999:
            p.error("Task ID space exhausted; request a schema upgrade")
        ident = f"{prefix}-{seq:03d}"
        today = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
        ready = all(byid[dep]["status"] in {"verified", "done"} for dep in args.depends)
        task = {"id": ident, "priority": args.priority, "area": args.area, "title": title,
                "status": "ready" if ready else "planned", "owner": None,
                "work_branch": None, "depends": args.depends, "acceptance": acceptance,
                "issue": None, "pr": None, "evidence": [],
                "origin_task": args.after, "created_by": args.actor, "new_task_reason": reason,
                "status_history": [{"date": today, "from": None, "to": "planned",
                    "actor": args.actor, "reason": f"Necessary follow-up to {args.after}: {reason}"}]}
        if ready:
            task["status_history"].append({"date": today, "from": "planned",
                "to": "ready", "actor": args.actor,
                "reason": "All declared prerequisites verified; available for assignment"})
        db["tasks"].append(task)
        errors = validate(db)
        if errors:
            p.error("Proposed new task invalid: " + "; ".join(errors))
        replace_text(REGISTRY, json.dumps(db, indent=2, ensure_ascii=False) + "\n")
        replace_text(BOARD, render(db))
        print(f"{ident}: {task['status']}; proposed by {args.actor} after {args.after}")
        print("Check PRs/issues for semantic duplicates, then commit/push both files on coordination branch.")
        return
    t = next((item for item in db["tasks"] if item["id"] == args.task_id), None)
    if t is None:
        p.error("Unknown task ID")
    if t["status"] != args.expect:
        p.error(f"{args.task_id} currently {t['status']}, not expected {args.expect}; refetch before retry")
    if args.to_status not in EDGES[t["status"]]:
        p.error(f"Illegal transition {t['status']} -> {args.to_status}")
    if args.to_status in {"claimed", "in_progress"} and any(
       next(x for x in db["tasks"] if x["id"] == d)["status"] not in {"verified", "done"}
       for d in t["depends"]
    ):
        p.error("Blocked by dependency tasks not yet verified")
    if t.get("owner") and t["owner"] != args.actor and args.to_status not in {"ready", "blocked", "verified", "done"}:
        p.error(f"Already owned by {t['owner']}; cannot steal a task")
    if args.to_status == "claimed" and any(
        other["id"] != t["id"] and other.get("owner") == args.actor and
        other["status"] in {"claimed", "in_progress", "in_review"}
        for other in db["tasks"]
    ):
        p.error("Bot already owns an active task; finish, block or release it before claiming another")
    if args.to_status == "verified":
        if t.get("owner") == args.actor:
            p.error("Independent reviewer required; owner cannot self-verify")
        if not args.evidence:
            p.error("Verification needs fresh reviewer evidence for the exact commit/CI")
    if args.to_status in {"in_review", "verified", "done"} and not (t["evidence"] or args.evidence):
        p.error("Need tangible evidence: PR, exact commit SHA and CI run")
    if args.to_status == "done" and args.actor not in {"OWNER", "INTEGRATOR"}:
        p.error("Only owner/integrator may mark done after verified merge")
    if args.to_status == "done" and not any("merged" in e.lower() for e in t["evidence"] + args.evidence):
        p.error("Done requires merged PR evidence")
    if args.to_status in {"claimed", "in_progress", "in_review", "verified", "done"}:
        # Verification and merge are distinct roles: never overwrite the
        # task owner's identity when someone else reviews or integrates it.
        if args.to_status not in {"verified", "done"}:
            t["owner"] = args.actor
        t["work_branch"] = args.branch or t.get("work_branch")
        if args.to_status == "verified":
            t["verified_by"] = args.actor
        if args.to_status == "done":
            t["integrated_by"] = args.actor
        if not t["work_branch"]:
            p.error("Claim must identify work branch")
    if args.to_status == "ready":
        t["owner"] = None
        t["work_branch"] = None
    original = t["status"]
    t["status"] = args.to_status
    t["evidence"].extend(args.evidence)
    t["status_history"].append({
      "date": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
      "from": original, "to": args.to_status, "actor": args.actor,
      "reason": args.note,
    })
    errors = validate(db)
    if errors:
        p.error("Proposed change invalid: " + "; ".join(errors))
    replace_text(REGISTRY, json.dumps(db, indent=2, ensure_ascii=False) + "\n")
    replace_text(BOARD, render(db))
    print(f"{args.task_id}: {original} -> {args.to_status}, actor {args.actor}")
    print("Commit docs/agents/tasks.json and docs/agents/TASK_BOARD.md together.")


if __name__ == "__main__":
    main()
