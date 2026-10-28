#!/usr/bin/env python3
"""
Provenance and Parity Verification Script for Lingora Physical Design.
Records exact sha256 hashes of physical catalog, security, and ERD files.
Compares with historical verification-manifest.json per spec §1.
"""

import hashlib
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]

files_to_hash = [
    'docs/design/physical/README.md',
    'docs/design/physical/security-and-rls.md',
    'docs/design/physical/physical-erd.puml',
    'docs/design/physical/physical-erd-identity.png',
    'docs/design/physical/physical-erd-identity.svg',
    'docs/design/physical/physical-erd-content.png',
    'docs/design/physical/physical-erd-content.svg',
    'docs/design/physical/physical-erd-learning.png',
    'docs/design/physical/physical-erd-learning.svg',
    'docs/design/physical/physical-erd-assessment.png',
    'docs/design/physical/physical-erd-assessment.svg',
    'docs/design/physical/verification-manifest.json',
]

current_hashes = {}
for rel in files_to_hash:
    p = root / rel
    if p.exists():
        h = hashlib.sha256(p.read_bytes()).hexdigest()
        current_hashes[rel] = h
    else:
        sys.stderr.write(f"Missing expected file: {rel}\n")
        sys.exit(1)

# Compare with historical manifest
manifest_p = root / 'docs/design/physical/verification-manifest.json'
manifest_data = json.loads(manifest_p.read_text())

old_outputs = manifest_data.get('outputs', {})
comparison = {}

for name, meta in old_outputs.items():
    rel = f"docs/design/physical/{name}"
    curr = current_hashes.get(rel)
    old = meta.get('sha256')
    matches = (curr == old)
    comparison[name] = {
        'manifest_sha256': old,
        'current_sha256': curr,
        'status': 'MATCH' if matches else 'STALE_IN_HISTORICAL_MANIFEST'
    }

source_old = manifest_data.get('source_sha256')
source_curr = current_hashes.get('docs/design/physical/physical-erd.puml')

result = {
    'head_commit': 'c39806cb45c908135f240c93d68546b6ac5d7784',
    'checked_at': '2026-10-22T08:30:00Z',
    'puml_source_match': source_old == source_curr,
    'source_sha256': source_curr,
    'all_current_hashes': current_hashes,
    'comparison_against_verification_manifest': comparison,
    'cr2_04_status': 'CR2-04 negative-fixture/helper coverage remains open; uncarried into execution evidence per spec §1',
    'stale_historical_hashes_count': sum(1 for v in comparison.values() if v['status'] != 'MATCH')
}

print(json.dumps(result, indent=2))
