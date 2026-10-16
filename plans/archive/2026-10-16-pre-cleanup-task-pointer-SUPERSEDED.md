# Current task pointer

**Status:** DONE — detailed DOM-01 completeness documentation review only.
**Approval:** [user-authorized review](approved/2026-10-12-class-completeness-review-APPROVED.md).
**Completed task:** [archive](archive/2026-10-12-class-completeness-review-DONE.md).
**Deliverable:** [all23 classifier review + concrete correction proposal](../docs/modeling/current-target/class-completeness-review-2026-10-12.md).
**Evidence:** [audit](../docs/modeling/current-target/evidence/2026-10-12-class-completeness/verification.json), [inventory](../docs/modeling/current-target/evidence/2026-10-12-class-completeness/inventory.json), [entry capture](../docs/modeling/current-target/evidence/2026-10-12-class-completeness/entry-pointer.zip).

Conclusion: conceptual overview with minimal attributes; insufficient as detailed class design. Five empty classes; source/native members match. No canonical/native diagram or business correction applied. All44 pages and1,041 protected files unchanged; logs recorded, no staging/commit. Source-backed additions and naming/type/operation choices are proposals requiring a separately authorized correction scope.

Prior Activity layout and DOM readability remain DONE in their archives. Prior insertion drift remains separately [REVIEW](archive/2026-10-12-add-report-usecases-to-native-drawio-REVIEW-CAPTURE.md). Physical design PROPOSED, liveDB unverified; implementation/physical approval gates unchanged. No follow-on work active.


## Active directly authorized task: full Activity refinement

**Status:** TESTING

# Full Activity layout refinement — preserve concurrent document changes

**Approval:** direct user request 2026-10-12: “kh chỉnh full à có mấy cái trông vẫn khá xấu ... đang có 1 cái cập nhật song song ... kiểm tra lại xem”; save clarification: “Kiểm tra rồi lưu an toàn vào file chính”. Bounded diagram layout only.
**Scope:** all eight active native ACT-01/02/03/04/06/07/08/09 pages; prioritize ACT-03/06/04 and screenshot ACT-01. Full layout refinement, not just enlarging existing coordinates. Separate candidate and visual exports first; compare-and-save only the eight current pages into the latest primary bundle after validation. Preserve concurrent DOM-01 and all other current raw pages.
**Permitted:** consistent wrapped boxes, lane widths, row spacing, compact existing rail geometry, orthogonal connectors and separated branch labels. Preserve every existing label/ID/endpoint/arrow and embedded PUML. Native PNG/SVG and presentation crops in new evidence; current ten-minute script image links; append-only task/test/development/handoff records.
**Read-only:** all PUML and original PlantUML renders/manifests, product/spec/ADR, application/schema/API/DB/migrations, repository scripts/tests, prior evidence/approvals and PPTX. No new UML/product decision, full-bundle builder, staging or commit.
**Review:** previous mechanical expansion kept excessively long join lines and close parallel tracks. Shared bundle is also being edited in the DOM-01 chat. Screenshot matches ACT-01 current layout, not evidence of a lost AD save. Work on entry copy; merge only after AD raw hashes/semantics and latest page list remain compatible. If the same AD page changed externally, stop that page and preserve the conflict rather than overwrite it.
**Acceptance:** all eight layout pages readable; compact join lines, aligned/wrapped boxes, no connector through text; no label/shape clipping. Latest 36 non-AD pages exact at merge, including concurrent DOM-01. Canonical semantics unchanged; inspect actual exports and each difficult region before completion.
**Verification:** entry backup/hashes; separate candidate exports; temporary text-fit/node/route/label/semantic audit; before-save compare, exclusive file save and after-save raw-page audit; latest DOM-01 retained; current script links; diff check/stat, new-file line counts, append-only test/development evidence. Runtime N/A (layout only).


## Active directly authorized task: class design completion

**Status:** IMPLEMENTING

# Hoàn thiện thiết kế lớp miền Lingora — kế hoạch docs-only

**Phê duyệt:** yêu cầu PO đính kèm 2026-10-12 (REQUEST.txt), trực tiếp cho phép SAFE DESIGN DECISION và sửa sau bảng phân loại khi không còn user decision block. Đây là task bounded documentation, không architecture/schema/product implementation. Áp dụng brainstorming/writing-plans theo phạm vi đã chốt; không xin lại duyệt các detail được PO cho phép tự hoàn thiện. Không commit.
**Phạm vi file:** DOM-01 PUML + riêng PNG/SVG render pair và entry DOM-01 của manifest; chỉ page-DOM-01 native; thêm report/evidence; cập nhật index README ở mục hiện hành; immutable approved request/plan, DONE archive và append-only logs/lifecycle note. Không sửa 35 source khác, other43 native pages, ADR/product/spec, Prisma/migration/seed/code/API/frontend/tests, không cài package/xóa lịch sử.
**Thiết kế:** 22 class+1 enum trước/sau, không thêm classifier. LogicalUnit→Unit, AssessmentVersion→AssessmentBlueprintVersion giữ native class IDs. Bổ sung attributes logical + explicit28 relations, không methods. Assignment instance là lượt giao có assignedAt/endedAt và previousAssignment reference, at most1 open lượt mỗi content target; giữ Teacher A khi giao B. Blueprint version chứa typed config và grading reference server-only; freeze sau publish/use. Plan/Progress derived; context/SRS/streak/progression invariants giữ nguyên.
**Concurrent:** Activity refinement đang chạy. Candidate đầy đủ trên entry copy; trước save mở file độc quyền, đọc latest44-page package, kiểm tra DOM entry hash và page list; chỉ thay DOM fragment, giữ latest43 fragments exact và lưu merge evidence. Nếu DOM cũng đổi bên ngoài thì dừng save, giữ candidate và conflict. Current-task/HANDOFF chỉ thêm/update section task này, không overwrite task AD. Shared logs append-only. Ngoài scoped concurrent AD evidence/script/lifecycle, các file readonly giữ hash.
**Bước thực hiện:**
- [ ] Đọc authority/inspect repository, đủ23-row bảng trước sửa và USER DECISIONS STILL REQUIRED.
- [ ] Ghi immutable direct approval và baseline/full backup, preserve current task.
- [ ] Sửa một DOM source với group/tên/fields/cardinality; render riêng DOM, update manifest record.
- [ ] Dựng native candidate cùng semantics; route orthogonal/labels/fit; export candidate actual Draw.io PNG/SVG và review.
- [ ] Kiểm tra semantics/types/multiplicity/security/reassignment interval scenarios; geometry/scope/source-render hashes.
- [ ] Compare-and-save riêng DOM vào latest primary, xuất/review actual result, bảo toàn43 raw pages tại save.
- [ ] Báo cáo A–K tiếng Việt, thực chứng diff/stat/line counts/links/log prefixes; logs và DONE archive. Không commit.
**Verification:** PlantUML checkonly + DOM-only PNG/SVG; temporary read-only artifact audit outside repo (no test edits), actual Draw.io export/visual; font-fit/label/route/containment checks; source-native/manifest28 relation parity; explicit invariants and history scenario model-only, runtime N/A; latest merge audit/protected hashes/HEAD/index; diff check/stat và line count new files. Historical full-bundle baseline conflicts không thay/xóa; không chạy builder.
**Không còn user decision bắt buộc cho vòng hoàn thiện sơ đồ này.** Assignment episode representation, member naming/types, optional display fields là SAFE DESIGN DECISION theo §20. Standalone assessment-assignment physical XOR, persistence/table design, additional states/operations/zero-denominator UI và unneeded generic systems DEFER, không block nội dung hiện tại.
