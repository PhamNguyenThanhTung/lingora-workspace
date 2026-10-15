"""Final modeling inventory/scans/link/evidence checks; manual review remains required."""
from collections import Counter
from pathlib import Path
import hashlib
import json
import re
import subprocess
import xml.etree.ElementTree as ET

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]


def require(condition, message):
    if not condition:
        raise SystemExit('FAIL: ' + message)
    print('PASS: ' + message)


sources = sorted((BASE / 'src').glob('*.puml'))
texts = {p.stem: p.read_text(encoding='utf-8') for p in sources}
manifest = json.loads((BASE / 'render-manifest.json').read_text(encoding='utf-8'))
rows = manifest['records']
require(len(sources) == manifest['diagram_count'] == len(rows) == 36, '36 canonical source/manifest records')
require(len({r['id'] for r in rows}) == 36, '36 distinct diagram identities, including VIEW-UC namespace')
require({r['source'] for r in rows} == {p.relative_to(BASE).as_posix() for p in sources}, 'manifest exactly matches source set')
counts = Counter(r['classification'] for r in rows)
require(counts == {'CURRENT': 5, 'TARGET': 30, 'DEFERRED — NOT MVP': 1}, '5 CURRENT + 30 TARGET + 1 DEFERRED; active=35')
outputs = set()
for row in rows:
    source = BASE / row['source']
    require(hashlib.sha256(source.read_bytes()).hexdigest() == row['source_sha256'], f"fresh source hash {row['id']}")
    for fmt, name in row['outputs'].items():
        path = BASE / name
        assert path.is_file() and path.suffix == '.' + fmt
        outputs.add(path.resolve())
        if fmt == 'svg':
            tree = ET.parse(path).getroot()
            rendered_text = ' '.join(tree.itertext())
            assert not re.search(r'Syntax Error|An error has occurred|handwritten has been removed', rendered_text)
require(outputs == {p.resolve() for p in (BASE / 'rendered').glob('*') if p.suffix in {'.png', '.svg'}} and len(outputs) == 72, '72 outputs, no orphan/duplicate render or syntax/warning image')
require(all('\ufffd' not in text and '\u00e2\u20ac' not in text for text in texts.values()), 'UTF-8 sources without replacement/mojibake text')
target = '\n'.join(texts[Path(r['source']).stem] for r in rows if r['classification'] == 'TARGET')
require(not re.search(r'\b(Creator|Moderator|Manager|SuperAdmin|assignedRoles|SkillProfile|KnowledgeGap)\b', target), 'no legacy business roles, multi-role field, persisted profile/mastery entities in TARGET')
require(not re.search(r'(?im)^\s*(?:component|actor|node|class|entity).*\b(AI|LLM|Jump|Reassessment|MasteryEngine|WorkflowEngine)\b', target), 'no active AI runtime, Jump, Reassessment or generic/mastery engine nodes')
require(not re.search(r'\bA1\b|Unit\s*1\b|80%|\b12\s+(?:questions|exercises)\b|Again\s*/\s*Hard\s*/\s*Good\s*/\s*Easy', target, re.I), 'no hard-coded sample defaults or rigid four-rating SRS')
require(not re.search(r'/api/|\b(?:INSERT|UPDATE|SELECT|BEGIN TRANSACTION|COMMIT TRANSACTION)\b|supersedes_id|active_revision_id', target), 'TARGET has no selected API/SQL/physical field contract')
deferred = texts['ACT-05-reassessment']
require('DEFERRED — NOT MVP' in deferred and 'no Reassessment flow in MVP' in deferred and 'Learner' not in deferred, 'Reassessment retained only as disconnected deferred artifact')


def contains(stem, fragments):
    text = texts[stem]
    require(all(f.lower() in text.lower() for f in fragments), 'semantic anchors ' + stem)


contains('ACT-03-lesson-learning', ['queue tail', 'Entry is first response?', 'Retry correct?', 'sum / (N + K)', 'response count = N + K', 'Redo keeps completed-lesson count unchanged', 'independently of score'])
contains('SEQ-06-lesson-exercise-submission', ['loop While queue', 'append single retry at queue tail', 'sum += 1.0', 'sum += 0.5', 'sum / (N + K)', 'No new completed performance/completion'])
contains('ACT-06-srs-review', ['Optional', 'without schedule reset', 'first due after 1 day', 'recur every 30 days', 'once at session end', 'No second schedule operation'])
contains('SEQ-08-srs-review', ['Already recorded', 'Reset stage 1', 'recur every 30 days', 'at most once', 'No second scheduling operation', 'PAUSED'])
contains('STA-02-assignment-lifecycle', ['ASSIGNED --> ASSIGNED', 'no duplicate persisted workflow', 'history'])
require('Account deletion' not in texts['STA-01-account-status'], 'no unapproved account deletion lifecycle')
for stem in ['DOM-01-core-domain-model', 'DATA-03-target-logical-erd']:
    contains(stem, ['Language', 'ProficiencyFramework', 'Level', 'LessonAttempt', 'CompletionFact', 'AssessmentAttempt', 'AssessmentVersion', 'AssessmentResult', 'SrsReviewOperation'])
uc = (ROOT / 'docs/use-case-specifications.md').read_text(encoding='utf-8')
numbers = [int(n) for n in re.findall(r'^## (\d+)\.', uc, re.M)]
require(numbers == list(range(1, 16)) and 'không phải UC-15' in uc, '14 catalog entries plus limitations heading; 13 active and deferred UC-03')
require(all(f'VIEW-UC-0{i}' in uc for i in range(1, 5)) and 'Historical' not in uc[:100], 'explicit VIEW-UC aliases/canonical crosswalk retained')
trace = (ROOT / 'docs/05-traceability-matrix.md').read_text(encoding='utf-8').split('The inherited catalog rows')[0]
require(len(re.findall(r'^\| .*TARGET — approved', trace, re.M)) == 6 and 'docs/plantuml/' not in trace and 'uc-admin.puml' not in trace, 'six ADR-036 trace groups and current diagram pointers')
docs = [BASE / 'README.md', BASE / 'review.md', ROOT / 'docs/use-case-specifications.md', ROOT / 'docs/05-traceability-matrix.md']
links = 0
for doc in docs:
    text = doc.read_text(encoding='utf-8')
    for link in re.findall(r'\]\(([^)]+)\)', text):
        if re.match(r'https?://|#', link):
            continue
        name = link.split('#')[0]
        assert (doc.parent / name).exists(), f'Broken link {doc}: {link}'
        links += 1
require(links > 100, f'{links} local catalog/review/UC/trace links resolve')
require(len(list((ROOT / 'docs').rglob('*.puml'))) == 37 and len({hashlib.sha256(p.read_bytes()).hexdigest() for p in sources}) == 36, 'single canonical source set; 36 distinct diagrams + shared style only')
schema = (ROOT / 'lingora-admin/prisma/schema.prisma').read_text(encoding='utf-8')
sql = (ROOT / 'lingora-admin/prisma/migrations/202608140001_init/migration.sql').read_text(encoding='utf-8')
require(len(re.findall(r'^model ', schema, re.M)) == 18 and len(re.findall(r'^CREATE TABLE ', sql, re.M)) == 17, 'CURRENT 18 Prisma models / 17 migration tables')
contains('DATA-01-current-migration-erd', ['id : uuid <<PK>>', 'pair unique', 'next_review_at : timestamp(3)', 'ProgressStatus', 'not live DB'])
baseline_path = ROOT / 'plans/approved/2026-10-11-lingora-final-modeling-review-BASELINE.json'
baseline = json.loads(baseline_path.read_text(encoding='utf-8'))
require(subprocess.check_output(['git', 'diff', '--cached', '--raw'], cwd=ROOT).decode() == baseline['index'], 'pre-existing index state preserved; no staging')
require(subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT).decode().strip() == baseline['head'], 'HEAD preserved; no commit')
changed = []
for name, digest in baseline['files'].items():
    p = ROOT / name
    if not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest() != digest:
        changed.append(name)
allowed_exact = {'HANDOFF.md', 'docs/QUICK-REF.md', 'docs/README.md', 'docs/02-requirements.md', 'docs/use-case-specifications.md', 'docs/05-traceability-matrix.md', 'plans/current-task.md', 'plans/approved/README.md', 'plans/archive/README.md', 'logs/test-log.md', 'logs/development-log.md'}
require(all(name in allowed_exact or name.startswith('docs/modeling/current-target/') for name in changed), 'baseline changes confined to authorized docs/modeling/metadata; historical ADR/archive/app/schema unchanged')
new_allowed = {
    'plans/approved/2026-10-11-lingora-final-modeling-review-APPROVED.md',
    'plans/approved/2026-10-11-lingora-final-modeling-review-REQUEST.txt',
    'plans/approved/2026-10-11-lingora-final-modeling-review-BASELINE.json',
    'plans/archive/2026-10-11-lingora-final-modeling-review-DONE.md',
}
added = []
for directory in ['docs', 'plans', 'logs', 'lingora-web', 'lingora-admin', 'lingora-ai']:
    for p in (ROOT / directory).rglob('*'):
        if p.is_file() and not any(part in p.parts for part in ['node_modules', '.next', '.git', '__pycache__']):
            name = p.relative_to(ROOT).as_posix()
            if name not in baseline['files']:
                added.append(name)
require(all(name in new_allowed or name.startswith('docs/modeling/current-target/') for name in added), 'new files confined to authorized modeling/evidence and this task snapshots/archive')
log_markers = {
    'logs/test-log.md': b'\n\n## T-FMR-001',
    'logs/development-log.md': b'\n\n## FMR-001',
}
for name, marker in log_markers.items():
    data = (ROOT / name).read_bytes()
    if marker in data:
        original, appended = data.split(marker, 1)
        require(hashlib.sha256(original).hexdigest() == baseline['files'][name], f'{name}: historical bytes unchanged; task entry appended only')
        lines = appended.decode('ascii').splitlines()
        require(all(not re.search(r'\t| +$', line) or line.endswith('  ') for line in lines), f'{name}: new evidence whitespace checked')
whitespace_files = [ROOT / name for name in changed + added if Path(name).suffix in {'.md', '.txt', '.py', '.puml'} and name not in log_markers]
for p in whitespace_files:
    lines = p.read_text(encoding='utf-8-sig').splitlines()
    assert all(not re.search(r'\t| +$', line) or line.endswith('  ') for line in lines), f'Whitespace problem: {p}'
require(True, 'changed/new text checked including untracked modeling; Markdown hard breaks allowed')
print('Scope changes:', len(changed))
for name in sorted(added):
    if Path(name).suffix in {'.md', '.txt', '.py', '.json'}:
        count = len((ROOT / name).read_text(encoding='utf-8-sig').splitlines())
        print(f'New-file lines: {name}: {count}')
print('FINAL STATIC VERIFICATION PASS; manual semantics/visual review is recorded in review.md.')
