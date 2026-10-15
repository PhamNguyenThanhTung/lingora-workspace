"""Final-review documentation/scope checks; no database access or application writes."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
SLUG = "2026-10-11-final-physical-runtime-review"
BASE = json.loads((ROOT / "plans/approved" / (SLUG + "-BASELINE.json")).read_text(encoding="utf8"))
OBS = json.loads((HERE / "final-review-evidence/concurrent-workspace-observations.json").read_text(encoding="utf8"))["files"]
failures = []
sha = lambda data: hashlib.sha256(data).hexdigest()


def check(ok, label):
    print(("PASS " if ok else "FAIL ") + label)
    if not ok:
        failures.append(label)


def current_hash(name):
    p = ROOT / name
    return sha(p.read_bytes()) if p.is_file() else None


def original_log_prefix(data, expected):
    h = hashlib.sha256()
    for line in data.splitlines(keepends=True):
        h.update(line)
        if h.hexdigest() == expected:
            return True
    return h.hexdigest() == expected


report = (HERE / "final-review.md").read_text(encoding="utf8")
main = (HERE / "README.md").read_text(encoding="utf8")
security = (HERE / "security-and-rls.md").read_text(encoding="utf8")
source = (HERE / "physical-erd.puml").read_text(encoding="utf8")
catalog = re.findall(r"^\| `([a-z_]+)` \|", main, re.M)
table_section = report.split("## B. Table-count verdict", 1)[1].split("## C.", 1)[0]
audit = re.findall(r"^\| `([a-z_]+)` \|", table_section, re.M)
entities = re.findall(r'entity "(?:app|app_private)\.([a-z_]+)" as', source)
check(len(catalog) == len(audit) == len(entities) == 34 and set(catalog) == set(audit) == set(entities),
      "34-table catalog, complete necessity audit and ERD entity sets match")
check(re.findall(r"^## ([A-S])\.", report, re.M) == list("ABCDEFGHIJKLMNOPQRS"), "all requested A-S sections present in order")
findings = re.findall(r"^\| (F\d\d) \| (P[12]) \|", report, re.M)
check([f[0] for f in findings] == [f"F{i:02}" for i in range(1, 13)] and sum(p == "P1" for _, p in findings) == 6,
      "12 explicit findings, six P1 and six P2, with OPEN status")
check("**NEEDS PHYSICAL CORRECTION**" in report and "**NOT READY FOR IMPLEMENTATION PLANNING**" in report,
      "review verdict and downstream stop are explicit")
check("**CLEAN REBUILD RECOMMENDED**" in report and "**LIVE DB UNVERIFIED.**" in report,
      "conditional rebuild and live-state boundary explicit")

links = 0
for doc in [HERE / "final-review.md", HERE / "final-review-evidence/verification.md", HERE / "README.md"]:
    for target in re.findall(r"\[[^\]]+\]\(([^)]+)\)", doc.read_text(encoding="utf8")):
        target = target.strip("<>").split("#", 1)[0]
        if not target or re.match(r"https?://", target):
            continue
        check((doc.parent / target).resolve().exists(), f"local link {doc.name} -> {target}")
        links += 1
print("LOCAL_LINK_COUNT", links)

check("'ADMIN','TEACHER','LEARNER'" in main, "proposed business roles remain exactly three")
check("'PLACEMENT','LEVEL_UP'" in main and not re.search(r"CHECK IN \([^)]*'REASSESSMENT'", main),
      "no active Reassessment purpose introduced")
check(not re.search(r"CHECK IN \([^)]*'(ADMINISTRATOR|LESSON_CREATOR|MODERATOR|OPERATIONS_STAFF|ORGANIZATIONAL_MANAGER)'", main),
      "no active legacy business role enum")
check(not any(re.search(r"ai|chat|mastery|knowledge_gap|learning_plan|skill_profile", t) for t in catalog),
      "no AI/runtime/mastery/materialized-plan subsystem")
check("No fixed item count" in main and "No default universal ratio" in main and "no A1/A2 enumeration" in main,
      "no hard-coded A1, assessment item count or universal gate introduced")
check("NOBYPASSRLS" in main and "transaction-local" in security and "RLS bypass acknowledged" in security,
      "Prisma and provider service-role trust claims remain explicit")

manifest = json.loads((HERE / "verification-manifest.json").read_text(encoding="utf8"))
check(sha((HERE / "physical-erd.puml").read_bytes()) == manifest["source_sha256"], "unchanged source matches original render manifest")
fresh = json.loads((HERE / "final-review-evidence/render-manifest.json").read_text(encoding="utf8"))
check(fresh["source_sha256"] == manifest["source_sha256"] and len(fresh["outputs"]) == 8,
      "fresh independent render manifest covers unchanged source and eight outputs")
for view in ["identity", "content", "learning", "assessment"]:
    for ext in ["svg", "png"]:
        name = f"physical-erd-{view}.{ext}"
        check(sha((HERE / name).read_bytes()) == manifest["outputs"][name]["sha256"], "source-bound unchanged render " + name)
        check(sha((HERE / "final-review-evidence/rendered" / name).read_bytes()) == fresh["outputs"][name]["sha256"]
              == manifest["outputs"][name]["sha256"], "fresh render byte-identical to individually reviewed PNG/SVG " + name)
        if ext == "svg":
            ET.parse(HERE / name)
        else:
            from PIL import Image
            check(list(Image.open(HERE / name).size) == manifest["outputs"][name]["dimensions"], "PNG dimensions " + view)

allowed_existing = {"plans/current-task.md", "plans/approved/README.md", "plans/archive/README.md", "HANDOFF.md",
                    "docs/README.md", "docs/QUICK-REF.md", "docs/design/physical/README.md",
                    "logs/test-log.md", "logs/development-log.md"}
unexpected = []
for name, expected in BASE["existing_sha256"].items():
    observed = current_hash(name)
    if observed != expected and name not in allowed_existing and not (name in OBS and observed == OBS[name]):
        unexpected.append(name)
check(not unexpected, "preexisting scope preservation: " + str(unexpected))
check(all(current_hash(n) == h for n, h in OBS.items()), "38 exact concurrent draw.io observations preserved, including recorded deletions")

# Only a status pointer is added to the physical catalog; preserve the exact original bytes.
prefix = b"> **Final independent review (2026-10-11):** NEEDS PHYSICAL CORRECTION / NOT READY FOR IMPLEMENTATION PLANNING. See [final review](final-review.md); the earlier readiness verdict below is historical input.\n\n"
data = (HERE / "README.md").read_bytes()
check(data.startswith(prefix) and sha(data[len(prefix):]) == BASE["existing_sha256"]["docs/design/physical/README.md"],
      "physical definitions byte-identical; only final-review pointer prepended")
for name in ["logs/test-log.md", "logs/development-log.md"]:
    check(original_log_prefix((ROOT / name).read_bytes(), BASE["existing_sha256"][name]), "append-only original log prefix preserved: " + name)
canonical = [n for n in BASE["existing_sha256"] if n.startswith("docs/modeling/current-target/") and
             (n.endswith(".puml") or n.startswith("docs/modeling/current-target/rendered/"))]
check(all(current_hash(n) == BASE["existing_sha256"][n] for n in canonical), f"all {len(canonical)} canonical PUML/render artifacts unchanged")
now = {n.replace("\\", "/") for n in subprocess.check_output(
    ["rg", "--files", "--hidden", "-g", "!.git", "-g", "!node_modules", "-g", "!.next"], cwd=ROOT, text=True).splitlines()}
new = now - set(BASE["existing_sha256"])
allowed_new = lambda n: n.startswith("docs/design/physical/final-review-evidence/") or n in {
    "docs/design/physical/final-review.md", "docs/design/physical/verify_final_review.py",
    "plans/archive/2026-10-11-drawio-native-render-parity-PENDING-CAPTURE.md",
    "plans/archive/" + SLUG + "-DONE.md"} or n.startswith("plans/approved/" + SLUG + "-")
check(all(allowed_new(n) or n in OBS and current_hash(n) == OBS[n] for n in new), "new paths confined to review records or exact concurrent observations")
check(subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip() == BASE["head"], "HEAD unchanged; no commit")
check(subprocess.check_output(["git", "diff", "--cached", "--raw"], cwd=ROOT, text=True) == BASE["index_raw"], "preexisting index unchanged; no staging")
print("NEW_REVIEW_FILE_LINE_COUNTS")
for name in sorted(n for n in new if allowed_new(n) and Path(n).suffix in {".md", ".py", ".txt", ".json"}):
    print(name, len((ROOT / name).read_text(encoding="utf-8-sig").splitlines()))
print("DOCUMENTATION_AND_SCOPE_CHECKS " + ("FAIL" if failures else "PASS"))
print("SEMANTIC_REVIEW NEEDS PHYSICAL CORRECTION; F01-F12 OPEN; RUNTIME TESTS NOT EXECUTED")
sys.exit(bool(failures))
