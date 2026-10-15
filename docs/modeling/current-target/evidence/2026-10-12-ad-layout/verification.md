# Activity layout verification — 2026-10-12

**Verdict: PASS — documentation/layout delivery only.**

Eight native Activity pages ACT-01/02/03/04/06/07/08/09 were cleaned; the three selected for the ten-minute presentation (ACT-03, ACT-06, ACT-04) were handled first. Decision height increased from 24 to at least 52 px, action text to 16 px with padding, lane headers to 18 px and titles to 22 px. Existing labels are unchanged. Branch ports and captions were moved away from decision text. ACT-06 rail attachments are explicit; ACT-09's overlapping clone/withdrawal boxes are separated. Three ACT-01 routes were moved around action text after the detailed review.

The final temporary audit exits 0: 44 pages, eight changed, **36 other raw page fragments byte-exact**; 289 non-container nodes and 329 edges retain IDs, labels, endpoints, arrow types and embedded PUML. No overlapping node boxes and no route crossing the inset interior of unrelated nodes. **925 protected files**, HEAD/index and historical log prefixes unchanged. All sixteen final Draw.io Desktop PNG/SVG exports exit 0 and SVG XML parses. Presentation local links resolve.

Actual native PNGs were reviewed using whole-page views, a contact sheet and readable detail crops. ACT-03/06/04 were inspected in detail; ACT-01's three remaining connector collisions and ACT-09's overlapping nodes were found and corrected before fresh export. ACT-03 remains a long complete flow; three overlapping presentation regions are provided alongside the whole diagram and zoomable SVG. This checks image layout, not audience legibility when the whole tall diagram is reduced to a single slide.

## Reproducible commands and output

- `python C:/Users/PC/AppData/Local/Temp/lingora-ad-polish/verify.py` — final exit 0, verdict PASS, errors `[]`; [stdout](audit.stdout.txt), [machine evidence](verification.json). The read-only audit text is preserved in [verify.py.txt](verify.py.txt) and [collisions.py.txt](collisions.py.txt).
- PowerShell `Start-Process -FilePath 'C:/Program Files/draw.io/draw.io.exe' -ArgumentList @('--export','--format', $adFormat, '--page-index', $adPage.page, '--theme','light','--border','20','--output', ($adExportRoot+'/'+$adPage.id+'.'+$adFormat), $adPrimary) -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput <id.format.stdout.txt> -RedirectStandardError <id.format.stderr.txt>`; formats png/svg; page-index ACT-01=18, ACT-02=19, ACT-03=20, ACT-04=21, ACT-06=22, ACT-07=23, ACT-08=24, ACT-09=25. Sixteen final invocations exit 0; retained output files accompany exports.
- `git diff --check` — exit 0, [captured output](diff-check.txt). `git diff --stat` — exit 0, [whole-worktree output](diff-stat.txt), includes unrelated entry changes and does not attribute them to this task. Most diagram artifacts are untracked at entry, so the Git stat omits their content; the task baseline/audit establishes bounded scope.

**Environment:** Windows 10.0.26200.0; Python 3.13.2; Node v24.11.1; Draw.io Desktop 32.4.1; HEAD `89d58f3da8b9ffcb9a7d9bcdfc6eb76b93eab737`.

**Intermediate diagnostics retained:** initial arrow check assumed every edge used `classic`; replaced that unsupported audit assumption with the immutable original edge-style comparison. The first geometry check found ACT-09's pre-existing overlapping clone/withdrawal boxes; these were then separated. Two inline Python previews/port snippets failed PowerShell quoting before writes and were rerun from temporary script files. Initial link check failed before the three presentation regions were generated; final links pass. No diagnostic failure was counted as acceptance.

**Scope/limits:** all canonical PUML, original PlantUML renders/manifests, original speaking script and PPTX files remain read-only. Only the current ten-minute script's AD links and one layout-use paragraph changed. No business/UML-semantic correction, product decision, code/schema/API/DB/migration/test/ADR edits. Native dangling intermediate endpoints and other original modeling semantics are retained. Prior source/output conflict remains REVIEW. The predecessor UC-01 IMPLEMENTING pointer is captured verbatim; this task does not infer its closure. Runtime tests **N/A — diagram layout only**. No staging or commit.

**Backup:** [entry package](before-package.zip), [protected hashes](baseline.json). Lifecycle approval/archive pointers and test/development evidence are recorded separately. New text-file line counts and final artifact hashes are in [closure.json](closure.json).
