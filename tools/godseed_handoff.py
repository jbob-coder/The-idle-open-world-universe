#!/usr/bin/env python3
"""Structured, Git-backed GODSEED chat retirement handoffs.

This command writes only a handoff JSON document. The task registry and
ownership are changed separately through tools/godseed_tasks.py. In particular
a handoff does not release a bot or complete its task.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
from pathlib import Path
import re
import tempfile

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "docs/agents/tasks.json"
HANDOFFS = ROOT / "docs/agents/handoffs"
TASK_ID = re.compile(r"[A-Z]{2,4}-\d{3}\Z")
SHA = re.compile(r"[0-9a-fA-F]{40}\Z")
REASONS = {"context_limit", "session_end", "owner_request", "blocked"}
STATUSES = {"claimed", "in_progress", "in_review", "blocked", "ready"}
REQUIRED_START = [
    "docs/agents/README.md", "docs/agents/BOT_MASTER_PROMPT.md",
    "docs/agents/TASK_WORKFLOW.md", "docs/agents/tasks.json",
    "docs/agents/TASK_BOARD.md",
]


def read_registry():
    return json.loads(REGISTRY.read_text(encoding="utf-8"))


def handoff_file(task_id):
    if not TASK_ID.fullmatch(task_id):
        raise ValueError("Invalid task ID")
    return HANDOFFS / (task_id + ".json")


def validate_handoff(doc, path_task=None):
    errors = []
    def err(message):
        errors.append(message)
    if not isinstance(doc, dict):
        return ["Handoff must be a JSON object"]
    if doc.get("schema_version") != 1:
        err("schema_version must be 1")
    task_id = doc.get("task_id")
    if not isinstance(task_id, str) or not TASK_ID.fullmatch(task_id):
        err("task_id must be an area prefix and three digits")
    if path_task is not None and task_id != path_task:
        err("handoff filename and task ID differ")
    if not isinstance(doc.get("retiring_bot"), str) or not re.fullmatch(r"[A-Za-z0-9_-]{4,32}", doc["retiring_bot"]):
        err("retiring_bot must be a stable 4–32 character ID")
    if doc.get("reason") not in REASONS:
        err("invalid reason")
    if doc.get("last_known_status") not in STATUSES:
        err("invalid source task status")
    for field in ("coordination_sha", "work_sha"):
        value = doc.get(field)
        if value is not None and (not isinstance(value, str) or not SHA.fullmatch(value)):
            err(field + " must be a full 40-character commit SHA or null")
    if not doc.get("unpublished_changes") and not doc.get("work_sha"):
        err("a published work_sha is required before safe release")
    for field in ("work_branch", "coordination_branch", "summary", "save_notes"):
        value = doc.get(field)
        if not isinstance(value, str) or not value.strip():
            err(field + " must not be empty")
    if not isinstance(doc.get("created_utc"), str):
        err("created_utc is required")
    else:
        try:
            parsed = dt.datetime.fromisoformat(doc["created_utc"].replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                err("created_utc must have timezone")
        except ValueError:
            err("invalid created_utc")
    for field in ("changed_files", "tests", "blockers", "risks", "next_actions", "do_not_repeat"):
        value = doc.get(field)
        if not isinstance(value, list) or any(not isinstance(s, str) or not s.strip() for s in value):
            err(field + " must be a list of nonempty strings")
    if isinstance(doc.get("next_actions"), list) and not doc["next_actions"]:
        err("at least one actionable next step is required")
    if isinstance(doc.get("tests"), list) and not doc["tests"]:
        err("report at least NOT_RUN: <reason> for test status")
    for item in doc.get("tests", []):
        if isinstance(item, str) and not item.startswith(("PASS: ", "FAIL: ", "NOT_RUN: ")):
            err("each test must start PASS:, FAIL: or NOT_RUN:")
    if not isinstance(doc.get("unpublished_changes"), bool):
        err("unpublished_changes must be boolean")
    if doc.get("pr_url") is not None:
        u = doc["pr_url"]
        if not isinstance(u, str) or not re.fullmatch(r"https://github\.com/[^/]+/[^/]+/pull/\d+", u):
            err("pr_url must be a GitHub PR URL or null")
    if doc.get("starting_documents") != REQUIRED_START:
        err("missing or altered new-chat starting documents")
    if not isinstance(doc.get("owner_at_handoff"), str):
        err("owner_at_handoff must be a string")
    return errors


def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    name = None
    try:
        with tempfile.NamedTemporaryFile(dir=path.parent, mode="w", encoding="utf-8", delete=False) as f:
            json.dump(value, f, ensure_ascii=False, indent=2)
            f.write("\n")
            name = f.name
        os.replace(name, path)
    finally:
        if name and os.path.exists(name):
            os.unlink(name)


def write(args, db):
    t = next((x for x in db["tasks"] if x["id"] == args.task), None)
    if t is None:
        raise ValueError("Unregistered task")
    if t.get("owner") != args.actor:
        raise ValueError("Actor does not own this task; do not overwrite another bot's handoff")
    if t["status"] not in STATUSES - {"ready"}:
        raise ValueError("Task has no active/review/blocked status to hand off")
    if args.unpublished and args.work_sha:
        # A work SHA may point to committed parts, but uncommitted changes are
        # still at risk and the incoming bot must be warned.
        pass
    elif not args.work_sha and not args.unpublished:
        raise ValueError("Provide a real --work-sha or use --unpublished; no invented commit")
    doc = {
        "schema_version": 1,
        "task_id": args.task, "retiring_bot": args.actor,
        "reason": args.reason,
        "created_utc": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "last_known_status": t["status"], "owner_at_handoff": t["owner"],
        "coordination_branch": db["coordinator_branch"],
        "coordination_sha": args.coordination_sha,
        "work_branch": args.work_branch, "work_sha": args.work_sha,
        "pr_url": args.pr,
        "summary": args.summary, "changed_files": args.file,
        "tests": args.test, "blockers": args.blocker, "risks": args.risk,
        "save_notes": args.save_notes, "next_actions": args.next,
        "do_not_repeat": args.do_not_repeat, "unpublished_changes": args.unpublished,
        "starting_documents": REQUIRED_START,
        "continuity_rule": "Re-read live registry. Only claim if ready/unowned. Keep prior branch intact."
    }
    errors = validate_handoff(doc, args.task)
    if errors:
        raise ValueError("; ".join(errors))
    atomic_json(handoff_file(args.task), doc)
    print("Saved local handoff: " + str(handoff_file(args.task).relative_to(ROOT)))
    print("Commit and push this file to the COORDINATION branch, verify on GitHub,")
    print("then (only when work is fully preserved) release claimed/in_progress -> ready")
    print("through godseed_tasks.py and commit BOTH registry and generated board.")


def check(args, db):
    paths = [handoff_file(args.task)] if args.task else sorted(HANDOFFS.glob("*.json"))
    if not paths:
        print("No per-task handoff files found")
        return
    invalid = []
    for path in paths:
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
        except (ValueError, OSError) as e:
            invalid.append(path.name + ": unreadable JSON: " + str(e))
            continue
        errors = validate_handoff(doc, path.stem)
        if doc.get("task_id") not in {t["id"] for t in db["tasks"]}:
            errors.append("task ID not found in live registry")
        invalid.extend(path.name + ": " + e for e in errors)
        if not errors:
            task = next(t for t in db["tasks"] if t["id"] == doc["task_id"])
            print("VALID " + path.name + " | registry: " + task["status"] +
                  " | owner: " + str(task.get("owner")) + " | handoff by " + doc["retiring_bot"])
    if invalid:
        raise ValueError("\n".join(invalid))


def main(argv=None):
    p = argparse.ArgumentParser(description="Safe, machine-validated GODSEED chat handoffs")
    sub = p.add_subparsers(dest="cmd", required=True)
    w = sub.add_parser("write", help="Prepare handoff; does NOT change task ownership/status")
    w.add_argument("--task", required=True)
    w.add_argument("--actor", required=True)
    w.add_argument("--reason", choices=sorted(REASONS), required=True)
    w.add_argument("--coordination-sha", required=True)
    w.add_argument("--work-branch", required=True)
    w.add_argument("--work-sha", help="Published, verifiable 40-character code HEAD")
    w.add_argument("--unpublished", action="store_true", help="Work remains uncommitted; do NOT release claim")
    w.add_argument("--pr", help="Real GitHub PR URL")
    w.add_argument("--summary", required=True)
    w.add_argument("--save-notes", required=True)
    w.add_argument("--file", action="append", default=[], help="Changed path, repeat for multiple")
    w.add_argument("--test", action="append", default=[], help="PASS:/FAIL:/NOT_RUN: evidence")
    w.add_argument("--blocker", action="append", default=[])
    w.add_argument("--risk", action="append", default=[])
    w.add_argument("--next", action="append", default=[], required=True)
    w.add_argument("--do-not-repeat", action="append", default=[])
    chk = sub.add_parser("check", help="Validate stored handoffs; no task is claimed")
    chk.add_argument("--task", help="If omitted, inspect all current handoffs")
    args = p.parse_args(argv)
    try:
        db = read_registry()
        if args.cmd == "write":
            write(args, db)
        else:
            check(args, db)
    except (ValueError, OSError) as exc:
        p.error(str(exc))


if __name__ == "__main__":
    main()
