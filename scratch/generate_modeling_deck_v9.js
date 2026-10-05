const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

// ────────────────────────────────────────────────────────────
// Lingora System Modeling Presentation v9 (Locked Final Visual Polish)
// Technical / Software Architecture / Academic Engineering Style
// ────────────────────────────────────────────────────────────

const prs = new pptxgen();
prs.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 inches
prs.author = "Lingora Engineering Architecture";
prs.title = "Lingora — Phân Tích & Mô Hình Hóa Hệ Thống";

// ── Strict Color Palette (Single Accent: Tech Blue #2563EB) ──
const BG_MAIN       = "F8F9FA";  // Off-white minimal canvas
const WHITE         = "FFFFFF";  // Pure white diagram container
const DARK_NAVY     = "0F172A";  // Primary text & titles
const BODY_SLATE    = "334155";  // Body text
const MUTED_GRAY    = "64748B";  // Secondary text, slide numbers
const BORDER_SUBTLE = "E2E8F0";  // 1px clean diagram border
const STRIP_BG      = "F1F5F9";  // Light slate strip fill for takeaways
const ACCENT_BLUE   = "2563EB";  // Single primary presentation accent

// Tag/Badge Colors
const STATUS_PASS_BG = "DCFCE7";
const STATUS_PASS_FG = "15803D";
const STATUS_MUTED_BG = "F1F5F9";
const STATUS_MUTED_FG = "475569";
const STATUS_INFO_BG  = "E0F2FE";
const STATUS_INFO_FG  = "0369A1";

const diagramDir = "docs/diagrams/lingora-modeling/out";
const outFile = "docs/diagrams/lingora-modeling/deck/Lingora-System-Modeling-Presentation-v9.pptx";

function imgData(filename) {
  const p = path.join(diagramDir, filename);
  if (!fs.existsSync(p)) return null;
  const buf = fs.readFileSync(p);
  return "image/png;base64," + buf.toString("base64");
}

// Subtle presentation transitions
const FADE = { type: "fade", secondsAdvance: 0 };
const PUSH = { type: "push", dirn: "L", secondsAdvance: 0 };

function addSlideHeader(s, eyebrow, title, slideNum) {
  s.addText(eyebrow.toUpperCase(), {
    x: 0.8, y: 0.35, w: 9.0, h: 0.25,
    fontSize: 10, fontFace: "Calibri", color: ACCENT_BLUE, bold: true, charSpacing: 1.5, margin: 0
  });
  s.addText(title, {
    x: 0.8, y: 0.62, w: 10.5, h: 0.45,
    fontSize: 21, fontFace: "Calibri", color: DARK_NAVY, bold: true, margin: 0
  });
  if (slideNum) {
    s.addText(`${String(slideNum).padStart(2, "0")} / 12`, {
      x: 11.5, y: 0.4, w: 1.0, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: MUTED_GRAY, bold: true, align: "right", margin: 0
    });
  }
}

// ════════════════════════════════════════════════════════════
// SLIDE 1: COVER (Modern Minimal Technical)
// ════════════════════════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = FADE;
  s.background = { color: BG_MAIN };

  // Geometric blueprint line motif on the right
  const pts = [
    [10.2, 1.5], [11.8, 1.8], [11.0, 3.2], [12.2, 4.0], [10.5, 5.0], [11.8, 5.8]
  ];
  pts.forEach(([px, py]) => {
    s.addShape("ellipse", {
      x: px, y: py, w: 0.12, h: 0.12,
      fill: { color: "CBD5E1" }, line: { width: 0 }
    });
  });
  const lines = [[0,1], [1,2], [2,3], [2,4], [4,5]];
  lines.forEach(([a, b]) => {
    const [x1, y1] = pts[a];
    const [x2, y2] = pts[b];
    s.addShape("line", {
      x: Math.min(x1, x2) + 0.06, y: Math.min(y1, y2) + 0.06,
      w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
      line: { color: "E2E8F0", width: 0.75 },
      flipV: y2 < y1
    });
  });

  // Top accent bar
  s.addShape("rect", {
    x: 0.8, y: 1.8, w: 0.06, h: 3.2,
    fill: { color: ACCENT_BLUE }, line: { width: 0 }
  });

  // Main title
  s.addText("LINGORA ARCHITECTURE SPECIFICATION", {
    x: 1.1, y: 1.8, w: 8.5, h: 0.3,
    fontSize: 12, fontFace: "Calibri", color: ACCENT_BLUE, bold: true, charSpacing: 2, margin: 0
  });

  s.addText("Phân Tích & Mô Hình Hóa Hệ Thống", {
    x: 1.1, y: 2.2, w: 8.5, h: 0.9,
    fontSize: 34, fontFace: "Calibri", color: DARK_NAVY, bold: true, margin: 0
  });

  s.addText("Use Case Diagram  ·  Activity Flow  ·  Domain Class Model  ·  Traceability Matrix", {
    x: 1.1, y: 3.2, w: 8.5, h: 0.4,
    fontSize: 13, fontFace: "Calibri", color: BODY_SLATE, margin: 0
  });

  s.addText("Tài liệu Kỹ thuật Phần mềm — Phase 1 Locked Baseline", {
    x: 1.1, y: 4.2, w: 8.5, h: 0.35,
    fontSize: 11, fontFace: "Calibri", color: MUTED_GRAY, margin: 0
  });

  s.addNotes("Báo cáo phân tích và mô hình hóa hệ thống học ngoại ngữ Lingora. Nội dung bao gồm biểu đồ ca sử dụng, biểu đồ hoạt động, biểu đồ lớp và ma trận truy vết yêu cầu.");
})();

// ════════════════════════════════════════════════════════════
// SLIDE 2: OVERVIEW ARCHITECTURE (Consistent Style, No Rainbow)
// ════════════════════════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = PUSH;
  s.background = { color: BG_MAIN };

  addSlideHeader(s, "Kiến trúc hệ thống", "Tổng Quan Phân Hệ & Ranh Giới Phạm Vi", 2);

  const cols = [
    {
      num: "01",
      title: "LEARNING SUBSYSTEM",
      subtitle: "Trải nghiệm học tập & củng cố",
      items: [
        "[UC-01] Xác thực phiên & phân quyền người dùng",
        "[UC-02] Cài đặt mục tiêu học tập hằng ngày",
        "[UC-03] Kiểm tra chẩn đoán xếp lớp đầu vào",
        "[UC-04] Duyệt lộ trình học & thử thách Jump",
        "[UC-05] Xem bài học (Viewer) & làm bài tập tương tác",
        "[UC-06] Ôn tập từ vựng ngắt quãng theo SRS Policy B",
        "[UC-07] Theo dõi tiến độ học tập & chuỗi ngày Streak"
      ]
    },
    {
      num: "02",
      title: "CONTENT SUBSYSTEM",
      subtitle: "Biên soạn, duyệt & quản lý phiên bản",
      items: [
        "[UC-08] Soạn thảo bài học, bài tập & từ vựng đi kèm",
        "[UC-09] Kiểm duyệt độc lập & yêu cầu chỉnh sửa",
        "[UC-10] Xuất bản bài học đã duyệt ra hệ thống",
        "[Rule] Clone-to-Draft v2 bảo toàn bài đang phát hành",
        "[Rule] Điều kiện hiển thị Unit: đủ 4/4 Lesson Published",
        "[Rule] Phân tách nhiệm vụ SoD: Creator không tự duyệt",
        "[Admin] Xuất bản khẩn cấp bài Approved (kèm AuditLog)"
      ]
    },
    {
      num: "03",
      title: "ADMIN & OPERATIONS",
      subtitle: "Vận hành, kiểm toán & điều phối",
      items: [
        "[UC-11] Quản trị tài khoản & 6 vai trò hệ thống",
        "[UC-12] Xem báo cáo & thống kê vận hành",
        "[UC-13] Tra cứu nhật ký kiểm toán an ninh AuditLog",
        "[UC-14] Tiếp nhận & điều phối xử lý phiếu hỗ trợ",
        "[UC-15] Quản lý nhóm học viên & tiến độ lớp học",
        "[Rule] Tiến độ (UserProgress) tách rời Năng lực (SkillProfile)",
        "[Rule] Mọi thao tác quản trị quan trọng đều lưu AuditLog"
      ]
    }
  ];

  const colW = 3.65;
  const gap = 0.39;
  const startX = 0.8;

  cols.forEach((col, idx) => {
    const x = startX + idx * (colW + gap);

    // Card white
    s.addShape("rect", {
      x: x, y: 1.25, w: colW, h: 4.5,
      fill: { color: WHITE },
      line: { color: BORDER_SUBTLE, width: 1 }
    });

    // Subsystem Header
    s.addText(`${col.num}  ·  ${col.title}`, {
      x: x + 0.25, y: 1.45, w: colW - 0.5, h: 0.35,
      fontSize: 12, fontFace: "Calibri", color: DARK_NAVY, bold: true, margin: 0
    });
    s.addText(col.subtitle, {
      x: x + 0.25, y: 1.82, w: colW - 0.5, h: 0.25,
      fontSize: 10, fontFace: "Calibri", color: MUTED_GRAY, italic: true, margin: 0
    });

    // Divider
    s.addShape("rect", {
      x: x + 0.25, y: 2.15, w: colW - 0.5, h: 0.015,
      fill: { color: BORDER_SUBTLE }, line: { width: 0 }
    });

    // Bullets
    const textArr = col.items.map((it, i) => ({
      text: it,
      options: {
        fontSize: 9.5, fontFace: "Calibri", color: BODY_SLATE,
        bullet: true, paraSpaceAfter: 5,
        breakLine: i < col.items.length - 1
      }
    }));
    s.addText(textArr, {
      x: x + 0.15, y: 2.25, w: colW - 0.35, h: 3.3,
      valign: "top", margin: [0, 5, 0, 5]
    });
  });

  // Bottom Scope & Roles strip (Clean Off-white / Slate)
  s.addShape("rect", {
    x: 0.8, y: 5.95, w: 11.733, h: 1.05,
    fill: { color: STRIP_BG },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  s.addText("6 VAI TRÒ & PHẠM VI QUYỀN HẠN", {
    x: 1.05, y: 6.05, w: 6.0, h: 0.25,
    fontSize: 10, fontFace: "Calibri", color: ACCENT_BLUE, bold: true, charSpacing: 1, margin: 0
  });

  s.addText([
    { text: "6 vai trò hệ thống:  ", options: { fontSize: 10, fontFace: "Calibri", color: DARK_NAVY, bold: true } },
    { text: "Learner  ·  Lesson Creator  ·  Moderator  ·  Org Manager  ·  Operations Staff  ·  Administrator", options: { fontSize: 10, fontFace: "Calibri", color: BODY_SLATE } }
  ], { x: 1.05, y: 6.32, w: 11.0, h: 0.25, margin: 0 });

  s.addText("Phân định scope: UC-14 (Phiếu hỗ trợ) thuộc MVP điều phối; UC-15 (Quản lý nhóm) thuộc phạm vi mở rộng tương lai (Future Extension).", {
    x: 1.05, y: 6.6, w: 11.0, h: 0.25,
    fontSize: 9.5, fontFace: "Calibri", color: MUTED_GRAY, margin: 0
  });

  s.addNotes("Kiến trúc phân chia thành 3 phân hệ độc lập: Learning, Content và Admin/Ops. 6 vai trò bảo đảm nguyên tắc phân tách trách nhiệm.");
})();

// ════════════════════════════════════════════════════════════
// SLIDE 3: OVERALL USE CASE (Large Diagram + Right Compact Callout)
// ════════════════════════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = PUSH;
  s.background = { color: BG_MAIN };

  addSlideHeader(s, "Ca sử dụng hệ thống", "Sơ Đồ Ca Sử Dụng Tổng Quan (Overall Use Case Diagram)", 3);

  // Large Diagram Container: 8.5 inches wide (~72% area)
  s.addShape("rect", {
    x: 0.8, y: 1.25, w: 8.5, h: 5.75,
    fill: { color: WHITE },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  const d = imgData("02-usecase-overall.png");
  if (d) {
    s.addImage({
      data: d,
      x: 0.9, y: 1.35, w: 8.3, h: 5.55,
      sizing: { type: "contain", w: 8.3, h: 5.55 }
    });
  }

  // Right takeaway container: 3.0 inches wide
  s.addShape("rect", {
    x: 9.5, y: 1.25, w: 3.033, h: 5.75,
    fill: { color: WHITE },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  s.addText("ĐIỂM NHẤN KIẾN TRÚC", {
    x: 9.75, y: 1.45, w: 2.5, h: 0.3,
    fontSize: 10.5, fontFace: "Calibri", color: ACCENT_BLUE, bold: true, charSpacing: 1, margin: 0
  });

  const takeaways = [
    { title: "Kế thừa Authenticated User", desc: "6 vai trò đều kế thừa từ Authenticated User để dùng chung cơ chế phiên và xác thực [UC-01]." },
    { title: "Tách riêng 3 phân hệ", desc: "Phân định rõ ranh giới giữa Học tập (Learner), Quản trị nội dung (Content) và Vận hành (Admin/Ops)." },
    { title: "Quyền xuất bản chính thức", desc: "Chỉ Org Manager có quyền Publish [UC-10]. Admin chỉ xuất bản khẩn cấp khi có lý do và lưu AuditLog." },
    { title: "Ranh giới phạm vi (Scope)", desc: "UC-14 (Phiếu hỗ trợ) thuộc MVP điều phối. UC-15 (Quản lý nhóm) nằm trong nhóm mở rộng tương lai." }
  ];

  let curY = 1.95;
  takeaways.forEach((t) => {
    s.addText(`• ${t.title}`, {
      x: 9.75, y: curY, w: 2.55, h: 0.25,
      fontSize: 10, fontFace: "Calibri", color: DARK_NAVY, bold: true, margin: 0
    });
    curY += 0.28;
    s.addText(t.desc, {
      x: 9.95, y: curY, w: 2.35, h: 0.65,
      fontSize: 9.5, fontFace: "Calibri", color: BODY_SLATE, valign: "top", margin: 0
    });
    curY += 0.68;
  });

  s.addNotes("Sơ đồ ca sử dụng tổng quan định hình kiến trúc toàn hệ thống Lingora. Tác nhân Authenticated User chuẩn hóa đăng nhập, và phân hệ được chia tách mạch lạc.");
})();

// ════════════════════════════════════════════════════════════
// SLIDE 4: LEARNER USE CASE (Large Diagram + Right Compact Callout)
// ════════════════════════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = PUSH;
  s.background = { color: BG_MAIN };

  addSlideHeader(s, "Phân hệ học viên", "Sơ Đồ Ca Sử Dụng Chi Tiết — Phân Hệ Học Viên (Learner)", 4);

  // Large Diagram Container: 8.5 inches wide (~72% area)
  s.addShape("rect", {
    x: 0.8, y: 1.25, w: 8.5, h: 5.75,
    fill: { color: WHITE },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  const d = imgData("03-usecase-learner.png");
  if (d) {
    s.addImage({
      data: d,
      x: 0.9, y: 1.35, w: 8.3, h: 5.55,
      sizing: { type: "contain", w: 8.3, h: 5.55 }
    });
  }

  // Right takeaway container: 3.0 inches wide
  s.addShape("rect", {
    x: 9.5, y: 1.25, w: 3.033, h: 5.75,
    fill: { color: WHITE },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  s.addText("QUY TẮC NGHIỆP VỤ HỌC VIÊN", {
    x: 9.75, y: 1.45, w: 2.5, h: 0.3,
    fontSize: 10.5, fontFace: "Calibri", color: ACCENT_BLUE, bold: true, charSpacing: 1, margin: 0
  });

  const takeaways = [
    { title: "Bắt buộc xem lý thuyết", desc: "Lesson Content Viewer được include vào UC-05; học viên phải xem lý thuyết/từ vựng trước khi làm bài tập." },
    { title: "Làm lại có kiểm soát (Retry)", desc: "Luồng extend từ UC-05 có hạn mức max(1, floor(N*0.10)), điểm làm lại tối đa 70% credit." },
    { title: "Thử thách nhảy cấp (Jump)", desc: "Mở rộng từ UC-04, yêu cầu đạt >= 95% và áp dụng thời gian chờ Cooldown 24h khi thi trượt." },
    { title: "Vòng lặp học tập khép kín", desc: "Xếp lớp (UC-03) -> học bài (UC-05) -> ôn tập SRS độc lập (UC-06) -> tích lũy chuỗi ngày Streak (UC-07)." }
  ];

  let curY = 1.95;
  takeaways.forEach((t) => {
    s.addText(`• ${t.title}`, {
      x: 9.75, y: curY, w: 2.55, h: 0.25,
      fontSize: 10, fontFace: "Calibri", color: DARK_NAVY, bold: true, margin: 0
    });
    curY += 0.28;
    s.addText(t.desc, {
      x: 9.95, y: curY, w: 2.35, h: 0.65,
      fontSize: 9.5, fontFace: "Calibri", color: BODY_SLATE, valign: "top", margin: 0
    });
    curY += 0.68;
  });

  s.addNotes("Quy trình học viên bao quát chu trình từ chẩn đoán xếp lớp, học lý thuyết qua Viewer, làm bài tập tương tác, đến ôn tập ngắt quãng và tích lũy Streak.");
})();

// ════════════════════════════════════════════════════════════
// SLIDE 5: CONTENT & ADMIN USE CASE (Large Diagram + Right Compact Callout)
// ════════════════════════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = PUSH;
  s.background = { color: BG_MAIN };

  addSlideHeader(s, "Quản trị & kiểm duyệt", "Sơ Đồ Ca Sử Dụng Chi Tiết — Quản Trị & Kiểm Duyệt", 5);

  // Large Diagram Container: 8.5 inches wide (~72% area)
  s.addShape("rect", {
    x: 0.8, y: 1.25, w: 8.5, h: 5.75,
    fill: { color: WHITE },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  const d = imgData("04-usecase-content-admin.png");
  if (d) {
    s.addImage({
      data: d,
      x: 0.9, y: 1.35, w: 8.3, h: 5.55,
      sizing: { type: "contain", w: 8.3, h: 5.55 }
    });
  }

  // Right takeaway container: 3.0 inches wide
  s.addShape("rect", {
    x: 9.5, y: 1.25, w: 3.033, h: 5.75,
    fill: { color: WHITE },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  s.addText("NGUYÊN TẮC QUẢN TRỊ & SOD", {
    x: 9.75, y: 1.45, w: 2.5, h: 0.3,
    fontSize: 10.5, fontFace: "Calibri", color: ACCENT_BLUE, bold: true, charSpacing: 1, margin: 0
  });

  const takeaways = [
    { title: "Phân tách nhiệm vụ (SoD)", desc: "Creator soạn thảo, Moderator thẩm định, Org Manager xuất bản. Creator không tự duyệt nội dung của mình." },
    { title: "Quyết định thẩm định", desc: "Moderator chỉ chuyển APPROVED hoặc CHANGES_REQUESTED kèm góp ý, không có quyền xuất bản ra hệ thống." },
    { title: "Quyền xuất bản chính thức", desc: "Org Manager là vai trò duy nhất có thẩm quyền Publish bài học đạt trạng thái APPROVED." },
    { title: "Xuất bản khẩn cấp", desc: "Admin chỉ can thiệp xuất bản bài đã Approved; bắt buộc nhập lý do giải trình và lưu AuditLog." }
  ];

  let curY = 1.95;
  takeaways.forEach((t) => {
    s.addText(`• ${t.title}`, {
      x: 9.75, y: curY, w: 2.55, h: 0.25,
      fontSize: 10, fontFace: "Calibri", color: DARK_NAVY, bold: true, margin: 0
    });
    curY += 0.28;
    s.addText(t.desc, {
      x: 9.95, y: curY, w: 2.35, h: 0.65,
      fontSize: 9.5, fontFace: "Calibri", color: BODY_SLATE, valign: "top", margin: 0
    });
    curY += 0.68;
  });

  s.addNotes("Quy trình phê duyệt nội dung tuân thủ nguyên tắc phân tách nhiệm vụ (SoD). Moderator độc lập thẩm định và Org Manager độc quyền xuất bản.");
})();

// ════════════════════════════════════════════════════════════
// Helper: Dual Activity Slide (Diagrams 75% height, slim strip)
// ════════════════════════════════════════════════════════════
function addDualActivitySlide(opts) {
  const s = prs.addSlide();
  s.transition = PUSH;
  s.background = { color: BG_MAIN };

  addSlideHeader(s, opts.eyebrow, opts.title, opts.num);

  const diagW = 5.72;
  const diagH = 4.45;  // Substantially enlarged diagrams

  // Left Diagram Header & Container
  s.addText(opts.leftTitle, {
    x: 0.8, y: 1.18, w: diagW, h: 0.25,
    fontSize: 10.5, fontFace: "Calibri", color: DARK_NAVY, bold: true, margin: 0
  });

  s.addShape("rect", {
    x: 0.8, y: 1.48, w: diagW, h: diagH,
    fill: { color: WHITE },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  const dL = imgData(opts.leftFile);
  if (dL) {
    s.addImage({
      data: dL,
      x: 0.88, y: 1.55, w: diagW - 0.16, h: diagH - 0.14,
      sizing: { type: "contain", w: diagW - 0.16, h: diagH - 0.14 }
    });
  }

  // Right Diagram Header & Container
  s.addText(opts.rightTitle, {
    x: 6.813, y: 1.18, w: diagW, h: 0.25,
    fontSize: 10.5, fontFace: "Calibri", color: DARK_NAVY, bold: true, margin: 0
  });

  s.addShape("rect", {
    x: 6.813, y: 1.48, w: diagW, h: diagH,
    fill: { color: WHITE },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  const dR = imgData(opts.rightFile);
  if (dR) {
    s.addImage({
      data: dR,
      x: 6.893, y: 1.55, w: diagW - 0.16, h: diagH - 0.14,
      sizing: { type: "contain", w: diagW - 0.16, h: diagH - 0.14 }
    });
  }

  // Slim Key Takeaway Strip at Bottom (Height 0.95 in)
  s.addShape("rect", {
    x: 0.8, y: 6.05, w: 11.733, h: 0.95,
    fill: { color: STRIP_BG },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  const bulletsText = opts.takeaways.map((t, idx) => ({
    text: t,
    options: {
      fontSize: 9.2, fontFace: "Calibri", color: BODY_SLATE,
      bullet: true, paraSpaceAfter: 2.5,
      breakLine: idx < opts.takeaways.length - 1
    }
  }));

  s.addText(bulletsText, {
    x: 1.0, y: 6.12, w: 11.3, h: 0.82,
    valign: "middle", margin: [0, 4, 0, 4]
  });

  if (opts.notes) s.addNotes(opts.notes);
}

// ════════════════════════════════════════════════════════════
// SLIDE 6: ACTIVITY PLACEMENT
// ════════════════════════════════════════════════════════════
addDualActivitySlide({
  num: 6,
  eyebrow: "Quy trình đánh giá",
  title: "Sơ Đồ Hoạt Động — Đánh Giá Chẩn Đoán Đầu Vào (Placement)",
  leftTitle: "Luồng Chẩn Đoán Tuyến Tính (30 Câu -> Starting Unit)",
  leftFile: "05a-activity-placement-flow.png",
  rightTitle: "Nhánh Bỏ Qua (Skip) & Nhánh Thi Lại (Retake)",
  rightFile: "05b-activity-placement-branches.png",
  takeaways: [
    "Quy mô 30 câu & Mapping A: Đề thi gồm 30 câu hỏi; thang điểm thô 0–30 ánh xạ ra Starting Unit từ 1 đến 6.",
    "Nhánh Bỏ qua (Skip): Gán mặc định học từ Unit 1 với trạng thái UNVERIFIED; không tạo AssessmentResult hoặc SkillProfile.",
    "Nhánh Thi lại (Retake): Kích hoạt từ Profile; lưu bản ghi AssessmentResult mới độc lập, không xóa lịch sử bài thi trước."
  ],
  notes: "Đánh giá xếp lớp xác định điểm xuất phát cho người học. Tùy chọn bỏ qua không sinh dữ liệu năng lực giả, và thi lại bảo lưu lịch sử bài thi."
});

// ════════════════════════════════════════════════════════════
// SLIDE 7: ACTIVITY LEARNING FLOW
// ════════════════════════════════════════════════════════════
addDualActivitySlide({
  num: 7,
  eyebrow: "Quy trình học bài",
  title: "Sơ Đồ Hoạt Động — Chu Trình Học Bài & Làm Lại Có Kiểm Soát",
  leftTitle: "Luồng Học Chính (Kiểm Tra 4/4 Published -> Viewer -> Bài Tập)",
  leftFile: "06a-activity-learning-main.png",
  rightTitle: "Luồng Làm Lại Có Kiểm Soát (Controlled Retry Flow)",
  rightFile: "06b-activity-learning-retry.png",
  takeaways: [
    "Điều kiện mở Unit: Unit chỉ hiển thị khi có đủ 4/4 Lesson Published. Người học bắt buộc qua Lesson Content Viewer trước khi làm bài tập.",
    "Cơ chế Retry: Khi làm sai bài tập, học viên xem giải thích (Show Explanation); làm lại đúng trong hạn mức nhận tối đa 70% credit.",
    "Cập nhật tiến độ & Streak [UC-07]: Hoàn thành bài học cập nhật UserProgress, tăng Streak [UC-07] và thêm thẻ SRS (1, 3, 7, 14, 30 ngày)."
  ],
  notes: "Chu trình học bài bắt buộc học viên tiếp thu lý thuyết qua Viewer trước khi trả lời câu hỏi. Cơ chế làm lại có kiểm soát giới hạn lượt thử và công nhận điểm."
});

// ════════════════════════════════════════════════════════════
// SLIDE 8: ACTIVITY CONDITIONAL JUMP
// ════════════════════════════════════════════════════════════
addDualActivitySlide({
  num: 8,
  eyebrow: "Quy trình nhảy cấp",
  title: "Sơ Đồ Hoạt Động — Thử Thách Nhảy Cấp (Conditional Jump)",
  leftTitle: "Kiểm Tra Cooldown 24h & Làm Bài Thi Jump",
  leftFile: "07a-activity-jump-check.png",
  rightTitle: "Xử Lý Kết Quả: Vượt Cấp (Đạt >= 95%) vs Khóa Chờ 24h",
  rightFile: "07b-activity-jump-result.png",
  takeaways: [
    "Kiểm tra Cooldown: Hệ thống chặn làm bài nếu đang trong thời gian chờ 24 giờ sau lần thi trượt gần nhất.",
    "Quy mô đề Jump: 20 câu (vượt 1 Unit), 25–30 câu (vượt 2–3 Units), hoặc 40 câu (vượt hơn 3 Units).",
    "Xử lý kết quả: Đạt >= 95% gán nhãn SKIPPED_BY_JUMP (by_jump = true) cho nội dung vượt qua; thi trượt kích hoạt Cooldown 24h."
  ],
  notes: "Thử thách nhảy cấp cho phép bỏ qua nội dung đã thuần thục. Quy mô đề thi linh hoạt theo số Unit nhảy và có thời gian chờ 24h nếu không đạt."
});

// ════════════════════════════════════════════════════════════
// SLIDE 9: ACTIVITY GOVERNANCE
// ════════════════════════════════════════════════════════════
addDualActivitySlide({
  num: 9,
  eyebrow: "Quy trình nội dung",
  title: "Sơ Đồ Hoạt Động — Quản Trị & Xuất Bản Nội Dung",
  leftTitle: "Quy Trình Phê Duyệt & Xuất Bản Chính Thức",
  leftFile: "08a-activity-governance-main.png",
  rightTitle: "Cơ Chế Clone-to-Draft v2 & Xuất Bản Khẩn Cấp",
  rightFile: "08b-activity-governance-branches.png",
  takeaways: [
    "Phê duyệt độc lập: Moderator chuyển APPROVED hoặc CHANGES_REQUESTED kèm ghi chú, không dùng trạng thái REJECTED.",
    "Quyền xuất bản: Org Manager là vai trò duy nhất có thẩm quyền Publish bài học sau khi đã duyệt APPROVED.",
    "Clone-to-Draft v2 & Khẩn cấp: Sửa bài đã xuất bản tạo bản nháp v2 và Archive v1 sau khi Publish v2; Admin xuất bản khẩn cấp có AuditLog."
  ],
  notes: "Quy trình quản trị học liệu kết hợp thẩm định sư phạm và lưu vết phiên bản. Sửa đổi nội dung đã xuất bản được nhân bản an toàn qua phiên bản mới."
});

// ════════════════════════════════════════════════════════════
// SLIDE 10: CLASS CONTENT MODEL (Landscape Diagram 75% + Bottom Slim Takeaway)
// ════════════════════════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = PUSH;
  s.background = { color: BG_MAIN };

  addSlideHeader(s, "Mô hình cấu trúc", "Sơ Đồ Lớp — Cấu Trúc Nội Dung & Khóa Học", 10);

  // Large Landscape Diagram Container: 11.733 in x 4.65 in (~75% area)
  s.addShape("rect", {
    x: 0.8, y: 1.25, w: 11.733, h: 4.65,
    fill: { color: WHITE },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  const d = imgData("09-class-content.png");
  if (d) {
    s.addImage({
      data: d,
      x: 0.9, y: 1.35, w: 11.533, h: 4.45,
      sizing: { type: "contain", w: 11.533, h: 4.45 }
    });
  }

  // Bottom Takeaway Strip (Height 0.95 in)
  s.addShape("rect", {
    x: 0.8, y: 6.05, w: 11.733, h: 0.95,
    fill: { color: STRIP_BG },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  const takeaways = [
    "Ký hiệu CURRENT vs TARGET: Phân biệt bằng nét vẽ: nét liền cho thực thể CURRENT (schema.prisma hiện hành) và nét đứt cho TARGET (mục tiêu Phase 2).",
    "Vòng đời 6 trạng thái: LessonRevision quản lý 6 trạng thái: DRAFT, IN_REVIEW, CHANGES_REQUESTED, APPROVED, PUBLISHED, ARCHIVED.",
    "Liên kết & Ràng buộc: Exercise gắn trực tiếp với LessonRevision; Unit chỉ mở hiển thị cho học viên khi có đủ 4/4 Lesson Published."
  ];

  const bulletsText = takeaways.map((t, idx) => ({
    text: t,
    options: {
      fontSize: 9.2, fontFace: "Calibri", color: BODY_SLATE,
      bullet: true, paraSpaceAfter: 2.5,
      breakLine: idx < takeaways.length - 1
    }
  }));

  s.addText(bulletsText, {
    x: 1.0, y: 6.12, w: 11.3, h: 0.82,
    valign: "middle", margin: [0, 4, 0, 4]
  });

  s.addNotes("Sơ đồ lớp nội dung thể hiện cấu trúc bài học và cơ chế quản lý phiên bản. Nét vẽ phân định trực quan giữa bảng dữ liệu hiện tại và thực thể mục tiêu.");
})();

// ════════════════════════════════════════════════════════════
// SLIDE 11: CLASS LEARNER ASSESSMENT MODEL (Landscape Diagram 75% + Bottom Slim Takeaway)
// ════════════════════════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = PUSH;
  s.background = { color: BG_MAIN };

  addSlideHeader(s, "Mô hình học viên", "Sơ Đồ Lớp — Học Viên, Đánh Giá & Tiến Độ", 11);

  // Large Landscape Diagram Container: 11.733 in x 4.65 in (~75% area)
  s.addShape("rect", {
    x: 0.8, y: 1.25, w: 11.733, h: 4.65,
    fill: { color: WHITE },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  const d = imgData("10-class-learner-assessment.png");
  if (d) {
    s.addImage({
      data: d,
      x: 0.9, y: 1.35, w: 11.533, h: 4.45,
      sizing: { type: "contain", w: 11.533, h: 4.45 }
    });
  }

  // Bottom Takeaway Strip (Height 0.95 in)
  s.addShape("rect", {
    x: 0.8, y: 6.05, w: 11.733, h: 0.95,
    fill: { color: STRIP_BG },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  const takeaways = [
    "Tiến độ tách biệt Năng lực: Tách riêng UserProgress (tiến độ hoàn thành tuyến tính) khỏi SkillProfile (năng lực đa chiều qua AssessmentResult).",
    "SRS tất định Policy B: UserVocabSrs và ReviewLog thực thi chu kỳ ôn tập cố định 1, 3, 7, 14, 30 ngày; trả lời sai reset về mốc 1 ngày.",
    "Trạng thái Retry & Jump: Hạn mức Retry usage và Jump cooldown 24h được mô hình hóa dưới dạng ghi chú logic gắn vào UserProgress."
  ];

  const bulletsText = takeaways.map((t, idx) => ({
    text: t,
    options: {
      fontSize: 9.2, fontFace: "Calibri", color: BODY_SLATE,
      bullet: true, paraSpaceAfter: 2.5,
      breakLine: idx < takeaways.length - 1
    }
  }));

  s.addText(bulletsText, {
    x: 1.0, y: 6.12, w: 11.3, h: 0.82,
    valign: "middle", margin: [0, 4, 0, 4]
  });

  s.addNotes("Mô hình học viên bảo đảm nguyên tắc phân tách giữa tiến độ hoàn thành và hồ sơ năng lực. Dữ liệu ôn tập từ vựng tuân thủ thuật toán chu kỳ ngày cố định.");
})();

// ════════════════════════════════════════════════════════════
// SLIDE 12: TRACEABILITY MATRIX (Academic Engineering Table)
// ════════════════════════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = PUSH;
  s.background = { color: BG_MAIN };

  addSlideHeader(s, "Truy vết yêu cầu", "Ma Trận Truy Vết Nghiệp Vụ Toàn Diện (Traceability Matrix)", 12);

  const headers = ["UC ID", "Tên Ca Sử Dụng Chuẩn Tắc", "Sơ Đồ Hoạt Động", "Lớp Dữ Liệu", "Phạm Vi Triển Khai"];
  const colW = [0.85, 3.5, 2.0, 2.7, 2.683];

  const rows = [
    ["UC-01", "Authenticate & Manage Session", "—", "Profile, Role", "CORE (Phase 2 MVP)"],
    ["UC-02", "Configure Goals & Study Time", "—", "Profile", "CORE (Phase 2 MVP)"],
    ["UC-03", "Take Placement Test", "Slide 6 (Diagnostic Test)", "AssessmentResult, SkillProfile", "CORE (Phase 2 MVP)"],
    ["UC-04", "Browse Learning Path & Conditional Jump", "Slide 8 (Conditional Jump)", "Course, Unit, Lesson, UserProgress", "CORE (Phase 2 MVP)"],
    ["UC-05", "Complete Lesson Exercises & Controlled Retry", "Slide 7 (Learning & Retry)", "Lesson, Exercise, UserProgress", "CORE (Phase 2 MVP)"],
    ["UC-06", "Spaced Repetition Review (SRS)", "—", "Vocabulary, UserVocabSrs, ReviewLog", "CORE (Phase 2 MVP)"],
    ["UC-07", "Track Progress, Mastery & Streak", "Slide 7 (Streak Update)", "Profile, UserProgress", "CORE (Phase 2 MVP)"],
    ["UC-08", "Create & Edit Lesson Draft", "Slide 9 (Governance & Clone)", "Lesson, LessonRevision, Exercise", "CORE (Phase 2 MVP)"],
    ["UC-09", "Review & Moderate Content", "Slide 9 (Moderator Review)", "LessonRevision, AuditLog", "CORE (Phase 2 MVP)"],
    ["UC-10", "Publish Approved Content", "Slide 9 (Publication Flow)", "Unit, Lesson, LessonRevision, AuditLog", "CORE (Phase 2 MVP)"],
    ["UC-11", "Manage Accounts & Roles", "—", "Profile, Role, AuditLog", "CORE (Phase 2 MVP)"],
    ["UC-12", "View System Reports", "—", "UserProgress, AuditLog", "CORE (Phase 2 MVP)"],
    ["UC-13", "View & Audit Security Logs", "—", "AuditLog", "CORE (Phase 2 MVP)"],
    ["UC-14", "Handle Support Tickets", "—", "—", "MVP (Điều phối hỗ trợ)"],
    ["UC-15", "Manage Cohorts & Group Progress", "—", "—", "FUTURE EXTENSION"]
  ];

  const tableRows = [];

  // Dark Header
  tableRows.push(headers.map((h, j) => ({
    text: h,
    options: {
      fontSize: 10, fontFace: "Calibri", color: WHITE, bold: true,
      align: j === 0 || j === 4 ? "center" : "left",
      fill: { color: DARK_NAVY },
      margin: [3, 5, 3, 5],
      border: [
        { type: "solid", color: DARK_NAVY, pt: 0.5 },
        { type: "solid", color: DARK_NAVY, pt: 0.5 },
        { type: "solid", color: DARK_NAVY, pt: 0.5 },
        { type: "solid", color: DARK_NAVY, pt: 0.5 }
      ]
    }
  })));

  // Data rows (subtle zebra)
  rows.forEach((row, i) => {
    const bgColor = i % 2 === 0 ? WHITE : "F8FAFC";
    tableRows.push(row.map((val, j) => {
      const opts = {
        fontSize: 9.2, fontFace: "Calibri", color: BODY_SLATE,
        fill: { color: bgColor },
        margin: [2.5, 5, 2.5, 5],
        border: [
          { type: "solid", color: "E2E8F0", pt: 0.5 },
          { type: "solid", color: "E2E8F0", pt: 0.5 },
          { type: "solid", color: "E2E8F0", pt: 0.5 },
          { type: "solid", color: "E2E8F0", pt: 0.5 }
        ]
      };

      if (j === 0) {
        opts.bold = true;
        opts.color = ACCENT_BLUE;
        opts.align = "center";
      } else if (j === 2 && val !== "—") {
        opts.color = DARK_NAVY;
        opts.bold = true;
      } else if (j === 4) {
        opts.align = "center";
        opts.bold = true;
        if (val.includes("FUTURE")) {
          opts.color = MUTED_GRAY;
        } else if (val.includes("hỗ trợ")) {
          opts.color = STATUS_INFO_FG;
        } else {
          opts.color = STATUS_PASS_FG;
        }
      }

      return { text: val, options: opts };
    }));
  });

  s.addTable(tableRows, {
    x: 0.8, y: 1.25, w: 11.733,
    colW: colW,
    rowH: 0.31,
    autoPage: false
  });

  s.addText("Ghi chú: Cột Sơ đồ hoạt động chỉ dẫn chiếu tới các slide có biểu đồ thực tế trong tài liệu; các Use Case còn lại đánh dấu '—'. UC-14 và UC-15 không ánh xạ lớp thực thể nội bộ.", {
    x: 0.8, y: 6.78, w: 11.733, h: 0.25,
    fontSize: 9, fontFace: "Calibri", color: MUTED_GRAY, margin: 0
  });

  s.addNotes("Ma trận truy vết bảo đảm liên kết chặt chẽ giữa 15 ca sử dụng, sơ đồ hoạt động, mô hình thực thể và phạm vi bàn giao. Toàn bộ tính năng trọng tâm đều thuộc Core Phase 2 MVP.");
})();

// ── Save Presentation ──
const outDir = path.dirname(outFile);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

prs.writeFile({ fileName: outFile }).then(() => {
  console.log(`✓ Deck v9 saved: ${outFile}`);
  fs.copyFileSync(outFile, "Lingora-System-Modeling-Presentation-v9.pptx");
  console.log("✓ Copied to root: Lingora-System-Modeling-Presentation-v9.pptx");
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
