# Project 1 — Software Engineering Report Workspace & Reading Order Index

> **Mã tài liệu:** `docs/project-1/README.md`
> **Trạng thái:** `CANONICAL INDEX`
> **Phiên bản:** `1.1.0` (ADR-010 two-track consolidation)

---

## 1. Hướng dẫn Thứ tự Đọc Tài liệu Kỹ thuật (Engineering & Report Reading Order)

Để nắm bắt toàn diện kiến trúc, yêu cầu, cơ sở dữ liệu và bằng chứng triển khai của dự án Lingora, khuyến nghị thứ tự tiếp cận tài liệu như sau:

| Thứ tự | Tài liệu | Đường dẫn | Mục đích chính |
|---|---|---|---|
| **1** | **Bản tóm tắt nhanh dự án** | [`docs/QUICK-REF.md`](../QUICK-REF.md) | Nắm bắt nhanh kiến trúc, stack công nghệ, trạng thái milestone và các endpoint API. |
| **2** | **Kế hoạch Tổng thể & Lộ trình** | [`docs/00-master-plan.md`](../00-master-plan.md) | Xem mục tiêu, nguyên tắc bóc tách, các giả định G1–G6, và lộ trình 12 tuần. |
| **3** | **Đặc tả Phân tích Hệ thống** | [`docs/06-system-analysis.md`](../06-system-analysis.md) | Khảo sát bài toán, danh mục 6 năng lực, phân tích tác nhân, đặc tả chi tiết 8 Use Case và biểu đồ tuần tự. |
| **4** | **Từ điển Dữ liệu & ERD** | [`docs/07-data-dictionary.md`](../07-data-dictionary.md) | Xem biểu đồ ERD 17 thực thể, chi tiết ràng buộc thuộc tính, private storage buckets và bảng đối chiếu mismatch. |
| **5** | **Kiến trúc Hệ thống** | [`docs/01-architecture.md`](../01-architecture.md) | Phân tách trách nhiệm Web Learner (`lingora-web`), Web Admin, Supabase BaaS và AI Microservice. |
| **6** | **Hợp đồng Giao tiếp API** | [`docs/03-api-contract.md`](../03-api-contract.md) | Đặc tả target `/v1/gec/correct`, compatibility endpoints và error envelope. |
| **7** | **Ma trận Truy vết Yêu cầu** | [`docs/05-traceability-matrix.md`](../05-traceability-matrix.md) | Bảng ánh xạ 26 yêu cầu (Must/Nice) sang Use Case, Component, Entity, Test ID và bằng chứng báo cáo. |
| **8** | **Quyết định Kiến trúc & Bằng chứng** | [`logs/decision-log.md`](../../logs/decision-log.md) & [`logs/test-log.md`](../../logs/test-log.md) | Tra cứu ADR-001 .. ADR-010 và bằng chứng kiểm thử thực tế. |

---

## 2. Tài liệu Báo cáo Đồ án (.docx)
- **Báo cáo Kỹ nghệ Phần mềm:** [`docs/project-1/Lingora-Project-1.docx`](Lingora-Project-1.docx)
- **Báo cáo Học máy / Deep Learning (Transformer GEC):** [`docs/ml/Lingora-ML.docx`](../ml/Lingora-ML.docx)
- **Báo cáo NLP cũ:** [`docs/nlp/Lingora-NLP.docx`](../nlp/Lingora-NLP.docx) — historical scaffold, SUPERSEDED by ADR-010; binary không bị xóa trong task tài liệu này.

*Vòng đời các phần trong báo cáo:* `PLANNED → DRAFT → EVIDENCE-READY → VERIFIED`.
