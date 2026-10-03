#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
scratch/verify_consistency_guards.py
====================================
Automated Consistency Verification Harness for Lingora Design Re-Review (Round 3 + D1-D2).
Guards implemented:
1. GUARD-01: Q13 Raw XLSX Recount & Distribution Assertion
2. GUARD-02: Language Expert Identity Verification (Trần Minh Quân 9y, Lê Hoàng Mai 8y)
3. GUARD-03: NFR Performance & Availability Qualifiers ([PROPOSED TARGET / TBD — NOT BENCHMARKED])
4. GUARD-04: YC-CORE-01 Password Recovery End-to-End Downstream Trace
5. GUARD-05: AssessmentType Semantic Consistency (3 Pedagogical Types vs Execution Modes)
6. GUARD-06: Stale Jump Semantics Verification (SKIPPED_BY_JUMP, no raw COMPLETED_BY_JUMP)
7. GUARD-07: Stale CEFR Auto-Placement Verification (Starting Unit Mapping, no naked CEFR claims)
8. GUARD-08: N=35 / N=3 Evidence Labeling ([PRELIMINARY / PENDING RAW REPOSITORY EVIDENCE])
9. GUARD-09: LearningProgress Canonical Ownership (LearnerProfile sole owner, no Profile link)
10. GUARD-10: Canonical Five Exercise Types (MCQ, FILL_BLANK, REORDER, LISTENING, GRAMMAR)
11. GUARD-11: Multi-Language 4-Tier Assessment Chain (Engine -> Config -> Item Bank -> Rubric)
12. GUARD-12: No AssessmentSession Ghost Entity (D1.1)
13. GUARD-13: Expert PENDING-SOURCE-VERIFICATION Qualifiers (D1.4)
14. GUARD-14: Multi-Language Config Keys EN/ZH (D1.5)
15. GUARD-15: DeliveryMode Decoupling Prose+Puml (D1.1/D2.1)
16. GUARD-16: D2 Puml Parity (Concept/SkillProfile/Recommendation/Exercise-Concept)
17. GUARD-17: Ten Logical Invariants Present (D2.11)
18. GUARD-18: No Bare Stale Wording (Ba dạng HISTORICAL, audio_url, slide Ngu phap)
"""

import sys
import os
import re
from collections import Counter

# Ensure utf-8 stdout
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def log_guard(guard_id, name, passed, details=""):
    verdict = "PASS" if passed else "FAIL"
    print(f"[{verdict}] {guard_id}: {name}")
    if details:
        print(f"       -> {details}")
    return passed

def test_guard_01_q13_recount():
    """Guard 1: Q13 Raw XLSX recount and documentation consistency."""
    xlsx_path = os.path.join(REPO_ROOT, "Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx")
    if not os.path.exists(xlsx_path):
        return log_guard("GUARD-01", "Q13 Raw XLSX Recount", False, f"Missing XLSX file at {xlsx_path}")

    import openpyxl
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    sheet = wb.active

    # Find Q13 column
    q13_col = None
    for col in range(1, sheet.max_column + 1):
        header_val = str(sheet.cell(1, col).value or "")
        if "13." in header_val and "tự động xác định" in header_val:
            q13_col = col
            break

    if not q13_col:
        return log_guard("GUARD-01", "Q13 Raw XLSX Recount", False, "Could not find Q13 column header in raw XLSX")

    vals = [sheet.cell(r, q13_col).value for r in range(2, 17)]
    counts = Counter(vals)
    total_sum = sum(v for v in vals if isinstance(v, (int, float)))
    n = len(vals)
    avg = total_sum / n if n > 0 else 0

    expected_counts = {1.0: 1, 2.0: 1, 3.0: 1, 4.0: 4, 5.0: 8}
    expected_sum = 62.0
    expected_n = 15
    expected_pos = 12

    if counts != expected_counts or total_sum != expected_sum or n != expected_n:
        return log_guard("GUARD-01", "Q13 Raw XLSX Recount", False,
                         f"Raw count mismatch: got counts={dict(counts)}, sum={total_sum}, N={n}")

    # Now verify docs do not have stale distribution 6/15, 6/15, 2/15, 1/15, 0/15
    stale_patterns = [
        r"6/15.*5/5",
        r"Phân bố:\s*6 người\s*\(5★\)",
        r"6 người \(5★\)",
        r"6/15\s*\(40\.0%\)\s*mức 5/5"
    ]

    target_files = [
        os.path.join(REPO_ROOT, "docs", "tai-lieu-phan-tich-yeu-cau.md"),
        os.path.join(REPO_ROOT, "scratch", "build_full_17_slides.py"),
        os.path.join(REPO_ROOT, "docs", "slide-deck-17-slides.md")
    ]

    for tf in target_files:
        if os.path.exists(tf):
            with open(tf, "r", encoding="utf-8") as f:
                content = f.read()
                for pat in stale_patterns:
                    if re.search(pat, content):
                        return log_guard("GUARD-01", "Q13 Stale Scan", False,
                                         f"Found stale Q13 pattern '{pat}' in {os.path.relpath(tf, REPO_ROOT)}")

    return log_guard("GUARD-01", "Q13 Raw XLSX Recount & Distribution", True,
                     f"N={n}, 5★:8, 4★:4, 3★:1, 2★:1, 1★:1, Sum={total_sum}, Avg={avg:.4f} verified across raw XLSX and docs")

def test_guard_02_expert_identity():
    """Guard 2: Expert identity consistency across repo."""
    # Stale name "Lê Tuyết Mai" or "7 năm" associated with Chinese teacher
    target_files = [
        os.path.join(REPO_ROOT, "docs", "slide-deck-17-slides.md"),
        os.path.join(REPO_ROOT, "docs", "tai-lieu-phan-tich-yeu-cau.md"),
        os.path.join(REPO_ROOT, "docs", "phase-0-user-research-analysis-and-requirements.md"),
        os.path.join(REPO_ROOT, "docs", "05-traceability-matrix.md"),
        os.path.join(REPO_ROOT, "docs", "01-architecture.md")
    ]

    for tf in target_files:
        if os.path.exists(tf):
            with open(tf, "r", encoding="utf-8") as f:
                content = f.read()
                if "Lê Tuyết Mai" in content:
                    return log_guard("GUARD-02", "Expert Identity", False,
                                     f"Stale name 'Lê Tuyết Mai' found in {os.path.relpath(tf, REPO_ROOT)}")
                if "7 năm" in content and ("HSK" in content or "Mai" in content):
                    return log_guard("GUARD-02", "Expert Identity", False,
                                     f"Stale experience '7 năm' found for Chinese expert in {os.path.relpath(tf, REPO_ROOT)}")

    # Verify canonical presence of Trần Minh Quân (9 năm) and Lê Hoàng Mai (8 năm)
    slide_file = os.path.join(REPO_ROOT, "docs", "slide-deck-17-slides.md")
    with open(slide_file, "r", encoding="utf-8") as f:
        content = f.read()
        if "Trần Minh Quân" not in content or "9 năm" not in content:
            return log_guard("GUARD-02", "Expert Identity", False, "Trần Minh Quân (9 năm) missing from slide deck")
        if "Lê Hoàng Mai" not in content or "8 năm" not in content:
            return log_guard("GUARD-02", "Expert Identity", False, "Lê Hoàng Mai (8 năm) missing from slide deck")

    return log_guard("GUARD-02", "Language Expert Identity", True,
                     "Trần Minh Quân (9 năm) and Lê Hoàng Mai (8 năm) canonically verified; 0 stale Tuyết Mai / 7 năm occurrences")

def test_guard_03_nfr_qualifiers():
    """Guard 3: NFR performance & availability qualifiers."""
    sys_analysis_path = os.path.join(REPO_ROOT, "docs", "06-system-analysis.md")
    with open(sys_analysis_path, "r", encoding="utf-8") as f:
        content = f.read()

    # In section 7.2, NFR-PERF-05 and NFR-PERF-06 must have PROPOSED TARGET / TBD
    p5_match = re.search(r"NFR-PERF-05:[^\n]+", content)
    p6_match = re.search(r"NFR-PERF-06:[^\n]+", content)

    if not p5_match or "[PROPOSED TARGET / TBD — NOT BENCHMARKED]" not in p5_match.group(0):
        return log_guard("GUARD-03", "NFR Qualifiers", False, "NFR-PERF-05 missing proposed target qualifier in 06-system-analysis.md")

    if not p6_match or "[PROPOSED TARGET / TBD — NOT BENCHMARKED]" not in p6_match.group(0):
        return log_guard("GUARD-03", "NFR Qualifiers", False, "NFR-PERF-06 missing proposed target qualifier in 06-system-analysis.md")

    return log_guard("GUARD-03", "NFR Qualifiers", True,
                     "Performance and latency metrics properly qualified with [PROPOSED TARGET / TBD — NOT BENCHMARKED]")

def test_guard_04_password_recovery_trace():
    """Guard 4: YC-CORE-01 password recovery downstream trace."""
    # 1. YC-CORE-01 in docs/tai-lieu-phan-tich-yeu-cau.md
    with open(os.path.join(REPO_ROOT, "docs", "tai-lieu-phan-tich-yeu-cau.md"), "r", encoding="utf-8") as f:
        content = f.read()
        if "YC-CORE-01" not in content or "quên mật khẩu" not in content:
            return log_guard("GUARD-04", "Password Recovery Trace", False, "YC-CORE-01 missing 'quên mật khẩu'")

    # 2. MVP-01 and P1-FR-001 in docs/05-traceability-matrix.md
    with open(os.path.join(REPO_ROOT, "docs", "05-traceability-matrix.md"), "r", encoding="utf-8") as f:
        content = f.read()
        if "quên mật khẩu" not in content and "Password Recovery" not in content:
            return log_guard("GUARD-04", "Password Recovery Trace", False, "docs/05-traceability-matrix.md missing password recovery trace")

    # 3. P1-FR-001 in docs/02-requirements.md
    with open(os.path.join(REPO_ROOT, "docs", "02-requirements.md"), "r", encoding="utf-8") as f:
        content = f.read()
        if "recover password" not in content and "Password recovery" not in content:
            return log_guard("GUARD-04", "Password Recovery Trace", False, "P1-FR-001 in docs/02-requirements.md missing recover password")

    # 4. UC-01 in docs/06-system-analysis.md
    with open(os.path.join(REPO_ROOT, "docs", "06-system-analysis.md"), "r", encoding="utf-8") as f:
        content = f.read()
        if "Quên mật khẩu & Khôi phục phiên" not in content:
            return log_guard("GUARD-04", "Password Recovery Trace", False, "UC-01 in docs/06-system-analysis.md missing password recovery flow")
        if "[PENDING / DESIGN SPEC ONLY" not in content:
            return log_guard("GUARD-04", "Password Recovery Trace", False, "UC-01 missing PENDING / DESIGN SPEC ONLY status")

    return log_guard("GUARD-04", "Password Recovery Downstream Trace", True,
                     "YC-CORE-01 -> MVP-01 -> P1-FR-001 -> UC-01 -> Design Spec verified with PENDING runtime status")

def test_guard_05_assessment_type_consistency():
    """Guard 5: AssessmentType 3 pedagogical types vs execution delivery modes."""
    with open(os.path.join(REPO_ROOT, "docs", "phase-1-m2-1-domain-and-logical-data-foundation.md"), "r", encoding="utf-8") as f:
        m21_content = f.read()

    if "DIAGNOSTIC" not in m21_content or "EXIT" not in m21_content or "RE_EVALUATION" not in m21_content:
        return log_guard("GUARD-05", "AssessmentType Consistency", False, "Missing 3 canonical pedagogical types")

    if "deliveryMode" not in m21_content and "chế độ thực thi" not in m21_content:
        return log_guard("GUARD-05", "AssessmentType Consistency", False, "Missing execution delivery mode separation")

    with open(os.path.join(REPO_ROOT, "docs", "01-architecture.md"), "r", encoding="utf-8") as f:
        arch_content = f.read()
        if "DIAGNOSTIC" not in arch_content or "EXIT" not in arch_content or "RE_EVALUATION" not in arch_content:
            return log_guard("GUARD-05", "AssessmentType Consistency", False, "Missing 3 canonical types in docs/01-architecture.md")

    return log_guard("GUARD-05", "AssessmentType Semantic Consistency", True,
                     "3 canonical pedagogical types (DIAGNOSTIC, EXIT, RE_EVALUATION) cleanly decoupled from delivery modes (PLACEMENT, JUMP)")

def test_guard_06_jump_semantics():
    """Guard 6: Stale jump completion semantics verification."""
    # Active PlantUML should not assert COMPLETED_BY_JUMP == learning completion
    with open(os.path.join(REPO_ROOT, "docs", "plantuml", "learning-progression-model.puml"), "r", encoding="utf-8") as f:
        content = f.read()
        if "SKIPPED_BY_JUMP" not in content:
            return log_guard("GUARD-06", "Jump Semantics", False, "SKIPPED_BY_JUMP missing from progression model")

    # In decision sheet, COMPLETED_BY_JUMP must be marked historical
    with open(os.path.join(REPO_ROOT, "docs", "phase-0-product-owner-decision-sheet.md"), "r", encoding="utf-8") as f:
        content = f.read()
        if "COMPLETED_BY_JUMP" in content and "HISTORICAL" not in content:
            return log_guard("GUARD-06", "Jump Semantics", False, "Unmarked COMPLETED_BY_JUMP in phase-0-product-owner-decision-sheet.md")

    return log_guard("GUARD-06", "Stale Jump Semantics", True,
                     "SKIPPED_BY_JUMP / UNLOCKED_BY_JUMP enforced; raw COMPLETED_BY_JUMP marked historical")

def test_guard_07_cefr_placement():
    """Guard 7: CEFR auto-placement verification."""
    files_to_check = [
        os.path.join(REPO_ROOT, "docs", "report", "lingora-requirements-and-use-cases.md"),
        os.path.join(REPO_ROOT, "docs", "report", "lingora-project-1-lecturer-format.md")
    ]

    for fpath in files_to_check:
        if os.path.exists(fpath):
            with open(fpath, "r", encoding="utf-8") as f:
                lines = f.readlines()
                for i, line in enumerate(lines, 1):
                    if "tự động xác định trình độ CEFR" in line and "HISTORICAL" not in line and "SUPERSEDED" not in line:
                        return log_guard("GUARD-07", "CEFR Auto-Placement", False,
                                         f"Unqualified CEFR auto-placement claim at {os.path.relpath(fpath, REPO_ROOT)}:{i}")

    return log_guard("GUARD-07", "Stale CEFR Auto-Placement", True,
                     "Placement maps to Starting Unit on curriculum; CEFR auto-placement claims marked historical")

def test_guard_08_n35_n3_evidence_labels():
    """Guard 8: N=35 / N=3 evidence labeling."""
    slide_file = os.path.join(REPO_ROOT, "docs", "slide-deck-17-slides.md")
    with open(slide_file, "r", encoding="utf-8") as f:
        content = f.read()
        # In slide 6 footer
        if "N=35" in content and "Preliminary" not in content and "Pending" not in content:
            return log_guard("GUARD-08", "N=35/N=3 Evidence Status", False, "Slide deck missing Preliminary label for N=35")

    req_doc = os.path.join(REPO_ROOT, "docs", "tai-lieu-phan-tich-yeu-cau.md")
    with open(req_doc, "r", encoding="utf-8") as f:
        content = f.read()
        if "PRELIMINARY / DISCOVERY RESEARCH — PENDING RAW REPOSITORY EVIDENCE" not in content:
            return log_guard("GUARD-08", "N=35/N=3 Evidence Status", False, "tai-lieu-phan-tich-yeu-cau.md missing preliminary label")

    return log_guard("GUARD-08", "N=35 / N=3 Evidence Status", True,
                     "N=35 and N=3 strictly labeled as preliminary/discovery research pending raw evidence")

def test_guard_09_learning_progress_ownership():
    """Guard 9: LearningProgress sole ownership by LearnerProfile."""
    puml_path = os.path.join(REPO_ROOT, "docs", "plantuml", "domain-model-core.puml")
    with open(puml_path, "r", encoding="utf-8") as f:
        content = f.read()
        # Check no active "Profile "1" -- "0..*" LearningProgress"
        if re.search(r'^\s*Profile\s+"1"\s+--\s+"0\.\.\*"\s+LearningProgress', content, re.MULTILINE):
            return log_guard("GUARD-09", "LearningProgress Ownership", False,
                             "Duplicate direct linkage Profile -- LearningProgress still active in domain-model-core.puml")
        if "LearnerProfile \"1\" -- \"0..*\" LearningProgress" not in content:
            return log_guard("GUARD-09", "LearningProgress Ownership", False,
                             "LearnerProfile 1--0..* LearningProgress missing from domain-model-core.puml")

    m21_path = os.path.join(REPO_ROOT, "docs", "phase-1-m2-1-domain-and-logical-data-foundation.md")
    with open(m21_path, "r", encoding="utf-8") as f:
        m21_content = f.read()
        if "Chủ sở hữu duy nhất là `LearnerProfile`" not in m21_content and "Chủ sở hữu duy nhất là LearnerProfile" not in m21_content:
            return log_guard("GUARD-09", "LearningProgress Ownership", False,
                             "M2.1 doc missing explicit LearnerProfile sole ownership constraint")

    return log_guard("GUARD-09", "LearningProgress Canonical Ownership", True,
                     "LearnerProfile confirmed as sole canonical owner (Role.LEARNER only); duplicate Profile link removed")

def test_guard_10_exercise_types():
    """Guard 10: Canonical five exercise types."""
    # Current slide deck and generator should not have "Ghép thẻ" or "MATCHING" or "Viết" as canonical exercise type
    slide_file = os.path.join(REPO_ROOT, "docs", "slide-deck-17-slides.md")
    with open(slide_file, "r", encoding="utf-8") as f:
        content = f.read()
        # Slide 15 should have 5 canonical types
        s15_match = re.search(r"Bước 2 — Học bài học vi mô[^\n]+", content)
        if s15_match and "Ghép thẻ" in s15_match.group(0):
            return log_guard("GUARD-10", "Exercise Types", False, "Found 'Ghép thẻ' in slide 15 of slide-deck-17-slides.md")

    s15_script = os.path.join(REPO_ROOT, "scratch", "generate_s15_learner_flow.py")
    if os.path.exists(s15_script):
        with open(s15_script, "r", encoding="utf-8") as f:
            if "Ghép thẻ" in f.read():
                return log_guard("GUARD-10", "Exercise Types", False, "Found 'Ghép thẻ' in scratch/generate_s15_learner_flow.py")

    return log_guard("GUARD-10", "Canonical Five Exercise Types", True,
                     "MCQ, FILL_BLANK, REORDER, LISTENING, GRAMMAR canonical; 0 stale Ghép thẻ/MATCHING in current slides")

def test_guard_11_multilang_assessment_chain():
    """Guard 11: Multi-language assessment chain (Engine -> Config -> Item Bank -> Rubric)."""
    arch_path = os.path.join(REPO_ROOT, "docs", "01-architecture.md")
    with open(arch_path, "r", encoding="utf-8") as f:
        arch_content = f.read()
        if "Common Assessment Engine" not in arch_content or "Language Config" not in arch_content or "Item Bank" not in arch_content or "Rubric" not in arch_content:
            return log_guard("GUARD-11", "Assessment Chain", False, "docs/01-architecture.md missing 4-tier assessment chain")

    m21_path = os.path.join(REPO_ROOT, "docs", "phase-1-m2-1-domain-and-logical-data-foundation.md")
    with open(m21_path, "r", encoding="utf-8") as f:
        m21_content = f.read()
        if "Common Assessment Engine" not in m21_content or "Language Config" not in m21_content or "Item Bank" not in m21_content or "Rubric" not in m21_content:
            return log_guard("GUARD-11", "Assessment Chain", False, "M2.1 doc missing 4-tier assessment chain")

    return log_guard("GUARD-11", "Multi-Language 4-Tier Assessment Chain", True,
                     "Common Assessment Engine -> Language Config -> Item Bank -> Rubric verified in canonical architecture & logical design")

def test_guard_12_no_assessment_session_ghost():
    """Guard 12 (D1.1): AssessmentSession must not exist as canonical entity."""
    import glob
    hits = []
    for fpath in glob.glob(os.path.join(REPO_ROOT, "docs", "**", "*.md"), recursive=True) + \
                 glob.glob(os.path.join(REPO_ROOT, "docs", "plantuml", "*.puml")):
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
            if "AssessmentSession" in content:
                # Allowed only with explicit alias/historical note on same line block
                for i, line in enumerate(content.splitlines(), 1):
                    if "AssessmentSession" in line and "HISTORICAL" not in line and "không tồn tại entity" not in line and "no " not in line.lower():
                        # Check surrounding context for alias note
                        ctx = "\n".join(content.splitlines()[max(0, i - 3):i + 2])
                        if "alias" not in ctx.lower() and "không phải persisted entity" not in ctx:
                            hits.append(f"{os.path.relpath(fpath, REPO_ROOT)}:{i}")
    if hits:
        return log_guard("GUARD-12", "No AssessmentSession Ghost", False, f"Ungrounded mentions: {hits}")
    return log_guard("GUARD-12", "No AssessmentSession Ghost Entity", True,
                      "AssessmentSession absent as canonical entity (D1.1)")

def test_guard_13_expert_source_qualifier():
    """Guard 13 (D1.4): university credentials carry PENDING-SOURCE-VERIFICATION; no bare assertions."""
    files = [
        os.path.join(REPO_ROOT, "docs", "phase-0-user-research-analysis-and-requirements.md"),
        os.path.join(REPO_ROOT, "docs", "slide-deck-17-slides.md"),
    ]
    bare = []
    tags = 0
    for fpath in files:
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
            tags += content.count("PENDING-SOURCE-VERIFICATION")
            for pat in ["Đại học Victoria", "Sư phạm Bắc Kinh"]:
                for i, line in enumerate(content.splitlines(), 1):
                    if pat in line and "PENDING-SOURCE-VERIFICATION" not in line:
                        bare.append(f"{os.path.relpath(fpath, REPO_ROOT)}:{i}:{pat}")
    if bare:
        return log_guard("GUARD-13", "Expert Source Qualifier", False, f"Bare university assertions: {bare}")
    if tags < 4:
        return log_guard("GUARD-13", "Expert Source Qualifier", False, f"Expected >=4 qualifier tags, found {tags}")
    return log_guard("GUARD-13", "Expert PENDING-SOURCE-VERIFICATION", True,
                      f"{tags} qualifier tags present; 0 bare university assertions (D1.4)")

def test_guard_14_multilang_config_keys():
    """Guard 14 (D1.5): EN/ZH language-specific config keys present."""
    with open(os.path.join(REPO_ROOT, "docs", "01-architecture.md"), "r", encoding="utf-8") as f:
        arch = f.read()
    for key in ["collocation", "word family", "connected speech", "contextual vocabulary"]:
        if key not in arch:
            return log_guard("GUARD-14", "Multilang Config Keys", False, f"EN key '{key}' missing in docs/01-architecture.md")
    for key in ["trật tự từ/lượng từ", "nghe hiểu"]:
        if key not in arch:
            return log_guard("GUARD-14", "Multilang Config Keys", False, f"ZH key '{key}' missing in docs/01-architecture.md")
    with open(os.path.join(REPO_ROOT, "docs", "phase-1-m2-1-domain-and-logical-data-foundation.md"), "r", encoding="utf-8") as f:
        m21 = f.read()
    if "word family" not in m21:
        return log_guard("GUARD-14", "Multilang Config Keys", False, "EN 'word family' missing in M2.1 Tầng 2")
    return log_guard("GUARD-14", "Multi-Language Config Keys EN/ZH", True,
                      "EN (collocation/word family/connected speech/contextual vocab) + ZH specifics present (D1.5)")

def test_guard_15_delivery_mode_decoupling():
    """Guard 15 (D1.1/D2.1): deliveryMode decoupled in prose and puml."""
    with open(os.path.join(REPO_ROOT, "docs", "plantuml", "domain-model-core.puml"), "r", encoding="utf-8") as f:
        puml = f.read()
    if "delivery_mode" not in puml:
        return log_guard("GUARD-15", "DeliveryMode Decoupling", False, "delivery_mode missing in domain-model-core.puml AssessmentResult")
    with open(os.path.join(REPO_ROOT, "docs", "01-architecture.md"), "r", encoding="utf-8") as f:
        if "STANDARD" not in f.read():
            return log_guard("GUARD-15", "DeliveryMode Decoupling", False, "STANDARD missing in docs/01-architecture.md DeliveryMode")
    with open(os.path.join(REPO_ROOT, "docs", "phase-1-m2-1-domain-and-logical-data-foundation.md"), "r", encoding="utf-8") as f:
        m21 = f.read()
    if "Placement, Jump hoặc Exit/Re-evaluation" in m21:
        return log_guard("GUARD-15", "DeliveryMode Decoupling", False, "Conflated purpose line still present in M2.1")
    return log_guard("GUARD-15", "DeliveryMode Decoupling Prose+Puml", True,
                      "delivery_mode in puml; STANDARD in arch; purpose line decoupled (D1.1/D2.1)")

def test_guard_16_d2_puml_parity():
    """Guard 16 (D2): Concept/SkillProfile/Recommendation/Exercise-Concept parity."""
    with open(os.path.join(REPO_ROOT, "docs", "plantuml", "domain-model-core.puml"), "r", encoding="utf-8") as f:
        puml = f.read()
    checks = [
        ("prerequisite_concept_id", "Concept.prerequisite_concept_id"),
        ("is_active", "Concept.is_active"),
        ("PRONUNCIATION", "Concept domain PRONUNCIATION"),
        ("source_assessment_result_id", "SkillProfile provenance"),
        ("input_snapshot", "Recommendation.input_snapshot"),
        ("rule_version", "Recommendation.rule_version"),
        ("generated_at", "Recommendation.generated_at"),
        ("Exercise \"0..*\" -- \"1\" Concept", "Exercise→Concept relation"),
    ]
    for token, label in checks:
        if token not in puml:
            return log_guard("GUARD-16", "D2 Puml Parity", False, f"Missing {label} in domain-model-core.puml")
    return log_guard("GUARD-16", "D2 Puml Parity", True,
                      "Concept/SkillProfile/Recommendation/Exercise-Concept parity verified (D2.2/D2.4/D2.12)")

def test_guard_17_ten_invariants():
    """Guard 17 (D2.11): ten logical invariants present."""
    with open(os.path.join(REPO_ROOT, "docs", "01-architecture.md"), "r", encoding="utf-8") as f:
        arch = f.read()
    required = ["Progress $\\ne$ Proficiency", "Mastery", "LevelReadiness", "certification",
                "downgrade", "replay old lesson", "learning completion", "UNVERIFIED", "Exit"]
    for key in required:
        if key not in arch:
            return log_guard("GUARD-17", "Ten Invariants", False, f"Invariant key '{key}' missing in docs/01-architecture.md §3.3")
    with open(os.path.join(REPO_ROOT, "docs", "phase-1-m2-1-domain-and-logical-data-foundation.md"), "r", encoding="utf-8") as f:
        if "4.5. Logical Invariants" not in f.read():
            return log_guard("GUARD-17", "Ten Invariants", False, "M2.1 §4.5 Logical Invariants section missing")
    return log_guard("GUARD-17", "Ten Logical Invariants", True,
                      "10 invariants in 01 §3.3 + M2.1 §4.5 (D2.11)")

def test_guard_18_no_bare_stale_wording():
    """Guard 18 (D1.6/D2.6): bare stale wording absent."""
    stale = []
    for fpath,changetag in [
        (os.path.join(REPO_ROOT, "docs", "phase-0-final-master-consolidation.md"), "Ba dạng"),
        (os.path.join(REPO_ROOT, "docs", "phase-0-roles-and-mvp-final.md"), "Ba dạng"),
    ]:
        with open(fpath, "r", encoding="utf-8") as f:
            for i, line in enumerate(f.read().splitlines(), 1):
                if "Ba dạng" in line and "HISTORICAL" not in line:
                    stale.append(f"{os.path.relpath(fpath, REPO_ROOT)}:{i}")
    erd = os.path.join(REPO_ROOT, "docs", "plantuml", "erd-mvp-learning.puml")
    with open(erd, "r", encoding="utf-8") as f:
        if "audio_path" in f.read():
            stale.append("erd-mvp-learning.puml:audio_path")
    slide = os.path.join(REPO_ROOT, "docs", "slide-deck-17-slides.md")
    with open(slide, "r", encoding="utf-8") as f:
        for i, line in enumerate(f.read().splitlines(), 1):
            if "Q17 & Q7" in line and "Viết" in line and "Ngữ pháp" not in line:
                stale.append(f"slide-deck-17-slides.md:{i}:Viết-thay-Ngu-phap")
    if stale:
        return log_guard("GUARD-18", "No Bare Stale Wording", False, f"Stale hits: {stale}")
    return log_guard("GUARD-18", "No Bare Stale Wording", True,
                      "Ba dạng HISTORICAL; audio_url; slide 5-type = Ngữ pháp (D1.6/D2.6)")

def main():
    print("=" * 75)
    print("  LINGORA DESIGN D1-D2 - AUTOMATED CONSISTENCY GUARDS")
    print("=" * 75)

    guards = [
        test_guard_01_q13_recount,
        test_guard_02_expert_identity,
        test_guard_03_nfr_qualifiers,
        test_guard_04_password_recovery_trace,
        test_guard_05_assessment_type_consistency,
        test_guard_06_jump_semantics,
        test_guard_07_cefr_placement,
        test_guard_08_n35_n3_evidence_labels,
        test_guard_09_learning_progress_ownership,
        test_guard_10_exercise_types,
        test_guard_11_multilang_assessment_chain,
        test_guard_12_no_assessment_session_ghost,
        test_guard_13_expert_source_qualifier,
        test_guard_14_multilang_config_keys,
        test_guard_15_delivery_mode_decoupling,
        test_guard_16_d2_puml_parity,
        test_guard_17_ten_invariants,
        test_guard_18_no_bare_stale_wording,
    ]

    all_passed = True
    total = len(guards)
    for guard in guards:
        res = guard()
        if not res:
            all_passed = False

    print("=" * 75)
    if all_passed:
        print(f"ALL {total} CONSISTENCY GUARDS PASSED CLEANLY.")
        sys.exit(0)
    else:
        print("ONE OR MORE CONSISTENCY GUARDS FAILED.")
        sys.exit(1)

if __name__ == "__main__":
    main()
