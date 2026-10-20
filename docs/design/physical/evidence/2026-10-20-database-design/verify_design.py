"""Scoped static artifact checks; no SQL execution or semantic approval."""
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import subprocess
import xml.etree.ElementTree as ET

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
PHYSICAL = HERE.parents[1]


def visible(text):
    return '\n'.join(
        line.replace('\u2013', '-') if line.startswith('title ') else line
        for line in text.strip().splitlines()
        if not line.lstrip().startswith("'")
    )


def main():
    entry = json.loads((HERE / 'inventory.json').read_text(encoding='utf-8'))
    models = re.findall(r'^model (\w+) \{', (ROOT / 'lingora-admin/prisma/schema.prisma').read_text(encoding='utf-8'), re.M)
    assert models == entry['prisma_models'] and len(models) == 18
    migrations = {p.relative_to(ROOT).as_posix() for p in (ROOT / 'lingora-admin/prisma/migrations').glob('*/migration.sql')}
    assert migrations == {p.replace('\\', '/') for p in entry['migration_files']} and len(migrations) == 3
    preserved = [p for p in entry['entry_sha256'] if p.startswith(('lingora-admin', 'docs/modeling'))]
    for name in preserved:
        assert hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == entry['entry_sha256'][name], name
    print('PASS: 18 legacy models, three migrations, accepted DOM and native 44-page bundle preserved from entry.')

    catalog = (PHYSICAL / 'README.md').read_text(encoding='utf-8')
    tables = re.findall(r'^\| `([a-z_]+)` \|', catalog, re.M)
    details = re.findall(r'^- \*\*`(?:app_private\.)?([a-z_]+)`:\*\*', catalog, re.M)
    source = (PHYSICAL / 'physical-erd.puml').read_text(encoding='utf-8')
    defined = re.findall(r'entity "(?:app|app_private)\.([a-z_]+)" as', source)
    assert len(tables) == len(details) == len(defined) == 34
    assert len(set(tables)) == 34 and set(tables) == set(details) == set(defined)
    assert all(n == 1 for n in Counter(defined).values())
    panels = re.findall(r'@startuml\s+(\S+)(.*?@enduml)', source, re.S)
    assert len(panels) == 4
    for name, body in panels:
        aliases = re.findall(r'entity "[^"]+" as (\w+)', body)
        assert len(aliases) == len(set(aliases)), name
        edges = re.findall(r'^([a-z_]+)\s+[|}o][^\n]*?\s+([a-z_]+)\s*$', body, re.M)
        assert all(a in aliases and b in aliases for a, b in edges), name
        expected = '@startuml ' + name + body
        with Image.open(PHYSICAL / (name + '.png')) as image:
            embedded = image.info['plantuml'].split('@enduml', 1)[0] + '@enduml'
            assert visible(embedded) == visible(expected), 'PNG/source drift: ' + name
            image.verify()
        svg = ET.parse(PHYSICAL / (name + '.svg')).getroot()
        assert not re.search(r'Syntax Error|An error has occurred', ' '.join(svg.itertext()))
    print('PASS: 34 catalog/detail/ERD tables; four views with defined endpoints/unique aliases; eight valid renders and PNG source parity.')

    changed = subprocess.check_output(['git', 'diff', entry['entry_head'], '--name-only'], cwd=ROOT, text=True).splitlines()
    # Includes untracked documentation; excludes app/schema/logical-diagram edits.
    untracked = subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard'], cwd=ROOT, text=True).splitlines()
    allowed = ('docs/design/physical/', 'docs/02-requirements.md', 'docs/04-data-model.md',
               'docs/05-traceability-matrix.md', 'docs/README.md', 'docs/QUICK-REF.md',
               'docs/use-case-specifications.md', 'logs/decision-log.md', 'logs/test-log.md',
               'logs/development-log.md', 'plans/current-task.md', 'plans/archive/2026-10-20-database-', 'HANDOFF.md')
    assert all(p.startswith(allowed) for p in changed + untracked), changed + untracked
    # Historical records under physical/ are not permitted merely because the directory is allowed.
    physical_allowed = {'README.md', 'security-and-rls.md', 'rebuild-plan.md', 'physical-erd.puml',
                        'database-reconciliation-2026-10-20.md'} | {n + '.' + f for n, _ in panels for f in ('svg', 'png')}
    for p in changed + untracked:
        if p.startswith('docs/design/physical/'):
            rel = p.removeprefix('docs/design/physical/')
            assert rel in physical_allowed or rel.startswith('evidence/2026-10-20-database-design/'), p
    links = 0
    inherited_missing = set()
    for name in set(changed + untracked):
        path = ROOT / name
        if path.suffix != '.md':
            continue
        prior = subprocess.run(['git', 'show', entry['entry_head'] + ':' + name], cwd=ROOT,
                               text=True, encoding='utf-8', errors='surrogateescape', capture_output=True)
        prior_targets = set(re.findall(r'\[[^\]]+\]\(([^)]+)\)', prior.stdout)) if prior.returncode == 0 else set()
        # The inherited development log contains mixed legacy encoding; scan links without rewriting bytes.
        for raw_target in re.findall(r'\[[^\]]+\]\(([^)]+)\)', path.read_text(encoding='utf-8', errors='surrogateescape')):
            target = raw_target
            target = target.strip('<>').split('#', 1)[0]
            if not target or re.match(r'[a-z]+://', target):
                continue
            if not (path.parent / target).resolve().exists():
                assert raw_target in prior_targets, ('new broken link', name, target)
                inherited_missing.add((name, target))
                continue
            links += 1
    print(f'PASS: documentation-only scope, historical review preservation and {links} local links.')
    print(f'LIMIT: {len(inherited_missing)} inherited unresolved links retained in historical prose: {sorted(inherited_missing)}')
    print('Static artifact checks only; DB43 runtime cases NOT EXECUTED; live DB UNVERIFIED.')


if __name__ == '__main__':
    main()
