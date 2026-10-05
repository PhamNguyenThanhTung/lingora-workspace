const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

// ────────────────────────────────────────────────────
// Lingora System Modeling Presentation v8
// Premium Midnight Executive Design with Transitions
// ────────────────────────────────────────────────────

const prs = new pptxgen();
prs.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
prs.author = "Lingora Team";
prs.title = "Lingora — Mô Hình Hóa Hệ Thống & Đặc Tả Nghiệp Vụ";

// ── Premium Midnight Executive Palette ──
const NAVY      = "0F172A";
const DEEP_NAVY = "060C1F";
const DARK_CARD = "111827";
const SLATE     = "94A3B8";
const SLATE_DK  = "64748B";
const ICE_BLUE  = "DBEAFE";
const WHITE     = "FFFFFF";
const OFF_WHITE = "F8FAFC";
const ACCENT    = "3B82F6";  // Bright blue accent
const ACCENT_2  = "06B6D4";  // Cyan for variety
const GREEN     = "10B981";  // Emerald green for status
const BORDER    = "1E293B";  // Dark subtle border
const CARD_BG   = "F1F5F9";  // Light card fill for content slides

const diagramDir = "docs/diagrams/lingora-modeling/out";
const outFile = "docs/diagrams/lingora-modeling/deck/Lingora-System-Modeling-Presentation-v8.pptx";

// Helper: convert image to base64 data URI
function imgData(filename) {
  const p = path.join(diagramDir, filename);
  if (!fs.existsSync(p)) return null;
  const buf = fs.readFileSync(p);
  return "image/png;base64," + buf.toString("base64");
}

// ── Transition presets ──
const FADE       = { type: "fade",    secondsAdvance: 0 };
const PUSH_LEFT  = { type: "push",    dirn: "L", secondsAdvance: 0 };
const COVER_LEFT = { type: "cover",   dirn: "L", secondsAdvance: 0 };
const WIPE_RIGHT = { type: "wipe",    dirn: "R", secondsAdvance: 0 };

// ═══════════════════════════════════════════
// SLIDE 1: COVER — Dark Cinematic
// ═══════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = FADE;
  s.background = { color: DEEP_NAVY };

  // Subtle geometric grid pattern (decorative nodes)
  const positions = [
    [9.8, 1.2], [10.6, 2.0], [11.4, 1.0], [10.2, 3.0], [11.8, 2.8],
    [9.4, 4.2], [10.8, 4.6], [11.6, 4.0], [12.0, 5.2], [10.0, 5.6]
  ];
  positions.forEach(([cx, cy]) => {
    s.addShape("ellipse", {
      x: cx, y: cy, w: 0.12, h: 0.12,
      fill: { color: ACCENT, transparency: 75 },
      line: { width: 0 }
    });
  });
  // Connecting lines between some nodes
  const lineColor = { color: ACCENT, transparency: 80 };
  const linePairs = [[0,1],[1,2],[1,3],[3,4],[5,6],[6,7],[7,8],[5,9]];
  linePairs.forEach(([a,b]) => {
    const [x1,y1] = positions[a];
    const [x2,y2] = positions[b];
    s.addShape("line", {
      x: Math.min(x1,x2)+0.06, y: Math.min(y1,y2)+0.06,
      w: Math.abs(x2-x1), h: Math.abs(y2-y1),
      line: { ...lineColor, width: 0.5 },
      flipV: y2 < y1
    });
  });

  // Accent bar at very top
  s.addShape("rect", {
    x: 0, y: 0, w: 13.333, h: 0.04,
    fill: { color: ACCENT }, line: { width: 0 }
  });

  // Main title block
  s.addText("LINGORA", {
    x: 1.0, y: 1.8, w: 8.0, h: 0.6,
    fontSize: 14, fontFace: "Calibri", color: ACCENT,
    bold: true, charSpacing: 8, margin: 0
  });

  s.addText("Mô Hình Hóa Hệ Thống\n& Đặc Tả Nghiệp Vụ", {
    x: 1.0, y: 2.4, w: 8.5, h: 1.6,
    fontSize: 40, fontFace: "Calibri", color: WHITE,
    bold: true, lineSpacingMultiple: 1.15, margin: 0
  });

  s.addText("Use Case  ·  Activity Flow  ·  Domain Class Model  ·  Requirement Traceability", {
    x: 1.0, y: 4.15, w: 8.5, h: 0.5,
    fontSize: 14, fontFace: "Calibri", color: SLATE, margin: 0
  });

  // Divider line
  s.addShape("rect", {
    x: 1.0, y: 4.9, w: 2.5, h: 0.03,
    fill: { color: ACCENT }, line: { width: 0 }
  });

  s.addText("Báo cáo Kỹ thuật Phần mềm — Phase 1 Locked Baseline Specification", {
    x: 1.0, y: 5.15, w: 8.0, h: 0.4,
    fontSize: 11, fontFace: "Calibri", color: SLATE_DK, margin: 0
  });

  s.addNotes("Báo cáo trình bày phân tích và mô hình hóa hệ thống học ngoại ngữ trực tuyến Lingora. Nội dung bao gồm biểu đồ ca sử dụng, biểu đồ hoạt động, biểu đồ lớp và ma trận truy vết yêu cầu.");
})();

// ═══════════════════════════════════════════
// SLIDE 2: OVERVIEW ARCHITECTURE — 3 Columns
// ═══════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = PUSH_LEFT;
  s.background = { color: OFF_WHITE };

  // Eyebrow + Title
  s.addText("KIẾN TRÚC HỆ THỐNG", {
    x: 0.8, y: 0.4, w: 8.0, h: 0.3,
    fontSize: 11, fontFace: "Calibri", color: ACCENT, bold: true, charSpacing: 2, margin: 0
  });
  s.addText("Tổng Quan Kiến Trúc Nghiệp Vụ & Ranh Giới Vai Trò", {
    x: 0.8, y: 0.72, w: 10.0, h: 0.55,
    fontSize: 24, fontFace: "Calibri", color: NAVY, bold: true, margin: 0
  });
  s.addText("02 / 12", {
    x: 11.8, y: 0.45, w: 0.8, h: 0.3,
    fontSize: 11, fontFace: "Calibri", color: SLATE_DK, bold: true, align: "right", margin: 0
  });

  // 3 subsystem columns
  const colDefs = [
    {
      title: "LEARNING\nSUBSYSTEM",
      accent: ACCENT,
      desc: "Trải nghiệm học tập & củng cố năng lực",
      items: [
        "[UC-01] Xác thực phiên & phân quyền người dùng",
        "[UC-02] Cấu hình mục tiêu học tập hằng ngày",
        "[UC-03] Kiểm tra chẩn đoán xếp lớp đầu vào",
        "[UC-04] Duyệt lộ trình học & thử thách Jump",
        "[UC-05] Xem lý thuyết (Viewer) & làm bài tập tương tác",
        "[UC-06] Ôn tập từ vựng ngắt quãng theo SRS Policy B",
        "[UC-07] Theo dõi tiến độ học tập & chuỗi ngày Streak"
      ]
    },
    {
      title: "CONTENT\nSUBSYSTEM",
      accent: "8B5CF6", // Purple
      desc: "Biên soạn, kiểm duyệt & quản trị vòng đời",
      items: [
        "[UC-08] Soạn thảo bài học, bài tập & từ vựng đi kèm",
        "[UC-09] Kiểm duyệt độc lập & yêu cầu chỉnh sửa",
        "[UC-10] Xuất bản bài học đã duyệt ra toàn hệ thống",
        "[Rule] Quy trình Clone-to-Draft v2 bảo toàn bài đang phát hành",
        "[Rule] Điều kiện hiển thị Unit: đủ 4/4 Lesson Published",
        "[Rule] Phân tách nhiệm vụ SoD: Creator không tự duyệt bài",
        "[Admin] Xuất bản khẩn cấp bài đã Approved, có lý do & AuditLog"
      ]
    },
    {
      title: "ADMIN\n& OPS",
      accent: GREEN,
      desc: "Vận hành, kiểm toán an ninh & hỗ trợ",
      items: [
        "[UC-11] Quản trị tài khoản & phân bổ 6 vai trò chuẩn tắc",
        "[UC-12] Theo dõi báo cáo & thống kê vận hành hệ thống",
        "[UC-13] Tra cứu nhật ký kiểm toán an ninh bất biến AuditLog",
        "[UC-14] Tiếp nhận & điều phối xử lý phiếu hỗ trợ kỹ thuật",
        "[UC-15] Quản trị nhóm học viên & tiến độ lớp học",
        "[Rule] Bất biến: Tiến độ hoàn thành tách bạch khỏi Năng lực",
        "[Rule] Kiểm toán bất biến: Mọi hành động can thiệp đều lưu vết"
      ]
    }
  ];

  const colW = 3.7;
  const gap = 0.3;
  const startX = 0.8;

  colDefs.forEach((col, idx) => {
    const x = startX + idx * (colW + gap);

    // Card background
    s.addShape("roundRect", {
      x: x, y: 1.5, w: colW, h: 4.25,
      rectRadius: 0.06,
      fill: { color: WHITE },
      shadow: { type: "outer", blur: 6, offset: 2, angle: 270, color: "000000", opacity: 0.08 },
      line: { width: 0 }
    });

    // Color accent line at top of card
    s.addShape("rect", {
      x: x, y: 1.5, w: colW, h: 0.04,
      fill: { color: col.accent }, line: { width: 0 }
    });

    // Column title
    s.addText(col.title, {
      x: x + 0.25, y: 1.72, w: colW - 0.5, h: 0.7,
      fontSize: 14, fontFace: "Calibri", color: NAVY, bold: true,
      lineSpacingMultiple: 1.1, margin: 0
    });

    // Description
    s.addText(col.desc, {
      x: x + 0.25, y: 2.45, w: colW - 0.5, h: 0.35,
      fontSize: 9.5, fontFace: "Calibri", color: SLATE_DK, italic: true, margin: 0
    });

    // Items
    const itemsText = col.items.map((it, i) => ({
      text: it,
      options: {
        fontSize: 9.5, fontFace: "Calibri", color: "334155",
        bullet: true, paraSpaceAfter: 4,
        breakLine: i < col.items.length - 1
      }
    }));
    s.addText(itemsText, {
      x: x + 0.2, y: 2.85, w: colW - 0.4, h: 2.8,
      valign: "top", margin: [0, 5, 0, 5]
    });
  });

  // Bottom role bar
  s.addShape("roundRect", {
    x: 0.8, y: 5.95, w: 11.733, h: 0.95,
    rectRadius: 0.06,
    fill: { color: NAVY },
    line: { width: 0 }
  });

  s.addText("CÁC VAI TRÒ CHUẨN TẮC & RANH GIỚI PHẠM VI", {
    x: 1.05, y: 6.02, w: 5.0, h: 0.25,
    fontSize: 10, fontFace: "Calibri", color: ACCENT, bold: true, charSpacing: 1, margin: 0
  });

  s.addText([
    { text: "6 vai trò:  ", options: { fontSize: 10, fontFace: "Calibri", color: WHITE, bold: true } },
    { text: "Learner  ·  Lesson Creator  ·  Moderator  ·  Org Manager  ·  Operations Staff  ·  Administrator", options: { fontSize: 10, fontFace: "Calibri", color: SLATE } }
  ], { x: 1.05, y: 6.28, w: 11.0, h: 0.25, margin: 0 });

  s.addText("UC-14 (Phiếu hỗ trợ) thuộc MVP điều phối;  UC-15 (Quản lý nhóm) thuộc Future Extension.", {
    x: 1.05, y: 6.55, w: 11.0, h: 0.25,
    fontSize: 9.5, fontFace: "Calibri", color: SLATE_DK, margin: 0
  });

  s.addNotes("Kiến trúc nghiệp vụ chia làm ba phân hệ rõ ràng: Learning, Content và Administration. Sáu vai trò vận hành theo nguyên tắc phân tách nhiệm vụ.");
})();

// ═══════════════════════════════════════════
// Helper: Diagram + Right Callout slide
// ═══════════════════════════════════════════
function addDiagramCalloutSlide(opts) {
  const s = prs.addSlide();
  s.transition = PUSH_LEFT;
  s.background = { color: OFF_WHITE };

  // Header
  s.addText(opts.eyebrow.toUpperCase(), {
    x: 0.8, y: 0.4, w: 8.0, h: 0.3,
    fontSize: 11, fontFace: "Calibri", color: ACCENT, bold: true, charSpacing: 2, margin: 0
  });
  s.addText(opts.title, {
    x: 0.8, y: 0.72, w: 10.0, h: 0.55,
    fontSize: 24, fontFace: "Calibri", color: NAVY, bold: true, margin: 0
  });
  s.addText(`${String(opts.num).padStart(2, "0")} / 12`, {
    x: 11.8, y: 0.45, w: 0.8, h: 0.3,
    fontSize: 11, fontFace: "Calibri", color: SLATE_DK, bold: true, align: "right", margin: 0
  });

  // Diagram card (left ~65%)
  const dData = imgData(opts.diagramFile);
  if (dData) {
    s.addShape("roundRect", {
      x: 0.8, y: 1.45, w: 8.0, h: 5.55,
      rectRadius: 0.06,
      fill: { color: WHITE },
      shadow: { type: "outer", blur: 6, offset: 2, angle: 270, color: "000000", opacity: 0.06 },
      line: { width: 0 }
    });
    s.addImage({
      data: dData,
      x: 0.95, y: 1.55, w: 7.7, h: 5.35,
      sizing: { type: "contain", w: 7.7, h: 5.35 }
    });
  }

  // Right callout card
  s.addShape("roundRect", {
    x: 9.05, y: 1.45, w: 3.48, h: 5.55,
    rectRadius: 0.06,
    fill: { color: WHITE },
    shadow: { type: "outer", blur: 6, offset: 2, angle: 270, color: "000000", opacity: 0.06 },
    line: { width: 0 }
  });

  // Callout title
  s.addText(opts.calloutTitle, {
    x: 9.3, y: 1.65, w: 3.0, h: 0.35,
    fontSize: 11, fontFace: "Calibri", color: ACCENT, bold: true, charSpacing: 1, margin: 0
  });

  // Callout bullet pairs
  let curY = 2.1;
  opts.bullets.forEach((b) => {
    s.addText(`●  ${b.title}`, {
      x: 9.3, y: curY, w: 3.0, h: 0.25,
      fontSize: 10.5, fontFace: "Calibri", color: NAVY, bold: true, margin: 0
    });
    curY += 0.28;
    s.addText(b.desc, {
      x: 9.55, y: curY, w: 2.75, h: 0.65,
      fontSize: 9.5, fontFace: "Calibri", color: "475569", valign: "top", margin: 0
    });
    curY += 0.72;
  });

  if (opts.notes) s.addNotes(opts.notes);
}

// ═══════════════════════════════════════════
// Helper: Dual Diagram + Bottom Takeaway slide
// ═══════════════════════════════════════════
function addDualDiagramSlide(opts) {
  const s = prs.addSlide();
  s.transition = PUSH_LEFT;
  s.background = { color: OFF_WHITE };

  // Header
  s.addText(opts.eyebrow.toUpperCase(), {
    x: 0.8, y: 0.4, w: 8.0, h: 0.3,
    fontSize: 11, fontFace: "Calibri", color: ACCENT, bold: true, charSpacing: 2, margin: 0
  });
  s.addText(opts.title, {
    x: 0.8, y: 0.72, w: 10.0, h: 0.55,
    fontSize: 24, fontFace: "Calibri", color: NAVY, bold: true, margin: 0
  });
  s.addText(`${String(opts.num).padStart(2, "0")} / 12`, {
    x: 11.8, y: 0.45, w: 0.8, h: 0.3,
    fontSize: 11, fontFace: "Calibri", color: SLATE_DK, bold: true, align: "right", margin: 0
  });

  // Left diagram
  s.addText(opts.leftTitle, {
    x: 0.8, y: 1.38, w: 5.85, h: 0.28,
    fontSize: 11, fontFace: "Calibri", color: NAVY, bold: true, margin: 0
  });

  const dL = imgData(opts.leftFile);
  if (dL) {
    s.addShape("roundRect", {
      x: 0.8, y: 1.7, w: 5.85, h: 3.85,
      rectRadius: 0.06,
      fill: { color: WHITE },
      shadow: { type: "outer", blur: 6, offset: 2, angle: 270, color: "000000", opacity: 0.06 },
      line: { width: 0 }
    });
    s.addImage({
      data: dL,
      x: 0.9, y: 1.78, w: 5.65, h: 3.7,
      sizing: { type: "contain", w: 5.65, h: 3.7 }
    });
  }

  // Right diagram
  s.addText(opts.rightTitle, {
    x: 6.95, y: 1.38, w: 5.85, h: 0.28,
    fontSize: 11, fontFace: "Calibri", color: NAVY, bold: true, margin: 0
  });

  const dR = imgData(opts.rightFile);
  if (dR) {
    s.addShape("roundRect", {
      x: 6.95, y: 1.7, w: 5.585, h: 3.85,
      rectRadius: 0.06,
      fill: { color: WHITE },
      shadow: { type: "outer", blur: 6, offset: 2, angle: 270, color: "000000", opacity: 0.06 },
      line: { width: 0 }
    });
    s.addImage({
      data: dR,
      x: 7.05, y: 1.78, w: 5.385, h: 3.7,
      sizing: { type: "contain", w: 5.385, h: 3.7 }
    });
  }

  // Bottom takeaway strip
  s.addShape("roundRect", {
    x: 0.8, y: 5.75, w: 11.733, h: 1.25,
    rectRadius: 0.06,
    fill: { color: NAVY },
    line: { width: 0 }
  });

  const takeaways = opts.takeaways.map((t, i) => ({
    text: `●  ${t}`,
    options: {
      fontSize: 9.5, fontFace: "Calibri", color: "CBD5E1",
      bullet: false, paraSpaceAfter: 3,
      breakLine: i < opts.takeaways.length - 1
    }
  }));
  s.addText(takeaways, {
    x: 1.1, y: 5.85, w: 11.2, h: 1.05,
    valign: "middle", margin: [0, 5, 0, 5]
  });

  if (opts.notes) s.addNotes(opts.notes);
}

// ═══════════════════════════════════════════
// SLIDES 3-5: USE CASE DIAGRAMS
// ═══════════════════════════════════════════

// Slide 3: Overall Use Case
addDiagramCalloutSlide({
  num: 3,
  eyebrow: "Ca sử dụng hệ thống",
  title: "Sơ Đồ Ca Sử Dụng Tổng Quan (Overall Use Case Diagram)",
  diagramFile: "02-usecase-overall.png",
  calloutTitle: "Ý CHÍNH KIẾN TRÚC",
  bullets: [
    { title: "Kế thừa tác nhân chuẩn tắc", desc: "Sáu vai trò kế thừa từ Authenticated User để dùng chung phiên và xác thực (UC-01)." },
    { title: "Phân rã 3 phân hệ độc lập", desc: "Tách bạch triệt để giữa Học tập, Quản trị nội dung và Vận hành quản trị." },
    { title: "Quyền hạn xuất bản", desc: "Org Manager xuất bản chính thức (UC-10); Administrator chỉ can thiệp khẩn cấp với AuditLog bắt buộc." },
    { title: "Scope boundary rõ ràng", desc: "UC-14 (Hỗ trợ) thuộc MVP; UC-15 (Nhóm) thuộc Future Extension. Không trộn lẫn phạm vi." }
  ],
  notes: "Sơ đồ ca sử dụng tổng quan thể hiện cấu trúc phân hệ của Lingora. Sáu tác nhân kế thừa từ Authenticated User nhằm chuẩn hóa cơ chế đăng nhập."
});

// Slide 4: Learner Use Case
addDiagramCalloutSlide({
  num: 4,
  eyebrow: "Phân hệ học viên",
  title: "Sơ Đồ Ca Sử Dụng Chi Tiết — Phân Hệ Học Viên (Learner)",
  diagramFile: "03-usecase-learner.png",
  calloutTitle: "QUY TẮC NGHIỆP VỤ HỌC VIÊN",
  bullets: [
    { title: "Viewer bắt buộc", desc: "Lesson Content Viewer được include trực tiếp vào UC-05; học viên phải xem lý thuyết trước khi làm bài tập." },
    { title: "Controlled Retry", desc: "Làm lại câu sai là luồng extend có hạn mức max(1, floor(N*0.10)), điểm tối đa 70% credit." },
    { title: "Conditional Jump", desc: "Thử thách nhảy cấp mở rộng từ UC-04, yêu cầu đạt >= 95% và áp dụng Cooldown 24h khi trượt." },
    { title: "Chu trình khép kín", desc: "Từ xếp lớp (UC-03), học bài (UC-05), ôn SRS độc lập (UC-06) đến tích lũy Streak (UC-07)." }
  ],
  notes: "Phân hệ học viên chuẩn hóa chu trình học tập khép kín. Người học bắt buộc xem nội dung qua Viewer trước khi trả lời bài tập."
});

// Slide 5: Content & Admin Use Case
addDiagramCalloutSlide({
  num: 5,
  eyebrow: "Quản trị & kiểm duyệt",
  title: "Sơ Đồ Ca Sử Dụng Chi Tiết — Quản Trị & Kiểm Duyệt",
  diagramFile: "04-usecase-content-admin.png",
  calloutTitle: "NGUYÊN TẮC QUẢN TRỊ & SOD",
  bullets: [
    { title: "Phân tách SoD", desc: "Creator soạn bài; Moderator thẩm định; Org Manager xuất bản. Creator không tự duyệt bài của mình." },
    { title: "Kết quả thẩm định", desc: "Moderator chỉ chuyển APPROVED hoặc CHANGES_REQUESTED kèm ghi chú, không có quyền phát hành." },
    { title: "Quyền xuất bản", desc: "Org Manager là tác nhân duy nhất có thẩm quyền xuất bản chính thức khi bài đạt APPROVED." },
    { title: "Can thiệp khẩn cấp", desc: "Administrator chỉ xuất bản khẩn cấp cho bài đã APPROVED; bắt buộc giải trình và AuditLog." }
  ],
  notes: "Phân hệ quản trị nội dung thực thi nghiêm ngặt nguyên tắc phân tách nhiệm vụ. Người soạn bài không có quyền tự phê duyệt hay xuất bản."
});

// ═══════════════════════════════════════════
// SLIDES 6-9: ACTIVITY DIAGRAMS (Dual Layout)
// ═══════════════════════════════════════════

// Slide 6: Placement
addDualDiagramSlide({
  num: 6,
  eyebrow: "Quy trình đánh giá",
  title: "Sơ Đồ Hoạt Động — Đánh Giá Chẩn Đoán Đầu Vào (Placement)",
  leftTitle: "Luồng Chẩn Đoán Tuyến Tính (30 Câu → Starting Unit)",
  leftFile: "05a-activity-placement-flow.png",
  rightTitle: "Nhánh Bỏ Qua (Skip) & Nhánh Thi Lại (Retake)",
  rightFile: "05b-activity-placement-branches.png",
  takeaways: [
    "Quy mô 30 câu & Mapping A: Đề thi 30 câu, thang điểm thô 0–30. Ánh xạ ra Starting Unit từ 1 đến 6 theo dải điểm chuẩn tắc.",
    "Nhánh Bỏ qua (Skip): Gán mặc định Unit 1 với trạng thái UNVERIFIED, không tạo bản ghi rác trong AssessmentResult hay SkillProfile.",
    "Nhánh Thi lại (Retake): Kích hoạt từ Profile, lưu bản ghi mới độc lập mà không ghi đè lịch sử bài thi trước đó."
  ],
  notes: "Quy trình đánh giá chẩn đoán đầu vào gồm 30 câu hỏi theo ma trận kiến thức phân tầng. Điểm số thô được ánh xạ qua Mapping A."
});

// Slide 7: Learning Flow
addDualDiagramSlide({
  num: 7,
  eyebrow: "Quy trình học bài",
  title: "Sơ Đồ Hoạt Động — Chu Trình Học Bài & Làm Lại Có Kiểm Soát",
  leftTitle: "Luồng Học Chính (4/4 Published → Viewer → Bài Tập)",
  leftFile: "06a-activity-learning-main.png",
  rightTitle: "Luồng Làm Lại Có Kiểm Soát (Controlled Retry Flow)",
  rightFile: "06b-activity-learning-retry.png",
  takeaways: [
    "Điều kiện hiển thị: Unit chỉ mở khi đủ 4/4 Lesson Published. Học viên bắt buộc qua Lesson Content Viewer trước khi làm bài tập.",
    "Quy chế Retry: Sai khi retry quay lại Show Explanation; hết hạn mức báo 'No quota'; làm lại đúng ghi nhận ≤ 70% credit.",
    "Cập nhật nguyên tử [UC-07]: Hoàn thành bài học ghi nhận UserProgress, tăng Streak thuộc UC-07 và thêm thẻ SRS (1,3,7,14,30 ngày)."
  ],
  notes: "Chu trình học bài yêu cầu bài học thuộc Unit có đủ 4/4 bài đã phát hành. Học viên tiếp thu kiến thức qua Viewer trước bài tập."
});

// Slide 8: Conditional Jump
addDualDiagramSlide({
  num: 8,
  eyebrow: "Quy trình nhảy cấp",
  title: "Sơ Đồ Hoạt Động — Thử Thách Nhảy Cấp (Conditional Jump)",
  leftTitle: "Kiểm Tra Cooldown 24h & Làm Bài Thi Jump",
  leftFile: "07a-activity-jump-check.png",
  rightTitle: "Xử Lý Kết Quả: Vượt Cấp (Đỗ >= 95%) vs Khóa Phạt 24h",
  rightFile: "07b-activity-jump-result.png",
  takeaways: [
    "Kiểm tra Cooldown: Chặn làm bài nếu đang trong thời gian phạt Cooldown 24 giờ sau lần thi trượt gần nhất.",
    "Quy mô đề Jump: 20 câu (nhảy 1 Unit), 25–30 câu (nhảy 2–3 Units), hoặc 40 câu (nhảy hơn 3 Units).",
    "Xử lý kết quả: Đạt >= 95% gán SKIPPED_BY_JUMP (by_jump = true) cho nội dung vượt qua; trượt khóa 24 giờ."
  ],
  notes: "Thử thách nhảy cấp cho phép người học bỏ qua nội dung đã nắm vững. Quy mô bài thi tương ứng với số lượng bài học cần vượt qua."
});

// Slide 9: Governance
addDualDiagramSlide({
  num: 9,
  eyebrow: "Quy trình nội dung",
  title: "Sơ Đồ Hoạt Động — Quản Trị & Xuất Bản Nội Dung",
  leftTitle: "Quy Trình Phê Duyệt & Xuất Bản Chính Thức",
  leftFile: "08a-activity-governance-main.png",
  rightTitle: "Cơ Chế Clone-to-Draft v2 & Xuất Bản Khẩn Cấp",
  rightFile: "08b-activity-governance-branches.png",
  takeaways: [
    "Phê duyệt độc lập: Moderator chuyển APPROVED hoặc CHANGES_REQUESTED kèm ghi chú chi tiết, không dùng REJECTED.",
    "Quyền xuất bản: Org Manager là tác nhân thẩm quyền duy nhất thực hiện Publish sau khi học liệu đã Approved.",
    "Clone-to-Draft v2 & Emergency: Sửa bài đã xuất bản tạo bản v2, bắt buộc Archive v1; Admin xuất bản có AuditLog."
  ],
  notes: "Quy trình quản trị học liệu kết hợp thẩm định sư phạm và lưu vết lịch sử. Moderator chỉ chuyển trạng thái duyệt."
});

// ═══════════════════════════════════════════
// SLIDES 10-11: CLASS DIAGRAMS
// ═══════════════════════════════════════════

// Slide 10: Content Class Model
addDiagramCalloutSlide({
  num: 10,
  eyebrow: "Mô hình cấu trúc",
  title: "Sơ Đồ Lớp — Cấu Trúc Nội Dung & Khóa Học",
  diagramFile: "09-class-content.png",
  calloutTitle: "ĐẶC TẢ LỚP NỘI DUNG",
  bullets: [
    { title: "CURRENT vs TARGET", desc: "Nét liền cho thực thể CURRENT (schema.prisma) và nét đứt cho TARGET (Phase 2)." },
    { title: "Vòng đời 6 trạng thái", desc: "LessonRevision quản lý: DRAFT, IN_REVIEW, CHANGES_REQUESTED, APPROVED, PUBLISHED, ARCHIVED." },
    { title: "Exercise thuộc Revision", desc: "Exercise liên kết trực tiếp với LessonRevision; khóa ngoại cũ giữ nhãn [CURRENT]." },
    { title: "Ràng buộc hiển thị Unit", desc: "Unit chỉ hiển thị khi đủ 4/4 Lesson Published, đảm bảo tính trọn vẹn chương trình." }
  ],
  notes: "Sơ đồ lớp nội dung phân tách giữa bảng dữ liệu hiện tại và mô hình quản lý phiên bản mục tiêu."
});

// Slide 11: Learner Assessment Class Model
addDiagramCalloutSlide({
  num: 11,
  eyebrow: "Mô hình học viên",
  title: "Sơ Đồ Lớp — Học Viên, Đánh Giá & Tiến Độ",
  diagramFile: "10-class-learner-assessment.png",
  calloutTitle: "BẤT BIẾN DỮ LIỆU HỌC VIÊN",
  bullets: [
    { title: "Tiến độ ≠ Năng lực", desc: "Tách bạch UserProgress (tiến độ tuyến tính) khỏi SkillProfile (năng lực đa chiều qua AssessmentResult)." },
    { title: "SRS tất định Policy B", desc: "UserVocabSrs thực thi chu kỳ ngày cố định 1, 3, 7, 14, 30 ngày; sai lập tức reset về mốc 1 ngày." },
    { title: "Ghi chú trạng thái State", desc: "Retry usage và Jump cooldown 24h được mô hình hóa dưới dạng ghi chú logic gắn UserProgress." },
    { title: "Kiểm toán an ninh", desc: "Mọi thay đổi vai trò hay can thiệp đặc quyền đều tạo bản ghi bất biến trong AuditLog." }
  ],
  notes: "Sơ đồ lớp học viên thể hiện nguyên tắc tách biệt giữa tiến độ học và hồ sơ năng lực."
});

// ═══════════════════════════════════════════
// SLIDE 12: TRACEABILITY MATRIX — Dark Header Table
// ═══════════════════════════════════════════
(() => {
  const s = prs.addSlide();
  s.transition = COVER_LEFT;
  s.background = { color: OFF_WHITE };

  // Header
  s.addText("TRUY VẾT YÊU CẦU", {
    x: 0.8, y: 0.4, w: 8.0, h: 0.3,
    fontSize: 11, fontFace: "Calibri", color: ACCENT, bold: true, charSpacing: 2, margin: 0
  });
  s.addText("Ma Trận Truy Vết Nghiệp Vụ Toàn Diện (Traceability Matrix)", {
    x: 0.8, y: 0.72, w: 10.0, h: 0.55,
    fontSize: 24, fontFace: "Calibri", color: NAVY, bold: true, margin: 0
  });
  s.addText("12 / 12", {
    x: 11.8, y: 0.45, w: 0.8, h: 0.3,
    fontSize: 11, fontFace: "Calibri", color: SLATE_DK, bold: true, align: "right", margin: 0
  });

  const headers = ["UC ID", "Tên Ca Sử Dụng Chuẩn Tắc", "Sơ Đồ Hoạt Động", "Lớp Dữ Liệu", "Phạm Vi Triển Khai"];
  const colW = [0.85, 3.3, 2.1, 2.73, 2.15];

  const rows = [
    ["UC-01", "Authenticate & Manage Session", "—", "Profile, Role", "CORE (Phase 2 MVP)"],
    ["UC-02", "Configure Goals & Study Time", "—", "Profile", "CORE (Phase 2 MVP)"],
    ["UC-03", "Take Placement Test", "Slide 6", "AssessmentResult, SkillProfile", "CORE (Phase 2 MVP)"],
    ["UC-04", "Browse Learning Path & Conditional Jump", "Slide 8", "Course, Unit, Lesson, UserProgress", "CORE (Phase 2 MVP)"],
    ["UC-05", "Complete Lesson Exercises & Controlled Retry", "Slide 7", "Lesson, Exercise, UserProgress", "CORE (Phase 2 MVP)"],
    ["UC-06", "Spaced Repetition Review (SRS)", "—", "Vocabulary, UserVocabSrs, ReviewLog", "CORE (Phase 2 MVP)"],
    ["UC-07", "Track Progress, Mastery & Streak", "Slide 7", "Profile, UserProgress", "CORE (Phase 2 MVP)"],
    ["UC-08", "Create & Edit Lesson Draft", "Slide 9", "Lesson, LessonRevision, Exercise", "CORE (Phase 2 MVP)"],
    ["UC-09", "Review & Moderate Content", "Slide 9", "LessonRevision, AuditLog", "CORE (Phase 2 MVP)"],
    ["UC-10", "Publish Approved Content", "Slide 9", "Unit, Lesson, LessonRevision, AuditLog", "CORE (Phase 2 MVP)"],
    ["UC-11", "Manage Accounts & Roles", "—", "Profile, Role, AuditLog", "CORE (Phase 2 MVP)"],
    ["UC-12", "View System Reports", "—", "UserProgress, AuditLog", "CORE (Phase 2 MVP)"],
    ["UC-13", "View & Audit Security Logs", "—", "AuditLog", "CORE (Phase 2 MVP)"],
    ["UC-14", "Handle Support Tickets", "—", "—", "MVP (Điều phối hỗ trợ)"],
    ["UC-15", "Manage Cohorts & Group Progress", "—", "—", "FUTURE EXTENSION"]
  ];

  // Build table rows as array of arrays
  const tableRows = [];

  // Header row
  tableRows.push(headers.map((h, j) => ({
    text: h,
    options: {
      fontSize: 10, fontFace: "Calibri", color: WHITE, bold: true,
      align: j === 0 || j === 4 ? "center" : "left",
      fill: { color: NAVY },
      margin: [3, 5, 3, 5],
      border: [
        { type: "solid", color: NAVY, pt: 0.5 },
        { type: "solid", color: NAVY, pt: 0.5 },
        { type: "solid", color: NAVY, pt: 0.5 },
        { type: "solid", color: NAVY, pt: 0.5 }
      ]
    }
  })));

  // Data rows
  rows.forEach((row, i) => {
    const bgColor = i % 2 === 0 ? WHITE : "F8FAFC";
    tableRows.push(row.map((val, j) => {
      const opts = {
        fontSize: 9.5, fontFace: "Calibri", color: "334155",
        fill: { color: bgColor },
        margin: [2, 5, 2, 5],
        border: [
          { type: "solid", color: "E2E8F0", pt: 0.5 },
          { type: "solid", color: "E2E8F0", pt: 0.5 },
          { type: "solid", color: "E2E8F0", pt: 0.5 },
          { type: "solid", color: "E2E8F0", pt: 0.5 }
        ]
      };

      if (j === 0) {
        opts.bold = true;
        opts.color = ACCENT;
        opts.align = "center";
      } else if (j === 2 && val !== "—") {
        opts.bold = true;
        opts.color = GREEN;
      } else if (j === 4) {
        opts.bold = true;
        opts.align = "center";
        if (val.includes("FUTURE")) {
          opts.color = SLATE_DK;
        } else if (val.includes("hỗ trợ")) {
          opts.color = ACCENT_2;
        } else {
          opts.color = GREEN;
        }
      }

      return { text: val, options: opts };
    }));
  });

  s.addTable(tableRows, {
    x: 0.65, y: 1.38, w: 12.0,
    colW: colW,
    rowH: 0.3,
    autoPage: false,
    autoPageRepeatHeader: true
  });

  // Footnote
  s.addText("Ghi chú: Cột Sơ đồ hoạt động dẫn chiếu slide có biểu đồ thực tế; các Use Case còn lại đánh dấu '—'. UC-14 và UC-15 không ánh xạ lớp thực thể nội bộ.", {
    x: 0.8, y: 6.78, w: 11.733, h: 0.3,
    fontSize: 9, fontFace: "Calibri", color: SLATE_DK, margin: 0
  });

  s.addNotes("Ma trận truy vết bảo đảm tính liên kết giữa các ca sử dụng với biểu đồ hoạt động và cấu trúc dữ liệu. Phân định rõ ràng phạm vi triển khai cốt lõi MVP.");
})();

// ── Save ──
const outDir = path.dirname(outFile);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
prs.writeFile({ fileName: outFile }).then(() => {
  console.log(`✓ Deck v8 saved: ${outFile}`);
  // Copy to root too
  fs.copyFileSync(outFile, "Lingora-System-Modeling-Presentation-v8.pptx");
  console.log("✓ Copied to root: Lingora-System-Modeling-Presentation-v8.pptx");
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
