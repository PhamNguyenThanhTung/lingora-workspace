"""Correction-pass static evidence; never substitutes for manual visual review."""
from collections import Counter
from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys
sys.stdout.reconfigure(encoding='utf-8')
import xml.etree.ElementTree as ET
from PIL import Image

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def require(value, message):
    if not value:
        raise SystemExit("FAIL: " + message)
    print("PASS: " + message)

def visible(source):
    return "\n".join(line for line in source.splitlines() if not line.lstrip().startswith("'"))

sources = sorted((BASE / "src").glob("*.puml"))
texts = {p.stem: p.read_text(encoding="utf-8") for p in sources}
manifest = json.loads((BASE / "render-manifest.json").read_text(encoding="utf-8"))
rows = manifest["records"]
require(len(sources) == manifest["diagram_count"] == len(rows) == 36, "36 sources / manifest entries")
require(len({r["id"] for r in rows}) == 36, "36 unique diagram identities; UC view namespace retained")
require(Counter(r["classification"] for r in rows) == {"CURRENT": 5, "TARGET": 30, "DEFERRED — NOT MVP": 1}, "5 CURRENT + 30 TARGET + 1 DEFERRED; 35 active")
require({r["source"] for r in rows} == {p.relative_to(BASE).as_posix() for p in sources}, "manifest exactly covers source set")
require(manifest["style_sha256"] == sha(BASE / "style.puml"), "fresh shared style hash")
outputs = set()
svg_text = {}
for r in rows:
    require(sha(BASE / r["source"]) == r["source_sha256"], "fresh source " + r["id"])
    for fmt, name in r["outputs"].items():
        p = BASE / name
        require(p.is_file() and sha(p) == r["output_sha256"][fmt], "fresh " + fmt + " " + r["id"])
        outputs.add(p.resolve())
        if fmt == "png":
            with Image.open(p) as im:
                im.verify()
        else:
            tree = ET.parse(p).getroot()
            svg_text[r["id"]] = " ".join(tree.itertext())
            require(not re.search(r"Syntax Error|An error has occurred|Please use CSS style|has been removed", svg_text[r["id"]]), "no render error " + r["id"])
            colors = re.findall(r"#[0-9A-Fa-f]{6}", p.read_text(encoding="utf-8"))
            require(all(c[1:3].lower() == c[3:5].lower() == c[5:7].lower() for c in colors), "grayscale SVG " + r["id"])
require(outputs == {p.resolve() for p in (BASE / "rendered").glob("*") if p.suffix in {".svg", ".png"}} and len(outputs) == 72, "36 SVG + 36 PNG; no orphan output")
visual = (BASE / "evidence/visual-review.md").read_text(encoding="utf-8")
visual_rows = re.findall(r"^\| ([A-Z]+(?:-[A-Z]+)?-\d+) \| .*?ACCEPTABLE.*?`([0-9a-f]{64})` \|$", visual, re.M)
require(len(visual_rows) == 36 and dict(visual_rows) == {r["id"]: r["output_sha256"]["png"] for r in rows}, "36 individual manual-review records match final PNG hashes")
require(len({sha(p) for p in sources}) == 36, "no duplicate source bytes")
require(len(list(BASE.rglob("*.puml"))) == 37, "canonical package exactly 36 diagrams plus shared style; separate physical/report packages allowed")
all_visible = "\n".join(visible(t) for t in texts.values())
target = "\n".join(visible(texts[Path(r["source"]).stem]) for r in rows if r["classification"] == "TARGET")
require(not re.search(r"(?m)^\s*(note|footer|legend)\b", all_visible), "no rendered notes, debug footers or legends")
require(not re.search(r"\b(Creator|Moderator|Manager|SuperAdmin|assignedRoles)\b", target), "legacy TARGET role scan clear")
require(not re.search(r"(?im)^\s*(actor|component|node|class|entity|rectangle).*\b(AI|LLM|Jump|Reassessment|MasteryEngine|WorkflowEngine)\b", target), "active AI runtime / Jump / Reassessment node scan clear")
require(not re.search(r"Again\s*[/,|]\s*Hard\s*[/,|]\s*Good\s*[/,|]\s*Easy", target, re.I), "rigid four-rating SRS scan clear")
require(not re.search(r"\b(?:12|13|30|40)\s*(?:questions|exercises|câu hỏi|bài tập)\b", target, re.I), "hard-coded lesson/assessment question-count scan clear")
require(not re.search(r"\bA1\b|Unit\s*1\b|80\s*%", target, re.I), "A1 / Unit1 / 80%-as-invariant scan clear")
require(not re.search(r"/api/|\bSELECT\s|\bINSERT\s|\bUPDATE\s|supersedes_id|active_revision_id", target), "no selected API/SQL contract in TARGET")
overview = visible(texts["UC-01-target-overall"])
require('rectangle "HỆ THỐNG HỌC NGOẠI NGỮ LINGORA"' in overview and len(re.findall(r"^actor ", overview, re.M)) == 3, "Overall three actors and exact system boundary")
protected = {"Profile", "UC02", "UC04", "UC05", "UC06", "UC07", "UC08", "UC09", "UC10", "UC11", "UC12", "UC13", "UC14"}
includes = set(re.findall(r"^(\w+) \.\.> Login : <<include>>", overview, re.M))
require(includes == protected and not ({"Signup", "Recovery", "Activation"} & includes), "13 protected Login includes; public flows excluded")
require(not re.search(r"^(Learner|Teacher|Admin)\s*(?:-->|->)", overview, re.M), "Overview actor associations nondirectional")
for stem, text in texts.items():
    v = visible(text)
    if stem.startswith("ACT-"):
        require("start" in v and "stop" in v and "|Hệ thống|" in v, "activity start/end/system lane " + stem)
    if stem.startswith("SEQ-"):
        require("actor " in v and "database " in v and "alt " in v and "Sơ đồ trình tự" in v, "sequence participants/fragments/title " + stem)
require("DEFERRED — NOT IN MVP" in visible(texts["ACT-05-reassessment"]), "deferred artifact visibly marked NOT IN MVP")
assignment = visible(texts["STA-02-assignment-lifecycle"])
require("ASSIGNED --> ASSIGNED" in assignment and "Quản trị viên đổi người phụ trách" in assignment and "Giữ tác giả và lịch sử" in assignment, "reassignment changes responsibility in place and preserves attribution/history")
require(not re.search(r"\b(?:CLOSED|COMPLETED)\b", assignment, re.I), "no unapproved assignment CLOSED/COMPLETED terminal state")
levelup = visible(texts["ACT-04-level-up-assessment"])
uc = (ROOT / "docs/use-case-specifications.md").read_text(encoding="utf-8")
uc_levelup = uc.split("## 5. Thi lên cấp", 1)[1].split("## 6.", 1)[0]
adr = (ROOT / "logs/decision-log.md").read_text(encoding="utf-8")
adr033 = adr.split("## ADR-033", 1)[1].split("## ADR-034", 1)[0]
require("Gate and pass parameters are course configuration, not fixed platform constants." in texts["ACT-04-level-up-assessment"] and "curriculum completion gate do khóa học cấu hình" in uc_levelup.lower() and "assessment theo cấu hình hiện hành" in uc_levelup.lower() and "no universal percentage" in adr033.lower(), "Level-up curriculum-readiness and assessment pass rules remain configured")
require(not re.search(r"100\s*%|100\s*percent|all required lessons", levelup + "\n" + uc_levelup, re.I), "no fixed 100%/all-required lesson Level-up rule in active diagram or UC")
act_onboarding = visible(texts["ACT-01-learner-onboarding"])
act_replacement = visible(texts["ACT-09-revision-replacement"])
require(all("không tính mẫu số" in t and "vẫn tính mẫu số" in t for t in [act_onboarding, act_replacement]), "both affected activities distinguish unavailable from progression-locked denominator treatment")
uc_path = uc.split("## 4. Khám phá Lộ trình học", 1)[1].split("## 5. Thi lên cấp", 1)[0]
requirements = (ROOT / "docs/02-requirements.md").read_text(encoding="utf-8")
require("vẫn thuộc eligible denominator" in uc_path and "normal sequential progression has not unlocked" in requirements, "UC and active requirements include published active progression-locked lessons")
final_review = (BASE / "final-review.md").read_text(encoding="utf-8")
require("MODELING APPROVED" in final_review and "READY FOR PHYSICAL DESIGN" in final_review and "100% required lessons không phải platform invariant" in final_review, "final review states the bounded recheck and requested verdict")
require("evidence/final-three-point-correction.md" in final_review and (BASE / "evidence/final-three-point-correction.md").is_file(), "final review links to three-point correction evidence")
for stem in ["ACT-03-lesson-learning", "SEQ-06-lesson-exercise-submission"]:
    t = visible(texts[stem])
    require(all(x in t for x in ["N + K", "1.0", "0.5"]), "N/K contribution anchors " + stem)
for stem in ["ACT-06-srs-review", "SEQ-08-srs-review"]:
    require("30" in visible(texts[stem]) and "1" in visible(texts[stem]), "SRS recurrence anchors " + stem)
require("hàng củng cố cuối phiên" in visible(texts["ACT-06-srs-review"]) and "không tạo lượt lập lịch thứ hai" in visible(texts["ACT-06-srs-review"]), "SRS activity separate end-session reinforcement / no second scheduling")
require("opt Có câu củng cố trong phiên" in texts["SEQ-08-srs-review"] and "không lập lịch lần thứ hai" in texts["SEQ-08-srs-review"] and "không lọc theo trọng tâm" in texts["SEQ-08-srs-review"], "sequence separate reinforcement and independent internal due selection")

dom = visible(texts["DOM-01-core-domain-model"])
data = visible(texts["DATA-03-target-logical-erd"])
require("class " in dom and "entity " not in dom and not re.search(r"<<PK|<<FK|varchar|uuid|nullable", dom, re.I), "DOM-01 UML concepts / no physical data markers")
require("entity " in data and "class " not in data and "ExerciseResponseRecord" in data and "LessonVocabularyLink" in data and "AssignmentHistoryRecord" in data, "DATA-03 logical identities, links and retained histories distinct from domain")
require("LearningPlan <<derived>>" in dom and "entity LearningPlan" not in data, "derived domain plan has no required persisted counterpart")
uc = (ROOT / "docs/use-case-specifications.md").read_text(encoding="utf-8")
require([int(n) for n in re.findall(r"^## (\d+)\.", uc, re.M)] == list(range(1, 16)) and "không phải UC-15" in uc, "canonical UC catalog identities unchanged; supporting Login is not UC15")
links = 0
for doc in [BASE / "README.md", BASE / "review.md", ROOT / "docs/README.md", ROOT / "docs/QUICK-REF.md", ROOT / "docs/05-traceability-matrix.md", ROOT / "docs/use-case-specifications.md"]:
    for link in re.findall(r"\]\(([^)]+)\)", doc.read_text(encoding="utf-8")):
        if re.match(r"https?://|#", link):
            continue
        path = link.split("#")[0]
        require((doc.parent / path).exists(), "link " + path)
        links += 1
print("Resolved local links:", links)

scope = subprocess.run([__import__("sys").executable, str(ROOT / "docs/design/physical/personalization-correction-evidence/check_task.py")], cwd=ROOT)
require(scope.returncode == 0, "current exact task inventory preserves untouched sources/renders, historical evidence, HEAD/index and log prefix")
require("studyFocus" in dom and "studyFocus" in data and "BALANCED" in dom + data, "context Study Focus in domain/logical data; no persisted plan added")
require("practiceSkillRefs" in dom + data and "controlledKnowledgeAreas" in data, "finite practice metadata reuses catalog concepts")
print("CURRENT TARGETED MODELING STATIC VERIFICATION PASS; no broad semantic re-audit performed.")
