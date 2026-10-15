"""Targeted logical synchronization with the approved PO addendum."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[4]
M=ROOT/'docs/modeling/current-target'
R=ROOT/'docs/modeling/report-usecases'
def patch(p, pairs):
    s=p.read_text(encoding='utf-8')
    for a,b in pairs:
        assert a in s,(p.name,a[:100])
        s=s.replace(a,b)
    p.write_text(s,encoding='utf-8')
patch(M/'src/ACT-01-learner-onboarding.puml',[
 (':Tạo ngữ cảnh học cho ngôn ngữ;', ':Tạo ngữ cảnh học cho ngôn ngữ; trọng tâm mặc định Cân bằng;\n|Học viên|\nif (Muốn chọn trọng tâm riêng?) then (Có)\n  :Chọn Từ vựng / Ngữ pháp / Đọc / Nghe;\n  |Hệ thống|\n  :Lưu trọng tâm hợp lệ; không đổi điểm bắt đầu;\nelse (Không)\n  |Hệ thống|\n  :Giữ trọng tâm Cân bằng;\nendif;')
])
# The if terminator is PlantUML 'endif' without a semicolon.
patch(M/'src/ACT-01-learner-onboarding.puml',[('endif;','endif')])
patch(M/'src/ACT-03-lesson-learning.puml',[
 ('if (Hệ thống chọn review cho phiên thường?) then (Có)','if (Bắt đầu phần luyện tập bổ sung?) then (Có)'),
 (':Xác định nội bộ card due/overdue;\n    :Chọn câu hỏi ôn phù hợp; không gửi danh sách;', ':Đọc ngữ cảnh và trọng tâm hiện tại;\n    :Chọn nội bộ thẻ đến hạn / quá hạn độc lập trọng tâm;\n    :Chọn luyện tập đã xuất bản theo trọng tâm và cấu hình;\n    :Thiếu nội dung ưu tiên: dùng nội dung hợp lệ khác;\n    :Giữ cấu trúc phiên; không gửi danh sách trước;'),
 ('while (Còn câu hỏi SRS được chọn?) is (Có)','while (Còn câu hỏi bổ sung được chọn?) is (Có)'),
 (':Đưa ra một prompt ôn tập;', ':Đưa ra một câu hỏi hiện tại;'),
 (':Trả lời câu hỏi ôn tập;', ':Trả lời câu hỏi bổ sung;'),
 (':Xác thực outcome và cập nhật lịch do server tính;', 'if (Câu ôn SRS?) then (Có)\n        :Xác thực Đã nhớ / Chưa nhớ; tính lịch SRS;\n        :Chưa nhớ: xếp một lượt củng cố cuối phiên;\n      else (Luyện tập theo trọng tâm)\n        :Phản hồi luyện tập; không ghi điểm core;\n      endif'),
 ('    endwhile (Không)\n  else (Không)','    endwhile (Không)\n    :Củng cố câu chưa nhớ tối đa một lần; không tính lịch lại;\n    :Kết quả bổ sung không đổi N, K hoặc hoàn thành;\n  else (Không)')
])
patch(M/'src/ACT-06-srs-review.puml',[
 (':Xác định nội bộ các card due/overdue;', ':Chọn nội bộ thẻ đến hạn / quá hạn;\n:Trọng tâm không loại thẻ đến hạn; giữ thẻ chưa được ôn;'),
 ('while (Còn câu hỏi ôn được chọn?)','while (Còn câu hỏi ôn được chọn?)')
] if False else [
 (':Xác định nội bộ các card due/overdue;', ':Chọn nội bộ thẻ đến hạn / quá hạn;\n:Trọng tâm không loại thẻ đến hạn; giữ thẻ chưa được ôn;'),
 (':Chọn item phù hợp với phiên vừa bắt đầu;', ':Chọn câu hỏi phù hợp sau khi bắt đầu phiên;'),
 (':Bắt đầu dedicated review session;', ':Bắt đầu phiên ôn riêng tùy chọn;')
])
patch(M/'src/SEQ-06-lesson-exercise-submission.puml',[
 ('opt Hệ thống chọn review block cho phiên thường','opt Bắt đầu phần luyện tập bổ sung sau core'),
 ('    Server -> DB : Tìm nội bộ card due/overdue của learner','    Server -> DB : Đọc ngữ cảnh, trọng tâm và cấu hình luyện tập\n    DB --> Server : Trọng tâm hiện tại; nội dung đã xuất bản hợp lệ\n    Server -> Server : Ưu tiên trọng tâm; thiếu nội dung thì dùng nguồn hợp lệ khác\n    Server -> DB : Tìm nội bộ thẻ đến hạn / quá hạn của learner'),
 ('    Server -> Server : Chọn item phù hợp; không tạo danh sách cho learner','    Server -> Server : Chọn SRS độc lập trọng tâm; giữ cấu trúc phiên\n    Server -> Server : Chỉ trả câu hiện tại sau bắt đầu; không gửi danh sách trước'),
 ('    end\n  end\nelse Chưa kết thúc hợp lệ', '    end\n    opt Có câu SRS chưa nhớ cần củng cố\n      Server --> Web : Một câu củng cố cuối phiên; không lập lịch lại\n      Web -> Server : Trả lời củng cố trong phiên đã xác thực\n      Server -> DB : Ghi củng cố tối đa một lần; giữ lịch\n    end\n    loop Mỗi câu luyện tập theo trọng tâm được chọn\n      Server --> Web : Câu hỏi luyện tập hiện tại\n      Learner -> Web : Trả lời câu hỏi\n      Web -> Server : Câu trả lời và tham chiếu phiên hợp lệ\n      Server -> Server : Chấm PRACTICE đúng phạm vi; phản hồi tạm thời\n      Server --> Web : Phản hồi; không đổi điểm core / completion / SRS\n    end\n  end\nelse Chưa kết thúc hợp lệ')
])
patch(M/'src/SEQ-08-srs-review.puml',[
 ('Server -> Server : Chọn item phù hợp sau khi phiên bắt đầu','Server -> Server : Chọn câu ôn sau bắt đầu; không lọc theo trọng tâm\nServer -> Server : Giữ thẻ quá hạn chưa chọn đủ điều kiện ôn'),
 ('      note right: Reinforcement giữ lịch vừa tính; không tạo scheduling operation thứ hai.','      Server -> Server : Củng cố giữ lịch; không lập lịch lần thứ hai')
])
patch(M/'src/DOM-01-core-domain-model.puml',[
 ('  purpose: LearningPurpose','  purpose: LearningPurpose\n  studyFocus: StudyFocus (mặc định BALANCED)'),
 ('  core: Boolean','  core: Boolean\n  practiceSkillRefs: Skill[*]\n  knowledgeArea: Vocabulary | Grammar | Reading | Listening'),
 (' class Course',' enum StudyFocus {\n  BALANCED\n  VOCABULARY\n  GRAMMAR\n  READING\n  LISTENING\n }\n class Course')
])
patch(M/'src/DATA-03-target-logical-erd.puml',[
 ('  status; purpose; studyPreferences','  status; purpose; studyPreferences\n  studyFocus (mặc định BALANCED)'),
 ('  ordering; eligibility','  ordering; eligibility\n  finiteTopicSkillCatalog; controlledKnowledgeAreas'),
 ('  order; type; core','  order; type; core\n  practiceSkillRefs; immutableAreaSnapshot')
])
for stem in ['ACT-01-learner-onboarding','ACT-03-lesson-learning','ACT-06-srs-review','SEQ-06-lesson-exercise-submission','SEQ-08-srs-review','DOM-01-core-domain-model','DATA-03-target-logical-erd']:
    p=M/'src'/f'{stem}.puml'
    s=p.read_text(encoding='utf-8').replace('@startuml\n','@startuml\n\' Addendum authority: ADR-042; Study Focus affects supplementary practice only.\n',1)
    p.write_text(s,encoding='utf-8')

# Replace the three touched report views' notes with behavior labels/comments.
for stem in ['VIEW-RUC-02-learning-context','VIEW-RUC-03-lesson-practice','VIEW-RUC-04-srs-review']:
    p=R/f'{stem}.puml';s=p.read_text(encoding='utf-8')
    s=re.sub(r'^note .*?^end note\n','',s,flags=re.M|re.S)
    p.write_text(s,encoding='utf-8')
patch(R/'VIEW-RUC-02-learning-context.puml',[
 ('    usecase "Tạm dừng ngữ cảnh" as Pause','    usecase "Tạm dừng ngữ cảnh" as Pause\n    usecase "Chọn/thay đổi trọng tâm học tập" as Focus'),
 ('Learner -- Pause','Learner -- Pause\nLearner -- Focus')
])
patch(R/'VIEW-RUC-03-lesson-practice.puml',[
 ('    usecase "Trả lời câu hỏi ôn tập nếu hệ thống chọn" as SRSQuestion','    usecase "Trả lời câu ôn đến hạn do hệ thống chọn" as SRSQuestion\n    usecase "Luyện tập bổ sung theo trọng tâm" as Supplementary'),
 ('Learner -- SRSQuestion','Learner -- SRSQuestion\nLearner -- Supplementary'),
 ('SRSQuestion ..> Core : <<extend>>','')
])
patch(R/'VIEW-RUC-04-srs-review.puml',[
 ('Chọn câu hỏi từ card due/overdue phù hợp','Chọn nội bộ câu ôn đến hạn / quá hạn'),
 ('Cập nhật outcome và tính lịch ôn tiếp theo','Cập nhật kết quả và tính lịch ôn tiếp theo')
])
for stem in ['VIEW-RUC-02-learning-context','VIEW-RUC-03-lesson-practice','VIEW-RUC-04-srs-review']:
    p=R/f'{stem}.puml';s=p.read_text(encoding='utf-8').replace('@startuml\n',"@startuml\n' ADR-042: context supporting subflow; no new canonical UC. No due-list browsing.\n",1);p.write_text(s,encoding='utf-8')

p=ROOT/'docs/02-requirements.md'
s=p.read_text(encoding='utf-8')
marker='### SRS interaction and session boundary'
at=s.index(marker)
s=s[:at]+'''### Study Focus personalization — ADR-042 (2026-10-12)

Each owned LearningContext has one primary Study Focus: BALANCED default, VOCABULARY, GRAMMAR, READING or LISTENING. Selection/change is optional context/preferences behavior and applies to the next supplementary session only. Preserve existing history/scores/progress/start/working level and all SRS schedules; started session composition is unchanged.

Ordinary supplementary practice combines independently eligible due/overdue SRS with configured focus-biased authored PRACTICE from the context's published AVAILABLE accessible curriculum. Reuse finite active Topic/Skill catalog metadata with four controlled knowledge areas; reject draft/inactive/retired/foreign-scope/secure assessment content. Bias is nonexclusive and configuration-driven, with eligible other-area fallback and no failure from sparse focus content. No fixed platform count/percentage or new taxonomy/history/composition table is required.

Shared core order/unlocks/completion/Level-up gates and N/K contributions 1/0.5/0 with N+K denominator are unchanged. Supplementary responses never enter core score/completion or scored pinned Placement/Level-up composition/results. Grammar focus cannot suppress due vocabulary. Learners see only current prompts after session start, never due-list/pre-browse metadata. Detailed decision and PERS-01–10 design cases: [Study Focus addendum](study-focus-addendum.md). Canonical UCs remain unchanged.

'''+s[at:]
p.write_text(s,encoding='utf-8')
p=ROOT/'docs/use-case-specifications.md';s=p.read_text(encoding='utf-8')
for marker,block in [
 ('## 5. Thi lên cấp','''### Supporting context preferences — Study Focus (ADR-042)

`Chọn/thay đổi trọng tâm học tập` is supporting behavior within UC-04, not a new canonical UC. ACTIVE Learner chooses one of BALANCED (default), VOCABULARY, GRAMMAR, READING, LISTENING for their own context; invalid value/foreign context denies. Creation does not require a choice. Changes affect next supplementary practice only, preserve started composition and never reset start/progress/SRS or rewrite evidence. See [decision/design cases](study-focus-addendum.md).

'''),
 ('## 7. Học từ vựng','''### Supplementary practice — ADR-042

After valid core completion, learner may start a supplementary block: independent internal due/overdue SRS plus configured focus-biased eligible authored practice. Other-area fallback handles scarce focus material; an empty optional practice pool never fails core completion. Restrict to published AVAILABLE accessible same-context curriculum with active finite practice-skill/area metadata and PRACTICE origin; no secure assessment reuse. Temporary feedback stays outside core N/K, performance/completion/unlocks, secure assessment result and progression. No extra canonical UC or persisted composition/history is required.

'''),
 ('## 8. Theo dõi','''### Focus and SRS selection — ADR-042

Focus bias is separate from due selection: GRAMMAR still keeps due VOCABULARY eligible. No learner due list, card preview or stage/date enumeration. One prompt is returned only after ordinary supplementary/dedicated session start; overdue persists until valid review. Policy B, core enrollment/optional Add to Review, account-wide card uniqueness and at-most-once reinforcement without a second schedule remain unchanged. No dynamic SRS/focus practice enters scored Placement/Level-up versions.

''')]:
    at=s.index(marker);s=s[:at]+block+s[at:]
p.write_text(s,encoding='utf-8')
p=ROOT/'docs/05-traceability-matrix.md';s=p.read_text(encoding='utf-8');at=s.find('\n')
s=s[:at]+'''

## Current Study Focus traceability — ADR-042

| Requirement | Canonical behavior / affected views | Design acceptance |
|---|---|---|
| One owned-context focus, default BALANCED; optional change, next session only | UC-04 supporting preferences; VIEW-RUC-02; ACT-01; DOM-01/DATA-03 | PERS-01/05/09/10 |
| Configured nonexclusive bias, eligible fallback and finite published practice metadata | UC-06; VIEW-RUC-03; ACT-03/SEQ-06; DOM-01/DATA-03 | PERS-02/03/09 |
| Internal independent due/overdue SRS, no due browsing; unchanged Policy B | UC-07; VIEW-RUC-04; ACT-06/SEQ-08 | PERS-04/05 |
| Shared core N/K, completion, order/unlocks/gates unchanged | UC-04/06/08; ACT-03/SEQ-06 | PERS-06 |
| No dynamic focus/SRS in scored pinned secure assessments | UC-02/05; existing secure-assessment views unchanged | PERS-07/08 |
| Exact Teacher key projection/submit and own-context principal lock path | UC-10/11 and UC-04; proposed physical security correction | PD-F01-AUTHORING-ALLOW/OTHER-TEACHER/LEARNER-KEY-DENIED/PINNED-GRADER/MISSING-KEY/TEACHER-PUBLISH-DENIED; PD-F02-PARENT-LOCK-PRIVILEGES/LOCKER-CONTEXT-READ/CREATE-RESUME-PAUSE-RACE |

Canonical UC-01–14 identity/count is unchanged. [Addendum](study-focus-addendum.md) and [physical correction](design/physical/personalization-and-final-correction.md) contain future design acceptance, **NOT EXECUTED**; no runtime implementation/test status is inferred. Earlier trace rows remain historical where marked.
'''+s[at:];p.write_text(s,encoding='utf-8')
for p,text in [
 (M/'README.md','\n\n## Study Focus targeted addendum (ADR-042, 2026-10-12)\n\n[PO addendum](../../study-focus-addendum.md) synchronizes ACT-01/03/06, SEQ-06/08 and DOM-01/DATA-03 only. No canonical UC/diagram identity changes. Context focus affects next supplementary composition; SRS selection stays internal/independent and secure assessments stay pinned. Scope/render/review evidence: [physical correction](../../design/physical/personalization-and-final-correction.md). Earlier full-review verdicts remain dated evidence, not approval of this physical proposal.\n'),
 (R/'README.md','\n\n## Study Focus integration (ADR-042)\n\nVIEW-RUC-02 adds supporting owned-context focus selection/change; VIEW-RUC-03 adds personalized supplementary practice outside core; VIEW-RUC-04 keeps due selection internal and independent from focus. Canonical UC-01–14 remain unchanged. [Addendum](../../study-focus-addendum.md) controls these changes; affected PNG/SVG/manifest records are refreshed in this correction. Physical interaction sync is now recorded in [physical correction](../../design/physical/personalization-and-final-correction.md); the earlier downstream note describes the prior report-only task.\n')]:
    with p.open('a',encoding='utf-8') as f:f.write(text)
print('Targeted logical/requirements/UC/trace/report synchronization applied')
