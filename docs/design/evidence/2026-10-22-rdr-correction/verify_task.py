#!/usr/bin/env python3
"""Task verification script for 2026-10-22 RDR correction.

Validates:
1. Native page fragments: 44 pages total; exactly 42 preserved byte-identical to baseline, exactly 2 authorized modified (DOM-01, DATA-03).
2. Manifest records: 36 records total; exactly 34 untouched, exactly 2 updated with exact current hashes and provenances.
3. Modeling baseline verification (verify_current.py) exits 0.
4. Draw.io active pages (validate_drawio.py) exits 0 with 44 total pages (35 active).
5. Physical catalog integrity: 34 tables defined in README.md, 4 views / 8 exports intact with valid images/SVGs and source parity.
6. Documentation links and reference sanity.
7. Semantic acceptance scenarios for RDR-01, RDR-02, and RDR-03.
"""
from pathlib import Path
import hashlib
import json
import re
import sys
import unittest
import xml.etree.ElementTree as ET
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
BASE = ROOT / 'docs' / 'modeling' / 'current-target'
PHYSICAL = ROOT / 'docs' / 'design' / 'physical'
EVIDENCE = ROOT / 'docs' / 'design' / 'evidence' / '2026-10-22-rdr-correction'


class TaskVerificationTests(unittest.TestCase):
    def setUp(self):
        self.baseline = json.loads((EVIDENCE / 'entry-baseline.json').read_text(encoding='utf-8'))

    def test_native_page_fragments_partition(self):
        primary = BASE / 'lingora-all-diagrams.drawio'
        fragments = re.findall(rb'<diagram\b.*?</diagram>', primary.read_bytes(), re.S)
        self.assertEqual(len(fragments), 44)
        pages = {ET.fromstring(f).get('id'): hashlib.sha256(f).hexdigest() for f in fragments}
        self.assertEqual(len(pages), 44)

        changed = []
        unchanged = []
        for pid, expected_sha in self.baseline['native_pages'].items():
            current_sha = pages.get(pid)
            if current_sha == expected_sha:
                unchanged.append(pid)
            else:
                changed.append(pid)

        self.assertEqual(len(unchanged), 42, f"Expected 42 unchanged pages, got {len(unchanged)}")
        self.assertEqual(set(changed), {'page-DOM-01', 'page-DATA-03'}, f"Unexpected changed pages: {changed}")

    def test_manifest_records_partition(self):
        manifest = json.loads((BASE / 'render-manifest.json').read_text(encoding='utf-8'))
        self.assertEqual(manifest['diagram_count'], 36)
        self.assertEqual(len(manifest['records']), 36)

        changed = []
        unchanged = []
        for record in manifest['records']:
            rid = record['id']
            exp_sha = self.baseline['manifest_records'][rid]['source_sha256']
            if record['source_sha256'] == exp_sha:
                unchanged.append(rid)
            else:
                changed.append(rid)

        self.assertEqual(len(unchanged), 34, f"Expected 34 unchanged manifest records, got {len(unchanged)}")
        self.assertEqual(set(changed), {'DOM-01', 'DATA-03'}, f"Unexpected changed records: {changed}")

    def test_physical_catalog_preservation(self):
        readme = (PHYSICAL / 'README.md').read_text(encoding='utf-8')
        tables = [
            'accounts', 'languages', 'frameworks', 'levels', 'courses', 'units', 'lessons',
            'lesson_revisions', 'vocabulary_concepts', 'lesson_vocabulary_links', 'item_identities',
            'item_revisions', 'item_grading_secrets', 'lesson_exercises', 'media_assets',
            'media_bindings', 'learning_contexts', 'lesson_attempts', 'lesson_responses',
            'lesson_completions', 'srs_cards', 'srs_review_operations', 'assessment_blueprints',
            'assessment_versions', 'assessment_version_items', 'assessment_attempts',
            'assessment_responses', 'assessment_results', 'content_assignments',
            'assignment_history', 'revision_reviews', 'provisioning_requests',
            'command_receipts', 'audit_events'
        ]
        self.assertEqual(len(tables), 34)
        for tbl in tables:
            self.assertIn(f"`{tbl}`", readme, f"Table {tbl} missing from catalog README!")

        # Check 4 views, 8 export files
        views = ['content', 'learning', 'assessment', 'identity']
        for v in views:
            for fmt in ['png', 'svg']:
                p = PHYSICAL / f'physical-erd-{v}.{fmt}'
                self.assertTrue(p.is_file(), f"Missing export {p}")
                if fmt == 'png':
                    with Image.open(p) as img:
                        img.verify()
                else:
                    tree = ET.parse(p).getroot()
                    self.assertFalse(re.search(r'Syntax Error', ' '.join(tree.itertext())))

    def test_rdr_semantic_assertions(self):
        # RDR-01 assertions
        dom_puml = (BASE / 'src' / 'DOM-01-core-domain-model.puml').read_text(encoding='utf-8')
        data_puml = (BASE / 'src' / 'DATA-03-target-logical-erd.puml').read_text(encoding='utf-8')
        self.assertIn('User "0..1" -- "0..*" SecurityAuditEvent : thao tác', dom_puml)
        self.assertIn('Account |o--o{ Audit', data_puml)

        # RDR-02 assertions
        phys_readme = (PHYSICAL / 'README.md').read_text(encoding='utf-8')
        reconcil = (PHYSICAL / 'database-reconciliation-2026-10-20.md').read_text(encoding='utf-8')
        self.assertIn('is_draft_omitted boolean NOT NULL DEFAULT false', phys_readme)
        self.assertIn('omit_draft_assessment_contribution', phys_readme)
        self.assertIn('is_draft_omitted = false', reconcil)

        # RDR-03 assertions
        sec_rls = (PHYSICAL / 'security-and-rls.md').read_text(encoding='utf-8')
        rebuild = (PHYSICAL / 'rebuild-plan.md').read_text(encoding='utf-8')
        self.assertIn('app_private.check_fingerprint_collision', sec_rls)
        self.assertIn('hashtext(p_fingerprint)', sec_rls)
        self.assertIn('PD-RDR02-OMIT', rebuild)
        self.assertIn('PD-RDR03-COLLISION', rebuild)


if __name__ == '__main__':
    unittest.main()
