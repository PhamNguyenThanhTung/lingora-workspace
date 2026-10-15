"""Current proposed physical-design and correction-pass checks; no DB access."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
SLUG = "2026-10-11-physical-design-correction-pass"
BASE = json.loads((ROOT / "plans/approved" / f"{SLUG}-BASELINE.json").read_text(encoding="utf-8"))
failures = []


def check(condition, label):
    print(("PASS " if condition else "FAIL ") + label)
    if not condition:
        failures.append(label)


def read(name):
    path = HERE / name
    return path.read_text(encoding="utf-8") if path.exists() else ""


def sha(data):
    return hashlib.sha256(data).hexdigest()


main = read("README.md")
security = read("security-and-rls.md")
rebuild = read("rebuild-plan.md")
report = read("correction-pass.md")
independent = read("independent-recheck.md")
source = read("physical-erd.puml")
catalog = re.findall(r"^\| `([a-z_]+)` \|", main, re.M)
details = re.findall(r"^- \*\*`(?:app_private\.)?([a-z_]+)`:\*\*", main, re.M)
entities = re.findall(r'entity "(?:app|app_private)\.([a-z_]+)" as', source)
check(len(catalog) == 34 and len(set(catalog)) == 34, "34 unique proposed tables retained")
check(len(details) == 34 and set(catalog) == set(details) == set(entities),
      "table inventory, typed definitions and physical ERD entity sets agree")

panels = [panel for panel in source.split("@enduml") if "@startuml" in panel]
check(len(panels) == 4, "four proposed physical ERD views remain")
for panel in panels:
    name = re.search(r"@startuml\s+(\S+)", panel).group(1)
    local = set(re.findall(r'entity "[^"]+" as ([a-z_]+)', panel))
    edges = re.findall(r"^([a-z_]+) [|}o].*? ([a-z_]+)$", panel, re.M)
    check(all(a in local and b in local for a, b in edges), f"ERD relationship endpoints exist: {name}")
check("PROPOSED PHYSICAL DESIGN - NOT IMPLEMENTED" in source, "ERD still labels design PROPOSED / NOT IMPLEMENTED")

links = 0
documents = [
    HERE / "README.md", HERE / "security-and-rls.md", HERE / "rebuild-plan.md",
    HERE / "review-and-verification.md", HERE / "correction-pass.md",
    HERE / "independent-recheck.md",
]
for doc in documents:
    check(doc.exists(), f"required correction artifact exists: {doc.name}")
    if not doc.exists():
        continue
    for target in re.findall(r"\[[^\]]+\]\(([^)]+)\)", doc.read_text(encoding="utf-8")):
        target = target.strip("<>").split("#", 1)[0]
        if not target or re.match(r"https?://", target):
            continue
        check((doc.parent / target).resolve().exists(), f"local link {doc.name} -> {target}")
        links += 1
print(f"LOCAL_LINK_COUNT {links}")

check("PROPOSED PHYSICAL DESIGN — NOT IMPLEMENTED" in main and "LIVE DB UNVERIFIED" in main,
      "physical design and live database status remain explicitly proposed/unverified")
check("'ADMIN','TEACHER','LEARNER'" in main and "'PENDING','ACTIVE','DISABLED'" in main,
      "only the three approved business roles and approved account statuses are represented")
check("'PLACEMENT','LEVEL_UP'" in main and not re.search(r"purpose\s+CHECK IN[^\n]*REASSESSMENT", main, re.I),
      "active assessment purpose remains Placement/Level-up without Reassessment")
check("lingora_runtime" in security and "NOBYPASSRLS" in security and "FORCE RLS" in security
      and "service-role" in security and "server authorization" in security.lower(),
      "browser/server/Prisma/service-role boundaries and server authorization are explicit")
check("Recommendation: CLEAN REBUILD" in rebuild and "read-only inventory" in rebuild
      and "restore" in rebuild and "Do not assume an empty database" in rebuild,
      "conditional rebuild and destructive execution gates are preserved")
check(not any(re.search(r"ai|mastery|knowledge_gap|learning_plan|skill_profile", name) for name in catalog),
      "no AI, mastery, KnowledgeGap, persisted plan or SkillProfile table is introduced")
check("no hard-coded a1" in report.lower() and "100% readiness" in report
      and "fixed assessment item count" in report.lower(),
      "correction report records no hard-coded level, universal readiness or item-count invariant")

# Each finding must be reported as closed by the correction evidence and independently checked.
finding_rows = re.findall(r"^\| (F\d\d) \| (P[12]) \|.*?\| (CLOSED|STILL OPEN) \|$", report, re.M)
check([row[0] for row in finding_rows] == [f"F{i:02}" for i in range(1, 13)]
      and all(row[2] == "CLOSED" for row in finding_rows),
      "correction report gives exactly one CLOSED/OPEN result for F01-F12")
recheck_rows = re.findall(r"^\| (F\d\d) \| (CLOSED|STILL OPEN) \|", independent, re.M)
check([row[0] for row in recheck_rows] == [f"F{i:02}" for i in range(1, 13)]
      and all(row[1] == "CLOSED" for row in recheck_rows),
      "independent recheck independently reports all twelve findings CLOSED")

required_commands = [
    "CTX_CREATE", "LESSON_ANSWER", "LESSON_COMPLETE", "SRS_REVIEW",
    "ASSESSMENT_FINALIZE", "TEACHER_EDIT_DRAFT", "TEACHER_REMOVE_DRAFT_MEMBER",
    "TEACHER_SUBMIT", "ADMIN_REQUEST_CHANGES", "ADMIN_APPROVE", "ADMIN_PUBLISH",
    "ADMIN_DISABLE", "ADMIN_REENABLE", "MEDIA_CLEANUP",
]
for command in required_commands:
    check(command in security, f"capability matrix includes {command}")
check("Operation" in security and "Trusted server" in security and "Required ownership/scope" in security
      and "DB/RLS dependency" in security,
      "capability matrix names actor, trusted checks, ownership and DB/RLS dependencies")

correction_checks = {
    "F01 checked Teacher submission": all(s in security + main for s in [
        "submit_assigned_work", "current assignment", "expected row_version", "IN_REVIEW", "Teacher",
    ]),
    "F02 first context branch and capacity": all(s in security + main for s in [
        "FIRST_CONTEXT_CREATE", "without an existing context", "learning_contexts SELECT", "at most two ACTIVE",
    ]),
    "F03 missing-account audit subject": all(s in main + security for s in [
        "verified_auth_subject_id", "VERIFIED_AUTH_SUBJECT", "no phantom account",
    ]),
    "F04 assignment generation and review pin": all(s in main + security for s in [
        "scope_generation", "assignment_scope_snapshot", "unpublishable",
    ]),
    "F05 draft-only membership removal": all(s in main + security for s in [
        "lesson_exercises", "lesson_vocabulary_links", "media_bindings", "assessment_version_items",
        "draft-only association", "DRAFT", "CHANGES_REQUESTED",
    ]),
    "F06 retirement reservation race": all(s in main + security for s in [
        "retired_at", "retirement reservation", "final reference check", "outside the database transaction",
    ]),
    "F07 stable curriculum ownership": all(s in main + security for s in [
        "course_id", "level_id", "unit_id", "position-only reorder", "once referenced",
    ]),
    "F08 active-revision first completion guard": all(s in main + security for s in [
        "active_revision_id", "first completion", "dedupe before", "course lock",
    ]),
    "F09 card/session reinforcement uniqueness": all(s in main for s in [
        "UNIQUE(card_id,session_key) WHERE kind='SCHEDULE'",
        "UNIQUE(card_id,session_key) WHERE kind='REINFORCEMENT'",
    ]),
    "F10 availability-aware default start": all(s in main for s in [
        "approved ACT-01", "configured default", "lowest-position level with eligible published AVAILABLE lessons",
        "cannot override a lower eligible level", "course lock", "coming-soon",
    ]),
    "F11 immutable blueprint scope and version": all(s in main for s in [
        "blueprint identity and scope", "new blueprint identity", "blueprint_snapshot",
        "historical attempt", "current curriculum gate",
    ]),
    "F12 finite topic/skill/purpose mapping": all(s in main + security for s in [
        "coverage_catalog", "topic_ids", "skill_ids", "PLACEMENT", "LEVEL_UP",
        "curriculum membership", "active flags", "no new table",
    ]),
}
for label, condition in correction_checks.items():
    check(condition, label)

scenario_ids = [
    "PD-F01-TEACHER-SUBMIT", "PD-F01-UNASSIGNED-DENIED", "PD-F02-FIRST-CONTEXT",
    "PD-F02-CONTEXT-CAPACITY-RACE", "PD-F05-REMOVE-DRAFT-MEMBER", "PD-F06-CLEANUP-PUBLISH-RACE",
    "PD-F11-BLUEPRINT-CONFIG-AFTER-PUBLISH", "PD-F04-CURRICULUM-ASSIGNMENT-HISTORY",
    "PD-F08-OLD-OPEN-ATTEMPT", "PD-F08-REPLACEMENT-COMPLETION-RACE",
    "PD-F09-DUPLICATE-REINFORCEMENT-RETRY", "PD-F09-CARD-SESSION-UNIQUE-RACE",
    "PD-F03-MISSING-ACCOUNT-AUDIT", "PD-F11-VERSION-COVERAGE-SNAPSHOT",
    "PD-F10-AVAILABILITY-AWARE-DEFAULT", "PD-F12-COVERAGE-TAGS-VALIDATION",
]
for scenario in scenario_ids:
    check(scenario in rebuild and scenario in report, f"acceptance scenario is recorded: {scenario}")
check(all(term in rebuild for term in ["Setup", "Action", "Expected invariant", "NOT EXECUTED"]),
      "future acceptance cases identify setup, action and expected invariant")
check(all(term in rebuild for term in [
    "PD-F10-AVAILABILITY-AWARE-DEFAULT", "Configured default points to a higher level",
    "lowest-position level", "zero eligible levels", "coherent generation",
    "PD-F12-COVERAGE-TAGS-VALIDATION", "Allowed in-scope tags pass",
    "invented, out-of-course, retired/inactive, and uncovered tags reject",
]), "F10 availability/default and F12 positive/negative tag cases are explicit")

old_checks = [
    "preexisting files changed only in authorized pointers",
    "six separately observed unrelated drawio files",
    "task new files only authorized physical/task artifacts",
    "all 139 canonical modeling files unchanged",
]
for stale_check in old_checks:
    check(stale_check in report, f"historical verifier disposition recorded: {stale_check}")
check("CURRENT AUTHORITY" in report and "old task baseline" in report.lower(),
      "verifier now uses current task baseline and current authority")

# The approved logical source set and unrelated initial workspace state are compared to this task's baseline.
allowed_existing = {
    "plans/current-task.md", "plans/approved/README.md", "plans/archive/README.md",
    "HANDOFF.md", "docs/README.md", "docs/QUICK-REF.md",
    "docs/design/physical/README.md", "docs/design/physical/security-and-rls.md",
    "docs/design/physical/rebuild-plan.md", "docs/design/physical/review-and-verification.md",
    "docs/design/physical/physical-erd.puml", "docs/design/physical/verify.py",
    "docs/design/physical/verification-output.txt",
    "docs/design/physical/physical-erd-identity.svg", "docs/design/physical/physical-erd-identity.png",
    "docs/design/physical/physical-erd-content.svg", "docs/design/physical/physical-erd-content.png",
    "docs/design/physical/physical-erd-learning.svg", "docs/design/physical/physical-erd-learning.png",
    "docs/design/physical/physical-erd-assessment.svg", "docs/design/physical/physical-erd-assessment.png",
    "logs/test-log.md", "logs/development-log.md", "logs/decision-log.md",
}
allowed_new_exact = {
    f"plans/approved/{SLUG}-REQUEST.txt", f"plans/approved/{SLUG}-APPROVED.md",
    f"plans/approved/{SLUG}-BASELINE.json", f"plans/archive/{SLUG}-DONE.md",
    "docs/design/physical/correction-pass.md",
    "docs/design/physical/independent-recheck.md",
    "docs/design/physical/final-review-evidence/historical-verify.py",
    "docs/design/physical/verification-output.txt",
}
existing = BASE["existing_sha256"]


def original_log_prefix(data, expected_hash):
    digest = hashlib.sha256()
    for line in data.splitlines(keepends=True):
        digest.update(line)
        if digest.hexdigest() == expected_hash:
            return True
    return digest.hexdigest() == expected_hash


changed_unexpected = []
for name, expected in existing.items():
    path = ROOT / name
    observed = sha(path.read_bytes()) if path.is_file() else None
    if observed != expected and name not in allowed_existing:
        changed_unexpected.append(name)
check(not changed_unexpected, "pre-existing files outside task permissions preserved: " + str(changed_unexpected))
for name in ["logs/test-log.md", "logs/development-log.md", "logs/decision-log.md"]:
    check(original_log_prefix((ROOT / name).read_bytes(), existing[name]),
          f"append-only log prefix preserved: {name}")

now = {name.replace("\\", "/") for name in subprocess.check_output(
    ["rg", "--files", "--hidden", "-g", "!.git", "-g", "!node_modules", "-g", "!.next", "-g", "!dist", "-g", "!build"],
    cwd=ROOT, text=True, encoding="utf-8").splitlines()}
new_paths = now - set(existing)
unexpected_new = sorted(
    name for name in new_paths
    if name not in allowed_new_exact
    and not name.startswith("docs/design/physical/correction-pass-evidence/")
)
check(not unexpected_new, "new files confined to authorized task artifacts: " + str(unexpected_new))
logical_paths = [name for name in existing if name.startswith("docs/modeling/current-target/")]
check(all((ROOT / name).is_file() and sha((ROOT / name).read_bytes()) == existing[name] for name in logical_paths),
      f"all {len(logical_paths)} approved-modeling files match this task baseline")
check(subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True, encoding="utf-8").strip() == BASE["head"],
      "HEAD unchanged; no commit")
def normalize_git_raw(value):
    return value.replace("\r\n", "\n").rstrip("\n")


current_index = subprocess.check_output(
    ["git", "diff", "--cached", "--raw"], cwd=ROOT, text=True, encoding="utf-8"
)
check(normalize_git_raw(current_index) == normalize_git_raw(BASE["index_raw"]),
      "pre-existing Git index unchanged; no staging")

print("NEW_TEXT_FILE_LINE_COUNTS")
for name in sorted(new_paths):
    path = ROOT / name
    if path.suffix.lower() in {".md", ".py", ".puml", ".json", ".txt"}:
        print(f"{name}: {len(path.read_text(encoding='utf-8').splitlines())}")
print("PHYSICAL CORRECTION VERIFICATION " + ("FAIL" if failures else "PASS"))
sys.exit(bool(failures))
