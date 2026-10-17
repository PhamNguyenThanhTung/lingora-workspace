"""Check the exact merge and preservation boundary for this maintenance task."""
import hashlib
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
BASE = HERE.parents[1]
ROOT = BASE.parents[2]
ACT = BASE/'evidence/2026-10-16-activity-layout'
IDS = {'page-ACT-'+n for n in ('01', '02', '03', '04', '06', '07', '08', '09')}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pages(path):
    fragments = re.findall(rb'<diagram\b.*?</diagram>', path.read_bytes(), re.S)
    result = {ET.fromstring(fragment).get('id'): hashlib.sha256(fragment).hexdigest() for fragment in fragments}
    assert len(fragments) == len(result) == 44
    return result


def main():
    baseline = json.loads((HERE/'baseline.json').read_text(encoding='utf-8'))
    current = pages(BASE/'lingora-all-diagrams.drawio')
    candidate = pages(ACT/'candidate.drawio')
    assert current.keys() == baseline['pages'].keys()
    assert all(current[k] == candidate[k] for k in IDS), 'Activity merge differs from reviewed candidate'
    assert all(current[k] == v for k, v in baseline['pages'].items() if k not in IDS), 'unrelated page changed'
    print('PASS: eight exact candidate Activity pages; other 36 pages including DOM byte-identical.')
    allowed = {'plans/current-task.md', 'HANDOFF.md', 'docs/QUICK-REF.md', 'docs/README.md',
               'docs/modeling/current-target/README.md', 'docs/modeling/current-target/render-manifest.json',
               'docs/modeling/current-target/lingora-all-diagrams.drawio',
               'docs/modeling/current-target/rendered/ACT-07-teacher-provisioning.png',
               'logs/test-log.md', 'logs/development-log.md'}
    changed = {name for name, digest in baseline['tracked'].items()
               if not (ROOT/name).is_file() or sha(ROOT/name) != digest}
    assert changed <= allowed, 'out of scope tracked files: '+str(changed-allowed)
    print('PASS: all canonical sources, historical evidence, application code and unrelated tracked files preserved.')
    rows = json.loads((BASE/'render-manifest.json').read_text(encoding='utf-8'))['records']
    entry = json.loads((HERE/'entry-manifest.json').read_text(encoding='utf-8'))['records']
    assert next(r for r in rows if r['id']=='DOM-01') == next(r for r in entry if r['id']=='DOM-01')
    assert 'PASS' in (ACT/'independent-review.md').read_text(encoding='utf-8')
    assert 'PASS' in (HERE/'provenance-review.md').read_text(encoding='utf-8')
    print('PASS: DOM manifest unchanged; independent Activity and provenance reviews recorded.')
    for doc in [ROOT/'plans/current-task.md', ROOT/'HANDOFF.md', ROOT/'docs/README.md',
                ROOT/'docs/QUICK-REF.md', BASE/'README.md', BASE/'modeling-closeout-2026-10-16.md']:
        for link in re.findall(r'\]\(([^)]+)\)', doc.read_text(encoding='utf-8-sig')):
            if not re.match(r'https?://|#', link):
                assert (doc.parent/link.split('#')[0]).exists(), f'broken link: {doc}: {link}'
    print('PASS: current documentation links resolve.')


if __name__ == '__main__':
    main()
