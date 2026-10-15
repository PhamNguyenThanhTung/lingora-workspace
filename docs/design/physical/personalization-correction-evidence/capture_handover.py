"""Record precisely observed concurrent report artifacts before touching shared files."""
from pathlib import Path
import hashlib,json,subprocess,shutil
ROOT=Path(__file__).resolve().parents[4]
E=Path(__file__).resolve().parent
SLUG='2026-10-12-study-focus-personalization-f01-f02'
base=json.loads((ROOT/'plans/approved'/f'{SLUG}-BASELINE.json').read_text(encoding='utf-8'))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest() if p.is_file() else None
names=[n.replace('\\','/') for n in subprocess.check_output(['rg','--files','--hidden','-g','!.git','-g','!node_modules','-g','!.next','-g','!dist','-g','!build'],cwd=ROOT,text=True,encoding='utf-8').splitlines()]
shared={'plans/current-task.md','docs/02-requirements.md','docs/use-case-specifications.md','docs/05-traceability-matrix.md','docs/modeling/current-target/README.md','docs/modeling/current-target/render-manifest.json','logs/decision-log.md','docs/presentation/usecase-activity-presentation.md'}
stems=['UC-02-target-learner','ACT-03-lesson-learning','ACT-06-srs-review','SEQ-06-lesson-exercise-submission','SEQ-08-srs-review']
for stem in stems:
    shared.add(f'docs/modeling/current-target/src/{stem}.puml')
    for fmt in ['png','svg']:shared.add(f'docs/modeling/current-target/rendered/{stem}.{fmt}')
# The report namespace was newly created by the concurrent task. Enumerate it now,
# not a standing wildcard permission for later additions.
shared.update(n for n in set(names)|set(base['existing_sha256']) if n.startswith('docs/modeling/report-usecases/'))
shared.update(n for n in names if n.startswith('scripts/') and sha(ROOT/n)!=base['existing_sha256'].get(n))
captured={n:sha(ROOT/n) for n in sorted(shared)}
assert not (E/'concurrent-handover.json').exists()
(E/'concurrent-handover.json').write_text(json.dumps(dict(source_thread='01a12be6-7b60-7bb1-9c7f-420a80d90761',reason='Latest human steering limits concurrent task to presentation Markdown; preserve observed report/ADR-041 input, then synchronize authorized touched paths in this task.',observed_sha256=captured,all_files_sha256={n:sha(ROOT/n) for n in names},log_prefix_sha256={n:sha(ROOT/n) for n in ['logs/decision-log.md','logs/test-log.md','logs/development-log.md']}),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
shutil.copyfile(ROOT/'docs/modeling/current-target/verify.py',E/'entry-modeling-verify.py')
shutil.copyfile(ROOT/'plans/current-task.md',ROOT/'plans/archive/2026-10-12-report-functional-usecase-views-PARTIAL-CAPTURE.md')
for n in ['docs/02-requirements.md','docs/use-case-specifications.md','docs/05-traceability-matrix.md']:
    (E/('handover-'+Path(n).name)).write_bytes((ROOT/n).read_bytes())
print(f'Captured {len(captured)} exact concurrent paths; shared logical entry snapshots retained')
