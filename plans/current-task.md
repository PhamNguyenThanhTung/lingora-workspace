# Active Task

`integrate-survey-and-format-final-report`

## Status

DONE

## Objective

Analyze the 15-response survey workbook, integrate evidence-backed percentages into the active Lingora reports, and produce a polished final DOCX whose academic typography and page presentation follow the provided warehouse-management report reference.

## Approved Decisions

1. Use `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx` as the quantitative survey source (`N=15`).
2. Present major findings percentage-first with counts, for example `86,7% (13/15)`.
3. Keep the 15 survey responses separate from the six original interviews and three supplementary interview records; do not claim a combined `N=21` or `N=24`.
4. Report multi-select percentages against all 15 respondents and state that totals may exceed 100%.
5. Do not fabricate significance, representativeness, or population-level conclusions from the convenience sample.
6. Use `D:/02_QUẢN LÝ NHẬP XUẤT KHO THIẾT BỊ ĐIỆN TỬ.docx` only as a visual/format reference; do not copy its domain content or embedded instructions.
7. Apply its academic presentation conventions to Lingora while retaining Lingora's own chapter structure and technical content.

## Files Expected To Change

- `plans/current-task.md`
- `plans/approved/2026-08-23-integrate-15-response-survey-into-reports-APPROVED.md`
- `docs/report/evidence-register.md`
- `docs/report/lingora-requirements-and-use-cases.md`
- `docs/report/lingora-project-1-requirements-report.md`
- `docs/report/lingora-project-1-lecturer-format.md`
- `docs/report/lingora-project-1-five-chapter-report.md`
- `docs/report/Lingora-Project-1-Lecturer-Format-Final.docx`
- `tmp/report-format-reference/artifact.md`
- `tools/build_lingora_final_report.py`
- `logs/test-log.md`
- `logs/development-log.md`
- `HANDOFF.md`

## Test Plan

1. Recompute all inserted percentages from the workbook and verify count/percentage pairs.
2. Verify all reports state `N=15`, separate survey and interview evidence, and explain multi-select totals.
3. Scan reports for obsolete claims that no traceable quantitative survey exists.
4. Run `git diff --check` and post-change quality review.
5. Render the final DOCX to page PNGs and visually inspect every page; verify styles, headings, tables, headers/footers and page numbering.

## Approval

- Status: **APPROVED by user on 2026-08-23**
- Approval message: "đây là phần khảo sát thêm vào báo cáo cho tôi ghi tỉ lệ cho nó to chứ 15 người đang hơi ít"
- Format reference approval: "bạn xem đây là format báo cáo dài đầy đủ chuẩn chi ... phông chữ cách trình bày nó phải kiểu như này"
