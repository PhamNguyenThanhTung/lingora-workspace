# Project 1 — Software Engineering Report Workspace & Reading Order Index

> **Mã tài liệu:** `docs/project-1/README.md`
> **Trạng thái:** `REPORT / PRESENTATION ARTIFACT (Historical Project 1 Reading Order Index)`
> **Phân loại:** `REPORT / PRESENTATION ARTIFACT`. Tài liệu chỉ mục phục vụ báo cáo Đồ án 1 tại thời điểm Phase 0 (ADR-010). Các tài liệu và đường dẫn trong không gian này phản ánh ảnh chụp báo cáo học thuật lịch sử; KHÔNG dùng làm căn cứ thẩm quyền cho thiết kế sản phẩm hoặc miền nghiệp vụ hiện hành (vốn được kiểm soát bởi `AGENTS.md`, `docs/README.md`, `docs/QUICK-REF.md`, và các ADR-030–036).
> **Phiên bản:** `1.1.0` (ADR-010 two-track consolidation)

---

## 1. Hướng dẫn Thứ tự Đọc Tài liệu Kỹ thuật (Engineering & Report Reading Order)

Để nắm bắt toàn diện kiến trúc, yêu cầu, cơ sở dữ liệu và bằng chứng triển khai của dự án Lingora, khuyến nghị thứ tự tiếp cận tài liệu như sau:

| Thứ tự | Tài liệu | Đường dẫn | Mục đích chính |
|---|---|---|---|
| **1** | **Mục lục tài liệu** | [Tài liệu Lingora](../README.md) | Tìm yêu cầu, use case, dữ liệu, báo cáo và UI baseline. |
| **2** | **Kế hoạch Tổng thể & Lộ trình** | `docs/00-master-plan.md` | Xem mục tiêu, nguyên tắc bóc tách, các giả định G1–G6, và lộ trình 12 tuần. |
| **3** | **Đặc tả Phân tích Hệ thống** | [`docs/06-system-analysis.md`](../06-system-analysis.md) | Khảo sát bài toán, danh mục 6 năng lực, phân tích tác nhân, đặc tả chi tiết 8 Use Case và biểu đồ tuần tự. |
| **4** | **Từ điển Dữ liệu & ERD** | [`docs/07-data-dictionary.md`](../07-data-dictionary.md) | Xem biểu đồ ERD 17 thực thể, chi tiết ràng buộc thuộc tính, private storage buckets và bảng đối chiếu mismatch. |
| **5** | **Kiến trúc Hệ thống** | [`docs/01-architecture.md`](../01-architecture.md) | Phân tách trách nhiệm Web Learner (`lingora-web`), Web Admin, Supabase BaaS và AI Microservice. |
| **6** | **Hợp đồng Giao tiếp API** | [`docs/03-api-contract.md`](../03-api-contract.md) | Đặc tả target `/v1/gec/correct`, compatibility endpoints và error envelope. |
| **7** | **Ma trận Truy vết Yêu cầu** | [`docs/05-traceability-matrix.md`](../05-traceability-matrix.md) | Bảng ánh xạ 26 yêu cầu (Must/Nice) sang Use Case, Component, Entity, Test ID và bằng chứng báo cáo. |
| **8** | **Quyết định Kiến trúc & Bằng chứng** | [`logs/decision-log.md`](../../logs/decision-log.md) & [`logs/CHANGELOG.md`](../../logs/CHANGELOG.md) | Tra cứu ADR-014, ADR-030–036, ADR-041–044 và kết quả các slice. |

---

## 2. Tài liệu Báo cáo Đồ án (.docx)
- **Báo cáo Kỹ nghệ Phần mềm (Giảng viên định dạng chuẩn):** [`docs/report/Lingora-Project-1-Lecturer-Format-Final.docx`](../report/Lingora-Project-1-Lecturer-Format-Final.docx)
- **Tài liệu Báo cáo Markdown:** [`docs/report/lingora-project-1-lecturer-format.md`](../report/lingora-project-1-lecturer-format.md)
- **Sơ đồ Báo cáo Học thuật:** [PlantUML và Draw.io](../modeling/report-usecases/README.md)
- *Ghi chú:* Các báo cáo ML/NLP cũ phân tán trước đây (`docs/ml/`, `docs/nlp/`) đã được dọn dẹp và hợp nhất vào hai báo cáo chính thức theo quyết định ADR-010 (Software Engineering + Transformer GEC).

*Vòng đời các phần trong báo cáo:* `PLANNED → DRAFT → EVIDENCE-READY → VERIFIED`.
