"""Record already observed gates, current pointers and append-only task logs."""
from pathlib import Path
import json,re,hashlib,subprocess,difflib
ROOT=Path(__file__).resolve().parents[4];E=Path(__file__).resolve().parent
SLUG='2026-10-12-study-focus-personalization-f01-f02'
for n in ['scope-output.txt','modeling-output.txt','physical-output.txt','diff-check-output.txt','diff-stat-output.txt']:
    assert (E/n).read_text(encoding='utf-8').rstrip().endswith('EXIT 0'),n
report=ROOT/'docs/design/physical/personalization-and-final-correction.md'
s=report.read_text(encoding='utf-8').replace('Final observed output is recorded after corrections.','Final observed output: [canonical modeling](personalization-correction-evidence/modeling-output.txt), [physical](personalization-correction-evidence/physical-output.txt) and [finite inventory/freshness/links](personalization-correction-evidence/scope-output.txt) each exit 0; git diff --check exits 0. Current source/table/manifest identities and retained unchanged views agree. [Verification detail](personalization-correction-evidence/verification.md) and [visual QA](personalization-correction-evidence/visual-review.md) preserve scope and limitations.')
report.write_text(s,encoding='utf-8')
p=ROOT/'docs/design/physical/README.md';s=p.read_text(encoding='utf-8').replace('PROPOSED — correction under verification; final physical approval remains separate.','PROPOSED — PHYSICAL DESIGN READY FOR FINAL APPROVAL RECHECK; F01/F02 CLOSED; final physical approval remains separate.');p.write_text(s,encoding='utf-8')
p=ROOT/'docs/QUICK-REF.md';s=p.read_text(encoding='utf-8')
new='> **Task state / next action:** STUDY FOCUS PERSONALIZATION ADDENDUM + FINAL PHYSICAL CORRECTION F01/F02 is DONE. [Current correction](design/physical/personalization-and-final-correction.md): PERSONALIZATION ADDENDUM APPLIED, F01 CLOSED, F02 CLOSED, independent regression NONE; 34→34, canonical/physical verifiers exit 0. ADR-042 adds one five-value per-context focus (BALANCED default), next supplementary sessions only, with independent internal due SRS and eligible practice bias/fallback; core and pinned assessments unchanged. Physical design remains PROPOSED, LIVE DB UNVERIFIED. Next separately authorized task: FINAL PHYSICAL APPROVAL RECHECK. No implementation planning/code/DB/rebuild is active. Existing draw.io pending commit gate remains separate.'
s=re.sub(r'^> \*\*Task state / next action:\*\*.*$',new,s,flags=re.M);p.write_text(s,encoding='utf-8')
p=ROOT/'docs/README.md';s=p.read_text(encoding='utf-8');s=s.replace('**Final physical design recheck (completed 2026-10-12):**','**Historical final physical design recheck (completed 2026-10-12; corrected by the addendum below):**')
marker='## Canonical documents'
at=s.find(marker)
block='''## Study Focus personalization and final physical correction (2026-10-12)

[Study Focus addendum](study-focus-addendum.md) and ADR-042 control the additive product scope alongside unchanged ADR-036/041: one primary focus per owned context, default BALANCED, affecting next supplementary practice only. Independent internal due SRS remains separate from eligible authored-practice bias/fallback; shared core and scored pinned assessments stay unchanged. Canonical UC-01–14 remains unchanged.

[Current A–L correction report](design/physical/personalization-and-final-correction.md) supersedes only the prior F01/F02 open dependencies; [fresh targeted reviewer](design/physical/personalization-correction-evidence/independent-review.md) returns CONSISTENT / F01 CLOSED / F02 CLOSED / regression NONE. Table impact 34→34; canonical/physical verifiers exit 0. Status: PHYSICAL DESIGN READY FOR FINAL APPROVAL RECHECK, still PROPOSED / NOT IMPLEMENTED / LIVE DB UNVERIFIED. Final physical approval and implementation planning remain separate, unauthorized tasks. Prior approval/archive/review records are retained as historical evidence.

'''
if at<0:at=s.index('| [use-case-specifications.md]');at=s.rfind('\n## ',0,at)+1
s=s[:at]+block+s[at:];p.write_text(s,encoding='utf-8')
for rel,text in [
 ('plans/approved/README.md',f'\n- [{SLUG}-APPROVED.md]({SLUG}-APPROVED.md) is the immutable direct PO documentation/modeling authorization. REQUEST/BASELINE preserve scope/entry state; completed record is in archive. It does not approve physical implementation.\n'),
 ('plans/archive/README.md',f'\n- [{SLUG}-DONE.md]({SLUG}-DONE.md) records personalization applied, F01/F02 CLOSED, regression NONE and readiness for a separate FINAL PHYSICAL APPROVAL RECHECK. [Report task partial capture](2026-10-12-report-functional-usecase-views-PARTIAL-CAPTURE.md) retains the interrupted predecessor pointer without claiming it DONE.\n')]:
    p=ROOT/rel
    with p.open('a',encoding='utf-8',newline='\n') as f:f.write(text)

verification='''# Verification evidence — Study Focus + F01/F02

Environment: Windows, Python 3.13.2, OpenJDK 17.0.2, PlantUML 1.2026.8, HEAD 89d58f3da8b9ffcb9a7d9bcdfc6eb76b93eab737. No database connection/execution. All proposed runtime cases remain NOT EXECUTED.

Commands observed: `python docs/design/physical/personalization-correction-evidence/render_affected.py --physical` and `--logical`; final targeted `refresh_visual_records.py` rerendered only SEQ-06 and physical source after a source change. PlantUML SVG/PNG invocations printed exact Java arguments, exit 0, empty stdout/stderr. Seven canonical, three report and two affected physical views were individually opened; no broad renderer/re-audit. See affected-render-manifest.json, physical-render-manifest.json and [manual visual QA](visual-review.md).

`python docs/design/physical/personalization-correction-evidence/verify_all.py` invokes the exact three verification commands plus git diff --check/stat. Full command/output/exit evidence: [scope](scope-output.txt), [canonical](modeling-output.txt), [physical](physical-output.txt), [whitespace](diff-check-output.txt), [diff stat](diff-stat-output.txt), [new text line counts](file-line-counts.txt). Observed exit 0 for each. Finite inventory preserves unrelated initial files, exact observed concurrent report artifacts, historical review/approved snapshots, post-handover log byte prefixes and HEAD/index. 34 tables agree with ERD; affected source/output hashes and palette checks pass; untouched 29 canonical diagrams and four physical learning/assessment output files remain protected by exact hashes. SVG source-line/codeLine metadata churn on unaffected physical views was removed after drawing XML equality was checked; PNGs were byte-identical.

Root-cause corrections preserved [old physical verifier](entry-verify.py), [observed stale failures](entry-physical-verifier-output.txt) and [old canonical verifier](entry-modeling-verify.py). Legitimate previous recheck/report artifacts are captured by immutable entry baseline and exact concurrent-handover.json, not standing wildcard permissions. Existing substantive table/role/assessment/gate/SRS/grant/freshness checks were retained. Old task baselines/global docs-PUML count and obsolete SRS literals were replaced by current scoped inventories/package checks. Historical log body contains preexisting mixed-encoding/old file-URI references; its bytes are preserved, and only new appended log links are validated. Snapshot links retain their original source-relative meaning and are not treated as new live index links. Current authoritative Markdown links are validated, including fixing one archived-target pointer in affected requirements.

During targeted independent review, F01 required one additional frozen-consumer readiness path and explicit content_writer membership/catalog/media reads; both were repaired and freshly reread. [Independent report](independent-review.md) seals CONSISTENT / F01 CLOSED / F02 CLOSED / regression NONE. No actionable design blocker remains. Actual deployed RLS/grants/runtime concurrency and destructive rebuild still need later separately authorized execution/restore proof.

Manual review verdict: N/A — non-runnable design/visual inspection. Automated structural/scope verdicts come only from observed exits; no runtime PASS or physical approval is inferred.
'''
(E/'verification.md').write_text(verification,encoding='utf-8')
test='''

## T-PERS-001 — Study Focus + final physical F01/F02 correction (2026-10-12)

- **Environment:** Windows; Python 3.13.2; OpenJDK 17.0.2; PlantUML 1.2026.8; HEAD `89d58f3da8b9ffcb9a7d9bcdfc6eb76b93eab737`. LIVE DB UNVERIFIED; no DB connection or mutation.
- **Command:** `python docs/design/physical/personalization-correction-evidence/verify_all.py` invokes `python docs/design/physical/personalization-correction-evidence/check_task.py`, `python docs/modeling/current-target/verify.py`, `python docs/design/physical/verify.py`, `git diff --check`, `git diff --stat`; exact commands/output retained in each output file.
- **Output:** observed exits 0/0/0/0/0; `TASK SCOPE/FRESHNESS/LINKS PASS`, `CURRENT TARGETED MODELING STATIC VERIFICATION PASS`, `PHYSICAL PERSONALIZATION / FINAL CORRECTION PASS`. 34→34; finite inventory/links/hashes/monochrome and unchanged HEAD/index pass. New-file line counts are retained with git diff --stat output.
- **Verdict:** PASS — observed documentation/modeling structural and scope checks only. Initial stale-baseline and transient metadata/link/console-encoding failures were corrected, not concealed as runtime PASS.
- **Render command:** `python docs/design/physical/personalization-correction-evidence/render_affected.py --physical`, `--logical`, then `python docs/design/physical/personalization-correction-evidence/refresh_visual_records.py` for the changed SEQ-06/identity inputs. Exact PlantUML invocations observed exit 0, empty stdout/stderr; manifests bind source and output hashes.
- **Manual command/action:** read source chains and individually open affected PNGs with view_image; fresh independent targeted reviewer. **Output:** CONSISTENT; F01 CLOSED; F02 CLOSED; regression NONE. **Verdict:** N/A — non-runnable design/visual review. PERS-01–10 and PD-F01/F02 runtime cases are NOT EXECUTED.
- **Evidence:** [verification](../docs/design/physical/personalization-correction-evidence/verification.md), [independent review](../docs/design/physical/personalization-correction-evidence/independent-review.md), [final report](../docs/design/physical/personalization-and-final-correction.md).
'''
development='''

## PERS-001 — Study Focus addendum + F01/F02 final correction (2026-10-12)

Completed the PO-authorized documentation/modeling addendum ADR-042: five-value primary context focus, next supplementary composition only, independent internal due selection, eligible published finite practice metadata with configured bias/fallback, unchanged core/SRS/pinned assessments and UC catalog. Targeted seven canonical/three report/two physical view changes retain 34 tables. Preserved the concurrent report task inputs and its human-steered presentation Markdown; predecessor partial pointer was captured without marking that task DONE.

F01 now specifies assigned Teacher authoring-secret SELECT/edit, full readiness/submit grants and a separate bounded frozen-member validator; independent reviewer found/rechecked that reuse dependency and explicit membership/catalog/media reads. F02 specifies learner_writer stable parent account SELECT+lock privilege before context count/lookup plus its own context writes and scoped_locker independent context/config reads. No caller-grant inheritance or FORCE RLS bypass is assumed.

Corrected stale verifier baselines/finite artifact inventory, obsolete SRS literal/global package checks, a local archived-target link and SVG source-offset churn. Fixed one task-local UTF-8 editing mistake; historical log mixed-encoding bytes were preserved. Fresh verifiers/diff checks exit 0; manual review and future design runtime cases distinguished, evidence T-PERS-001. Final status PERSONALIZATION ADDENDUM APPLIED / F01 CLOSED / F02 CLOSED / PHYSICAL DESIGN READY FOR FINAL APPROVAL RECHECK. LIVE DB UNVERIFIED; no implementation/rebuild approval.

**Commit:** none — user forbids staging/commit; HEAD and original index unchanged. Stop; next separate task FINAL PHYSICAL APPROVAL RECHECK.
'''
for n,text in [('logs/test-log.md',test),('logs/development-log.md',development)]:
    with (ROOT/n).open('ab') as f:f.write(text.encode('utf-8'))
# Root artifact outputs mirror retained evidence, without overwriting old review records.
for name,source in [('docs/modeling/current-target/verification-output.txt','modeling-output.txt'),('docs/design/physical/verification-output.txt','physical-output.txt')]:
    (ROOT/name).write_bytes((E/source).read_bytes())
p=ROOT/'plans/current-task.md';s=p.read_text(encoding='utf-8').replace('**Status:** IMPLEMENTING','**Status:** TESTING');p.write_text(s,encoding='utf-8')
before=(E/'entry-physical-erd.puml').read_text(encoding='utf-8');after=(ROOT/'docs/design/physical/physical-erd.puml').read_text(encoding='utf-8')
diff=''.join(difflib.unified_diff(before.splitlines(True),after.splitlines(True),fromfile='entry/physical-erd.puml',tofile='current/physical-erd.puml'))
for n in ['02-requirements.md','use-case-specifications.md','05-traceability-matrix.md']:
    before=(E/('handover-'+n)).read_text(encoding='utf-8');after=(ROOT/'docs'/n).read_text(encoding='utf-8');diff+=''.join(difflib.unified_diff(before.splitlines(True),after.splitlines(True),fromfile='handover/'+n,tofile='current/'+n))
(E/'task-diff.patch').write_text(diff,encoding='utf-8')
print('Observed TEST/LOG gates recorded; task TESTING pending final pointer/artifact verification')
