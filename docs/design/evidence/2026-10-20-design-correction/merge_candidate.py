"""Merge only the six independently accepted native fragments and provenance."""
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
MODEL = ROOT / 'docs/modeling/current-target'
sys.path.insert(0, str(ROOT / 'scripts'))
from validate_drawio import load_all_sources, validate_document


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    baseline = json.loads((HERE / 'baseline.json').read_text(encoding='utf-8'))
    report = json.loads((HERE / 'native/final-report.json').read_text(encoding='utf-8'))
    candidate = (HERE / 'native/candidate.drawio').read_bytes()
    review = (HERE / 'native-independent-review.md').read_text(encoding='utf-8')
    assert report['candidate_sha256'] == sha(candidate)
    assert '**Verdict: PASS**' in review and sha(candidate) in review
    assert not validate_document(ET.fromstring(candidate), load_all_sources())
    ids = set(baseline['edited_ids'])
    assert set(report['pages']) == ids
    pattern = rb'<diagram\b.*?</diagram>'
    fragments = {ET.fromstring(p).get('id'): p for p in re.findall(pattern, candidate, re.S)}
    primary = MODEL / 'lingora-all-diagrams.drawio'
    before = primary.read_bytes()
    current = {ET.fromstring(p).get('id'): sha(p) for p in re.findall(pattern, before, re.S)}
    assert len(fragments) == len(current) == 44
    assert all(current[k] == baseline['pages'][k] == sha(v)
               for k, v in fragments.items() if k[5:] not in ids)
    assert all(current[k] in {baseline['pages'][k], sha(v)}
               for k, v in fragments.items() if k[5:] in ids), 'unexpected edit in target page'
    for diagram_id, row in report['pages'].items():
        assert diagram_id in ids
        source = next((MODEL / 'src').glob(diagram_id + '-*.puml'))
        assert sha(source.read_bytes()) == row['source_sha256'], diagram_id
        assert sha(fragments['page-' + diagram_id]) == row['page_fragment_sha256']
        for fmt in ('png', 'svg'):
            assert sha((HERE / 'native' / (diagram_id + '.' + fmt)).read_bytes()) == row[fmt + '_sha256']
    after = re.sub(pattern, lambda m: fragments[ET.fromstring(m[0]).get('id')]
                   if ET.fromstring(m[0]).get('id')[5:] in ids else m[0], before, flags=re.S)
    manifest_path = MODEL / 'render-manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    for row in manifest['records']:
        diagram_id = row['id']
        if diagram_id not in ids:
            continue
        row['source_sha256'] = sha((MODEL / row['source']).read_bytes())
        row['output_sha256'] = {fmt: sha((MODEL / name).read_bytes()) for fmt, name in row['outputs'].items()}
        row['native_page_sha256'] = sha(fragments['page-' + diagram_id])
        row['native_outputs'] = {fmt: os.path.relpath(HERE / 'native' / (diagram_id + '.' + fmt), MODEL).replace('\\', '/')
                                 for fmt in ('png', 'svg')}
        row['native_output_sha256'] = {fmt: report['pages'][diagram_id][fmt + '_sha256'] for fmt in ('png', 'svg')}
    primary.write_bytes(after)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (HERE / 'merge.json').write_text(json.dumps({
        'verdict': 'PASS', 'candidate_sha256': sha(candidate), 'primary_sha256': sha(after),
        'changed_ids': sorted(ids), 'preserved_pages': 38,
        'page_sha256': {k: sha(v) for k, v in fragments.items()},
    }, indent=2) + '\n', encoding='utf-8')
    print('PASS: six accepted fragments/provenance merged; 38 pages and 30 manifest records preserved.')


if __name__ == '__main__':
    main()
