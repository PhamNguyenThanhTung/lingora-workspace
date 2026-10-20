"""Task-scoped design/artifact checks; never executes SQL or mutates artifacts."""
import copy
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
MODEL = ROOT / 'docs/modeling/current-target'
PHYSICAL = ROOT / 'docs/design/physical'
sys.path.insert(0, str(ROOT / 'scripts'))
from validate_drawio import load_all_sources, validate_document


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def visible(source):
    return '\n'.join(line.replace('\u2013', '-') if line.startswith('title ') else line
                     for line in source.strip().splitlines() if not line.lstrip().startswith("'"))


def table_line(catalog, table):
    match = re.search(r'^- \*\*`(?:app_private\.)?' + re.escape(table) + r'`:\*\*.*$', catalog, re.M)
    assert match, table
    return match[0]


def referenced_keys(catalog):
    """Resolve actual target declarations for the three documented scoped FK paths."""
    targets = {
        'lesson_attempts': [('id', 'lesson_revision_id'), ('id', 'context_id', 'lesson_id')],
        'lesson_exercises': [('id', 'lesson_revision_id')],
    }
    for table, required in targets.items():
        declared = {tuple(c.strip() for c in key.split(','))
                    for key in re.findall(r'UNIQUE\(([^)]+)\)', table_line(catalog, table))}
        assert set(required) <= declared, (table, required, declared)


def main():
    baseline = json.loads((HERE / 'baseline.json').read_text(encoding='utf-8'))
    ids = set(baseline['edited_ids'])
    sources = {row['id']: row for row in baseline['manifest']['records']}
    allowed = {'DESIGN.md', 'docs/README.md', 'docs/QUICK-REF.md', 'docs/05-traceability-matrix.md',
               'docs/modeling/current-target/README.md',
               'docs/modeling/current-target/lingora-all-diagrams.drawio',
               'docs/modeling/current-target/render-manifest.json',
               'logs/test-log.md', 'logs/development-log.md', 'HANDOFF.md', 'plans/current-task.md'}
    allowed |= {'docs/modeling/current-target/' + sources[i]['source'] for i in ids}
    allowed |= {'docs/modeling/current-target/' + output for i in ids for output in sources[i]['outputs'].values()}
    allowed |= {'docs/design/physical/' + n for n in ('README.md', 'security-and-rls.md', 'rebuild-plan.md', 'physical-erd.puml')}
    allowed |= {'docs/design/physical/physical-erd-' + v + '.' + f for v in ('content', 'learning') for f in ('svg', 'png')}
    changed = subprocess.check_output(['git', 'diff', baseline['head'], '--name-only'], cwd=ROOT, text=True).splitlines()
    untracked = subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard'], cwd=ROOT, text=True).splitlines()
    new_prefixes = ('docs/design/evidence/2026-10-20-design-correction/',
                    'docs/design/design-correction-2026-10-20.md',
                    'plans/archive/2026-10-20-design-correction-DONE.md')
    assert all(n in allowed or n.startswith(new_prefixes) for n in changed + untracked), changed + untracked
    preserved = {n: h for n, h in baseline['files'].items() if n not in allowed}
    for name, digest in preserved.items():
        assert sha(ROOT / name) == digest, name
    print(f'PASS: bounded changed paths; {len(preserved)} protected artifact/app/schema/history hashes unchanged.')

    primary = MODEL / 'lingora-all-diagrams.drawio'
    fragments = re.findall(rb'<diagram\b.*?</diagram>', primary.read_bytes(), re.S)
    pages = {ET.fromstring(f).get('id'): hashlib.sha256(f).hexdigest() for f in fragments}
    assert len(fragments) == len(pages) == 44
    assert all(pages[k] == h for k, h in baseline['pages'].items() if k[5:] not in ids)
    assert all(pages['page-' + i] != baseline['pages']['page-' + i] for i in ids)
    document = ET.parse(primary).getroot()
    canonical = load_all_sources()
    assert not validate_document(document, canonical)
    # Payload equality alone cannot detect a wrong visible relationship marker.
    data_source = canonical['DATA-03']
    aliases = dict(re.findall(r'entity "([^"]+)" as (\w+)', data_source))
    aliases = {alias: name for name, alias in aliases.items()}
    markers = {'||': 'ERmandOne', '|o': 'ERzeroToOne', 'o|': 'ERzeroToOne',
               'o{': 'ERzeroToMany', '|{': 'ERoneToMany'}
    expected_relations = {
        (aliases[a], aliases[b], markers[left], markers[right])
        for a, left, right, b in re.findall(r'^\s*(\w+)\s+([|o}]+)--([|o{]+)\s+(\w+)', data_source, re.M)
    }
    data_page = document.find("diagram[@id='page-DATA-03']")
    labels = {n.get('id'): n.get('label') for n in data_page.findall('.//UserObject')}
    actual_relations = set()
    for cell in data_page.findall('.//mxCell'):
        if cell.get('edge') != '1':
            continue
        style = dict(part.split('=', 1) for part in cell.get('style', '').split(';') if '=' in part)
        actual_relations.add((labels[cell.get('source')], labels[cell.get('target')],
                              style.get('startArrow'), style.get('endArrow')))
    assert len(expected_relations) == 21 and actual_relations == expected_relations, (actual_relations, expected_relations)
    broken = copy.deepcopy(document)
    payload = next(n for n in broken.findall('.//UserObject') if n.get('plantUmlData'))
    payload.set('plantUmlData', json.dumps({'data': '@startuml\ninvalid changed payload\n@enduml'}))
    assert any('payload' in e for e in validate_document(broken, canonical)), 'negative payload fixture undetected'
    manifest = json.loads((MODEL / 'render-manifest.json').read_text(encoding='utf-8'))
    for row in manifest['records']:
        if row['id'] not in ids:
            assert row == sources[row['id']], row['id']
    print('PASS: six changed pages, 38 exact preserved fragments, current payloads; all 21 DATA endpoint/cardinality tuples; negative payload rejected; 30 other manifest records unchanged.')

    catalog = (PHYSICAL / 'README.md').read_text(encoding='utf-8')
    referenced_keys(catalog)
    for target in ('UNIQUE(id,lesson_revision_id)', 'UNIQUE(id,context_id,lesson_id)'):
        broken_catalog = catalog.replace(target, '', 1)
        try:
            referenced_keys(broken_catalog)
        except AssertionError:
            pass
        else:
            raise AssertionError('negative missing-target-key fixture undetected: ' + target)
    command = table_line(catalog, 'command_receipts')
    commands = set(re.findall(r"'([A-Z_]+)'", re.search(r'command CHECK IN \(([^)]+)\)', command)[1]))
    assert {'REQUEST_CHANGES', 'APPROVE', 'ARCHIVE', 'WITHDRAW'} <= commands
    security = (PHYSICAL / 'security-and-rls.md').read_text(encoding='utf-8')
    assert 'UPDATE(status,purpose,study_focus,study_preferences,' in security
    assert '`purpose_tags text[]`' in table_line(catalog, 'lesson_revisions')
    tables = re.findall(r'^\| `([a-z_]+)` \|', catalog, re.M)
    definitions = re.findall(r'^- \*\*`(?:app_private\.)?([a-z_]+)`:\*\*', catalog, re.M)
    physical_source = (PHYSICAL / 'physical-erd.puml').read_text(encoding='utf-8')
    entities = re.findall(r'entity "(?:app|app_private)\.([a-z_]+)" as', physical_source)
    assert len(tables) == len(definitions) == len(entities) == 34
    assert set(tables) == set(definitions) == set(entities)
    panels = re.findall(r'@startuml\s+(\S+)(.*?@enduml)', physical_source, re.S)
    assert len(panels) == 4
    for name, body in panels:
        with Image.open(PHYSICAL / (name + '.png')) as img:
            embedded = img.info['plantuml'].split('@enduml', 1)[0] + '@enduml'
            assert visible(embedded) == visible('@startuml ' + name + body), name
            img.verify()
        svg = ET.parse(PHYSICAL / (name + '.svg')).getroot()
        assert not re.search(r'Syntax Error|An error has occurred', ' '.join(svg.itertext()))
    print('PASS: exact target keys + two missing-key negatives; receipt commands/purpose capability; 34 tables/four views/eight renders and source parity.')

    link_count = 0
    inherited = set()
    for name in set(changed + untracked):
        path = ROOT / name
        if path.suffix != '.md':
            continue
        prior = subprocess.run(['git', 'show', baseline['head'] + ':' + name], cwd=ROOT,
                               capture_output=True, text=True, encoding='utf-8', errors='surrogateescape')
        old_targets = set(re.findall(r'\[[^\]]+\]\(([^)]+)\)', prior.stdout))
        for raw in re.findall(r'\[[^\]]+\]\(([^)]+)\)', path.read_text(encoding='utf-8', errors='surrogateescape')):
            target = raw.strip('<>').split('#', 1)[0]
            if not target or re.match(r'[a-z]+://', target):
                continue
            if not (path.parent / target).resolve().exists():
                assert raw in old_targets, ('new broken link', name, target)
                inherited.add((name, target))
            else:
                link_count += 1
    for name in ('logs/test-log.md', 'logs/development-log.md'):
        before = subprocess.check_output(['git', 'show', baseline['head'] + ':' + name], cwd=ROOT)
        assert (ROOT / name).read_bytes().replace(b'\r\n', b'\n').startswith(before.replace(b'\r\n', b'\n')), name
    print(f'PASS: {link_count} resolving documentation links, no new broken links, log prefixes retained. Inherited unresolved: {sorted(inherited)}')
    print('Static design/artifact checks only; independent semantic/visual evidence required. Runtime NOT EXECUTED; live DB UNVERIFIED.')


if __name__ == '__main__':
    main()
