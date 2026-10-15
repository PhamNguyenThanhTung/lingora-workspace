"""Local documentation checks only; never connects to a database or writes app files."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
SLUG = "2026-10-11-physical-data-runtime-design"
BASELINE = ROOT / "plans/approved" / (SLUG + "-BASELINE.json")
sha = lambda b: hashlib.sha256(b).hexdigest()
failures = []


def check(ok, description):
    print(("PASS " if ok else "FAIL ") + description)
    if not ok:
        failures.append(description)


main = (HERE / "README.md").read_text(encoding="utf8")
security = (HERE / "security-and-rls.md").read_text(encoding="utf8")
rebuild = (HERE / "rebuild-plan.md").read_text(encoding="utf8")
source = (HERE / "physical-erd.puml").read_text(encoding="utf8")
catalog = re.findall(r"^\| `([a-z_]+)` \|", main, re.M)
details = re.findall(r"^- \*\*`(?:app_private\.)?([a-z_]+)`:\*\*", main, re.M)
entities = re.findall(r'entity "(?:app|app_private)\.([a-z_]+)" as', source)
check(len(catalog) == 34 and len(set(catalog)) == 34, "34 unique justified catalog tables")
check(set(catalog) == set(details) == set(entities) and len(entities) == 34,
      "catalog / typed column details / ERD actual entity coverage match")
for panel in source.split("@enduml"):
    if "@startuml" not in panel:
        continue
    local = set(re.findall(r'entity "[^"]+" as ([a-z_]+)', panel))
    edges = re.findall(r"^([a-z_]+) [|}o].*? ([a-z_]+)$", panel, re.M)
    check(all(a in local and b in local for a, b in edges),
          "ERD relationship endpoints exist: " + re.search(r"@startuml (\S+)", panel)[1])

links = 0
for doc in [HERE / n for n in ["README.md", "security-and-rls.md", "rebuild-plan.md", "review-and-verification.md"]]:
    if not doc.exists():
        check(False, "required review evidence exists")
        continue
    for link in re.findall(r"\[[^\]]+\]\(([^)]+)\)", doc.read_text(encoding="utf8")):
        link = link.strip("<>").split("#", 1)[0]
        if not link or re.match(r"https?://", link):
            continue
        check((doc.parent / link).resolve().exists(), f"local link {doc.name} -> {link}")
        links += 1
print(f"LOCAL_LINK_COUNT {links}")

assertions = {
    "three fixed trusted roles": "'ADMIN','TEACHER','LEARNER'" in main and "raw user metadata" in security,
    "authorized activation/account status and context states": "'PENDING','ACTIVE','DISABLED'" in main and "'ACTIVE','PAUSED'" in main,
    "only Placement/Level-up purpose enum": "'PLACEMENT','LEVEL_UP'" in main and not re.search(r"CHECK IN \([^)]*'REASSESSMENT'", main),
    "five actual exercise types": "'MCQ','FILL_BLANK','REORDER','LISTENING','GRAMMAR'" in main,
    "no old business role enum in proposed schema": not re.search(r"CHECK IN \([^)]*'(ADMINISTRATOR|LESSON_CREATOR|MODERATOR|OPERATIONS_STAFF|ORGANIZATIONAL_MANAGER)'", main),
    "Unit options and response/snapshot choices documented": "Unit Option A" in main and "Option B summarized" in main and "immutable item revision IDs" in main,
    "exact N/K performance and completion separation": "response_count = N + K" in main and "units/(2*response_count)" in main and "No score gate" in main,
    "unique logical completion and no forced redo": "UNIQUE(context_id,lesson_id)" in main and "not forced to redo" in main,
    "account-wide SRS policy and reinforcement": "UNIQUE(learner_id,vocabulary_id)" in main and "Final stage remains5/+30" in main and "no second qualifying schedule fact" in main,
    "progression lock included, unavailable excluded": "remain in the denominator even when learner progression" in main and "PLANNED, WITHDRAWN" in main,
    "configuration, not universal counts/levels/gates": "No fixed item count" in main and "no A1/A2 enumeration" in main and "No default universal ratio" in main,
    "secrets physically separated and private": "app_private.item_grading_secrets" in main and "direct browser S/I/U/D is denied" in security and "no per-item correctness" in main,
    "runtime role RLS reality": "NOBYPASSRLS" in main and "transaction-local" in security and "FORCE RLS" in main,
    "explicit finalizer/provision/lock principal grants": all(n in security for n in ["lingora_learner_writer", "lingora_content_writer", "lingora_auth_provisioner", "lingora_scoped_locker"]) and "INSERT learning_contexts" in security and "column UPDATE(row_version)" in security,
    "assignment targets / item authoring owners / absent collision guard": "(assignment_id,lesson_id)" in main and "(assignment_id,blueprint_id)" in main and "authoring_lesson_revision_id" in main and "absent collision row" in main,
    "atomic publish/history/no cascade": "Crash/constraint failure rolls back" in main and "no cascade from account" in main,
    "current configured gates and pinned pass config": "currently configured curriculum gate" in main and "pinned version pass config" in main,
    "streak source facts preserve approved exclusion": "assessments do not qualify" in main,
    "live state and conditional rebuild": "LIVE DB UNVERIFIED" in main and "CLEAN REBUILD" in rebuild and "Do not assume an empty database" in rebuild,
    "future tests are explicitly not run": "NOT EXECUTED IN THIS DESIGN TASK" in rebuild and len(re.findall(r"\| PD-", rebuild)) >= 35,
    "no AI infrastructure table in proposed inventory": not any(re.search(r"ai|chat|mastery|knowledge_gap|learning_plan|skill_profile", n) for n in catalog),
    "review verdict does not claim design approval": "PHYSICAL DESIGN READY FOR REVIEW" in main and "This is not design approval" in main,
}
for desc, ok in assertions.items():
    check(ok, desc)

manifest_path = HERE / "verification-manifest.json"
if manifest_path.exists():
    manifest = json.loads(manifest_path.read_text(encoding="utf8"))
    check(manifest["source_sha256"] == sha((HERE / "physical-erd.puml").read_bytes()), "ERD source matches manual/render manifest")
    for view in ["identity", "content", "learning", "assessment"]:
        for ext in ["svg", "png"]:
            p = HERE / f"physical-erd-{view}.{ext}"
            check(p.exists() and sha(p.read_bytes()) == manifest["outputs"][p.name]["sha256"], "fresh reviewed render " + p.name)
            if ext == "svg":
                ET.parse(p)
                check("Syntax Error" not in p.read_text(encoding="utf8"), "SVG syntax/output check " + view)
            else:
                from PIL import Image
                im = Image.open(p)
                check(list(im.size) == manifest["outputs"][p.name]["dimensions"], "PNG dimensions " + view)
else:
    check(False, "render/manual manifest exists")

baseline = json.loads(BASELINE.read_text(encoding="utf8"))
allow = {"plans/current-task.md", "plans/approved/README.md", "plans/archive/README.md", "HANDOFF.md", "docs/README.md", "docs/QUICK-REF.md", "logs/test-log.md", "logs/development-log.md", "logs/decision-log.md"}
changed = []
for name, expected in baseline["existing_sha256"].items():
    p = ROOT / name
    if not p.exists() or sha(p.read_bytes()) != expected:
        changed.append(name)
check(set(changed) <= allow, "preexisting files changed only in authorized pointers/append-only logs: " + str(len(changed)))
for name, marker in [("logs/test-log.md", "\n\n## T-PD-001"), ("logs/development-log.md", "\n\n## PD-001"), ("logs/decision-log.md", "\n\n## ADR-037")]:
    data = (ROOT / name).read_bytes()
    expected = baseline["existing_sha256"][name]
    prefix = data.split(marker.encode(), 1)[0]
    check(sha(data) == expected or sha(prefix) == expected, "historical log prefix preserved: " + name)
existing = set(baseline["existing_sha256"])
now = set(x.replace("\\", "/") for x in subprocess.check_output(["rg", "--files", "--hidden", "-g", "!.git", "-g", "!node_modules", "-g", "!.next"], cwd=ROOT, text=True).splitlines())
new = now - existing
observation = json.loads((HERE / "unrelated-workspace-observations.json").read_text(encoding="utf8"))
external = set(observation["files"])
check(all(n in new and sha((ROOT/n).read_bytes()) == observation["files"][n] for n in external),
      "six separately observed unrelated drawio files preserved")
allowed_new = lambda n: n.startswith("docs/design/physical/") or n.startswith("plans/approved/" + SLUG + "-") or n == "plans/archive/" + SLUG + "-DONE.md"
check(all(allowed_new(n) for n in new - external), "task new files only authorized physical/task artifacts")
check(subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip() == baseline["head"], "HEAD unchanged")
check(subprocess.check_output(["git", "diff", "--cached", "--raw"], cwd=ROOT, text=True) == baseline["index_raw"], "preexisting Git index unchanged")
canonical = [n for n in existing if n.startswith("docs/modeling/current-target/")]
check(all((ROOT/n).exists() and sha((ROOT/n).read_bytes()) == baseline["existing_sha256"][n] for n in canonical), f"all {len(canonical)} canonical modeling files unchanged")
print("NEW_FILE_LINE_COUNTS")
for n in sorted(new - external):
    if Path(n).suffix in [".md", ".py", ".puml", ".json", ".txt"] and n != "docs/design/physical/verification-output.txt":
        print(f"{n}: {len((ROOT/n).read_text(encoding='utf8').splitlines())}")
print("PHYSICAL DESIGN DOCUMENT CHECKS " + ("FAIL" if failures else "PASS"))
sys.exit(bool(failures))
