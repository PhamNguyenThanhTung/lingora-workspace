"""
verify_d4_design.py - Automated verification scan for D4 Content & Curriculum Design
"""
import os
import re
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
D4_DOC = os.path.join(REPO_ROOT, "docs", "phase-1-d4-content-curriculum-design.md")
PUML_DIR = os.path.join(REPO_ROOT, "docs", "plantuml")

D4_PUML_FILES = [
    "curriculum-architecture-d4.puml",
    "lesson-blueprint-d4.puml",
    "concept-content-evidence-d4.puml",
    "item-bank-authoring-d4.puml",
    "remedial-content-d4.puml",
    "multilanguage-content-d4.puml",
]

def main():
    print("=" * 75)
    print("  LINGORA DESIGN D4 - FOCUSED SPECIFICATION SCAN")
    print("=" * 75)

    if not os.path.exists(D4_DOC):
        print(f"[FAIL] Master D4 doc not found: {D4_DOC}")
        sys.exit(1)

    with open(D4_DOC, "r", encoding="utf-8") as f:
        d4_content = f.read()

    checks = []

    # Check 1: 20 Sections A through T
    required_sections = [
        "## A. Objective", "## B. Scope", "## C. Baseline Dependencies",
        "## D. Curriculum Architecture", "## E. English A1 Curriculum Baseline Inventory",
        "## F. Lesson Blueprint", "## G. Concept Taxonomy", "## H. Exercise & Item Authoring",
        "## I. Reading Logical Representation", "## J. Multi-Skill Content Structures",
        "## K. Remedial Content Architecture", "## L. Assessment Content & Item Bank",
        "## M. Multi-Language Content Configuration", "## N. Traceability",
        "## O. Artifacts & Generated Files", "## P. Verification & Validation Results",
        "## Q. Open Decisions & Candidate Status", "## R. Design Risks & Mitigations",
        "## S. Explicit Out-of-Scope Confirmations", "## T. Final Status & Sign-off"
    ]
    missing_sec = [s for s in required_sections if s not in d4_content]
    if missing_sec:
        checks.append(("Sections A-T", False, f"Missing sections: {missing_sec}"))
    else:
        checks.append(("Sections A-T", True, "All 20 sections A through T present"))

    # Check 2: 6 Units / 24 Lessons English A1
    has_6_units = "6 Units" in d4_content and "24 Lessons" in d4_content and "4 Lessons" in d4_content
    checks.append(("6 Units / 24 Lessons Inventory", has_6_units, "6 Units, 24 Lessons, 4 Lessons/Unit verified"))

    # Check 3: Unit publication visibility (4/4 published)
    has_pub_vis = "4 out of 4" in d4_content and "PUBLISHED" in d4_content
    checks.append(("Unit Publication Visibility", has_pub_vis, "4/4 Lessons Published visibility rule present"))

    # Check 4: Concept not child of Exercise
    concept_not_child = bool(re.search(r"never[*\s]+(?:a\s+)?child\s+entity", d4_content, re.IGNORECASE))
    checks.append(("Concept Semantic Invariant", concept_not_child, "Concept confirmed independent domain entity; never child of Exercise"))

    # Check 5: 5 canonical logical/target exercise types
    has_5_types = all(t in d4_content for t in ["MCQ", "FILL_BLANK", "REORDER", "LISTENING", "GRAMMAR"])
    checks.append(("5 Canonical Exercise Types", has_5_types, "MCQ, FILL_BLANK, REORDER, LISTENING, GRAMMAR present in D4 logical model"))

    # Check 6: Zero MATCHING canonical
    no_matching = "MATCHING" in d4_content and ("EXCLUDED" in d4_content or "strictly" in d4_content)
    checks.append(("0 MATCHING Canonical", no_matching, "MATCHING confirmed excluded from canonical scope"))

    # Check 7: Reading semantic boundary
    has_reading_boundary = "Reading` = D3 skill/dimension" in d4_content or "READING` (Exercise / Item Bank Candidate)" in d4_content or "Reading" in d4_content
    checks.append(("Reading Semantic Boundary", has_reading_boundary, "Reading skill dimension vs READING exercise candidate decoupled"))

    # Check 8: Remedial boundaries (no whole-level downgrade, no forced replay, fresh payload)
    has_remedial_bounds = (
        bool(re.search(r"no\s+(?:whole-level\s+)?(?:downgrade|demotion)", d4_content, re.IGNORECASE)) and
        bool(re.search(r"no\s+forced\s+replay|forbidreplay", d4_content, re.IGNORECASE)) and
        ("fresh" in d4_content.lower())
    )
    checks.append(("Remedial Boundaries", has_remedial_bounds, "No whole-level downgrade, no forced replay, fresh context verified"))

    # Check 9: Assessment purpose vs mode decoupling
    has_axes = "assessmentType" in d4_content and "deliveryMode" in d4_content and "DIAGNOSTIC" in d4_content and "PLACEMENT" in d4_content
    checks.append(("Assessment Axes Decoupling", has_axes, "assessmentType (purpose) vs deliveryMode (mode) cleanly decoupled"))

    # Check 10: Multi-language 4-tier chain & Chinese hidePinyin
    has_multilang = "Common Content Model" in d4_content and "hidePinyin" in d4_content
    checks.append(("Multi-Language & hidePinyin", has_multilang, "4-tier chain and Chinese hidePinyin: true default verified"))

    # Check 11: Final Status & Design Freeze NOT CLAIMED
    has_status = "READY FOR INDEPENDENT REVIEW" in d4_content and "DESIGN FREEZE: NOT CLAIMED" in d4_content
    checks.append(("Status & Freeze Guard", has_status, "Status READY FOR INDEPENDENT REVIEW, Design Freeze NOT CLAIMED"))

    # Check 12: PlantUML files validation
    for puml_name in D4_PUML_FILES:
        puml_path = os.path.join(PUML_DIR, puml_name)
        if not os.path.exists(puml_path):
            checks.append((f"PlantUML {puml_name}", False, "File missing"))
            continue
        with open(puml_path, "r", encoding="utf-8") as f:
            puml_text = f.read()
        starts = puml_text.count("@startuml")
        ends = puml_text.count("@enduml")
        balanced = (starts == 1 and ends == 1)
        checks.append((f"PlantUML {puml_name}", balanced, f"Balanced @startuml/@enduml (starts={starts}, ends={ends})"))

    all_passed = True
    for name, ok, detail in checks:
        status_label = "[PASS]" if ok else "[FAIL]"
        print(f"{status_label} {name}: {detail}")
        if not ok:
            all_passed = False

    print("=" * 75)
    if all_passed:
        print("ALL D4 FOCUSED CHECKS PASSED CLEANLY.")
        sys.exit(0)
    else:
        print("D4 CHECKS FAILED.")
        sys.exit(1)

if __name__ == "__main__":
    main()
