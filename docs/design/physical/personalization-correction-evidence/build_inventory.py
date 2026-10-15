"""Explicit reviewable permitted artifact inventory; no prefix wildcard rules."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[4];E=Path(__file__).resolve().parent
SLUG='2026-10-12-study-focus-personalization-f01-f02'
allowed={'plans/current-task.md','plans/approved/README.md','plans/archive/README.md','HANDOFF.md','docs/QUICK-REF.md','docs/README.md','docs/02-requirements.md','docs/use-case-specifications.md','docs/05-traceability-matrix.md','logs/decision-log.md','logs/test-log.md','logs/development-log.md','docs/modeling/current-target/README.md','docs/modeling/current-target/render-manifest.json','docs/modeling/current-target/verify.py','docs/modeling/current-target/verification-output.txt','docs/modeling/current-target/evidence/visual-review.md','docs/modeling/report-usecases/README.md','docs/modeling/report-usecases/render-manifest.json','docs/design/physical/README.md','docs/design/physical/security-and-rls.md','docs/design/physical/rebuild-plan.md','docs/design/physical/physical-erd.puml','docs/design/physical/verify.py','docs/design/physical/verification-output.txt'}
for stem in ['ACT-01-learner-onboarding','ACT-03-lesson-learning','ACT-06-srs-review','SEQ-06-lesson-exercise-submission','SEQ-08-srs-review','DOM-01-core-domain-model','DATA-03-target-logical-erd']:
    allowed.add(f'docs/modeling/current-target/src/{stem}.puml')
    allowed.update(f'docs/modeling/current-target/rendered/{stem}.{fmt}' for fmt in ['png','svg'])
for stem in ['VIEW-RUC-02-learning-context','VIEW-RUC-03-lesson-practice','VIEW-RUC-04-srs-review']:
    allowed.add(f'docs/modeling/report-usecases/{stem}.puml')
    allowed.update(f'docs/modeling/report-usecases/rendered/{stem}.{fmt}' for fmt in ['png','svg'])
for view in ['identity','content']:allowed.update(f'docs/design/physical/physical-erd-{view}.{fmt}' for fmt in ['png','svg'])
new={'docs/study-focus-addendum.md','docs/design/physical/personalization-and-final-correction.md','plans/archive/2026-10-12-report-functional-usecase-views-PARTIAL-CAPTURE.md',f'plans/archive/{SLUG}-DONE.md'}
new.update(f'plans/approved/{SLUG}-{suffix}' for suffix in ['REQUEST.txt','APPROVED.md','BASELINE.json'])
filenames=['bootstrap.py','capture_handover.py','edit_physical.py','extend_acceptance.py','edit_logical.py','render_affected.py','migrate_verifiers.py','check_task.py','build_inventory.py','finish_records.py','verify_all.py','refresh_visual_records.py','entry-verify.py','entry-physical-erd.puml','entry-modeling-verify.py','entry-current-task.md','entry-status.txt','entry-physical-verifier-output.txt','entry-modeling-verifier-output.txt','concurrent-handover.json','concurrent-final.json','handover-02-requirements.md','handover-use-case-specifications.md','handover-05-traceability-matrix.md','physical-render-manifest.json','affected-render-manifest.json','task-inventory.json','independent-review.md','visual-review.md','verification.md','scope-output.txt','modeling-output.txt','physical-output.txt','diff-check-output.txt','diff-stat-output.txt','file-line-counts.txt','task-diff.patch','render-commands.json']
new.update('docs/design/physical/personalization-correction-evidence/'+n for n in filenames)
(E/'task-inventory.json').write_text(json.dumps(dict(authorized_existing=sorted(allowed),authorized_new=sorted(new),reason='Bounded PO scope; exact paths only, independent reviewer owns its sole report.'),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Finite inventory: {len(allowed)} mutable existing paths; {len(new)} exact new artifacts')
