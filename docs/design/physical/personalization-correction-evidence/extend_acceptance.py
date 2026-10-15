from pathlib import Path
P=Path(__file__).resolve().parents[4]/'docs/design/physical'
p=P/'README.md'
s=p.read_text(encoding='utf-8').replace('`gate_config jsonb object`, `coverage_catalog jsonb object`','`gate_config jsonb object`, `practice_config jsonb object` (bounded ordinary-practice distribution/limits, no fixed platform counts), `coverage_catalog jsonb object`')
s=s.replace('`practice_skill_ids text[]` (finite course catalog skill IDs; controlled area mapping)','`practice_skill_ids text[]` (finite course catalog skill IDs; controlled area mapping; nonempty for published supplementary-eligible practice)')
p.write_text(s,encoding='utf-8')
p=P/'security-and-rls.md'
s=p.read_text(encoding='utf-8').replace('courses(id,language_id,framework_id,is_active,generation/default config)','courses(id,language_id,framework_id,is_active,curriculum_generation,default_start_level_id,gate_config,practice_config,coverage_catalog,coverage_catalog_generation)')
s=s.replace('maximum SELECT and lock-only','maximum SELECT and lock-only')
s+='''

For supplementary selection, learner_writer has explicit SELECT item_identities(id,origin,practice_exposed_at,exact_fingerprint), item_revisions(id,item_id,type,prompt_data,practice_skill_ids,practice_coverage_snapshot,frozen_at,authoring_lesson_revision_id), lesson_exercises(id,lesson_revision_id,item_revision_id,is_core), lessons/lesson_revisions/units/levels/courses fields listed above, media_bindings/assets readiness/retirement metadata and owned srs_cards(id,learner_id,vocabulary_id,stage,due_at,row_version) with matching vocabulary language metadata. Principal SELECT policies restrict practice to exact accessible published context scope, valid active course catalog and PRACTICE origin; card policy restricts learner_id=verified ACTIVE learner. No secret SELECT for learner_writer. The separate grade_supplementary_practice owner grader has these exact scope/membership reads plus secret key SELECT under a signed-session/PRACTICE-only principal policy. Internal due/card projection is never returned as a list; start/prompt DTO allowlist is current prompt/opaque reference only.
'''
p.write_text(s,encoding='utf-8')
p=P/'rebuild-plan.md'
s=p.read_text(encoding='utf-8')
block='''## Study Focus and F01/F02 final-correction acceptance

Design specifications below are **NOT EXECUTED**. They supplement, rather than replace, the F03–F12 scenarios above. [PERS-01–10](../../study-focus-addendum.md) are required future runtime tests, including the five-value CHECK/default, bias/fallback, independent due selection, no resets/core or secure-assessment injection, invalid values and foreign contexts.

| ID | Setup | Action | Expected invariant |
|---|---|---|---|
| PD-F01-AUTHORING-ALLOW | ACTIVE currently assigned Teacher; exact unfrozen item under editable authoring parent; runtime login + FORCE RLS on every table | Call named authoring read/edit, then submit valid package | content_writer's explicit secret SELECT/I/U and policies permit only that item; transition_writer executes content_writer readiness validator; IN_REVIEW + SUBMIT/audit/receipt commit together |
| PD-F01-OTHER-TEACHER | T2/current reassignment or frozen consumer refers to T1 item | Request authoring grading/read/edit by item ID | Deny without key projection, mutation or role assumption; ownership is authoring parent, not consumer membership |
| PD-F01-LEARNER-KEY-DENIED | ACTIVE Learner; real runtime login, own assessment and guessed authoring item | Call authoring function or raw secret/helper SELECT/EXECUTE | Deny raw key path; browser/Data API and generic runtime key SELECT denied |
| PD-F01-PINNED-GRADER | ACTIVE Learner with valid owned pinned attempt; also foreign attempt | Grade through checked function using matching pinned member; try foreign member | Own pinned grading succeeds with bounded practice feedback/assessment aggregate; foreign scope rejected; no Teacher gate on learner grading |
| PD-F01-MISSING-KEY | Assigned editable package has missing/invalid required grading schema | Teacher SUBMIT | Readiness rejects before lifecycle/provenance/receipt commit; independent denial/failure audit sanitized |
| PD-F01-TEACHER-PUBLISH-DENIED | Teacher submitted complete assigned package | Teacher requests approve/publish/Admin review function | Denied; Teacher SUBMIT exception never confers Admin lifecycle privileges |
| PD-F02-PARENT-LOCK-PRIVILEGES | ACTIVE learner has zero contexts; real runtime login, FORCE RLS; helper roles NOBYPASSRLS | Create through learner_writer; inspect current_user at each definer; separately remove its SELECT/UPDATE privilege in a disposable test | Parent SELECT FOR UPDATE precedes lookup/count; only valid granted path succeeds. Missing principal grant fails; no caller-grant inheritance assumed |
| PD-F02-LOCKER-CONTEXT-READ | Learner owns existing context; another learner owns a second context | Call checked course locker then resume through writer | Locker uses its own minimal context SELECT/owner policy; own succeeds and foreign denies; first-create branch requires no context |
| PD-F02-CREATE-RESUME-PAUSE-RACE | One ACTIVE row and two concurrent different-language creates/resumes; also pause concurrent with resume | Run commands on separate connections | All capacity paths take same parent account row lock; max-two ACTIVE, one unique learner/language, preserved progress/preferences/SRS |
| PD-PERS-SESSION-BOUNDARY | BALANCED session started, later change context focus, stale/forged signed references and retired asset | Answer current prompt/start next session; try invalid reference | Active composition is pinned, next uses new focus; every prompt rechecks ownership/status/access, no list/key leak, no core/assessment evidence mutation |

No production/read-only/live test has been substituted for these cases. Later implementation acceptance must assert committed rows, losing-path absence of writes and serialized DTO fields using the real restricted login.

'''
s=s.replace('## U. Execution prerequisites and stop',block+'## U. Execution prerequisites and stop').replace('**STOP after design delivery. Next task: FINAL PHYSICAL DESIGN REVIEW.**','**STOP after this correction. Next separate task: FINAL PHYSICAL APPROVAL RECHECK.**')
p.write_text(s,encoding='utf-8')
p=P/'physical-erd.puml'
s=p.read_text(encoding='utf-8')
panels=s.split('@enduml')
for i,title in [(0,'Sơ đồ dữ liệu vật lý đề xuất – Tài khoản và chương trình'),(1,'Sơ đồ dữ liệu vật lý đề xuất – Nội dung và phân công')]:
    import re
    panels[i]=re.sub(r'^title .*$', 'title '+title,panels[i],flags=re.M)
    panels[i]=re.sub(r'^caption .*\n','',panels[i],flags=re.M)
    panels[i]=re.sub(r'^legend bottom\n.*?^endlegend\n','',panels[i],flags=re.M|re.S)
s='@enduml'.join(panels)
p.write_text(s,encoding='utf-8')
print('Acceptance added; 34 tables retained; only affected physical views styled')
