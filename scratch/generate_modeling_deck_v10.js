const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

// ────────────────────────────────────────────────────────────
// Lingora System Modeling Presentation v10
// High-Legibility, Human-Designed Technical Architecture Presentation
// ────────────────────────────────────────────────────────────

const prs = new pptxgen();
prs.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
prs.author = "Lingora Engineering Architecture";
prs.title = "Lingora — Phân Tích & Mô Hình Hóa Hệ Thống (v10)";

// ── Color System (Dark Navy Base, Light Canvas, Teal Main Accent, Warm Amber Secondary) ──
const BG_LIGHT      = "F8FAFC";  // Crisp off-white canvas
const BG_DARK       = "0B1329";  // Deep tech navy for title & closing slides
const WHITE         = "FFFFFF";  // Pure white diagram container
const DARK_NAVY     = "0F172A";  // Primary text & titles
const BODY_SLATE    = "334155";  // Body text
const MUTED_GRAY    = "64748B";  // Secondary text, page numbers
const BORDER_SUBTLE = "E2E8F0";  // 1px subtle card border
const CARD_BG_LIGHT = "F1F5F9";  // Subtle tinted card fill

// Cohesive Accent Palette
const ACCENT_TEAL   = "0D9488";  // Main Accent: Tech Teal
const ACCENT_AMBER  = "D97706";  // Warm Accent: Amber / Gold
const ACCENT_BLUE   = "2563EB";  // Secondary Accent: Classic Blue

// Scope / Status Badges
const CHIP_CORE_BG  = "DCFCE7";
const CHIP_CORE_FG  = "15803D";
const CHIP_MVP_BG   = "E0F2FE";
const CHIP_MVP_FG   = "0369A1";
const CHIP_FUTR_BG  = "F1F5F9";
const CHIP_FUTR_FG  = "475569";

const diagramDir = "docs/diagrams/lingora-modeling/out";
const outFile = "docs/diagrams/lingora-modeling/deck/Lingora-System-Modeling-Presentation-v10.pptx";

function imgData(filename) {
  const p = path.join(diagramDir, filename);
  if (!fs.existsSync(p)) return null;
  const buf = fs.readFileSync(p);
  return "image/png;base64," + buf.toString("base64");
}

const TOTAL_SLIDES = 17;

// Transitions
const FADE = { type: "fade", secondsAdvance: 0 };
const PUSH = { type: "push", dirn: "L", secondsAdvance: 0 };

function addStandardHeader(s, eyebrow, title, slideNum) {
  s.addText(eyebrow.toUpperCase(), {
    x: 0.8, y: 0.35, w: 9.0, h: 0.25,
    fontSize: 12, fontFace: "Calibri", color: ACCENT_TEAL, bold: true, charSpacing: 1.5, margin: 0
  });
  s.addText(title, {
    x: 0.8, y: 0.62, w: 10.5, h: 0.5,
    fontSize: 28, fontFace: "Calibri", color: DARK_NAVY, bold: true, margin: 0
  });
  if (slideNum) {
    s.addText(`${String(slideNum).padStart(2, "0")} / ${TOTAL_SLIDES}`, {
      x: 11.3, y: 0.4, w: 1.2, h: 0.3,
      fontSize: 12, fontFace: "Calibri", color: MUTED_GRAY, bold: true, align: "right", margin: 0
    });
  }
}

// ════════════════════════════════════════════════════════════
// SLIDE 1: COVER (Dark Tech Hero Slide with Teal / Amber Accents)
// ════════════════════════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = FADE;
  s.background = { color: BG_DARK };

  // Left solid accent vertical bar (Teal + Amber)
  s.addShape("rect", {
    x: 0, y: 0, w: 0.3, h: 7.5,
    fill: { color: ACCENT_TEAL }, line: { width: 0 }
  });
  s.addShape("rect", {
    x: 0.3, y: 0, w: 0.08, h: 7.5,
    fill: { color: ACCENT_AMBER }, line: { width: 0 }
  });

  // Eyebrow tag
  s.addText("LINGORA ARCHITECTURE SPECIFICATION", {
    x: 1.2, y: 1.8, w: 9.0, h: 0.35,
    fontSize: 13, fontFace: "Calibri", color: ACCENT_TEAL, bold: true, charSpacing: 2, margin: 0
  });

  // Main Title (>= 38pt)
  s.addText("Phân Tích & Mô Hình Hóa Hệ Thống", {
    x: 1.2, y: 2.25, w: 10.5, h: 1.2,
    fontSize: 38, fontFace: "Calibri", color: WHITE, bold: true, margin: 0
  });

  // Subtitle (16pt)
  s.addText("Use Case Diagram  ·  Activity Flow  ·  Domain Class Model  ·  Traceability Matrix", {
    x: 1.2, y: 3.55, w: 10.5, h: 0.45,
    fontSize: 16, fontFace: "Calibri", color: "94A3B8", margin: 0
  });

  // Horizontal subtle separator
  s.addShape("rect", {
    x: 1.2, y: 4.3, w: 3.0, h: 0.02,
    fill: { color: ACCENT_AMBER }, line: { width: 0 }
  });

  // Document meta info (13pt)
  s.addText("Báo cáo Kỹ thuật Phần mềm — Phase 1 Locked Baseline Specification\nNền tảng Học ngoại ngữ Trực tuyến Lingora", {
    x: 1.2, y: 4.55, w: 9.5, h: 0.8,
    fontSize: 13, fontFace: "Calibri", color: "64748B", lineSpacingMultiple: 1.2, margin: 0
  });

  s.addNotes("Báo cáo phân tích và mô hình hóa hệ thống học ngoại ngữ Lingora. Nội dung bao gồm biểu đồ ca sử dụng, biểu đồ hoạt động, biểu đồ lớp và ma trận truy vết yêu cầu.");
})();

// ════════════════════════════════════════════════════════════
// SLIDE 2: SUBSYSTEM OVERVIEW (Color-Coded Chips + Separate Rules Strip)
// ════════════════════════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = PUSH;
  s.background = { color: BG_LIGHT };

  addStandardHeader(s, "Kiến trúc hệ thống", "Tổng Quan Phân Hệ & Ranh Giới Nghiệp Vụ", 2);

  const cols = [
    {
      chip: "01",
      chipColor: ACCENT_TEAL,
      title: "LEARNING SUBSYSTEM",
      subtitle: "Trải nghiệm học tập & củng cố năng lực",
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
      chip: "02",
      chipColor: ACCENT_BLUE,
      title: "CONTENT SUBSYSTEM",
      subtitle: "Biên soạn, kiểm duyệt & quản lý phiên bản",
      items: [
        "[UC-08] Soạn thảo bài học, bài tập & từ vựng đi kèm",
        "[UC-09] Kiểm duyệt độc lập & yêu cầu chỉnh sửa",
        "[UC-10] Xuất bản bài học đã duyệt ra hệ thống",
        "Biên soạn & cập nhật qua LessonRevision",
        "Kiểm soát vòng đời 6 trạng thái học liệu",
        "Phân định rõ thẩm quyền Moderator và Org Manager"
      ]
    },
    {
      chip: "03",
      chipColor: ACCENT_AMBER,
      title: "ADMIN & OPERATIONS",
      subtitle: "Vận hành, kiểm toán & điều phối hỗ trợ",
      items: [
        "[UC-11] Quản trị tài khoản & 6 vai trò hệ thống",
        "[UC-12] Xem báo cáo & thống kê vận hành",
        "[UC-13] Tra cứu nhật ký kiểm toán an ninh AuditLog",
        "[UC-14] Tiếp nhận & điều phối xử lý phiếu hỗ trợ",
        "[UC-15] Quản lý nhóm học viên & tiến độ lớp học",
        "Kiểm soát phân quyền chặt chẽ trên toàn nền tảng"
      ]
    }
  ];

  const colW = 3.65;
  const gap = 0.39;
  const startX = 0.8;

  cols.forEach((col, idx) => {
    const x = startX + idx * (colW + gap);

    // Card container
    s.addShape("rect", {
      x: x, y: 1.25, w: colW, h: 4.1,
      fill: { color: WHITE },
      line: { color: BORDER_SUBTLE, width: 1 }
    });

    // Top colored accent bar on each column
    s.addShape("rect", {
      x: x, y: 1.25, w: colW, h: 0.05,
      fill: { color: col.chipColor }, line: { width: 0 }
    });

    // Chip number + Title
    s.addText(col.chip, {
      x: x + 0.25, y: 1.45, w: 0.5, h: 0.3,
      fontSize: 13, fontFace: "Calibri", color: col.chipColor, bold: true, margin: 0
    });
    s.addText(col.title, {
      x: x + 0.65, y: 1.45, w: colW - 0.9, h: 0.3,
      fontSize: 13, fontFace: "Calibri", color: DARK_NAVY, bold: true, margin: 0
    });
    s.addText(col.subtitle, {
      x: x + 0.25, y: 1.8, w: colW - 0.5, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: MUTED_GRAY, italic: true, margin: 0
    });

    // Bullets with readable font size (11.5pt, compact spacing to prevent overflow)
    const textArr = col.items.map((it, i) => ({
      text: it,
      options: {
        fontSize: 11.5, fontFace: "Calibri", color: BODY_SLATE,
        bullet: true, paraSpaceAfter: 3,
        breakLine: i < col.items.length - 1
      }
    }));
    s.addText(textArr, {
      x: x + 0.15, y: 2.15, w: colW - 0.35, h: 3.15,
      valign: "top", margin: [0, 2, 0, 2]
    });
  });

  // Separate "QUY TẮC CHÍNH & PHẠM VI" Box at Bottom
  s.addShape("rect", {
    x: 0.8, y: 5.48, w: 11.733, h: 1.55,
    fill: { color: CARD_BG_LIGHT },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  s.addText("QUY TẮC NGHIỆP VỤ CHÍNH & PHÂN ĐỊNH PHẠM VI", {
    x: 1.05, y: 5.60, w: 7.0, h: 0.25,
    fontSize: 12, fontFace: "Calibri", color: ACCENT_TEAL, bold: true, charSpacing: 1, margin: 0
  });

  const ruleBullets = [
    ("• [SoD & Xuất bản] Phân tách nhiệm vụ SoD: Creator không tự duyệt bài; chỉ Org Manager có quyền Publish. Admin xuất bản khẩn cấp có AuditLog."),
    ("• [Nội dung & Học tập] Unit chỉ mở khi đủ 4/4 Lesson Published; học viên bắt buộc xem Viewer trước bài tập. Clone-to-Draft v2 bảo toàn bài đang phát hành."),
    ("• [Tiến độ & Phạm vi] UserProgress (tiến độ tuyến tính) tách biệt SkillProfile (năng lực). UC-14 thuộc MVP điều phối; UC-15 thuộc Future Extension.")
  ];
  const rulesText = ruleBullets.map((r, i) => ({
    text: r,
    options: {
      fontSize: 11.5, fontFace: "Calibri", color: BODY_SLATE,
      paraSpaceAfter: 3,
      breakLine: i < ruleBullets.length - 1
    }
  }));
  s.addText(rulesText, {
    x: 1.05, y: 5.88, w: 11.2, h: 1.05,
    valign: "top", margin: 0
  });

  s.addNotes("Kiến trúc phân chia thành 3 phân hệ độc lập: Learning, Content và Admin/Ops. 6 vai trò bảo đảm nguyên tắc phân tách trách nhiệm.");
})();

// ════════════════════════════════════════════════════════════
// SLIDE 3: OVERALL USE CASE (Large Diagram + Right Clean Callout)
// ════════════════════════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = PUSH;
  s.background = { color: BG_LIGHT };

  addStandardHeader(s, "Ca sử dụng hệ thống", "Sơ Đồ Ca Sử Dụng Tổng Quan (Overall Use Case Diagram)", 3);

  // Large Diagram: 8.5 in wide (~72% area)
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

  // Right callout container (3.0 in wide)
  s.addShape("rect", {
    x: 9.5, y: 1.25, w: 3.033, h: 5.75,
    fill: { color: WHITE },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  s.addText("Ý CHÍNH KIẾN TRÚC", {
    x: 9.75, y: 1.45, w: 2.5, h: 0.3,
    fontSize: 12, fontFace: "Calibri", color: ACCENT_TEAL, bold: true, charSpacing: 1, margin: 0
  });

  const takeaways = [
    { title: "Kế thừa Authenticated User", desc: "6 vai trò cùng kế thừa để dùng chung cơ chế phiên & xác thực [UC-01]." },
    { title: "Tách riêng 3 phân hệ", desc: "Phân ranh giới rõ ràng: Học tập (Learner), Nội dung (Content) và Vận hành (Admin/Ops)." },
    { title: "Quyền xuất bản chính thức", desc: "Org Manager xuất bản [UC-10]. Admin chỉ xuất bản khẩn cấp khi có lý do & lưu AuditLog." },
    { title: "Ranh giới phạm vi (Scope)", desc: "UC-14 (Phiếu hỗ trợ) thuộc MVP điều phối. UC-15 (Quản lý nhóm) thuộc Future Extension." }
  ];

  let curY = 1.95;
  takeaways.forEach((t) => {
    s.addText(`• ${t.title}`, {
      x: 9.75, y: curY, w: 2.55, h: 0.28,
      fontSize: 12, fontFace: "Calibri", color: DARK_NAVY, bold: true, margin: 0
    });
    curY += 0.32;
    s.addText(t.desc, {
      x: 9.95, y: curY, w: 2.35, h: 0.65,
      fontSize: 11, fontFace: "Calibri", color: BODY_SLATE, valign: "top", margin: 0
    });
    curY += 0.72;
  });

  s.addNotes("Sơ đồ ca sử dụng tổng quan định hình kiến trúc toàn hệ thống Lingora. Tác nhân Authenticated User chuẩn hóa đăng nhập, và phân hệ được chia tách mạch lạc.");
})();

// ════════════════════════════════════════════════════════════
// SLIDE 4: LEARNER USE CASE (Large Diagram + Right Callout)
// ════════════════════════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = PUSH;
  s.background = { color: BG_LIGHT };

  addStandardHeader(s, "Phân hệ học viên", "Sơ Đồ Ca Sử Dụng Chi Tiết — Phân Hệ Học Viên (Learner)", 4);

  // Large Diagram Container: 8.5 in wide
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

  // Right callout container
  s.addShape("rect", {
    x: 9.5, y: 1.25, w: 3.033, h: 5.75,
    fill: { color: WHITE },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  s.addText("QUY TẮC HỌC VIÊN", {
    x: 9.75, y: 1.45, w: 2.5, h: 0.3,
    fontSize: 12, fontFace: "Calibri", color: ACCENT_TEAL, bold: true, charSpacing: 1, margin: 0
  });

  const takeaways = [
    { title: "Bắt buộc xem lý thuyết", desc: "Lesson Content Viewer được include vào UC-05; học viên phải xem lý thuyết trước khi làm bài tập." },
    { title: "Làm lại có kiểm soát (Retry)", desc: "Luồng extend từ UC-05 có hạn mức max(1, floor(N*0.10)), điểm công nhận tối đa 70% credit." },
    { title: "Thử thách nhảy cấp (Jump)", desc: "Mở rộng từ UC-04, yêu cầu đạt >= 95% và áp dụng thời gian chờ Cooldown 24h khi thi trượt." },
    { title: "Chu trình học khép kín", desc: "Xếp lớp (UC-03) -> học bài (UC-05) -> ôn tập SRS độc lập (UC-06) -> tích lũy Streak (UC-07)." }
  ];

  let curY = 1.95;
  takeaways.forEach((t) => {
    s.addText(`• ${t.title}`, {
      x: 9.75, y: curY, w: 2.55, h: 0.28,
      fontSize: 12, fontFace: "Calibri", color: DARK_NAVY, bold: true, margin: 0
    });
    curY += 0.32;
    s.addText(t.desc, {
      x: 9.95, y: curY, w: 2.35, h: 0.65,
      fontSize: 11, fontFace: "Calibri", color: BODY_SLATE, valign: "top", margin: 0
    });
    curY += 0.72;
  });

  s.addNotes("Quy trình học viên bao quát chu trình từ chẩn đoán xếp lớp, học lý thuyết qua Viewer, làm bài tập tương tác, đến ôn tập ngắt quãng và tích lũy Streak.");
})();

// ════════════════════════════════════════════════════════════
// SLIDE 5: CONTENT & ADMIN USE CASE (Large Diagram + Right Callout)
// ════════════════════════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = PUSH;
  s.background = { color: BG_LIGHT };

  addStandardHeader(s, "Quản trị & kiểm duyệt", "Sơ Đồ Ca Sử Dụng Chi Tiết — Quản Trị & Kiểm Duyệt", 5);

  // Large Diagram Container: 8.5 in wide
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

  // Right callout container
  s.addShape("rect", {
    x: 9.5, y: 1.25, w: 3.033, h: 5.75,
    fill: { color: WHITE },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  s.addText("QUẢN TRỊ & SOD", {
    x: 9.75, y: 1.45, w: 2.5, h: 0.3,
    fontSize: 12, fontFace: "Calibri", color: ACCENT_TEAL, bold: true, charSpacing: 1, margin: 0
  });

  const takeaways = [
    { title: "Phân tách nhiệm vụ (SoD)", desc: "Creator soạn bài, Moderator thẩm định, Org Manager xuất bản. Creator không tự duyệt nội dung của mình." },
    { title: "Quyết định thẩm định", desc: "Moderator chỉ chuyển APPROVED hoặc CHANGES_REQUESTED kèm góp ý, không có quyền xuất bản." },
    { title: "Quyền xuất bản chính thức", desc: "Org Manager là vai trò duy nhất có thẩm quyền Publish bài học đạt trạng thái APPROVED." },
    { title: "Xuất bản khẩn cấp", desc: "Admin chỉ xuất bản khẩn cấp bài Approved; bắt buộc nhập lý do giải trình và lưu AuditLog." }
  ];

  let curY = 1.95;
  takeaways.forEach((t) => {
    s.addText(`• ${t.title}`, {
      x: 9.75, y: curY, w: 2.55, h: 0.28,
      fontSize: 12, fontFace: "Calibri", color: DARK_NAVY, bold: true, margin: 0
    });
    curY += 0.32;
    s.addText(t.desc, {
      x: 9.95, y: curY, w: 2.35, h: 0.65,
      fontSize: 11, fontFace: "Calibri", color: BODY_SLATE, valign: "top", margin: 0
    });
    curY += 0.72;
  });

  s.addNotes("Quy trình phê duyệt nội dung tuân thủ nguyên tắc phân tách nhiệm vụ (SoD). Moderator độc lập thẩm định và Org Manager độc quyền xuất bản.");
})();

// ════════════════════════════════════════════════════════════
// Single Diagram Activity Slide Template (Maximized Diagram 75-80%)
// ════════════════════════════════════════════════════════════
function addSingleActivitySlide(opts) {
  const s = prs.addSlide();
  s.transition = PUSH;
  s.background = { color: BG_LIGHT };

  addStandardHeader(s, opts.eyebrow, opts.title, opts.num);

  if (opts.layout === "side-by-side") {
    // Tall diagram on left (7.5 in wide), callouts on right (4.0 in wide)
    const diagW = 7.5;
    const diagH = 5.75;
    s.addShape("rect", {
      x: 0.8, y: 1.25, w: diagW, h: diagH,
      fill: { color: WHITE },
      line: { color: BORDER_SUBTLE, width: 1 }
    });
    const d = imgData(opts.diagramFile);
    if (d) {
      s.addImage({
        data: d,
        x: 0.9, y: 1.35, w: diagW - 0.2, h: diagH - 0.2,
        sizing: { type: "contain", w: diagW - 0.2, h: diagH - 0.2 }
      });
    }

    // Right Callout Box
    s.addShape("rect", {
      x: 8.5, y: 1.25, w: 4.033, h: diagH,
      fill: { color: WHITE },
      line: { color: BORDER_SUBTLE, width: 1 }
    });

    s.addText(opts.calloutHeader.toUpperCase(), {
      x: 8.8, y: 1.5, w: 3.5, h: 0.3,
      fontSize: 12, fontFace: "Calibri", color: ACCENT_TEAL, bold: true, charSpacing: 1, margin: 0
    });

    let curY = 2.0;
    opts.callouts.forEach((c) => {
      s.addText(`• ${c.title}`, {
        x: 8.8, y: curY, w: 3.5, h: 0.3,
        fontSize: 13, fontFace: "Calibri", color: DARK_NAVY, bold: true, margin: 0
      });
      curY += 0.35;
      s.addText(c.desc, {
        x: 9.05, y: curY, w: 3.25, h: 0.8,
        fontSize: 12, fontFace: "Calibri", color: BODY_SLATE, valign: "top", margin: 0
      });
      curY += 0.85;
    });

  } else {
    // Wide / Landscape diagram layout (Full width 11.73 in, height 4.9 in, slim 2-sentence note bottom)
    const diagW = 11.733;
    const diagH = 4.9;
    s.addShape("rect", {
      x: 0.8, y: 1.25, w: diagW, h: diagH,
      fill: { color: WHITE },
      line: { color: BORDER_SUBTLE, width: 1 }
    });
    const d = imgData(opts.diagramFile);
    if (d) {
      s.addImage({
        data: d,
        x: 0.9, y: 1.35, w: diagW - 0.2, h: diagH - 0.2,
        sizing: { type: "contain", w: diagW - 0.2, h: diagH - 0.2 }
      });
    }

    // Bottom concise callout box (0.75 in height)
    s.addShape("rect", {
      x: 0.8, y: 6.25, w: diagW, h: 0.75,
      fill: { color: CARD_BG_LIGHT },
      line: { color: BORDER_SUBTLE, width: 1 }
    });

    s.addText(opts.bottomSummary, {
      x: 1.05, y: 6.32, w: 11.2, h: 0.6,
      fontSize: 12.5, fontFace: "Calibri", color: DARK_NAVY, valign: "middle", margin: 0
    });
  }

  if (opts.notes) s.addNotes(opts.notes);
}

// ════════════════════════════════════════════════════════════
// SLIDES 6-13: INDIVIDUAL ACTIVITY DIAGRAMS (Separated)
// ════════════════════════════════════════════════════════════

// Slide 6: Placement Flow (Tall)
addSingleActivitySlide({
  num: 6,
  eyebrow: "Quy trình đánh giá",
  title: "Sơ Đồ Hoạt Động — Đánh Giá Xếp Lớp Tuyến Tính",
  layout: "side-by-side",
  diagramFile: "05a-activity-placement-flow.png",
  calloutHeader: "QUY CHẾ XẾP LỚP 30 CÂU",
  callouts: [
    { title: "Đề thi 30 câu chuẩn tắc", desc: "Ma trận kiến thức phân tầng từ Unit 1 đến Unit 6, đo lường toàn diện các kỹ năng từ vựng và ngữ pháp." },
    { title: "Ánh xạ Starting Unit (Mapping A)", desc: "Điểm số thô (0–30) được ánh xạ trực tiếp sang Starting Unit xuất phát từ 1 đến 6 theo dải điểm chuẩn." },
    { title: "Lưu kết quả & Hồ sơ năng lực", desc: "Tạo bản ghi AssessmentResult (DIAGNOSTIC), khởi tạo SkillProfile 4 chiều và cập nhật Starting Unit vào Profile." }
  ],
  notes: "Đánh giá xếp lớp tuyến tính gồm 30 câu hỏi theo ma trận phân tầng. Điểm số thô được ánh xạ qua Mapping A để xác định đơn vị học xuất phát."
});

// Slide 7: Placement Branches (Wide)
addSingleActivitySlide({
  num: 7,
  eyebrow: "Quy trình đánh giá",
  title: "Sơ Đồ Hoạt Động — Nhánh Bỏ Qua (Skip) & Thi Lại (Retake)",
  layout: "wide",
  diagramFile: "05b-activity-placement-branches.png",
  bottomSummary: "• Nhánh Bỏ qua (Skip): Gán mặc định Unit 1 với trạng thái UNVERIFIED; tuyệt đối không tạo AssessmentResult hoặc SkillProfile giả định.\n• Nhánh Thi lại (Retake): Kích hoạt từ Profile; lưu bản ghi AssessmentResult mới độc lập mà không ghi đè lịch sử bài thi trước đó.",
  notes: "Nhánh bỏ qua không sinh dữ liệu năng lực giả định. Nhánh thi lại bảo lưu toàn vẹn lịch sử bài thi trước đó."
});

// Slide 8: Learning Main Flow (Tall)
addSingleActivitySlide({
  num: 8,
  eyebrow: "Quy trình học bài",
  title: "Sơ Đồ Hoạt Động — Chu Trình Học Bài & Cập Nhật Tiến Độ",
  layout: "side-by-side",
  diagramFile: "06a-activity-learning-main.png",
  calloutHeader: "ĐIỀU KIỆN & CHU TRÌNH HỌC",
  callouts: [
    { title: "Điều kiện mở Unit (4/4 Published)", desc: "Học viên chỉ có thể mở học Unit khi Unit đó có đủ 4/4 bài học ở trạng thái PUBLISHED." },
    { title: "Viewer bắt buộc trước bài tập", desc: "Học viên bắt buộc xem nội dung lý thuyết qua Lesson Content Viewer trước khi trả lời bài tập." },
    { title: "Cập nhật tiến độ & Streak [UC-07]", desc: "Hoàn thành bài ghi nhận UserProgress, tăng chuỗi Streak [UC-07] và kích hoạt thẻ ôn tập SRS (1, 3, 7, 14, 30 ngày)." }
  ],
  notes: "Chu trình học bài bắt buộc học viên tiếp thu lý thuyết qua Viewer trước khi trả lời câu hỏi. Hoàn thành bài học cập nhật nguyên tử tiến độ, Streak và SRS."
});

// Slide 9: Controlled Retry Flow (Tall)
addSingleActivitySlide({
  num: 9,
  eyebrow: "Quy trình học bài",
  title: "Sơ Đồ Hoạt Động — Làm Lại Có Kiểm Soát (Controlled Retry)",
  layout: "side-by-side",
  diagramFile: "06b-activity-learning-retry.png",
  calloutHeader: "QUY CHẾ RETRY CÓ HẠN MỨC",
  callouts: [
    { title: "Xem giải thích (Show Explanation)", desc: "Khi trả lời sai, hệ thống hiển thị giải thích chi tiết đáp án để củng cố kiến thức trước khi retry." },
    { title: "Hạn mức làm lại có kiểm soát", desc: "Số lượt retry tối đa tính theo công thức: max(1, floor(N * 0.10)). Hết lượt sẽ báo 'No quota' và nhận 0 điểm." },
    { title: "Khống chế trần điểm (<= 70% credit)", desc: "Làm lại đúng chỉ được công nhận tối đa 70% số điểm chuẩn của câu hỏi, đảm bảo tính công bằng đánh giá." }
  ],
  notes: "Cơ chế làm lại có kiểm soát giới hạn số lượt thử, cung cấp phản hồi giải thích và khống chế trần điểm công nhận."
});

// Slide 10: Jump Check (Tall)
addSingleActivitySlide({
  num: 10,
  eyebrow: "Quy trình nhảy cấp",
  title: "Sơ Đồ Hoạt Động — Kiểm Tra Cooldown 24h & Thi Nhảy Cấp",
  layout: "side-by-side",
  diagramFile: "07a-activity-jump-check.png",
  calloutHeader: "ĐIỀU KIỆN THỬ THÁCH JUMP",
  callouts: [
    { title: "Kiểm tra Cooldown 24 giờ", desc: "Chặn làm bài nếu học viên đang trong thời gian phạt Cooldown 24h sau lần thi trượt trước đó; hiển thị đếm ngược." },
    { title: "Quy mô đề Jump phân tầng", desc: "Nhảy 1 Unit: 20 câu; nhảy 2–3 Units: 25–30 câu; nhảy trên 3 Units: 40 câu hỏi tổng hợp kiến thức." },
    { title: "Chấm điểm tự động & lưu kết quả", desc: "Nộp bài kiểm tra Jump được chấm điểm tự động và lưu kết quả phục vụ thẩm định tỷ lệ đạt." }
  ],
  notes: "Thử thách nhảy cấp cho phép bỏ qua nội dung đã nắm vững. Quy mô bài thi tương ứng với số lượng bài học cần vượt qua và áp dụng thời gian chờ 24h nếu trượt."
});

// Slide 11: Jump Result (Wide)
addSingleActivitySlide({
  num: 11,
  eyebrow: "Quy trình nhảy cấp",
  title: "Sơ Đồ Hoạt Động — Xử Lý Kết Quả Nhảy Cấp (Jump Result)",
  layout: "wide",
  diagramFile: "07b-activity-jump-result.png",
  bottomSummary: "• Nhánh Đỗ (Đạt >= 95%): Gán nhãn SKIPPED_BY_JUMP (by_jump = true) cho nội dung vượt qua; mở khóa Unit mục tiêu ngay lập tức.\n• Nhánh Trượt (Dưới 95%): Kích hoạt thời gian phạt Cooldown khóa 24 giờ; giữ nguyên vị trí học tập hiện tại và tiếp tục học tuyến tính.",
  notes: "Xử lý kết quả nhảy cấp: ngưỡng đạt 95% mở khóa bài học tiếp theo; trường hợp thi trượt áp dụng thời gian chờ 24 giờ."
});

// Slide 12: Governance Main Flow (Wide)
addSingleActivitySlide({
  num: 12,
  eyebrow: "Quy trình nội dung",
  title: "Sơ Đồ Hoạt Động — Thẩm Định & Xuất Bản Học Liệu",
  layout: "wide",
  diagramFile: "08a-activity-governance-main.png",
  bottomSummary: "• Phê duyệt độc lập: Moderator thẩm định và chuyển APPROVED hoặc CHANGES_REQUESTED kèm góp ý chi tiết; không dùng trạng thái REJECTED.\n• Quyền xuất bản chính thức: Org Manager là tác nhân duy nhất có thẩm quyền Publish bài học đạt trạng thái APPROVED ra toàn hệ thống.",
  notes: "Quy trình quản trị học liệu phân định thẩm quyền: Moderator thẩm định chất lượng sư phạm và Org Manager độc quyền phát hành chính thức."
});

// Slide 13: Governance Branches (Wide)
addSingleActivitySlide({
  num: 13,
  eyebrow: "Quy trình nội dung",
  title: "Sơ Đồ Hoạt Động — Clone-to-Draft v2 & Xuất Bản Khẩn Cấp",
  layout: "wide",
  diagramFile: "08b-activity-governance-branches.png",
  bottomSummary: "• Cơ chế Clone-to-Draft v2: Sửa bài PUBLISHED tạo bản nháp v2; bản v1 vẫn phục vụ học viên; bắt buộc Archive v1 ngay khi v2 được Publish.\n• Xuất bản khẩn cấp (Emergency): Administrator chỉ xuất bản cho bài đã APPROVED; bắt buộc giải trình lý do và ghi nhận AuditLog an ninh.",
  notes: "Cơ chế nhân bản bản nháp bảo toàn phiên bản đang phát hành cho học viên. Administrator can thiệp khẩn cấp luôn phải lưu vết kiểm toán."
});

// ════════════════════════════════════════════════════════════
// SLIDE 14: CLASS CONTENT MODEL (Enlarged Diagram + Separate Legend)
// ════════════════════════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = PUSH;
  s.background = { color: BG_LIGHT };

  addStandardHeader(s, "Mô hình cấu trúc", "Sơ Đồ Lớp — Cấu Trúc Nội Dung & Khóa Học", 14);

  // Large Diagram Container (11.73 in x 4.8 in)
  s.addShape("rect", {
    x: 0.8, y: 1.25, w: 11.733, h: 4.8,
    fill: { color: WHITE },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  const d = imgData("09-class-content.png");
  if (d) {
    s.addImage({
      data: d,
      x: 0.9, y: 1.35, w: 11.533, h: 4.6,
      sizing: { type: "contain", w: 11.533, h: 4.6 }
    });
  }

  // Bottom Separate Legend & Rules Strip (0.85 in height)
  s.addShape("rect", {
    x: 0.8, y: 6.15, w: 11.733, h: 0.85,
    fill: { color: CARD_BG_LIGHT },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  s.addText([
    { text: "CHÚ GIẢI KÝ HIỆU & RÀNG BUỘC:  ", options: { fontSize: 11, fontFace: "Calibri", color: ACCENT_TEAL, bold: true } },
    { text: "CURRENT = Nét liền (schema.prisma hiện hành)   ·   <<TARGET>> = Nét đứt (mục tiêu Phase 2)\n", options: { fontSize: 11, fontFace: "Calibri", color: DARK_NAVY, bold: true } },
    { text: "• Vòng đời 6 trạng thái: DRAFT, IN_REVIEW, CHANGES_REQUESTED, APPROVED, PUBLISHED, ARCHIVED trong LessonRevision.\n• Ràng buộc: Exercise liên kết LessonRevision; Unit chỉ mở hiển thị cho học viên khi có đủ 4/4 Lesson Published.", options: { fontSize: 10.5, fontFace: "Calibri", color: BODY_SLATE } }
  ], {
    x: 1.05, y: 6.2, w: 11.2, h: 0.75,
    valign: "middle", margin: 0
  });

  s.addNotes("Sơ đồ lớp nội dung thể hiện cấu trúc bài học và cơ chế quản lý phiên bản. Nét vẽ phân định trực quan giữa bảng dữ liệu hiện tại và thực thể mục tiêu.");
})();

// ════════════════════════════════════════════════════════════
// SLIDE 15: CLASS LEARNER ASSESSMENT MODEL (Enlarged Diagram + Separate Legend)
// ════════════════════════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = PUSH;
  s.background = { color: BG_LIGHT };

  addStandardHeader(s, "Mô hình học viên", "Sơ Đồ Lớp — Học Viên, Đánh Giá & Tiến Độ", 15);

  // Large Diagram Container (11.73 in x 4.8 in)
  s.addShape("rect", {
    x: 0.8, y: 1.25, w: 11.733, h: 4.8,
    fill: { color: WHITE },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  const d = imgData("10-class-learner-assessment.png");
  if (d) {
    s.addImage({
      data: d,
      x: 0.9, y: 1.35, w: 11.533, h: 4.6,
      sizing: { type: "contain", w: 11.533, h: 4.6 }
    });
  }

  // Bottom Separate Legend & Rules Strip (0.85 in height)
  s.addShape("rect", {
    x: 0.8, y: 6.15, w: 11.733, h: 0.85,
    fill: { color: CARD_BG_LIGHT },
    line: { color: BORDER_SUBTLE, width: 1 }
  });

  s.addText([
    { text: "CHÚ GIẢI KÝ HIỆU & RÀNG BUỘC:  ", options: { fontSize: 11, fontFace: "Calibri", color: ACCENT_TEAL, bold: true } },
    { text: "CURRENT = Nét liền (schema.prisma hiện hành)   ·   <<TARGET>> = Nét đứt (mục tiêu Phase 2)\n", options: { fontSize: 11, fontFace: "Calibri", color: DARK_NAVY, bold: true } },
    { text: "• Tiến độ tách rời Năng lực: Tách riêng UserProgress (tiến độ tuyến tính) khỏi SkillProfile (năng lực qua AssessmentResult).\n• SRS Policy B: Chu kỳ ôn tập cố định 1, 3, 7, 14, 30 ngày; sai reset về 1 ngày. Trạng thái Retry quota & Jump cooldown gắn UserProgress.", options: { fontSize: 10.5, fontFace: "Calibri", color: BODY_SLATE } }
  ], {
    x: 1.05, y: 6.2, w: 11.2, h: 0.75,
    valign: "middle", margin: 0
  });

  s.addNotes("Mô hình học viên bảo đảm nguyên tắc phân tách giữa tiến độ hoàn thành và hồ sơ năng lực. Dữ liệu ôn tập từ vựng tuân thủ thuật toán chu kỳ ngày cố định.");
})();

// ════════════════════════════════════════════════════════════
// SLIDE 16: TRACEABILITY MATRIX (Accurate New Slide References & Color Badges)
// ════════════════════════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = PUSH;
  s.background = { color: BG_LIGHT };

  addStandardHeader(s, "Truy vết yêu cầu", "Ma Trận Truy Vết Nghiệp Vụ Toàn Diện (Traceability Matrix)", 16);

  const headers = ["UC ID", "Tên Ca Sử Dụng Chuẩn Tắc", "Sơ Đồ Hoạt Động (Slide Mới)", "Lớp Dữ Liệu", "Phạm Vi Triển Khai"];
  const colW = [0.95, 3.5, 2.3, 2.6, 2.383];

  const rows = [
    ["UC-01", "Authenticate & Manage Session", "—", "Profile, Role", "CORE (Phase 2 MVP)"],
    ["UC-02", "Configure Goals & Study Time", "—", "Profile", "CORE (Phase 2 MVP)"],
    ["UC-03", "Take Placement Test", "Slide 6, 7 (Placement)", "AssessmentResult, SkillProfile", "CORE (Phase 2 MVP)"],
    ["UC-04", "Browse Learning Path & Conditional Jump", "Slide 10, 11 (Jump)", "Course, Unit, Lesson, UserProgress", "CORE (Phase 2 MVP)"],
    ["UC-05", "Complete Lesson Exercises & Controlled Retry", "Slide 8, 9 (Learning & Retry)", "Lesson, Exercise, UserProgress", "CORE (Phase 2 MVP)"],
    ["UC-06", "Spaced Repetition Review (SRS)", "—", "Vocabulary, UserVocabSrs, ReviewLog", "CORE (Phase 2 MVP)"],
    ["UC-07", "Track Progress, Mastery & Streak", "Slide 8 (Streak Update)", "Profile, UserProgress", "CORE (Phase 2 MVP)"],
    ["UC-08", "Create & Edit Lesson Draft", "Slide 12, 13 (Governance)", "Lesson, LessonRevision, Exercise", "CORE (Phase 2 MVP)"],
    ["UC-09", "Review & Moderate Content", "Slide 12 (Moderator Review)", "LessonRevision, AuditLog", "CORE (Phase 2 MVP)"],
    ["UC-10", "Publish Approved Content", "Slide 12, 13 (Publication)", "Unit, Lesson, LessonRevision, AuditLog", "CORE (Phase 2 MVP)"],
    ["UC-11", "Manage Accounts & Roles", "—", "Profile, Role, AuditLog", "CORE (Phase 2 MVP)"],
    ["UC-12", "View System Reports", "—", "UserProgress, AuditLog", "CORE (Phase 2 MVP)"],
    ["UC-13", "View & Audit Security Logs", "—", "AuditLog", "CORE (Phase 2 MVP)"],
    ["UC-14", "Handle Support Tickets", "—", "—", "MVP (Điều phối hỗ trợ)"],
    ["UC-15", "Manage Cohorts & Group Progress", "—", "—", "FUTURE EXTENSION"]
  ];

  const tableRows = [];

  // Dark Navy Header (11pt)
  tableRows.push(headers.map((h, j) => ({
    text: h,
    options: {
      fontSize: 11, fontFace: "Calibri", color: WHITE, bold: true,
      align: j === 0 || j === 4 ? "center" : "left",
      fill: { color: DARK_NAVY },
      margin: [4, 6, 4, 6],
      border: [
        { type: "solid", color: DARK_NAVY, pt: 0.5 },
        { type: "solid", color: DARK_NAVY, pt: 0.5 },
        { type: "solid", color: DARK_NAVY, pt: 0.5 },
        { type: "solid", color: DARK_NAVY, pt: 0.5 }
      ]
    }
  })));

  // Data Rows (>= 12pt for readability)
  rows.forEach((row, i) => {
    const bgColor = i % 2 === 0 ? WHITE : "F8FAFC";
    tableRows.push(row.map((val, j) => {
      const opts = {
        fontSize: 10, fontFace: "Calibri", color: BODY_SLATE,
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
        opts.color = ACCENT_TEAL;
        opts.align = "center";
      } else if (j === 2 && val !== "—") {
        opts.color = DARK_NAVY;
        opts.bold = true;
      } else if (j === 4) {
        opts.align = "center";
        opts.bold = true;
        if (val.includes("FUTURE")) {
          opts.fill = { color: CHIP_FUTR_BG };
          opts.color = CHIP_FUTR_FG;
        } else if (val.includes("hỗ trợ")) {
          opts.fill = { color: CHIP_MVP_BG };
          opts.color = CHIP_MVP_FG;
        } else {
          opts.fill = { color: CHIP_CORE_BG };
          opts.color = CHIP_CORE_FG;
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

  s.addText("Ghi chú: Cột Sơ đồ hoạt động dẫn chiếu chính xác số slide sau khi tách biểu đồ; các Use Case còn lại đánh dấu '—'. UC-14 và UC-15 không ánh xạ lớp thực thể nội bộ.", {
    x: 0.8, y: 6.78, w: 11.733, h: 0.25,
    fontSize: 10, fontFace: "Calibri", color: MUTED_GRAY, margin: 0
  });

  s.addNotes("Ma trận truy vết bảo đảm liên kết chặt chẽ giữa 15 ca sử dụng, sơ đồ hoạt động, mô hình thực thể và phạm vi bàn giao. Toàn bộ tính năng trọng tâm đều thuộc Core Phase 2 MVP.");
})();

// ════════════════════════════════════════════════════════════
// SLIDE 17: CONCLUSION & SUMMARY (Dark Closing Slide)
// ════════════════════════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = FADE;
  s.background = { color: BG_DARK };

  // Left solid accent bar
  s.addShape("rect", {
    x: 0, y: 0, w: 0.3, h: 7.5,
    fill: { color: ACCENT_TEAL }, line: { width: 0 }
  });
  s.addShape("rect", {
    x: 0.3, y: 0, w: 0.08, h: 7.5,
    fill: { color: ACCENT_AMBER }, line: { width: 0 }
  });

  s.addText("TỔNG KẾT MÔ HÌNH HÓA", {
    x: 1.2, y: 1.2, w: 8.0, h: 0.3,
    fontSize: 13, fontFace: "Calibri", color: ACCENT_TEAL, bold: true, charSpacing: 1.5, margin: 0
  });

  s.addText("Tổng Kết Kiến Trúc & Giá Trị Triển Khai", {
    x: 1.2, y: 1.6, w: 10.5, h: 0.8,
    fontSize: 34, fontFace: "Calibri", color: WHITE, bold: true, margin: 0
  });

  // 3 highlight pillars
  const pillars = [
    {
      num: "01",
      title: "Tính Toàn Vẹn & Kỷ Luật",
      desc: "Toàn bộ 15 Use Case, 8 luồng hoạt động chi tiết và mô hình dữ liệu ánh xạ 1:1, không mâu thuẫn chính sách nghiệp vụ."
    },
    {
      num: "02",
      title: "Trải Nghiệm Học Khoa Học",
      desc: "Viewer lý thuyết bắt buộc, Controlled Retry khống chế 70% credit, Conditional Jump Cooldown 24h và SRS tất định Policy B."
    },
    {
      num: "03",
      title: "Quản Trị Nghiêm Ngặt (SoD)",
      desc: "Phân tách Creator - Moderator - Org Manager, cơ chế Clone-to-Draft v2 bảo toàn phiên bản và AuditLog bất biến."
    }
  ];

  const pW = 3.6;
  const pGap = 0.45;
  pillars.forEach((p, idx) => {
    const px = 1.2 + idx * (pW + pGap);

    s.addShape("rect", {
      x: px, y: 2.7, w: pW, h: 3.2,
      fill: { color: "111827" },
      line: { color: "1E293B", width: 1 }
    });

    s.addText(p.num, {
      x: px + 0.3, y: 2.95, w: 2.0, h: 0.4,
      fontSize: 20, fontFace: "Calibri", color: ACCENT_AMBER, bold: true, margin: 0
    });

    s.addText(p.title, {
      x: px + 0.3, y: 3.45, w: pW - 0.6, h: 0.45,
      fontSize: 15, fontFace: "Calibri", color: WHITE, bold: true, margin: 0
    });

    s.addText(p.desc, {
      x: px + 0.3, y: 4.0, w: pW - 0.6, h: 1.5,
      fontSize: 12.5, fontFace: "Calibri", color: "94A3B8", lineSpacingMultiple: 1.2, margin: 0
    });
  });

  s.addText("Lingora Platform Architecture  ·  Phase 1 Baseline Complete", {
    x: 1.2, y: 6.4, w: 10.0, h: 0.3,
    fontSize: 12, fontFace: "Calibri", color: "64748B", margin: 0
  });

  s.addNotes("Slide tổng kết toàn bộ mô hình hóa hệ thống Lingora. Hệ thống sẵn sàng cho giai đoạn phát triển Phase 2.");
})();

// ── Save Presentation ──
const outDir = path.dirname(outFile);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

prs.writeFile({ fileName: outFile }).then(() => {
  console.log(`✓ Deck v10 saved: ${outFile}`);
  fs.copyFileSync(outFile, "Lingora-System-Modeling-Presentation-v10.pptx");
  console.log("✓ Copied to root: Lingora-System-Modeling-Presentation-v10.pptx");
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
