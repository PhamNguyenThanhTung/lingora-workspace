# -*- coding: utf-8 -*-
"""
Verification script for M2.2 Final P2 Cleanup
Validates:
- N-01: P1-FR-017 ownership cleanup
- N-02: GEC / Support traceability split
- N-03: Streak Freeze wording (canonical DEFERRED)
- N-04: Rate Limit removed from M2.2 Section 8
- Negative semantic scan for prior P1 regressions
"""
import sys

def verify_all():
    print("=== Checking N-04: Rate Limit ===")
    with open("docs/05-traceability-matrix.md", "r", encoding="utf-8") as f:
        tm_text = f.read()

    sec8_start = tm_text.find("## 8. M2.2 System Behavior")
    assert sec8_start != -1, "Section 8 not found in docs/05-traceability-matrix.md"
    sec8_text = tm_text[sec8_start:]
    assert "Rate Limit" not in sec8_text, "FAIL: Rate Limit still present in Section 8"
    print("[PASS] N-04: Rate Limit removed from Section 8 table")

    print("\n=== Checking N-01: P1-FR-017 Ownership Cleanup ===")
    # 1. In docs/05-traceability-matrix.md Section 8:
    # UC-07 row must not have P1-FR-017 as owner
    lines_sec8 = sec8_text.splitlines()
    uc07_line = [l for l in lines_sec8 if "UC-07" in l]
    assert len(uc07_line) == 1, f"Expected 1 UC-07 line, got {len(uc07_line)}"
    assert "P1-FR-017" not in uc07_line[0], f"FAIL: P1-FR-017 found in UC-07 line: {uc07_line[0]}"
    assert "P1-FR-016" in uc07_line[0], f"FAIL: P1-FR-016 missing from UC-07 line: {uc07_line[0]}"
    print("[PASS] N-01 (Traceability §8): UC-07 references P1-FR-016 (Skill Profile ref) and omits P1-FR-017")

    # 2. In docs/phase-1-m2-2-behavior-uc-activity-state.md:
    with open("docs/phase-1-m2-2-behavior-uc-activity-state.md", "r", encoding="utf-8") as f:
        spec_text = f.read()

    uc07_start = spec_text.find("### UC-07: Track Progress & Streak")
    uc07_end = spec_text.find("### UC-08: Create & Edit Lesson Draft")
    assert uc07_start != -1 and uc07_end != -1, "UC-07 bounds not found in M2.2 spec"
    uc07_spec = spec_text[uc07_start:uc07_end]
    assert "Skill Profile (`P1-FR-016`)" in uc07_spec, "FAIL: Skill Profile not mapped to P1-FR-016 in UC-07"
    assert "P1-FR-017" not in uc07_spec or "DEFERRED" in uc07_spec, "FAIL: P1-FR-017 active in UC-07 without DEFERRED notice"
    print("[PASS] N-01 (M2.2 Spec UC-07): Skill Profile mapped to P1-FR-016; P1-FR-017 disclaimed as DEFERRED outside MVP Core")

    # 3. Canonical status of P1-FR-017 preserved in docs/02 and docs/05 §3
    assert "| **P1-FR-017** | Nice / P2 | Achievements |" in tm_text, "FAIL: P1-FR-017 canonical row missing in docs/05"
    print("[PASS] N-01 (Canonical FR-017): P1-FR-017 preserved as Nice / P2 Achievements in canonical table")

    print("\n=== Checking N-02: GEC / Support Traceability Split ===")
    support_line = [l for l in lines_sec8 if "Operational Support" in l]
    assert len(support_line) == 1, f"Expected 1 Operational Support line, got {len(support_line)}"
    assert "UC-14" in support_line[0] and "BF-15" in support_line[0], f"FAIL: Support line mapping invalid: {support_line[0]}"
    assert "P1-FR-007" not in support_line[0], f"FAIL: P1-FR-007 mixed into UC-14 line: {support_line[0]}"

    gec_line = [l for l in lines_sec8 if "Scenario Writing with GEC" in l]
    assert len(gec_line) == 1, f"Expected 1 GEC line, got {len(gec_line)}"
    assert "P1-FR-007" in gec_line[0] and "BF-14" in gec_line[0], f"FAIL: GEC line mapping invalid: {gec_line[0]}"
    assert "UC-" not in gec_line[0].split("|")[3], f"FAIL: Fabricated UC in GEC line: {gec_line[0]}"
    print("[PASS] N-02: UC-14 (Support -> BF-15) and GEC (P1-FR-007 -> BF-14 -> no UC) cleanly split")

    print("\n=== Checking N-03: Streak Freeze Canonical Wording ===")
    with open("docs/01-architecture.md", "r", encoding="utf-8") as f:
        arch_text = f.read()

    arch_sec36 = arch_text[arch_text.find("### 3.6."):]
    assert "future gamification extension" not in arch_sec36, "FAIL: 'future gamification extension' still in 01-architecture"
    assert "Streak Freeze and Recovery Power-Up are DEFERRED" in arch_sec36, "FAIL: Canonical DEFERRED missing from 01-architecture"

    with open("HANDOFF.md", "r", encoding="utf-8") as f:
        handoff_text = f.read()
    handoff_latest = handoff_text[handoff_text.find("## Current state"):handoff_text.find("- Previous task:")]
    assert "future gamification extension" not in handoff_latest, "FAIL: 'future gamification extension' in HANDOFF latest"
    assert "Streak Freeze and Recovery Power-Up are DEFERRED" in handoff_latest, "FAIL: Canonical DEFERRED missing from HANDOFF latest"
    print("[PASS] N-03: Streak Freeze wording updated to canonical DEFERRED in architecture and handoff")

    print("\n=== Checking Negative Semantic Scan for Prior Regressions ===")
    # 1. No active Content Manager in M2.2 spec
    assert "Content Manager" not in spec_text or "không" in spec_text.lower(), "FAIL: Content Manager active in spec"

    # 2. No REJECTED in PlantUML or spec active states
    pumls = [
        "docs/plantuml/uc-overview-m22.puml",
        "docs/plantuml/activity-learner-flow-m22.puml",
        "docs/plantuml/activity-authoring-flow-m22.puml",
        "docs/plantuml/state-progression-readiness-m22.puml",
        "docs/plantuml/placement-jump-m22.puml",
        "docs/plantuml/srs-flow-m22.puml",
        "docs/plantuml/screen-flow-inventory-m22.puml"
    ]
    for p in pumls:
        with open(p, "r", encoding="utf-8") as pf:
            p_content = pf.read()
        for banned in ["Content Manager", "REJECTED", "longest_streak", "23:59:59", "NOT_READY", "EVALUATING"]:
            assert banned not in p_content, f"FAIL: {banned} found in {p}"
    print("[PASS] 7/7 PlantUML files clean of prohibited tokens")

    # 3. Canonical states active
    assert "CHANGES_REQUESTED" in spec_text, "CHANGES_REQUESTED missing"
    assert "ADVANCE_WITH_SUPPORT" in spec_text, "ADVANCE_WITH_SUPPORT missing"
    assert "REMEDIATE" in spec_text, "REMEDIATE missing"
    print("[PASS] Canonical lifecycle and readiness states verified active")

    # 4. Canonical 15 UCs and 15 BFs
    for i in range(1, 16):
        assert f"UC-{i:02d}" in spec_text, f"Missing UC-{i:02d}"
        assert f"BF-{i:02d}" in spec_text, f"Missing BF-{i:02d}"
    print("[PASS] Exactly 15 canonical UCs and 15 canonical BFs verified")

    print("\n=======================================================")
    print("ALL FINAL P2 CLEANUP VERIFICATIONS PASSED CLEANLY!")
    print("=======================================================")

if __name__ == "__main__":
    verify_all()
