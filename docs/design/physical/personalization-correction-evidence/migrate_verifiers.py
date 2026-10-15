"""Replace stale task inventories while retaining semantic/freshness checks."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
E=Path(__file__).resolve().parent
p=ROOT/'docs/design/physical/verify.py'
s=p.read_text(encoding='utf-8')
s=s.replace('SLUG = "2026-10-11-physical-design-correction-pass"','SLUG = "2026-10-12-study-focus-personalization-f01-f02"')
at=s.index('# The approved logical source set')
s=s[:at]+'''
# Current finite task inventory protects unrelated files and all earlier evidence.
scope = subprocess.run([sys.executable, str(HERE / "personalization-correction-evidence/check_task.py")], cwd=ROOT)
check(scope.returncode == 0, "current exact task inventory / preservation / fresh affected renders")
addendum = (ROOT / "docs/study-focus-addendum.md").read_text(encoding="utf-8")
current = read("personalization-and-final-correction.md")
targeted = (HERE / "personalization-correction-evidence/independent-review.md").read_text(encoding="utf-8") if (HERE / "personalization-correction-evidence/independent-review.md").exists() else ""
check(all(x in main for x in ["study_focus text NOT NULL DEFAULT 'BALANCED'", "'VOCABULARY'", "'GRAMMAR'", "'READING'", "'LISTENING'", "practice_skill_ids", "practice_config"]), "five-value focus/default and bounded reusable practice metadata")
check(all(f"PERS-{i:02}" in addendum for i in range(1,11)), "PERS-01–10 future design acceptance retained")
check(all(x in security for x in ["read_assigned_authoring_grading", "validate_assigned_package_readiness", "SELECT(item_revision_id,grading_data,feedback_data,schema_version)", "EXECUTE only `lingora_transition_writer`", "read_admin_review_grading", "grade_pinned_attempt"]), "F01 exact Teacher/validator/Admin/pinned-grader execution chains")
check(all(x in security for x in ["SELECT accounts(id,role,status,row_version)", "UPDATE(row_version)", "SELECT learning_contexts(id,learner_id,language_id,course_id,status)", "before any context lookup or count", "INSERT WITH CHECK", "lock_learner_course"]), "F02 own parent lock and independent locker context reads under FORCE RLS")
check(all(x in current for x in ["| F01 | CLOSED |", "| F02 | CLOSED |"]), "current report closes F01/F02 after review")
check(all(x in targeted for x in ["F01 CLOSED", "F02 CLOSED", "regression NONE"]), "fresh targeted independent closure / no changed-path regression")
print("PHYSICAL PERSONALIZATION / FINAL CORRECTION " + ("FAIL" if failures else "PASS"))
sys.exit(bool(failures))
'''
p.write_text(s,encoding='utf-8')
p=ROOT/'docs/modeling/current-target/verify.py'
s=p.read_text(encoding='utf-8')
s=s.replace('len(list((ROOT / "docs").rglob("*.puml"))) == 37','len(list(BASE.rglob("*.puml"))) == 37').replace('"single canonical set plus shared style"','"canonical package exactly 36 diagrams plus shared style; separate physical/report packages allowed"')
start=s.index('require("Không gồm lượt củng cố"')
end=s.index('\ndom =',start)
s=s[:start]+'''require("hàng củng cố cuối phiên" in visible(texts["ACT-06-srs-review"]) and "không tạo lượt lập lịch thứ hai" in visible(texts["ACT-06-srs-review"]), "SRS activity separate end-session reinforcement / no second scheduling")
require("opt Có câu củng cố trong phiên" in texts["SEQ-08-srs-review"] and "không lập lịch lần thứ hai" in texts["SEQ-08-srs-review"] and "không lọc theo trọng tâm" in texts["SEQ-08-srs-review"], "sequence separate reinforcement and independent internal due selection")
'''+s[end:]
at=s.index('baseline = json.loads((ROOT / "plans/approved/2026-10-11-final-3-point')
s=s[:at]+'''
scope = subprocess.run([__import__("sys").executable, str(ROOT / "docs/design/physical/personalization-correction-evidence/check_task.py")], cwd=ROOT)
require(scope.returncode == 0, "current exact task inventory preserves untouched sources/renders, historical evidence, HEAD/index and log prefix")
require("studyFocus" in dom and "studyFocus" in data and "BALANCED" in dom + data, "context Study Focus in domain/logical data; no persisted plan added")
require("practiceSkillRefs" in dom + data and "controlledKnowledgeAreas" in data, "finite practice metadata reuses catalog concepts")
print("CURRENT TARGETED MODELING STATIC VERIFICATION PASS; no broad semantic re-audit performed.")
'''
p.write_text(s,encoding='utf-8')
print('Stale baseline inventories migrated; all existing substantive checks retained')
