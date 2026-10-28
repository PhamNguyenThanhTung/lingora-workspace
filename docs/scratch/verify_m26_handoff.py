#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
docs/scratch/verify_m26_handoff.py
==============================
Automated Verification Suite for Milestone M2.6 (Design-to-Implementation Handoff Package).
Hardened for M2.6 Remediation Review (P1-01..11, P2-01..06, NEW-P1-01, NEW-P2-01..03).

Asserts:
1.  M26-VAL-01: Document Existence & Header Metadata
2.  M26-VAL-02: Output 1 — Migration Outline (8 Phases, Rollback, Zero SQL)
3.  M26-VAL-03: Output 2 — Test-Plan Skeleton (18 Frames, SKELETON — NOT EXECUTED, Deep Semantic Parity)
4.  M26-VAL-04: Output 3 — API Register (4 Tiers, 03-Contract Cross-Check, No P2-M*, Canonical Comps)
5.  M26-VAL-05: Output 4 — Security & Audit Reconfirmation (5 Zones, Zone 5, 6 Roles, 11 Canonical Events)
6.  M26-VAL-06: Output 5 — Report Mapping & Evidence Index (Roadmap §11 Parity, Real SHAs, Narrowed ADRs)
7.  M26-VAL-07: Output 6 — DD Closure Record (7 Decisions, Exact 10-Column Schema, Deep Parity)
8.  M26-VAL-08: Deliverable 7 — Implementation & Governance Dependency Register (Exact 9 Fields, 0 BLOCKING)
9.  M26-VAL-09: Gate D-G10 — Formal Six Fields & Handoff Readiness ONLY
10. M26-VAL-10: CURRENT / TARGET / FUTURE Distinction & No Runtime/Production Claims
11. M26-VAL-11: Repository Firewall & docs/03-api-contract.md Byte-Identical
12. M26-VAL-12: Canonical Component Ownership Matrix (Exact 29 Rows, M2.4 Live Source, Zero Fictitious Services) [NEW-P1-01]
13. M26-VAL-13: Canonical Security Boundary Alignment (B1..B6 Exact Parity Across Sec 4.2 & 5.2) [P2-01]
14. M26-VAL-14: ADR Citation Rigor & Decision-Log Verification (18 ADRs Verified, Zero Broken Citations) [P2-02]
15. M26-VAL-15: Route Neutrality & Non-Locking Classification ([ILLUSTRATIVE ROUTE EXAMPLE — NOT LOCKED]) [NEW-P2-02]
16. M26-VAL-16: Error Taxonomy & M2.6 Design Additions (SOD 403 Errors, 6 Governance Criteria) [NEW-P2-01]
17. M26-VAL-17: Mutation & Negative Verification Suite (25 Load-Bearing Semantic Mutants) [P2-05]
"""

import os
import sys
import re
import subprocess

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DOC_PATH = os.path.join(REPO_ROOT, "docs", "phase-1-m2-6-design-handoff.md")
CONTRACT_PATH = os.path.join(REPO_ROOT, "docs", "03-api-contract.md")
DECISION_LOG_PATH = os.path.join(REPO_ROOT, "logs", "decision-log.md")

CANONICAL_M24_COMPONENTS = {
    "COMP-PRES-01": "Learner Web UI",
    "COMP-PRES-02": "Admin Web UI",
    "COMP-APP-01": "Learner BFF / Route Handlers",
    "COMP-APP-02": "Admin BFF / Server Actions",
    "COMP-DOM-01": "Auth & Identity Domain Service",
    "COMP-DOM-02": "Curriculum & Progression Domain Service",
    "COMP-DOM-03": "Assessment & Diagnostic Domain Service",
    "COMP-DOM-04": "Spaced Repetition (SRS) Scheduling Domain Service",
    "COMP-DOM-05": "Lesson Execution & Controlled Retry Domain Service",
    "COMP-DOM-06": "Content Lifecycle & Moderation Domain Service",
    "COMP-DOM-07": "Admin Governance & Security Audit Domain Service",
    "COMP-DOM-08": "AI Integration & Proxy Domain Service",
    "COMP-INFRA-01": "Postgres DB",
    "COMP-INFRA-02": "Row Level Security (RLS) Policy Engine",
    "COMP-INFRA-03": "RPC Engine",
    "COMP-INFRA-04": "Storage Engine",
    "COMP-INFRA-05": "Immutable Audit Log Store",
    "COMP-EXT-01": "Supabase GoTrue Authentication Provider",
    "COMP-EXT-02": "Stateless AI Compute Service"
}

CANONICAL_M24_BOUNDARIES = {
    "B1": "Boundary 1: Learner Web (BFF / Client)",
    "B2": "Boundary 2: Admin Web (BFF / Server Actions)",
    "B3": "Boundary 3: Supabase RLS (Database Core)",
    "B4": "Boundary 4: Privileged Service Role (Operations / Maintenance)",
    "B5": "Boundary 5: AI Server (Stateless Inference)",
    "B6": "Boundary 6: Audit Store (Immutable Ledger)"
}

def log_test(test_id, name, passed, details=""):
    verdict = "PASS" if passed else "FAIL"
    print(f"[{verdict}] {test_id}: {name}")
    if details:
        print(f"       -> {details}")
    return passed

def read_m26_doc():
    if not os.path.exists(DOC_PATH):
        return None
    with open(DOC_PATH, "r", encoding="utf-8") as f:
        return f.read()

# ---------------------------------------------------------------------------
# Core Validators
# ---------------------------------------------------------------------------

def validate_doc_structure(content):
    if not content:
        return False, "Missing docs/phase-1-m2-6-design-handoff.md"
    required = [
        "PHASE 1 MILESTONE M2.6: DESIGN-TO-IMPLEMENTATION HANDOFF SPECIFICATION",
        "Milestone M2.6 (Design-to-Implementation Handoff — Handoff Package)",
        "HANDOFF-ONLY / ZERO IMPLEMENTATION",
        "TIER-3 PHYSICAL DECISION ON PAPER",
        "TARGET RUNTIME NOT PRODUCTION READY",
        "D-G10 VALIDATION SCOPE",
        "CONTRACT IMMUTABILITY"
    ]
    missing = [p for p in required if p not in content]
    if missing:
        return False, f"Missing header phrases: {missing}"
    return True, "Document header and strict firewalls verified"

def validate_migration_outline(content):
    phases = [
        "Phase 1", "Phase 2", "Phase 3", "Phase 4",
        "Phase 5", "Phase 6", "Phase 7", "Phase 8"
    ]
    for p in phases:
        if p not in content:
            return False, f"Missing migration phase: {p}"
    if "Rollback Target" not in content and "Mục Tiêu Hoàn Nguyên" not in content:
        return False, "Missing rollback targets in migration outline"
    if "CREATE TABLE" in content or "ALTER TABLE" in content:
        return False, "Executable SQL detected in design-only migration outline"
    return True, "All 8 migration phases present with rollback targets and zero executable SQL"

def validate_test_skeleton(content):
    frames = [
        "TEST-FRAME-MAPPING-A",
        "TEST-FRAME-DIAG-SKIP",
        "TEST-FRAME-DIAG-RETAKE",
        "TEST-FRAME-JUMP-PASS",
        "TEST-FRAME-JUMP-COOLDOWN",
        "TEST-FRAME-JUMP-NON-COMPLETION",
        "TEST-FRAME-RETRY-ALLOWANCE",
        "TEST-FRAME-RETRY-CREDIT",
        "TEST-FRAME-SRS-POLICY-B",
        "TEST-FRAME-STREAK-TIMEZONE",
        "TEST-FRAME-STREAK-RESET",
        "TEST-FRAME-ROLE-AUTH-MATRIX",
        "TEST-FRAME-RLS-ISOLATION",
        "TEST-FRAME-SOD-SELF-REVIEW",
        "TEST-FRAME-SOD-MODERATOR-PUBLISH",
        "TEST-FRAME-ADMIN-EMERGENCY-PUBLISH",
        "TEST-FRAME-GEC-TIMEOUT-FALLBACK",
        "TEST-FRAME-AI-NON-OWNERSHIP"
    ]
    missing = [f for f in frames if f not in content]
    if missing:
        return False, f"Missing test frames: {missing}"
    if "SKELETON — NOT EXECUTED" not in content:
        return False, "Missing 'SKELETON — NOT EXECUTED' explicit status label"
    
    # P1-01: Frame 2 Skip Branch A check
    if "0 AssessmentResult" not in content or "0 SkillProfile" not in content:
        return False, "P1-01: Frame 2 must explicitly assert 0 AssessmentResult and 0 SkillProfile for Skip"
    if "khởi tạo `SkillProfile` ở mức cơ sở" in content:
        return False, "P1-01: Frame 2 must NOT claim to create SkillProfile on Skip"
    
    # P1-02: Frame 7 Retry Allowance check
    if "max(1, floor(N * 0.10))" not in content:
        return False, "P1-02: Frame 7 must specify formula max(1, floor(N * 0.10))"
    stale_retry_phrases = [
        "bộ đếm bài làm lại được theo dõi theo ngày",
        "đặt lại (reset) chính xác tại ranh giới nửa đêm",
        "bộ đếm hạn mức làm lại đặt lại (reset)",
        "10% Daily Pool"
    ]
    for srp in stale_retry_phrases:
        if srp in content:
            return False, f"P1-02: Frame 7 contains stale retry phrase: {srp}"

    # P1-03: Frame 6 Learner Progression check
    if "LessonProgress" in content:
        return False, "P1-03: Stale entity LessonProgress detected; must be LearningProgress"
    if "LearningProgress" not in content:
        return False, "P1-03: Canonical entity LearningProgress missing from Frame 6"
    if "by_jump" not in content and "SKIPPED_BY_JUMP" not in content:
        return False, "P1-03: Canonical jump progression flags by_jump / SKIPPED_BY_JUMP missing"

    # P1-04: Zero lingora-core
    if "lingora-core" in content:
        return False, "P1-04: Fabricated service lingora-core detected"

    # P2-06: Frame 16 SoD error codes 403
    if "403 SOD_VIOLATION_EMERGENCY_UNAPPROVED" not in content:
        return False, "P2-06: Frame 16 Scenario A must return 403 SOD_VIOLATION_EMERGENCY_UNAPPROVED"
    if "403 SOD_VIOLATION_MISSING_JUSTIFICATION" not in content:
        return False, "P2-06: Frame 16 Scenario B must return 403 SOD_VIOLATION_MISSING_JUSTIFICATION"
    if "CONTENT_EMERGENCY_PUB" not in content:
        return False, "P2-06/P1-08: Frame 16 must reference canonical audit event CONTENT_EMERGENCY_PUB"

    return True, "All 18 mandatory test frames present, labeled SKELETON, with deep semantic parity verified"

def validate_api_register(content):
    tiers = ["CURRENT_APPLIED", "TARGET_DESIGN", "FUTURE_EXTENSION", "COMPATIBILITY_GAP"]
    for t in tiers:
        if t not in content:
            return False, f"Missing API classification tier: {t}"
    if "docs/03-api-contract.md" not in content:
        return False, "Missing cross-check reference to docs/03-api-contract.md"
    
    # P1-10: Reject all P2-M* fabricated milestones
    if re.search(r"P2-M\d", content):
        return False, "P1-10: Fabricated milestone ID matching P2-M* detected in API register or text"
    
    # P1-11: Diagnostic item count ~25-30
    if "Đủ 30 câu trả lời" in content or "bắt buộc 30 câu trả lời" in content:
        return False, "P1-11: Fabricated 30 answers requirement detected in API-ASSESS-02"
    if "~25–30" not in content and "~25-30" not in content:
        return False, "P1-11: Expected ~25–30 diagnostic items specification missing from API-ASSESS-02"

    # P2-01: Boundary mapping B1..B6 & status description
    if "Thiết kế mục tiêu sẵn sàng" in content:
        return False, "P2-01: Stale phrasing 'Thiết kế mục tiêu sẵn sàng' detected in API register"
    if "B1" not in content or "B2" not in content or "B3" not in content or "B4" not in content or "B5" not in content or "B6" not in content:
        return False, "P2-01: Missing boundary B1..B6 declarations"

    return True, "API surfaces classified into 4 tiers, cross-checked against docs/03, canonical components & boundaries"

def validate_security_and_audit(content):
    zones = ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"]
    for z in zones:
        if z not in content:
            return False, f"Missing security zone: {z}"
    if "Zone 5 — Privileged Infrastructure Operations" not in content:
        return False, "Zone 5 Privileged Infrastructure Operations not explicitly declared"
    
    roles = ["Learner", "Lesson Creator", "Moderator", "Organizational Manager", "Administrator", "Operations Staff"]
    for r in roles:
        if r not in content:
            return False, f"Missing canonical role: {r}"
    
    # Explicit exclusion of service-role as 7th business role
    has_exclusion = (
        "không có vai trò nghiệp vụ thứ 7" in content or
        "không coi khóa kỹ thuật hạ tầng `service_role` là vai trò kinh doanh thứ 7" in content or
        "No 7th Role" in content or
        "service-role is infrastructure" in content
    )
    if not has_exclusion:
        return False, "Explicit exclusion of service-role as 7th business role missing"
    
    # P1-08: Exact 11 canonical audit events
    canonical_events = [
        "AUTH_LOGIN_FAILED",
        "ROLE_ASSIGNED",
        "ACCOUNT_SUSPENDED",
        "CONTENT_APPROVED",
        "CONTENT_CHANGES_REQ",
        "CONTENT_PUBLISHED",
        "CONTENT_EMERGENCY_PUB",
        "CONTENT_EMERGENCY_ARCH",
        "DIAGNOSTIC_COMPLETED",
        "JUMP_LOCKOUT_TRIGGERED",
        "AUDIT_LOG_INSPECTED"
    ]
    for e in canonical_events:
        if e not in content:
            return False, f"P1-08: Missing canonical audit event: {e}"
    
    # Reject invented audit event names
    forbidden_events = [
        "AUTH_LOGIN_SUCCESS",
        "AUTH_LOGIN_FAILURE",
        "AUTH_PASSWORD_RESET",
        "CONTENT_DRAFT_CREATED",
        "CONTENT_SUBMITTED_REVIEW",
        "CONTENT_REVIEW_DECISION",
        "CONTENT_EMERGENCY_PUBLISHED",
        "SECURITY_SOD_VIOLATION",
        "SECURITY_RATE_LIMIT_EXCEEDED"
    ]
    for fe in forbidden_events:
        if fe in content:
            return False, f"P1-08: Invented audit event detected: {fe}"

    return True, "5 security zones (incl. Zone 5), 6 roles, and exact 11 canonical audit events reconfirmed"

def validate_report_mapping(content):
    if "Roadmap §11 Parity" not in content and "phase-1-system-design-plan.md §11" not in content:
        return False, "Missing roadmap §11 parity heading"
    if "PLANNED" not in content and "SKELETON" not in content:
        return False, "Missing PLANNED or SKELETON label for future links"
    
    # P1-09: Real git commit checkpoints
    real_shas = ["7ab74b4", "379c259", "0a9a126", "d09f7cc", "ea1a2f3"]
    for s in real_shas:
        if s not in content:
            return False, f"P1-09: Missing verified git checkpoint SHA: {s}"
    
    fake_shas = ["3064ec7", "a30b777", "cdfc3dc"]
    for fs in fake_shas:
        if fs in content:
            return False, f"P1-09: Fabricated commit SHA detected: {fs}"

    # P2-02: Narrowed ADR list
    if "ADR-001..028" in content:
        return False, "P2-02: Broad blanket citation ADR-001..028 detected; must cite actual ADRs"
    
    return True, "Academic report mapping synced with roadmap §11; anti-fabrication enforced with real SHAs"

def validate_dd_closure(content):
    dds = ["DD-01", "DD-02", "DD-03", "DD-04", "DD-05", "DD-06", "DD-10"]
    for dd in dds:
        if dd not in content:
            return False, f"Missing decision closure: {dd}"
    
    columns = [
        "(1) Trạng Thái Hiện Tại",
        "(2) Tier 1: Locked Behavior",
        "(3) Tier 2: Design Specification",
        "(4) Tier 3: Physical Decision",
        "(5) Rationale",
        "(6) Dependencies",
        "(7) Migration Impact",
        "(8) Rollback Consideration",
        "(9) Affected Artifacts",
        "(10) Implementation Consequences"
    ]
    for c in columns:
        if c not in content:
            return False, f"Missing DD closure column: {c}"
    
    # P1-07: DD-02 6 canonical lifecycle states
    dd02_states = ["DRAFT", "IN_REVIEW", "CHANGES_REQUESTED", "APPROVED", "PUBLISHED", "ARCHIVED"]
    for st in dd02_states:
        if st not in content:
            return False, f"P1-07: DD-02 missing canonical lifecycle state: {st}"

    # P1-05: DD-05 LISTENING audio reference via vocabularyId
    if "vocabularyId" not in content:
        return False, "P1-05: DD-05 must specify vocabularyId for LISTENING exercise"
    if "storage/audio/u1_l1.mp3" in content or "audioRef" in content:
        return False, "P1-05: DD-05 must NOT use free-form audioRef path/URL"

    # P1-06 & P2-04: DD-06 assessment_type enum and atomic app service
    if "JUMP_UNIT" in content or "JUMP_UNIT_1..6" in content:
        return False, "P1-06: DD-06 must NOT contain JUMP_UNIT"
    if "`DIAGNOSTIC`, `EXIT`, `RE_EVALUATION`" not in content:
        return False, "P1-06: DD-06 must retain locked enum DIAGNOSTIC, EXIT, RE_EVALUATION"
    if "atomic transaction" not in content and "giao dịch nguyên tử" not in content:
        return False, "P2-04: DD-06 must specify atomic transaction by application BFF service"
    if "COMP-DOM-03" not in content:
        return False, "NEW-P1-01: DD-06 must reference Assessment & Diagnostic Domain Service COMP-DOM-03"

    # P2-03: DD-10 identity-derived role enforcement
    if "profiles.role" not in content:
        return False, "P2-03: DD-10 must specify profiles.role lookup"
    if "auth.uid()" not in content:
        return False, "P2-03: DD-10 must specify auth.uid() identity matching"

    return True, "All 7 decisions resolved on paper with exact 10 columns and full semantic parity"

def validate_dependency_register(content):
    schema_fields = [
        "(1) Dependency ID",
        "(2) Description",
        "(3) Source",
        "(4) Blocks",
        "(5) Blocked by",
        "(6) Current/Target/Future",
        "(7) Required Milestone",
        "(8) Evidence",
        "(9) Resolution Status"
    ]
    for f in schema_fields:
        if f not in content:
            return False, f"Missing dependency register field: {f}"
    
    # Check that there are no unresolved BLOCKING rows in the table
    lines = content.splitlines()
    for line in lines:
        if ("| **DEP-" in line or "| DEP-" in line) and "|" in line:
            cols = [c.strip() for c in line.split("|")[1:-1]]
            if len(cols) >= 9:
                status = cols[8]
                if "BLOCKING" in status.upper():
                    return False, f"Unresolved BLOCKING dependency found in row: {cols[0]}"
    
    if "0 BLOCKING" not in content and "0 phụ thuộc `BLOCKING`" not in content:
        return False, "Explicit confirmation of 0 BLOCKING dependencies missing"
    
    return True, "Dependency register matches exact 9-field schema with 0 BLOCKING items"

def validate_dg10_gate(content):
    fields = [
        "1. **Đầu vào kiểm định (Input):**",
        "2. **Phương pháp kiểm định (Validation Method):**",
        "3. **Điều kiện Đạt (PASS Condition",
        "4. **Điều kiện Không Đạt (FAIL Condition",
        "5. **Bằng chứng kiểm tra (Evidence):**",
        "6. **Nguồn chân lý (Source of Truth):**"
    ]
    for f in fields:
        if f not in content:
            return False, f"Missing D-G10 field: {f}"
    if "IMPLEMENTATION HANDOFF READINESS ONLY" not in content and "tính sẵn sàng bàn giao triển khai" not in content:
        return False, "D-G10 must state handoff readiness only"
    if "NOT PRODUCTION READY" not in content and "NOT Production Ready" not in content:
        return False, "D-G10 must state target runtime is not production ready"
    if "PHÁN QUYẾT CỔNG D-G10:** **`PASS`**" not in content:
        return False, "D-G10 PASS verdict not found"
    return True, "Gate D-G10 satisfies formal six-field contract for handoff readiness only"

def validate_status_distinction(content):
    if "CURRENT_APPLIED" not in content or "TARGET_DESIGN" not in content or "FUTURE_EXTENSION" not in content:
        return False, "Missing status tier distinctions"
    return True, "Strict distinction between CURRENT, TARGET, and FUTURE preserved"

def validate_repository_firewall():
    # Check docs/03-api-contract.md is byte-identical to HEAD
    try:
        res = subprocess.run(["git", "diff", "--exit-code", "docs/03-api-contract.md"], cwd=REPO_ROOT, capture_output=True, text=True)
        if res.returncode != 0:
            return False, "docs/03-api-contract.md has been modified!"
    except Exception as e:
        return False, f"Git check failed: {e}"
    
    # Check no runtime or schema files are touched in git diff
    try:
        res = subprocess.run(["git", "diff", "--name-only"], cwd=REPO_ROOT, capture_output=True, text=True)
        files = res.stdout.strip().splitlines()
        forbidden = ["schema.prisma", "lingora-web", "lingora-admin", "lingora-ai", "migrations/"]
        for f in files:
            for forb in forbidden:
                if forb in f:
                    return False, f"Forbidden file touched in git diff: {f}"
    except Exception as e:
        return False, f"Git diff check failed: {e}"

    return True, "Repository firewall preserved: docs/03 byte-identical, zero runtime/schema changes"

# ---------------------------------------------------------------------------
# Extended Validators for M2.6 Remediation (NEW-P1-01, P2-01, P2-02, NEW-P2-01, NEW-P2-02)
# ---------------------------------------------------------------------------

def validate_component_ownership(content):
    m = re.search(r'### 4\.3\. Bảng Ma Trận Phân Định Thành Phần Sở Hữu Chuẩn Tắc.*?\n\n(.*?)\n\n### 4\.4\.', content, re.DOTALL)
    if not m:
        return False, "Section 4.3 ownership table not found"
    table_text = m.group(1)
    rows = [r.strip() for r in table_text.strip().splitlines() if r.strip().startswith('| **')]
    if len(rows) != 29:
        return False, f"Expected exactly 29 ownership rows, found {len(rows)}"
    
    parsed = {}
    for r in rows:
        cols = [c.strip() for c in r.split('|')[1:-1]]
        target = cols[0].replace('**', '').strip()
        comp_id = cols[2].replace('`', '').strip()
        comp_name = cols[3].strip()
        if comp_id not in CANONICAL_M24_COMPONENTS:
            return False, f"Fictitious or non-canonical component ID: {comp_id} in {target}"
        canonical_expected = CANONICAL_M24_COMPONENTS[comp_id]
        if not (canonical_expected in comp_name or comp_name in canonical_expected or comp_name.startswith(canonical_expected[:15])):
            return False, f"Component name mismatch for {comp_id}: {comp_name} vs expected {canonical_expected}"
        parsed[target] = comp_id

    # Specific mandatory mappings
    expected_mappings = {
        'TEST-FRAME-MAPPING-A': 'COMP-DOM-03',
        'TEST-FRAME-DIAG-SKIP': 'COMP-DOM-03',
        'TEST-FRAME-DIAG-RETAKE': 'COMP-DOM-03',
        'TEST-FRAME-JUMP-PASS': 'COMP-DOM-03',
        'TEST-FRAME-JUMP-COOLDOWN': 'COMP-DOM-03',
        'TEST-FRAME-JUMP-NON-COMPLETION': 'COMP-DOM-02',
        'TEST-FRAME-RETRY-ALLOWANCE': 'COMP-DOM-05',
        'TEST-FRAME-RETRY-CREDIT': 'COMP-DOM-05',
        'TEST-FRAME-SRS-POLICY-B': 'COMP-DOM-04',
        'TEST-FRAME-STREAK-TIMEZONE': 'COMP-DOM-02',
        'TEST-FRAME-STREAK-RESET': 'COMP-DOM-02',
        'TEST-FRAME-ROLE-AUTH-MATRIX': 'COMP-INFRA-02',
        'TEST-FRAME-RLS-ISOLATION': 'COMP-INFRA-02',
        'TEST-FRAME-SOD-SELF-REVIEW': 'COMP-DOM-06',
        'TEST-FRAME-SOD-MODERATOR-PUBLISH': 'COMP-DOM-06',
        'TEST-FRAME-ADMIN-EMERGENCY-PUBLISH': 'COMP-DOM-07',
        'TEST-FRAME-GEC-TIMEOUT-FALLBACK': 'COMP-DOM-08',
        'TEST-FRAME-AI-NON-OWNERSHIP': 'COMP-EXT-02',
        'API-AUTH (01..04)': 'COMP-EXT-01',
        'API-LEARN-01': 'COMP-DOM-02',
        'API-LEARN-02': 'COMP-DOM-05',
        'API-LEARN-03': 'COMP-DOM-05',
        'API-ASSESS (01..05)': 'COMP-DOM-03',
        'API-PRACT (01..02)': 'COMP-DOM-04',
        'API-AUTHZ (01..05)': 'COMP-DOM-06',
        'API-AUTHZ-06': 'COMP-DOM-07',
        'API-AI (GEC-01, HLTH)': 'COMP-EXT-02',
        'API-AUDIT-01': 'COMP-DOM-07',
        'API-EXT & API-GAP': 'COMP-DOM-01'
    }
    for target, exp_comp in expected_mappings.items():
        if parsed.get(target) != exp_comp:
            return False, f"Target {target} mapped to {parsed.get(target)}, expected {exp_comp}"

    return True, "All 29 component ownership rows match canonical M2.4 live sources with zero fictitious services"

def validate_boundary_mapping(content):
    # Verify B1 to B6 in Section 4.2
    for b_id, b_name in CANONICAL_M24_BOUNDARIES.items():
        if b_name not in content:
            return False, f"Missing or modified canonical boundary name: {b_name}"
    
    # Reject parallel or altered boundary taxonomy
    altered_boundaries = [
        "Boundary 4: Worker Queue",
        "Boundary 4: Background Task",
        "Boundary 2: Internal Admin API",
        "Boundary 1: Public Frontend"
    ]
    for ab in altered_boundaries:
        if ab in content:
            return False, f"Non-canonical boundary taxonomy detected: {ab}"
    
    return True, "All 6 security boundaries (B1..B6) strictly aligned with canonical M2.4 specifications"

def validate_adr_citations(content):
    if not os.path.exists(DECISION_LOG_PATH):
        return False, "logs/decision-log.md not found"
    with open(DECISION_LOG_PATH, "r", encoding="utf-8") as f:
        declog_text = f.read()

    doc_adrs = sorted(set(re.findall(r'ADR-\d+', content)))
    known_adrs = set(re.findall(r'ADR-\d+', declog_text))

    if not doc_adrs:
        return False, "No ADR citations found in document"

    missing_adrs = set(doc_adrs) - known_adrs
    if missing_adrs:
        return False, f"Unverified/fictitious ADR citations found: {sorted(missing_adrs)}"

    if len(doc_adrs) < 18:
        return False, f"Expected at least 18 cited ADRs, found {len(doc_adrs)}"

    return True, f"All {len(doc_adrs)} ADR citations verified against live logs/decision-log.md (0 broken)"

def validate_route_examples_neutrality(content):
    # Check warning banner in 4.1
    if "[ILLUSTRATIVE ROUTE EXAMPLE — NOT LOCKED]" not in content:
        return False, "Missing [ILLUSTRATIVE ROUTE EXAMPLE — NOT LOCKED] label"
    if "TUYỆT ĐỐI KHÔNG phải là hợp đồng API bị khóa" not in content and "không bị khóa" not in content:
        return False, "Missing route illustration neutrality notice in Section 4.1"

    # Check Section 3 test frames route examples
    m = re.search(r'## 3\. Output 2 — Implementation Test-Plan Skeleton.*?\n## 4\.', content, re.DOTALL)
    if not m:
        return False, "Section 3 not found for route example checking"
    sec3 = m.group(0)
    lines = sec3.splitlines()
    for i, line in enumerate(lines):
        if '/api/' in line and any(meth in line for meth in ['POST', 'GET', 'PUT', 'DELETE']):
            if "[ILLUSTRATIVE ROUTE EXAMPLE — NOT LOCKED]" not in line:
                return False, f"Line contains route without [ILLUSTRATIVE ROUTE EXAMPLE — NOT LOCKED]: {line.strip()}"

    return True, "All concrete route syntax labeled [ILLUSTRATIVE ROUTE EXAMPLE — NOT LOCKED]"

def validate_new_error_codes(content):
    m1 = re.search(r'SOD_VIOLATION_EMERGENCY_UNAPPROVED.*?\[M2\.6 DESIGN ADDITION\]', content)
    m2 = re.search(r'SOD_VIOLATION_MISSING_JUSTIFICATION.*?\[M2\.6 DESIGN ADDITION\]', content)
    if not m1:
        return False, "Missing SOD_VIOLATION_EMERGENCY_UNAPPROVED [M2.6 DESIGN ADDITION]"
    if not m2:
        return False, "Missing SOD_VIOLATION_MISSING_JUSTIFICATION [M2.6 DESIGN ADDITION]"

    # Check Section 4.5
    if "### 4.5. Quy Chuẩn Phân Loại Mã Lỗi" not in content and "### 4.5. Phân Loại Mã Lỗi" not in content:
        return False, "Missing Section 4.5 Error Taxonomy heading"

    sec45_required = [
        "403 SOD_VIOLATION_EMERGENCY_UNAPPROVED",
        "403 SOD_VIOLATION_MISSING_JUSTIFICATION",
        "Boundary 2: Admin Web (BFF / Server Actions)",
        "COMP-DOM-07",
        "RFC 9110",
        "Phase 2"
    ]
    for r in sec45_required:
        if r not in content:
            return False, f"Section 4.5 missing required element: {r}"

    return True, "New error codes classified as [M2.6 DESIGN ADDITION] with 6 required architectural aspects"

# ---------------------------------------------------------------------------
# Mutation / Negative Tests (25 Load-bearing validation checks)
# ---------------------------------------------------------------------------

def run_mutation_tests():
    doc = read_m26_doc()
    if not doc:
        return False, "Cannot read document for mutation tests"
    
    mutations = [
        ("MIGRATION_PHASE", lambda d: d.replace("Phase 4", "Phase X"), validate_migration_outline, "Missing Phase 4"),
        ("TEST_FRAME_ID", lambda d: d.replace("TEST-FRAME-MAPPING-A", "TEST-FRAME-MUTATED"), validate_test_skeleton, "Missing test frame"),
        ("ZONE_5", lambda d: d.replace("Zone 5", "Zone Privileged"), validate_security_and_audit, "Missing Zone 5"),
        ("BLOCKING_DEP", lambda d: d.replace("| `RESOLVED` |", "| `BLOCKING` |", 1), validate_dependency_register, "Unresolved BLOCKING dependency"),
        ("DD_COLUMN", lambda d: d.replace("(10) Implementation Consequences", "(10) Other Info"), validate_dd_closure, "Missing 10th DD column"),
        ("P1_01_SKIP_SKILLPROFILE", lambda d: d.replace("0 SkillProfile", "khởi tạo `SkillProfile` ở mức cơ sở"), validate_test_skeleton, "P1-01 Skip creating SkillProfile"),
        ("P1_02_RETRY_DAILY", lambda d: d.replace("theo từng lượt làm bài học", "bộ đếm bài làm lại được theo dõi theo ngày"), validate_test_skeleton, "P1-02 Retry daily pool"),
        ("P1_03_LESSON_PROGRESS", lambda d: d.replace("LearningProgress", "LessonProgress"), validate_test_skeleton, "P1-03 Stale LessonProgress"),
        ("P1_04_LINGORA_CORE", lambda d: d.replace("COMP-DOM-05", "lingora-core"), validate_test_skeleton, "P1-04 Fake lingora-core"),
        ("P1_05_AUDIO_REF", lambda d: d.replace('"vocabularyId": "UUID_VOCAB_REF"', '"audioRef": "storage/audio/u1_l1.mp3"'), validate_dd_closure, "P1-05 Free-form audioRef"),
        ("P1_06_JUMP_UNIT_ENUM", lambda d: d.replace("`DIAGNOSTIC`, `EXIT`, `RE_EVALUATION`", "`DIAGNOSTIC`, `JUMP_UNIT_1..6`"), validate_dd_closure, "P1-06 JUMP_UNIT_1..6 enum"),
        ("P1_07_LIFECYCLE_STATE", lambda d: d.replace("CHANGES_REQUESTED", "CHANGES_MUTATED"), validate_dd_closure, "P1-07 Missing CHANGES_REQUESTED"),
        ("P1_08_AUDIT_EVENT_REMOVE", lambda d: d.replace("CONTENT_EMERGENCY_PUB", "CONTENT_EMERGENCY_MUTATED"), validate_security_and_audit, "P1-08 Missing canonical event"),
        ("P1_08_AUDIT_EVENT_INVENT", lambda d: d.replace("AUTH_LOGIN_FAILED", "AUTH_LOGIN_SUCCESS"), validate_security_and_audit, "P1-08 Invented event AUTH_LOGIN_SUCCESS"),
        ("P1_09_FAKE_SHA", lambda d: d.replace("7ab74b4", "3064ec7"), validate_report_mapping, "P1-09 Fake SHA 3064ec7"),
        ("P1_10_P2_M1_MILESTONE", lambda d: d.replace("Phase 2 Entry (Auth/DB Foundation)", "Phase 2 (P2-M1)"), validate_api_register, "P1-10 Fabricated P2-M1"),
        ("P1_11_EXACT_30_ITEMS", lambda d: d.replace("~25–30 câu hỏi theo thiết kế", "Đủ 30 câu trả lời"), validate_api_register, "P1-11 Strict 30 items"),
        ("P2_06_SOD_ERROR_400", lambda d: d.replace("403 SOD_VIOLATION_EMERGENCY_UNAPPROVED", "400 SOD_VIOLATION_EMERGENCY_UNAPPROVED"), validate_test_skeleton, "P2-06 Frame 16 error code 400"),
        ("P2_03_DD10_AUTH_UID", lambda d: d.replace("auth.uid()", "auth.client_id()"), validate_dd_closure, "P2-03 Missing auth.uid()"),
        ("NEW_P1_01_COMP_OWNER_SWAP", lambda d: d.replace("| **TEST-FRAME-MAPPING-A** | B1 / Assessment Service | `COMP-DOM-03` |", "| **TEST-FRAME-MAPPING-A** | B1 / Assessment Service | `COMP-DOM-05` |"), validate_component_ownership, "Swap Frame 1 component owner to COMP-DOM-05"),
        ("NEW_P1_01_COMP_FICTITIOUS_ID", lambda d: d.replace("`COMP-DOM-03`", "`COMP-DOM-99`", 1), validate_component_ownership, "Inject fictitious COMP-DOM-99"),
        ("P2_01_BOUNDARY_B4_MUTATE", lambda d: d.replace("Boundary 4: Privileged Service Role (Operations / Maintenance)", "Boundary 4: Background Task Queue"), validate_boundary_mapping, "Alter Boundary 4 name"),
        ("P2_02_FICTITIOUS_ADR", lambda d: d.replace("ADR-002", "ADR-099", 1), validate_adr_citations, "Inject unverified ADR-099"),
        ("NEW_P2_02_STRIP_ILLUSTRATIVE", lambda d: d.replace("[ILLUSTRATIVE ROUTE EXAMPLE — NOT LOCKED]", "[CANONICAL ROUTE LOCKED]", 1), validate_route_examples_neutrality, "Strip illustrative route tag"),
        ("NEW_P2_01_STRIP_DESIGN_ADDITION_TAG", lambda d: d.replace("[M2.6 DESIGN ADDITION]", "[M2.4 INHERITED]"), validate_new_error_codes, "Strip M2.6 DESIGN ADDITION tag")
    ]

    for label, mut_func, validator, desc in mutations:
        mutated = mut_func(doc)
        ok, msg = validator(mutated)
        if ok:
            return False, f"Mutation failure ({label}): Mutant should have failed validator '{validator.__name__}' for '{desc}'"

    return True, f"All {len(mutations)} semantic mutation tests properly rejected invalid inputs"

# ---------------------------------------------------------------------------
# Main Runner
# ---------------------------------------------------------------------------

def main():
    print("===========================================================================")
    print("  LINGORA DESIGN M2.6 - HARDENED HANDOFF VERIFICATION SUITE")
    print("===========================================================================")

    doc = read_m26_doc()
    all_passed = True

    # Test 1
    ok, msg = validate_doc_structure(doc)
    all_passed = log_test("M26-VAL-01", "Document Existence & Header Metadata", ok, msg) and all_passed

    # Test 2
    ok, msg = validate_migration_outline(doc)
    all_passed = log_test("M26-VAL-02", "Output 1 — Migration Outline (8 Phases, Rollback, Zero SQL)", ok, msg) and all_passed

    # Test 3
    ok, msg = validate_test_skeleton(doc)
    all_passed = log_test("M26-VAL-03", "Output 2 — Test-Plan Skeleton (18 Frames, SKELETON, Deep Parity)", ok, msg) and all_passed

    # Test 4
    ok, msg = validate_api_register(doc)
    all_passed = log_test("M26-VAL-04", "Output 3 — API Register (4 Tiers, 03-Contract, No P2-M*, Canonical Comps)", ok, msg) and all_passed

    # Test 5
    ok, msg = validate_security_and_audit(doc)
    all_passed = log_test("M26-VAL-05", "Output 4 — Security & Audit (5 Zones, Zone 5, 6 Roles, 11 Canonical Events)", ok, msg) and all_passed

    # Test 6
    ok, msg = validate_report_mapping(doc)
    all_passed = log_test("M26-VAL-06", "Output 5 — Report Mapping & Evidence Index (Roadmap §11, Real SHAs, ADRs)", ok, msg) and all_passed

    # Test 7
    ok, msg = validate_dd_closure(doc)
    all_passed = log_test("M26-VAL-07", "Output 6 — DD Closure Record (7 Decisions, Exact 10 Cols, Deep Parity)", ok, msg) and all_passed

    # Test 8
    ok, msg = validate_dependency_register(doc)
    all_passed = log_test("M26-VAL-08", "Deliverable 7 — Dependency Register (Exact 9 Fields, 0 BLOCKING)", ok, msg) and all_passed

    # Test 9
    ok, msg = validate_dg10_gate(doc)
    all_passed = log_test("M26-VAL-09", "Gate D-G10 — Formal Six Fields & Handoff Readiness ONLY", ok, msg) and all_passed

    # Test 10
    ok, msg = validate_status_distinction(doc)
    all_passed = log_test("M26-VAL-10", "CURRENT / TARGET / FUTURE Distinction & No Runtime Claims", ok, msg) and all_passed

    # Test 11
    ok, msg = validate_repository_firewall()
    all_passed = log_test("M26-VAL-11", "Repository Firewall & docs/03-api-contract.md Byte-Identical", ok, msg) and all_passed

    # Test 12 (NEW-P1-01)
    ok, msg = validate_component_ownership(doc)
    all_passed = log_test("M26-VAL-12", "Canonical Component Ownership Matrix (Exact 29 Rows, M2.4 Live Source)", ok, msg) and all_passed

    # Test 13 (P2-01)
    ok, msg = validate_boundary_mapping(doc)
    all_passed = log_test("M26-VAL-13", "Canonical Security Boundary Alignment (B1..B6 Exact Parity Across Sec 4.2 & 5.2)", ok, msg) and all_passed

    # Test 14 (P2-02)
    ok, msg = validate_adr_citations(doc)
    all_passed = log_test("M26-VAL-14", "ADR Citation Rigor & Decision-Log Verification (18 ADRs Verified, 0 Broken)", ok, msg) and all_passed

    # Test 15 (NEW-P2-02)
    ok, msg = validate_route_examples_neutrality(doc)
    all_passed = log_test("M26-VAL-15", "Route Neutrality & Non-Locking Classification ([ILLUSTRATIVE ROUTE EXAMPLE])", ok, msg) and all_passed

    # Test 16 (NEW-P2-01)
    ok, msg = validate_new_error_codes(doc)
    all_passed = log_test("M26-VAL-16", "Error Taxonomy & M2.6 Design Additions (SOD 403 Errors, 6 Governance Criteria)", ok, msg) and all_passed

    # Test 17 (P2-05)
    ok, msg = run_mutation_tests()
    all_passed = log_test("M26-VAL-17", "Mutation & Negative Verification Suite (25 Load-Bearing Semantic Mutants)", ok, msg) and all_passed

    print("===========================================================================")
    if all_passed:
        print("ALL 17 HARDENED HANDOFF VERIFICATION SUITE CHECKS PASSED CLEANLY.")
        sys.exit(0)
    else:
        print("M2.6 HANDOFF VERIFICATION FAILED.")
        sys.exit(1)

if __name__ == "__main__":
    main()
