"""Merge only independently accepted Activity fragments into the current primary."""
import hashlib
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
BASE = HERE.parents[1]
ACT = BASE/'evidence/2026-10-16-activity-layout'
IDS = {'page-ACT-'+n for n in ('01', '02', '03', '04', '06', '07', '08', '09')}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    candidate = (ACT/'candidate.drawio').read_bytes()
    assert sha(candidate) == 'b953f9469b2375fa1c4cbcb49d8088668d6c46393cbbcb18d921b0e43e633b30'
    review = (ACT/'independent-review.md').read_text(encoding='utf-8')
    assert '**Verdict: PASS' in review and sha(candidate) in review
    pattern = rb'<diagram\b.*?</diagram>'
    fragments = {ET.fromstring(p).get('id'): p for p in re.findall(pattern, candidate, re.S)}
    primary = BASE/'lingora-all-diagrams.drawio'
    before = primary.read_bytes()
    entry = json.loads((HERE/'baseline.json').read_text(encoding='utf-8'))['pages']
    current = {ET.fromstring(p).get('id'): sha(p) for p in re.findall(pattern, before, re.S)}
    assert len(current) == len(fragments) == 44 and current.keys() == entry.keys()
    assert all(current[k] == v for k, v in entry.items() if k not in IDS)
    assert all(current[k] in {entry[k], sha(fragments[k])} for k in IDS)
    after = re.sub(pattern, lambda m: fragments[ET.fromstring(m[0]).get('id')]
                   if ET.fromstring(m[0]).get('id') in IDS else m[0], before, flags=re.S)
    final = {ET.fromstring(p).get('id'): sha(p) for p in re.findall(pattern, after, re.S)}
    assert all(final[k] == entry[k] for k in entry if k not in IDS)
    manifest_path = BASE/'render-manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    for row in manifest['records']:
        if 'page-'+row['id'] not in IDS:
            continue
        row['native_page_sha256'] = final['page-'+row['id']]
        row['native_outputs'] = {fmt: (ACT/f'{row["id"]}.{fmt}').relative_to(BASE).as_posix() for fmt in ('png', 'svg')}
        row['native_output_sha256'] = {fmt: sha((BASE/path).read_bytes()) for fmt, path in row['native_outputs'].items()}
        assert all(digest in review for digest in row['native_output_sha256'].values())
    primary.write_bytes(after)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (HERE/'merge.json').write_text(json.dumps({'verdict': 'PASS', 'primary_sha256': sha(after),
        'candidate_sha256': sha(candidate), 'merged_pages': sorted(IDS), 'preserved_pages': 36,
        'page_sha256': final}, indent=2)+'\n', encoding='utf-8')
    print('PASS: eight reviewed Activity pages merged; 36 other pages byte-identical; export provenance recorded.')


if __name__ == '__main__':
    main()
