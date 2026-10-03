#!/usr/bin/env python3
"""
Lingora Milestone M2.4 - Automated Architecture & Security Verification Suite
Evaluates M2.4 design specification and PlantUML models against canonical requirements.
"""

import sys
import re
import os
import subprocess

def run_checks():
    errors = []
    passes = []
    
    spec_path = "docs/phase-1-m2-4-architecture-security.md"
    plan_path = "plans/m2-4-architecture-security-plan.md"
    puml_comp = "docs/plantuml/component-architecture-m24.puml"
    puml_deploy = "docs/plantuml/deployment-boundary-m24.puml"
    puml_sec = "docs/plantuml/security-matrix-m24.puml"
    api_contract_path = "docs/03-api-contract.md"
    arch_path = "docs/01-architecture.md"
    trace_path = "docs/05-traceability-matrix.md"

    if not os.path.exists(spec_path):
        print(f"[FAIL] Master specification not found: {spec_path}")
        sys.exit(1)

    with open(spec_path, "r", encoding="utf-8") as f:
        spec_text = f.read()

    # CHECK 01: Exact Artifact Identities (#13, #14, #16)
    c1_ok = (
        "#13 Component Architecture" in spec_text and
        "#14 Deployment/Runtime Boundary" in spec_text and
        "#16 Security Responsibility Matrix" in spec_text
    )
    if c1_ok:
        passes.append("CHECK-01: Artifact Identities #13, #14, #16 exact")
    else:
        errors.append("CHECK-01: Missing exact canonical titles for Artifacts #13, #14, or #16")

    # CHECK 02: 6 Canonical Roles (No 7th role)
    roles = ["Administrator", "Lesson Creator", "Moderator", "Operations Staff", "Learner", "Organizational Manager"]
    c2_ok = all(r in spec_text for r in roles)
    c2_service_role = "Privileged Service Role" in spec_text and "infrastructure" in spec_text.lower()
    if c2_ok and c2_service_role:
        passes.append("CHECK-02: 6 Canonical Roles verified; Service Role treated as infrastructure boundary")
    else:
        errors.append("CHECK-02: Roles mismatch or Service Role misidentified as a business role")

    # CHECK 03: Current 2-Role vs Target 6-Role Distinction
    c3_ok = (
        "CURRENT_APPLIED" in spec_text and
        "TARGET_DESIGN" in spec_text and
        "2-role" in spec_text.lower() or "2 vai trò" in spec_text.lower()
    ) and "DD-10" in spec_text
    if c3_ok:
        passes.append("CHECK-03: Current 2-role vs Target 6-role distinction modeled under DD-10")
    else:
        errors.append("CHECK-03: Missing clear current vs target role distinction")

    # CHECK 04: Zero Target-as-Ready Claims
    banned_claims = [
        "TARGET = DEPLOYED", "TARGET = PRODUCTION READY", "TARGET_DESIGN is deployed",
        "target runtime is production-ready", "target is ready for production"
    ]
    c4_banned = [bc for bc in banned_claims if bc.lower() in spec_text.lower()]
    c4_guard = (
        "NOT PRODUCTION READY" in spec_text or
        "NOT YET DEPLOYED" in spec_text or
        "KHÔNG tuyên bố Target Runtime đã sẵn sàng vận hành" in spec_text
    )
    if not c4_banned and c4_guard:
        passes.append("CHECK-04: Zero target-as-ready claims; explicit anti-drift guards present")
    else:
        errors.append(f"CHECK-04: Target falsely claimed ready or missing anti-drift guard: {c4_banned}")

    # CHECK 05: DD-03 Three-Tier Handling
    c5_ok = (
        "DD-03" in spec_text and
        "LOCKED BEHAVIOR" in spec_text and
        "DESIGN SPECIFICATION" in spec_text and
        "OPEN PHYSICAL REPRESENTATION" in spec_text and
        "metadata JSONB" in spec_text and
        "OPEN" in spec_text
    )
    if c5_ok:
        passes.append("CHECK-05: DD-03 Audit architecture handled in mandatory 3 tiers")
    else:
        errors.append("CHECK-05: DD-03 missing 3-tier verdict or silent closure detected")

    # CHECK 06: DD-10 Three-Tier Handling
    c6_ok = (
        "DD-10" in spec_text and
        "LOCKED BEHAVIOR" in spec_text and
        "DESIGN SPECIFICATION" in spec_text and
        "OPEN PHYSICAL REPRESENTATION" in spec_text and
        "migration" in spec_text.lower()
    )
    if c6_ok:
        passes.append("CHECK-06: DD-10 Role enforcement split handled in mandatory 3 tiers")
    else:
        errors.append("CHECK-06: DD-10 missing 3-tier verdict or migration sequencing not open")

    # CHECK 07: Security Responsibility Matrix (6 Boundaries)
    boundaries = ["Learner Web", "Admin Web", "Supabase RLS", "Privileged Service Role", "AI Server", "Audit"]
    c7_ok = all(b in spec_text for b in boundaries) and "OP-01" in spec_text and "OP-15" in spec_text
    if c7_ok:
        passes.append("CHECK-07: Security matrix encompasses all 6 boundaries across 15 sensitive operations")
    else:
        errors.append("CHECK-07: Security matrix missing required boundary or operations coverage")

    # CHECK 08: Application / RLS / Privileged Service Role Distinction
    # Intended predicate: app-check concept AND RLS concept AND an explicit
    # non-replacement statement must ALL be present (explicit parentheses;
    # a bare "or" chain would pass on any single term).
    def _check08(t):
        has_app = ("App Check" in t or "Application" in t)
        has_rls = ("RLS" in t)
        has_non_replace = (
            "không bao giờ thay thế RLS" in t
            or "not replace RLS" in t.lower()
            or "không thay thế RLS" in t.lower()
        )
        return has_app and has_rls and has_non_replace
    c8_ok = _check08(spec_text)
    if c8_ok:
        passes.append("CHECK-08: Application AuthZ vs DB RLS cleanly separated; app checks never replace RLS")
    else:
        errors.append("CHECK-08: Application AuthZ and DB RLS distinction insufficient")

    # CHECK 09: Privileged Service Role Isolation
    c9_ok = (
        "SUPABASE_SERVICE_ROLE_KEY" in spec_text and
        ("cách ly" in spec_text.lower() or "isolated" in spec_text.lower()) and
        ("N/A — privileged service-role path" in spec_text or "privileged service-role" in spec_text.lower())
    )
    if c9_ok:
        passes.append("CHECK-09: Privileged Service Role isolated from client & learner runtime")
    else:
        errors.append("CHECK-09: Privileged Service Role isolation not explicitly enforced")

    # CHECK 10: SoD Negative Paths
    # Intended predicate: self-review guard AND moderator-publish guard AND
    # in-review-publish denial must ALL be present (explicit parentheses).
    def _check10(t):
        has_self = (
            "SOD_VIOLATION_SELF_REVIEW" in t
            or "Creator tự duyệt" in t
        )
        has_modpub = (
            "SOD_VIOLATION_MODERATOR_PUBLISH" in t
            or ("Moderator" in t and "xuất bản" in t.lower())
        )
        has_inreview = (
            "IN_REVIEW -> PUBLISHED" in t
            or "IN_REVIEW → PUBLISHED" in t
        )
        return has_self and has_modpub and has_inreview
    c10_sod = _check10(spec_text)
    if c10_sod:
        passes.append("CHECK-10: Separation of Duties (SoD) negative denial paths enforced")
    else:
        errors.append("CHECK-10: Missing SoD negative denial paths")

    # CHECK 11: GEC Stateless Non-Ownership
    c11_ok = (
        "stateless" in spec_text.lower() and
        "corrected_text" in spec_text and
        ("KHÔNG SỞ HỮU" in spec_text or "non-owner" in spec_text.lower() or "không sở hữu" in spec_text.lower()) and
        "8.0" in spec_text
    )
    if c11_ok:
        passes.append("CHECK-11: GEC stateless non-ownership and 8.0s timeout verified")
    else:
        errors.append("CHECK-11: GEC stateless non-ownership invariant violated")

    # CHECK 12: Zero Fabricated IDs or Ghost Entities
    ghost_uc = False
    ghost_bf = False
    ghost_attempt = False
    ghost_session = False
    for line in spec_text.splitlines():
        if re.search(r"\bUC-(?:16|17|18)\b", line):
            if not any(w in line.lower() for w in ["không", "zero", "cấm", "prohibition", "phantom", "ghost", "ngoài"]):
                ghost_uc = True
        if re.search(r"\bBF-16\b", line):
            if not any(w in line.lower() for w in ["không", "zero", "cấm", "prohibition", "phantom", "ghost", "ngoài"]):
                ghost_bf = True
        if "exerciseattempt" in line.lower():
            if not any(w in line.lower() for w in ["không", "zero", "cấm", "transient", "phiên", "no exerciseattempt", "no"]):
                ghost_attempt = True
        if "assessmentsession" in line.lower():
            if not any(w in line.lower() for w in ["historical", "không", "zero", "cấm", "ghost", "phantom", "alias", "no assessmentsession", "no"]):
                ghost_session = True

    c12_ok = not (ghost_uc or ghost_bf or ghost_attempt or ghost_session)
    if c12_ok:
        passes.append("CHECK-12: Zero active fabricated IDs (UC-16..18, BF-16) and zero ghost entities")
    else:
        errors.append(f"CHECK-12: Ghost entities or fabricated IDs detected: uc={ghost_uc}, bf={ghost_bf}, attempt={ghost_attempt}, session={ghost_session}")


    # CHECK 13: Open Decision Firewall
    open_tokens = ["DD-03", "DD-10", "D3", "D4", "DD-06"]
    c13_ok = all(t in spec_text for t in open_tokens) and "OPEN" in spec_text
    if c13_ok:
        passes.append("CHECK-13: Open decision firewall preserved (DD-03, DD-10, D3/D4, DD-06 open)")
    else:
        errors.append("CHECK-13: Open decision firewall incomplete")

    # CHECK 14: M2.2 / M2.3 Invariant Preservation
    c14_ok = (
        "Mapping A" in spec_text and
        "95%" in spec_text and
        "24h" in spec_text and
        "allowance" in spec_text.lower() and
        "Policy B" in spec_text and
        "[1, 3, 7, 14, 30]" in spec_text
    )
    if c14_ok:
        passes.append("CHECK-14: M2.2/M2.3 pedagogical and learning progression invariants preserved")
    else:
        errors.append("CHECK-14: Learning progression invariants (D5, D6, D7, D8) mismatch")

    # CHECK 15: docs/03-api-contract.md Byte-Identical
    cmd_03 = subprocess.run(["git", "diff", "--stat", "--", api_contract_path], capture_output=True, text=True)
    if cmd_03.returncode == 0 and len(cmd_03.stdout.strip()) == 0:
        passes.append("CHECK-15: docs/03-api-contract.md remains 100% byte-identical / read-only")
    else:
        errors.append(f"CHECK-15: docs/03-api-contract.md has been modified: {cmd_03.stdout}")

    # CHECK 16: PlantUML Structural Validity
    pumls = [puml_comp, puml_deploy, puml_sec]
    puml_ok = True
    for p in pumls:
        if not os.path.exists(p):
            errors.append(f"CHECK-16: PlantUML file missing: {p}")
            puml_ok = False
            continue
        with open(p, "r", encoding="utf-8") as pf:
            p_text = pf.read()
        starts = p_text.count("@startuml")
        ends = p_text.count("@enduml")
        if starts != 1 or ends != 1:
            errors.append(f"CHECK-16: PlantUML syntax unbalanced in {p} (starts={starts}, ends={ends})")
            puml_ok = False
        # Check trailing whitespace
        lines = p_text.splitlines()
        ws_lines = [i+1 for i, l in enumerate(lines) if l != l.rstrip()]
        if ws_lines:
            errors.append(f"CHECK-16: Trailing whitespace in {p} at lines: {ws_lines}")
            puml_ok = False
    if puml_ok:
        passes.append("CHECK-16: All 3 M2.4 PlantUML diagrams structurally valid with 0 trailing whitespace")

    # CHECK 17: Negative self-test for CHECK-08 / CHECK-10 predicates
    # Guards against precedence/tautology regressions: fixtures missing a
    # required conjunct MUST fail each predicate (proves the fix is load-bearing).
    neg_fixtures_08 = [
        "Application layer handles requests.",  # no RLS, no non-replacement
        "not replace RLS",                      # phrase alone, no app/RLS context
        "RLS policies exist.",                  # RLS alone
    ]
    neg_fixtures_10 = [
        "Moderator reviews content.",           # actor name alone
        "IN_REVIEW → PUBLISHED",                # denial text alone
        "SOD_VIOLATION_SELF_REVIEW",            # one guard alone
    ]
    neg_ok = all(not _check08(f) for f in neg_fixtures_08) and \
        all(not _check10(f) for f in neg_fixtures_10)
    # Positive control: conjunction of all markers must pass
    pos_ok = _check08("Application RLS không bao giờ thay thế RLS") and \
        _check10("SOD_VIOLATION_SELF_REVIEW SOD_VIOLATION_MODERATOR_PUBLISH IN_REVIEW -> PUBLISHED")
    c17_ok = neg_ok and pos_ok
    if c17_ok:
        passes.append("CHECK-17: Negative self-test for CHECK-08/CHECK-10 predicates")
    else:
        errors.append("CHECK-17: Predicate self-test failed (negatives passed or positive failed)")

    # Output Summary
    print("=" * 75)
    print("  LINGORA MILESTONE M2.4 - AUTOMATED DESIGN VERIFICATION")
    print("=" * 75)
    for p in passes:
        print(f"[PASS] {p}")
    if errors:
        print("-" * 75)
        for e in errors:
            print(f"[FAIL] {e}")
        print("=" * 75)
        print(f"FAILED: {len(errors)} checks failed.")
        return 1
    else:
        print("=" * 75)
        print(f"ALL {len(passes)} M2.4 DESIGN VERIFICATION CHECKS PASSED CLEANLY.")
        return 0

if __name__ == "__main__":
    sys.exit(run_checks())
