import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
from PIL import Image

def build_deck_v7():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Warm Minimal Editorial Palette
    BG_WARM = RGBColor(248, 249, 250)      # #F8F9FA warm off-white
    CARD_BG = RGBColor(255, 255, 255)      # Pure white diagram canvas
    NAVY = RGBColor(15, 23, 42)            # #0F172A primary headers
    SLATE = RGBColor(51, 65, 85)           # #334155 body text
    MUTED = RGBColor(100, 116, 139)        # #64748B captions & markers
    BORDER_SUBTLE = RGBColor(226, 232, 240)# #E2E8F0 subtle divider / border
    CALLOUT_BG = RGBColor(241, 245, 249)   # #F1F5F9 key takeaway background
    
    # Restrained Accents (Single Primary Accent + Muted Secondary Accent)
    ACCENT_BLUE = RGBColor(37, 99, 235)    # #2563EB presentation accent
    ACCENT_GREEN = RGBColor(22, 163, 74)   # #16A34A status / pass accent
    
    diagram_dir = "docs/diagrams/lingora-modeling/out"
    output_pptx = "docs/diagrams/lingora-modeling/deck/Lingora-System-Modeling-Presentation-v7.pptx"
    os.makedirs(os.path.dirname(output_pptx), exist_ok=True)

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_WARM
        bg.line.fill.background()
        return bg

    def add_editorial_header(slide, title_text, section_label, slide_num=None):
        # Header block at x = 0.8 in, y = 0.45 in
        hdr_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.42), Inches(10.5), Inches(0.95))
        tf = hdr_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p0 = tf.paragraphs[0]
        p0.text = section_label.upper()
        p0.font.name = "Calibri"
        p0.font.size = Pt(11)
        p0.font.bold = True
        p0.font.color.rgb = ACCENT_BLUE
        p0.space_after = Pt(2)

        p1 = tf.add_paragraph()
        p1.text = title_text
        p1.font.name = "Calibri"
        p1.font.size = Pt(24)
        p1.font.bold = True
        p1.font.color.rgb = NAVY

        if slide_num is not None:
            # Elegant minimalist page number
            num_box = slide.shapes.add_textbox(Inches(11.5), Inches(0.45), Inches(1.033), Inches(0.4))
            tf_num = num_box.text_frame
            tf_num.word_wrap = False
            tf_num.margin_left = tf_num.margin_top = tf_num.margin_right = tf_num.margin_bottom = 0
            pn = tf_num.paragraphs[0]
            pn.text = f"{slide_num:02d} / 12"
            pn.font.name = "Calibri"
            pn.font.size = Pt(11)
            pn.font.bold = True
            pn.font.color.rgb = MUTED
            pn.alignment = PP_ALIGN.RIGHT

    def place_diagram(slide, img_path, left_in, top_in, max_w_in, max_h_in):
        # Places image on a pure white canvas card with a 1px crisp subtle border
        if not os.path.exists(img_path):
            return

        with Image.open(img_path) as im:
            iw, ih = im.size

        # Inner padding inside white card
        pad = 0.08
        avail_w = max_w_in - 2 * pad
        avail_h = max_h_in - 2 * pad
        
        scale = min(avail_w / iw, avail_h / ih)
        fw = iw * scale
        fh = ih * scale
        
        # White container card
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(left_in), Inches(top_in), Inches(max_w_in), Inches(max_h_in))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = BORDER_SUBTLE
        card.line.width = Pt(1.0)

        # Centered image
        fx = left_in + (max_w_in - fw) / 2
        fy = top_in + (max_h_in - fh) / 2
        slide.shapes.add_picture(img_path, Inches(fx), Inches(fy), width=Inches(fw), height=Inches(fh))

    # ==========================================
    # SLIDE 1: COVER (Abstract Technical Motif)
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    # Architectural geometric accent motifs (light gray structural nodes)
    for i in range(5):
        cx = 10.2 + (i % 2) * 1.4
        cy = 1.8 + i * 1.0
        dot = s1.shapes.add_shape(MSO_SHAPE.OVAL, Inches(cx), Inches(cy), Inches(0.18), Inches(0.18))
        dot.fill.solid()
        dot.fill.fore_color.rgb = RGBColor(203, 213, 225)
        dot.line.fill.background()
        if i < 4:
            conn = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(cx + 0.08), Inches(cy + 0.18), Pt(1.0), Inches(0.85))
            conn.fill.solid()
            conn.fill.fore_color.rgb = RGBColor(226, 232, 240)
            conn.line.fill.background()

    # Main text block
    c_box = s1.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(9.5), Inches(3.8))
    tf1 = c_box.text_frame
    tf1.word_wrap = True
    tf1.margin_left = tf1.margin_top = tf1.margin_right = tf1.margin_bottom = 0

    p0 = tf1.paragraphs[0]
    p0.text = "LINGORA PLATFORM ARCHITECTURE"
    p0.font.name = "Calibri"
    p0.font.size = Pt(13)
    p0.font.bold = True
    p0.font.color.rgb = ACCENT_BLUE
    p0.space_after = Pt(12)

    p1 = tf1.add_paragraph()
    p1.text = "Mô Hình Hóa Hệ Thống & Đặc Tả Nghiệp Vụ"
    p1.font.name = "Calibri"
    p1.font.size = Pt(32)
    p1.font.bold = True
    p1.font.color.rgb = NAVY
    p1.space_after = Pt(14)

    p2 = tf1.add_paragraph()
    p2.text = "Use Case · Activity Flow · Domain Class Model · Requirement Traceability"
    p2.font.name = "Calibri"
    p2.font.size = Pt(15)
    p2.font.color.rgb = SLATE
    p2.space_after = Pt(28)

    p3 = tf1.add_paragraph()
    p3.text = "Báo cáo Kỹ thuật Phần mềm — Phase 1 Locked Baseline Specification"
    p3.font.name = "Calibri"
    p3.font.size = Pt(12)
    p3.font.color.rgb = MUTED

    s1.notes_slide.notes_text_frame.text = (
        "Báo cáo trình bày phân tích và mô hình hóa hệ thống học ngoại ngữ trực tuyến Lingora. "
        "Nội dung bao gồm biểu đồ ca sử dụng, biểu đồ hoạt động, biểu đồ lớp và ma trận truy vết yêu cầu. "
        "Mô hình bám sát tài liệu đặc tả hành vi M2.2 và quy tắc nghiệp vụ đã phê duyệt."
    )

    # ==========================================
    # SLIDE 2: OVERVIEW ARCHITECTURE (3 Clear Bands)
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_editorial_header(s2, "Tổng Quan Kiến Trúc Nghiệp Vụ & Ranh Giới Vai Trò", "Kiến trúc hệ thống", 2)

    # 3 Distinct Functional Bands
    band_w = Inches(3.75)
    band_h = Inches(4.2)
    band_y = Inches(1.5)
    gap = Inches(0.24)
    start_x = Inches(0.8)

    bands = [
        ("LEARNING SUBSYSTEM", "Trải nghiệm học tập & củng cố năng lực", [
            ("UC-01", "Xác thực phiên & phân quyền người dùng"),
            ("UC-02", "Cấu hình mục tiêu học tập hàng ngày"),
            ("UC-03", "Kiểm tra chẩn đoán xếp lớp đầu vào"),
            ("UC-04", "Duyệt lộ trình học & thử thách Jump"),
            ("UC-05", "Xem lý thuyết (Viewer) & làm bài tập tương tác"),
            ("UC-06", "Ôn tập từ vựng ngắt quãng theo SRS Policy B"),
            ("UC-07", "Theo dõi tiến độ học tập & chuỗi ngày Streak")
        ]),
        ("CONTENT SUBSYSTEM", "Biên soạn, kiểm duyệt & quản trị vòng đời", [
            ("UC-08", "Soạn thảo bài học, bài tập & từ vựng đi kèm"),
            ("UC-09", "Kiểm duyệt độc lập & yêu cầu chỉnh sửa"),
            ("UC-10", "Xuất bản bài học đã duyệt ra toàn hệ thống"),
            ("Rule", "Quy trình Clone-to-Draft v2 bảo toàn bài đang phát hành"),
            ("Rule", "Điều kiện hiển thị Unit: đủ 4/4 Lesson Published"),
            ("Rule", "Phân tách nhiệm vụ SoD: Creator không tự duyệt bài"),
            ("Admin", "Xuất bản khẩn cấp bài đã Approved, có lý do & AuditLog")
        ]),
        ("ADMINISTRATION & OPS", "Vận hành, kiểm toán an ninh & hỗ trợ", [
            ("UC-11", "Quản trị tài khoản & phân bổ 6 vai trò chuẩn tắc"),
            ("UC-12", "Theo dõi báo cáo & thống kê vận hành hệ thống"),
            ("UC-13", "Tra cứu nhật ký kiểm toán an ninh bất biến AuditLog"),
            ("UC-14", "Tiếp nhận & điều phối xử lý phiếu hỗ trợ kỹ thuật"),
            ("UC-15", "Quản trị nhóm học viên & tiến độ lớp học"),
            ("Rule", "Bất biến: Tiến độ hoàn thành tách bạch khỏi Năng lực"),
            ("Rule", "Kiểm toán bất biến: Mọi hành động can thiệp đều lưu vết")
        ])
    ]

    for i, (b_title, b_sub, items) in enumerate(bands):
        bx = start_x + i * (band_w + gap)
        
        # Band card container
        b_card = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, bx, band_y, band_w, band_h)
        b_card.fill.solid()
        b_card.fill.fore_color.rgb = CARD_BG
        b_card.line.color.rgb = BORDER_SUBTLE
        b_card.line.width = Pt(1.0)

        tf_b = b_card.text_frame
        tf_b.word_wrap = True
        tf_b.margin_left = tf_b.margin_right = Inches(0.2)
        tf_b.margin_top = Inches(0.2)

        p_t = tf_b.paragraphs[0]
        p_t.text = b_title
        p_t.font.name = "Calibri"
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = NAVY
        p_t.space_after = Pt(2)

        p_s = tf_b.add_paragraph()
        p_s.text = b_sub
        p_s.font.name = "Calibri"
        p_s.font.size = Pt(10)
        p_s.font.color.rgb = MUTED
        p_s.space_after = Pt(10)

        for tag, desc in items:
            p_it = tf_b.add_paragraph()
            p_it.text = f"• [{tag}] {desc}"
            p_it.font.name = "Calibri"
            p_it.font.size = Pt(9.5)
            p_it.font.color.rgb = SLATE
            p_it.space_after = Pt(3.5)

    # Bottom Scope & Role Strip
    bot_card = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(5.88), Inches(11.733), Inches(0.95))
    bot_card.fill.solid()
    bot_card.fill.fore_color.rgb = CALLOUT_BG
    bot_card.line.color.rgb = BORDER_SUBTLE
    bot_card.line.width = Pt(1.0)

    tf_bot = bot_card.text_frame
    tf_bot.word_wrap = True
    tf_bot.margin_left = tf_bot.margin_right = Inches(0.25)
    tf_bot.margin_top = Inches(0.12)

    pb0 = tf_bot.paragraphs[0]
    pb0.text = "CÁC VAI TRÒ CHUẨN TẮC & RANH GIỚI PHẠM VI"
    pb0.font.name = "Calibri"
    pb0.font.size = Pt(10.5)
    pb0.font.bold = True
    pb0.font.color.rgb = NAVY
    pb0.space_after = Pt(3)

    pb1 = tf_bot.add_paragraph()
    pb1.text = "• 6 vai trò: Learner · Lesson Creator · Moderator · Organizational Manager · Operations Staff · Administrator."
    pb1.font.name = "Calibri"
    pb1.font.size = Pt(10)
    pb1.font.color.rgb = SLATE
    pb1.space_after = Pt(2)

    pb2 = tf_bot.add_paragraph()
    pb2.text = "• Phân định: UC-14 (Phiếu hỗ trợ) thuộc MVP điều phối hỗ trợ; UC-15 (Quản lý nhóm) thuộc Future Extension."
    pb2.font.name = "Calibri"
    pb2.font.size = Pt(10)
    pb2.font.color.rgb = MUTED

    s2.notes_slide.notes_text_frame.text = (
        "Kiến trúc nghiệp vụ chia làm ba phân hệ rõ ràng: Learning, Content và Administration. "
        "Sáu vai trò vận hành theo nguyên tắc phân tách nhiệm vụ. "
        "UC-14 thuộc phạm vi MVP điều phối hỗ trợ, còn UC-15 quản lý nhóm thuộc phạm vi mở rộng tương lai."
    )

    # ==========================================
    # SLIDE 3: OVERALL USE CASE (Hero Diagram + Bottom Takeaways)
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_editorial_header(s3, "Sơ Đồ Ca Sử Dụng Tổng Quan (Overall Use Case Diagram)", "Ca sử dụng hệ thống", 3)

    # Diagram on left (w = 8.0, h = 5.45)
    place_diagram(s3, os.path.join(diagram_dir, "02-usecase-overall.png"), 0.8, 1.45, 8.0, 5.45)

    # Right Callout Card (w = 3.48, h = 5.45)
    rc3 = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(9.05), Inches(1.45), Inches(3.48), Inches(5.45))
    rc3.fill.solid()
    rc3.fill.fore_color.rgb = CALLOUT_BG
    rc3.line.color.rgb = BORDER_SUBTLE
    rc3.line.width = Pt(1.0)

    tf_rc3 = rc3.text_frame
    tf_rc3.word_wrap = True
    tf_rc3.margin_left = tf_rc3.margin_right = Inches(0.2)
    tf_rc3.margin_top = Inches(0.25)

    p_rc3_h = tf_rc3.paragraphs[0]
    p_rc3_h.text = "Ý CHÍNH KIẾN TRÚC CA SỬ DỤNG"
    p_rc3_h.font.name = "Calibri"
    p_rc3_h.font.size = Pt(11)
    p_rc3_h.font.bold = True
    p_rc3_h.font.color.rgb = NAVY
    p_rc3_h.space_after = Pt(14)

    s3_bullets = [
        ("Kế thừa tác nhân chuẩn tắc", "Sáu vai trò cụ thể đều kế thừa từ Authenticated User để dùng chung phiên và xác thực (UC-01)."),
        ("Phân rã 3 phân hệ độc lập", "Tách bạch triệt để giữa Học tập (Learner), Quản trị nội dung (Content) và Vận hành quản trị (Admin & Ops)."),
        ("Quyền hạn xuất bản & Cứu nguy", "Chỉ Org Manager xuất bản chính thức (UC-10); Administrator chỉ can thiệp xuất bản khẩn cấp với AuditLog bắt buộc.")
    ]
    for b_title, b_desc in s3_bullets:
        p_t = tf_rc3.add_paragraph()
        p_t.text = f"• {b_title}"
        p_t.font.name = "Calibri"
        p_t.font.size = Pt(10.5)
        p_t.font.bold = True
        p_t.font.color.rgb = NAVY
        p_t.space_after = Pt(2)

        p_d = tf_rc3.add_paragraph()
        p_d.text = b_desc
        p_d.font.name = "Calibri"
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = SLATE
        p_d.space_after = Pt(10)

    s3.notes_slide.notes_text_frame.text = (
        "Sơ đồ ca sử dụng tổng quan thể hiện cấu trúc phân hệ của Lingora. "
        "Sáu tác nhân kế thừa từ Authenticated User nhằm chuẩn hóa cơ chế đăng nhập. "
        "Hệ thống phân tách ranh giới rõ ràng giữa chức năng người học và phân hệ quản trị."
    )

    # ==========================================
    # SLIDE 4: LEARNER USE CASE DETAIL
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_editorial_header(s4, "Sơ Đồ Ca Sử Dụng Chi Tiết — Phân Hệ Học Viên (Learner)", "Phân hệ học viên", 4)

    # Diagram occupying 70% width: left = 0.8, top = 1.45, w = 8.0, h = 5.45
    place_diagram(s4, os.path.join(diagram_dir, "03-usecase-learner.png"), 0.8, 1.45, 8.0, 5.45)

    # Right Callout Card: left = 9.05, top = 1.45, w = 3.48, h = 5.45
    rc4 = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(9.05), Inches(1.45), Inches(3.48), Inches(5.45))
    rc4.fill.solid()
    rc4.fill.fore_color.rgb = CALLOUT_BG
    rc4.line.color.rgb = BORDER_SUBTLE
    rc4.line.width = Pt(1.0)

    tf_rc4 = rc4.text_frame
    tf_rc4.word_wrap = True
    tf_rc4.margin_left = tf_rc4.margin_right = Inches(0.2)
    tf_rc4.margin_top = Inches(0.2)

    p_rc4_h = tf_rc4.paragraphs[0]
    p_rc4_h.text = "QUY TẮC NGHIỆP VỤ HỌC VIÊN"
    p_rc4_h.font.name = "Calibri"
    p_rc4_h.font.size = Pt(11)
    p_rc4_h.font.bold = True
    p_rc4_h.font.color.rgb = NAVY
    p_rc4_h.space_after = Pt(12)

    bullets_s4 = [
        ("Viewer bắt buộc", "Lesson Content Viewer được include trực tiếp vào UC-05; học viên phải xem lý thuyết từ vựng trước khi làm bài tập."),
        ("Controlled Retry", "Làm lại câu sai là luồng extend có hạn mức max(1, floor(N*0.10)), điểm làm lại tối đa 70% credit."),
        ("Conditional Jump", "Thử thách nhảy cấp là năng lực mở rộng từ UC-04, yêu cầu đạt >= 95% và áp dụng Cooldown 24h khi trượt."),
        ("Chu trình khép kín", "Từ xếp lớp (UC-03), học bài (UC-05), ôn tập SRS độc lập (UC-06) đến tích lũy chuỗi ngày Streak (UC-07).")
    ]
    for b_title, b_desc in bullets_s4:
        pb_t = tf_rc4.add_paragraph()
        pb_t.text = f"• {b_title}"
        pb_t.font.name = "Calibri"
        pb_t.font.size = Pt(10)
        pb_t.font.bold = True
        pb_t.font.color.rgb = NAVY
        pb_t.space_after = Pt(2)

        pb_d = tf_rc4.add_paragraph()
        pb_d.text = b_desc
        pb_d.font.name = "Calibri"
        pb_d.font.size = Pt(9.5)
        pb_d.font.color.rgb = SLATE
        pb_d.space_after = Pt(10)

    s4.notes_slide.notes_text_frame.text = (
        "Phân hệ học viên chuẩn hóa chu trình học tập khép kín. "
        "Người học bắt buộc xem nội dung bài học qua Lesson Content Viewer trước khi trả lời bài tập. "
        "Các cơ chế làm lại có kiểm soát và nhảy cấp được mô hình hóa qua quan hệ mở rộng."
    )

    # ==========================================
    # SLIDE 5: CONTENT & ADMIN USE CASE DETAIL
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_editorial_header(s5, "Sơ Đồ Ca Sử Dụng Chi Tiết — Quản Trị & Kiểm Duyệt", "Quản trị & Kiểm duyệt", 5)

    # Diagram occupying 70% width: left = 0.8, top = 1.45, w = 8.0, h = 5.45
    place_diagram(s5, os.path.join(diagram_dir, "04-usecase-content-admin.png"), 0.8, 1.45, 8.0, 5.45)

    # Right Callout Card
    rc5 = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(9.05), Inches(1.45), Inches(3.48), Inches(5.45))
    rc5.fill.solid()
    rc5.fill.fore_color.rgb = CALLOUT_BG
    rc5.line.color.rgb = BORDER_SUBTLE
    rc5.line.width = Pt(1.0)

    tf_rc5 = rc5.text_frame
    tf_rc5.word_wrap = True
    tf_rc5.margin_left = tf_rc5.margin_right = Inches(0.2)
    tf_rc5.margin_top = Inches(0.2)

    p_rc5_h = tf_rc5.paragraphs[0]
    p_rc5_h.text = "NGUYÊN TẮC QUẢN TRỊ & SOD"
    p_rc5_h.font.name = "Calibri"
    p_rc5_h.font.size = Pt(11)
    p_rc5_h.font.bold = True
    p_rc5_h.font.color.rgb = NAVY
    p_rc5_h.space_after = Pt(12)

    bullets_s5 = [
        ("Phân tách SoD", "Creator soạn bài; Moderator thẩm định chất lượng; Org Manager xuất bản. Creator không tự duyệt bài của mình."),
        ("Kết quả thẩm định", "Moderator chỉ chuyển trạng thái APPROVED hoặc CHANGES_REQUESTED kèm ghi chú, không có quyền phát hành."),
        ("Quyền xuất bản", "Org Manager là tác nhân duy nhất có thẩm quyền xuất bản chính thức khi bài học đạt trạng thái APPROVED."),
        ("Can thiệp khẩn cấp", "Administrator chỉ xuất bản khẩn cấp cho bài đã APPROVED; bắt buộc giải trình lý do và ghi nhận AuditLog.")
    ]
    for b_title, b_desc in bullets_s5:
        pb_t = tf_rc5.add_paragraph()
        pb_t.text = f"• {b_title}"
        pb_t.font.name = "Calibri"
        pb_t.font.size = Pt(10)
        pb_t.font.bold = True
        pb_t.font.color.rgb = NAVY
        pb_t.space_after = Pt(2)

        pb_d = tf_rc5.add_paragraph()
        pb_d.text = b_desc
        pb_d.font.name = "Calibri"
        pb_d.font.size = Pt(9.5)
        pb_d.font.color.rgb = SLATE
        pb_d.space_after = Pt(10)

    s5.notes_slide.notes_text_frame.text = (
        "Phân hệ quản trị nội dung thực thi nghiêm ngặt nguyên tắc phân tách nhiệm vụ. "
        "Người soạn bài không có quyền tự phê duyệt hay xuất bản nội dung của mình. "
        "Administrator chỉ xuất bản khẩn cấp đối với bài đã qua phê duyệt và phải lưu vết kiểm toán."
    )

    # ==========================================
    # SLIDE 6: ACTIVITY PLACEMENT (Balanced Pairs + Takeaways)
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_editorial_header(s6, "Sơ Đồ Hoạt Động — Đánh Giá Chẩn Đoán Đầu Vào (Placement)", "Quy trình đánh giá", 6)

    # Diagram Pair: width 5.72 each, gap 0.29, height 4.2
    # Left diagram
    lt6 = s6.shapes.add_textbox(Inches(0.8), Inches(1.42), Inches(5.72), Inches(0.28))
    tf_lt6 = lt6.text_frame
    tf_lt6.word_wrap = False
    tf_lt6.margin_left = tf_lt6.margin_top = tf_lt6.margin_right = tf_lt6.margin_bottom = 0
    plt6 = tf_lt6.paragraphs[0]
    plt6.text = "Luồng Chẩn Đoán Tuyến Tính (30 Câu → Xác Định Starting Unit)"
    plt6.font.name = "Calibri"
    plt6.font.size = Pt(11)
    plt6.font.bold = True
    plt6.font.color.rgb = NAVY

    place_diagram(s6, os.path.join(diagram_dir, "05a-activity-placement-flow.png"), 0.8, 1.72, 5.72, 4.0)

    # Right diagram
    rt6 = s6.shapes.add_textbox(Inches(6.813), Inches(1.42), Inches(5.72), Inches(0.28))
    tf_rt6 = rt6.text_frame
    tf_rt6.word_wrap = False
    tf_rt6.margin_left = tf_rt6.margin_top = tf_rt6.margin_right = tf_rt6.margin_bottom = 0
    prt6 = tf_rt6.paragraphs[0]
    prt6.text = "Nhánh Bỏ Qua (Skip) & Nhánh Thi Lại (Retake)"
    prt6.font.name = "Calibri"
    prt6.font.size = Pt(11)
    prt6.font.bold = True
    prt6.font.color.rgb = NAVY

    place_diagram(s6, os.path.join(diagram_dir, "05b-activity-placement-branches.png"), 6.813, 1.72, 5.72, 4.0)

    # Bottom Takeaway Strip
    strip6 = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(5.85), Inches(11.733), Inches(1.15))
    strip6.fill.solid()
    strip6.fill.fore_color.rgb = CALLOUT_BG
    strip6.line.color.rgb = BORDER_SUBTLE
    strip6.line.width = Pt(1.0)

    tf_s6 = strip6.text_frame
    tf_s6.word_wrap = True
    tf_s6.margin_left = tf_s6.margin_right = Inches(0.2)
    tf_s6.margin_top = Inches(0.12)

    col_items_6 = [
        "Quy mô 30 câu & Mapping A: Đề thi 30 câu, thang điểm thô 0–30. Ánh xạ ra Starting Unit từ 1 đến 6 theo dải điểm chuẩn tắc.",
        "Nhánh Bỏ qua (Skip): Gán mặc định Unit 1 với trạng thái UNVERIFIED, không tạo bản ghi rác trong AssessmentResult hay SkillProfile.",
        "Nhánh Thi lại (Retake): Kích hoạt từ Profile, lưu bản ghi mới độc lập mà không ghi đè lịch sử bài thi trước đó."
    ]
    for i, it_text in enumerate(col_items_6):
        p = tf_s6.paragraphs[0] if i == 0 else tf_s6.add_paragraph()
        p.text = f"• {it_text}"
        p.font.name = "Calibri"
        p.font.size = Pt(9.5)
        p.font.color.rgb = SLATE
        p.space_after = Pt(2.5)

    s6.notes_slide.notes_text_frame.text = (
        "Quy trình đánh giá chẩn đoán đầu vào gồm 30 câu hỏi theo ma trận kiến thức phân tầng. "
        "Điểm số thô được ánh xạ qua Mapping A để xác định đơn vị học xuất phát. "
        "Trường hợp bỏ qua không tạo dữ liệu năng lực giả định, và thi lại sẽ lưu vết độc lập."
    )

    # ==========================================
    # SLIDE 7: ACTIVITY LEARNING FLOW
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_editorial_header(s7, "Sơ Đồ Hoạt Động — Chu Trình Học Bài & Làm Lại Có Kiểm Soát", "Quy trình học bài", 7)

    # Left diagram
    lt7 = s7.shapes.add_textbox(Inches(0.8), Inches(1.42), Inches(5.72), Inches(0.28))
    tf_lt7 = lt7.text_frame
    tf_lt7.word_wrap = False
    tf_lt7.margin_left = tf_lt7.margin_top = tf_lt7.margin_right = tf_lt7.margin_bottom = 0
    plt7 = tf_lt7.paragraphs[0]
    plt7.text = "Luồng Học Chính (Kiểm Tra 4/4 Published → Viewer → Bài Tập)"
    plt7.font.name = "Calibri"
    plt7.font.size = Pt(11)
    plt7.font.bold = True
    plt7.font.color.rgb = NAVY

    place_diagram(s7, os.path.join(diagram_dir, "06a-activity-learning-main.png"), 0.8, 1.72, 5.72, 4.0)

    # Right diagram
    rt7 = s7.shapes.add_textbox(Inches(6.813), Inches(1.42), Inches(5.72), Inches(0.28))
    tf_rt7 = rt7.text_frame
    tf_rt7.word_wrap = False
    tf_rt7.margin_left = tf_rt7.margin_top = tf_rt7.margin_right = tf_rt7.margin_bottom = 0
    prt7 = tf_rt7.paragraphs[0]
    prt7.text = "Luồng Làm Lại Có Kiểm Soát (Controlled Retry Flow)"
    prt7.font.name = "Calibri"
    prt7.font.size = Pt(11)
    prt7.font.bold = True
    prt7.font.color.rgb = NAVY

    place_diagram(s7, os.path.join(diagram_dir, "06b-activity-learning-retry.png"), 6.813, 1.72, 5.72, 4.0)

    # Bottom Takeaway Strip
    strip7 = s7.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(5.85), Inches(11.733), Inches(1.15))
    strip7.fill.solid()
    strip7.fill.fore_color.rgb = CALLOUT_BG
    strip7.line.color.rgb = BORDER_SUBTLE
    strip7.line.width = Pt(1.0)

    tf_s7 = strip7.text_frame
    tf_s7.word_wrap = True
    tf_s7.margin_left = tf_s7.margin_right = Inches(0.2)
    tf_s7.margin_top = Inches(0.12)

    col_items_7 = [
        "Điều kiện hiển thị: Unit chỉ mở khi đủ 4/4 Lesson Published. Học viên bắt buộc qua Lesson Content Viewer trước khi làm bài tập.",
        "Quy chế Retry: Sai khi retry quay lại Show Explanation; hết hạn mức báo 'No quota'; làm lại đúng ghi nhận <= 70% credit.",
        "Cập nhật nguyên tử [UC-07]: Hoàn thành bài học ghi nhận UserProgress, tăng Streak thuộc UC-07 và thêm thẻ SRS (1,3,7,14,30 ngày)."
    ]
    for i, it_text in enumerate(col_items_7):
        p = tf_s7.paragraphs[0] if i == 0 else tf_s7.add_paragraph()
        p.text = f"• {it_text}"
        p.font.name = "Calibri"
        p.font.size = Pt(9.5)
        p.font.color.rgb = SLATE
        p.space_after = Pt(2.5)

    s7.notes_slide.notes_text_frame.text = (
        "Chu trình học bài yêu cầu bài học thuộc Unit có đủ 4 trên 4 bài đã phát hành. "
        "Học viên tiếp thu kiến thức qua Viewer trước khi thực hiện bộ câu hỏi tương tác. "
        "Cơ chế làm lại giới hạn số lượt thử, hỗ trợ xem giải thích và khống chế trần điểm công nhận."
    )

    # ==========================================
    # SLIDE 8: ACTIVITY CONDITIONAL JUMP
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    add_editorial_header(s8, "Sơ Đồ Hoạt Động — Thử Thách Nhảy Cấp (Conditional Jump)", "Quy trình nhảy cấp", 8)

    # Left diagram
    lt8 = s8.shapes.add_textbox(Inches(0.8), Inches(1.42), Inches(5.72), Inches(0.28))
    tf_lt8 = lt8.text_frame
    tf_lt8.word_wrap = False
    tf_lt8.margin_left = tf_lt8.margin_top = tf_lt8.margin_right = tf_lt8.margin_bottom = 0
    plt8 = tf_lt8.paragraphs[0]
    plt8.text = "Kiểm Tra Cooldown 24h & Làm Bài Thi Jump"
    plt8.font.name = "Calibri"
    plt8.font.size = Pt(11)
    plt8.font.bold = True
    plt8.font.color.rgb = NAVY

    place_diagram(s8, os.path.join(diagram_dir, "07a-activity-jump-check.png"), 0.8, 1.72, 5.72, 4.0)

    # Right diagram
    rt8 = s8.shapes.add_textbox(Inches(6.813), Inches(1.42), Inches(5.72), Inches(0.28))
    tf_rt8 = rt8.text_frame
    tf_rt8.word_wrap = False
    tf_rt8.margin_left = tf_rt8.margin_top = tf_rt8.margin_right = tf_rt8.margin_bottom = 0
    prt8 = tf_rt8.paragraphs[0]
    prt8.text = "Xử Lý Kết Quả: Vượt Cấp (Đỗ >= 95%) vs Khóa Phạt 24h"
    prt8.font.name = "Calibri"
    prt8.font.size = Pt(11)
    prt8.font.bold = True
    prt8.font.color.rgb = NAVY

    place_diagram(s8, os.path.join(diagram_dir, "07b-activity-jump-result.png"), 6.813, 1.72, 5.72, 4.0)

    # Bottom Takeaway Strip
    strip8 = s8.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(5.85), Inches(11.733), Inches(1.15))
    strip8.fill.solid()
    strip8.fill.fore_color.rgb = CALLOUT_BG
    strip8.line.color.rgb = BORDER_SUBTLE
    strip8.line.width = Pt(1.0)

    tf_s8 = strip8.text_frame
    tf_s8.word_wrap = True
    tf_s8.margin_left = tf_s8.margin_right = Inches(0.2)
    tf_s8.margin_top = Inches(0.12)

    col_items_8 = [
        "Kiểm tra Cooldown: Chặn làm bài nếu đang trong thời gian phạt Cooldown 24 giờ sau lần thi trượt gần nhất.",
        "Quy mô đề Jump: 20 câu (nhảy 1 Unit), 25–30 câu (nhảy 2–3 Units), hoặc 40 câu (nhảy hơn 3 Units).",
        "Xử lý kết quả: Đạt >= 95% gán SKIPPED_BY_JUMP (by_jump = true) cho nội dung vượt qua; trượt khóa 24 giờ."
    ]
    for i, it_text in enumerate(col_items_8):
        p = tf_s8.paragraphs[0] if i == 0 else tf_s8.add_paragraph()
        p.text = f"• {it_text}"
        p.font.name = "Calibri"
        p.font.size = Pt(9.5)
        p.font.color.rgb = SLATE
        p.space_after = Pt(2.5)

    s8.notes_slide.notes_text_frame.text = (
        "Thử thách nhảy cấp cho phép người học bỏ qua nội dung đã nắm vững. "
        "Quy mô bài thi tương ứng với số lượng bài học cần vượt qua và có ngưỡng đạt 95%. "
        "Nội dung bỏ qua được đánh dấu xuất xứ rõ ràng và lần thi không đạt sẽ kích hoạt thời gian chờ."
    )

    # ==========================================
    # SLIDE 9: ACTIVITY GOVERNANCE & LIFECYCLE
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9)
    add_editorial_header(s9, "Sơ Đồ Hoạt Động — Quản Trị & Xuất Bản Nội Dung", "Quy trình nội dung", 9)

    # Left diagram
    lt9 = s9.shapes.add_textbox(Inches(0.8), Inches(1.42), Inches(5.72), Inches(0.28))
    tf_lt9 = lt9.text_frame
    tf_lt9.word_wrap = False
    tf_lt9.margin_left = tf_lt9.margin_top = tf_lt9.margin_right = tf_lt9.margin_bottom = 0
    plt9 = tf_lt9.paragraphs[0]
    plt9.text = "Quy Trình Phê Duyệt & Xuất Bản Chính Thức"
    plt9.font.name = "Calibri"
    plt9.font.size = Pt(11)
    plt9.font.bold = True
    plt9.font.color.rgb = NAVY

    place_diagram(s9, os.path.join(diagram_dir, "08a-activity-governance-main.png"), 0.8, 1.72, 5.72, 4.0)

    # Right diagram
    rt9 = s9.shapes.add_textbox(Inches(6.813), Inches(1.42), Inches(5.72), Inches(0.28))
    tf_rt9 = rt9.text_frame
    tf_rt9.word_wrap = False
    tf_rt9.margin_left = tf_rt9.margin_top = tf_rt9.margin_right = tf_rt9.margin_bottom = 0
    prt9 = tf_rt9.paragraphs[0]
    prt9.text = "Cơ Chế Clone-to-Draft v2 & Xuất Bản Khẩn Cấp"
    prt9.font.name = "Calibri"
    prt9.font.size = Pt(11)
    prt9.font.bold = True
    prt9.font.color.rgb = NAVY

    place_diagram(s9, os.path.join(diagram_dir, "08b-activity-governance-branches.png"), 6.813, 1.72, 5.72, 4.0)

    # Bottom Takeaway Strip
    strip9 = s9.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(5.85), Inches(11.733), Inches(1.15))
    strip9.fill.solid()
    strip9.fill.fore_color.rgb = CALLOUT_BG
    strip9.line.color.rgb = BORDER_SUBTLE
    strip9.line.width = Pt(1.0)

    tf_s9 = strip9.text_frame
    tf_s9.word_wrap = True
    tf_s9.margin_left = tf_s9.margin_right = Inches(0.2)
    tf_s9.margin_top = Inches(0.12)

    col_items_9 = [
        "Phê duyệt độc lập: Moderator chuyển APPROVED hoặc CHANGES_REQUESTED kèm ghi chú chi tiết, không dùng REJECTED.",
        "Quyền xuất bản: Org Manager là tác nhân thẩm quyền duy nhất thực hiện Publish sau khi học liệu đã Approved.",
        "Clone-to-Draft v2 & Emergency: Sửa bài đã xuất bản tạo bản v2 và bắt buộc Archive v1 sau khi Publish v2; Admin xuất bản có AuditLog."
    ]
    for i, it_text in enumerate(col_items_9):
        p = tf_s9.paragraphs[0] if i == 0 else tf_s9.add_paragraph()
        p.text = f"• {it_text}"
        p.font.name = "Calibri"
        p.font.size = Pt(9.5)
        p.font.color.rgb = SLATE
        p.space_after = Pt(2.5)

    s9.notes_slide.notes_text_frame.text = (
        "Quy trình quản trị học liệu kết hợp thẩm định sư phạm và lưu vết lịch sử. "
        "Moderator chỉ chuyển trạng thái duyệt hoặc yêu cầu chỉnh sửa mà không xuất bản bài học. "
        "Cơ chế nhân bản bản nháp giúp bảo toàn phiên bản đang phát hành cho người học."
    )

    # ==========================================
    # SLIDE 10: CLASS CONTENT MODEL
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10)
    add_editorial_header(s10, "Sơ Đồ Lớp — Cấu Trúc Nội Dung & Khóa Học", "Mô hình cấu trúc", 10)

    # Diagram occupying 70% width: left = 0.8, top = 1.45, w = 8.0, h = 5.45
    place_diagram(s10, os.path.join(diagram_dir, "09-class-content.png"), 0.8, 1.45, 8.0, 5.45)

    # Right Callout Card
    rc10 = s10.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(9.05), Inches(1.45), Inches(3.48), Inches(5.45))
    rc10.fill.solid()
    rc10.fill.fore_color.rgb = CALLOUT_BG
    rc10.line.color.rgb = BORDER_SUBTLE
    rc10.line.width = Pt(1.0)

    tf_rc10 = rc10.text_frame
    tf_rc10.word_wrap = True
    tf_rc10.margin_left = tf_rc10.margin_right = Inches(0.2)
    tf_rc10.margin_top = Inches(0.2)

    p_rc10_h = tf_rc10.paragraphs[0]
    p_rc10_h.text = "ĐẶC TẢ LỚP NỘI DUNG"
    p_rc10_h.font.name = "Calibri"
    p_rc10_h.font.size = Pt(11)
    p_rc10_h.font.bold = True
    p_rc10_h.font.color.rgb = NAVY
    p_rc10_h.space_after = Pt(12)

    bullets_s10 = [
        ("Ký hiệu CURRENT vs TARGET", "Phân định trực quan bằng nét vẽ: nét liền cho thực thể CURRENT (schema.prisma) và nét đứt cho TARGET (Phase 2)."),
        ("Vòng đời 6 trạng thái", "LessonRevision quản lý đầy đủ 6 trạng thái vòng đời: DRAFT, IN_REVIEW, CHANGES_REQUESTED, APPROVED, PUBLISHED, ARCHIVED."),
        ("Exercise thuộc Revision", "Exercise liên kết trực tiếp với LessonRevision; khóa ngoại cũ lesson_id giữ nhãn [CURRENT] để bảo toàn tính lịch sử."),
        ("Ràng buộc hiển thị Unit", "Gắn ghi chú ràng buộc {Unit hiển thị khi đủ 4/4 Lesson Published} nhằm bảo đảm tính trọn vẹn chương trình.")
    ]
    for b_title, b_desc in bullets_s10:
        pb_t = tf_rc10.add_paragraph()
        pb_t.text = f"• {b_title}"
        pb_t.font.name = "Calibri"
        pb_t.font.size = Pt(10)
        pb_t.font.bold = True
        pb_t.font.color.rgb = NAVY
        pb_t.space_after = Pt(2)

        pb_d = tf_rc10.add_paragraph()
        pb_d.text = b_desc
        pb_d.font.name = "Calibri"
        pb_d.font.size = Pt(9.5)
        pb_d.font.color.rgb = SLATE
        pb_d.space_after = Pt(10)

    s10.notes_slide.notes_text_frame.text = (
        "Sơ đồ lớp nội dung phân tách giữa bảng dữ liệu hiện tại và mô hình quản lý phiên bản mục tiêu. "
        "Thực thể LessonRevision hỗ trợ theo dõi vòng đời hoàn chỉnh của bài học. "
        "Quan hệ giữa bài học và bài tập bảo đảm tính toàn vẹn tham chiếu của chương trình học."
    )

    # ==========================================
    # SLIDE 11: CLASS LEARNER ASSESSMENT MODEL
    # ==========================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11)
    add_editorial_header(s11, "Sơ Đồ Lớp — Học Viên, Đánh Giá & Tiến Độ", "Mô hình học viên", 11)

    # Diagram occupying 70% width: left = 0.8, top = 1.45, w = 8.0, h = 5.45
    place_diagram(s11, os.path.join(diagram_dir, "10-class-learner-assessment.png"), 0.8, 1.45, 8.0, 5.45)

    # Right Callout Card
    rc11 = s11.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(9.05), Inches(1.45), Inches(3.48), Inches(5.45))
    rc11.fill.solid()
    rc11.fill.fore_color.rgb = CALLOUT_BG
    rc11.line.color.rgb = BORDER_SUBTLE
    rc11.line.width = Pt(1.0)

    tf_rc11 = rc11.text_frame
    tf_rc11.word_wrap = True
    tf_rc11.margin_left = tf_rc11.margin_right = Inches(0.2)
    tf_rc11.margin_top = Inches(0.2)

    p_rc11_h = tf_rc11.paragraphs[0]
    p_rc11_h.text = "BẤT BIẾN DỮ LIỆU HỌC VIÊN"
    p_rc11_h.font.name = "Calibri"
    p_rc11_h.font.size = Pt(11)
    p_rc11_h.font.bold = True
    p_rc11_h.font.color.rgb = NAVY
    p_rc11_h.space_after = Pt(12)

    bullets_s11 = [
        ("Tiến độ ≠ Năng lực", "Tách bạch tuyệt đối UserProgress (tiến độ hoàn thành tuyến tính) khỏi SkillProfile (năng lực đa chiều qua AssessmentResult)."),
        ("SRS tất định Policy B", "UserVocabSrs và ReviewLog thực thi chu kỳ ngày cố định 1, 3, 7, 14, 30 ngày; sai lập tức reset về mốc 1 ngày."),
        ("Ghi chú trạng thái State", "Các thuộc tính Retry usage và Jump cooldown 24h được mô hình hóa dưới dạng ghi chú logic gắn vào UserProgress."),
        ("Kiểm toán an ninh", "Mọi thay đổi vai trò hay can thiệp đặc quyền đều kích hoạt tạo bản ghi bất biến trong AuditLog.")
    ]
    for b_title, b_desc in bullets_s11:
        pb_t = tf_rc11.add_paragraph()
        pb_t.text = f"• {b_title}"
        pb_t.font.name = "Calibri"
        pb_t.font.size = Pt(10)
        pb_t.font.bold = True
        pb_t.font.color.rgb = NAVY
        pb_t.space_after = Pt(2)

        pb_d = tf_rc11.add_paragraph()
        pb_d.text = b_desc
        pb_d.font.name = "Calibri"
        pb_d.font.size = Pt(9.5)
        pb_d.font.color.rgb = SLATE
        pb_d.space_after = Pt(10)

    s11.notes_slide.notes_text_frame.text = (
        "Sơ đồ lớp phân hệ học viên thể hiện nguyên tắc tách biệt giữa tiến độ học và hồ sơ năng lực. "
        "Dữ liệu ôn tập từ vựng ngắt quãng được quản lý theo chu kỳ ngày cố định của Policy B. "
        "Các thông tin trạng thái về làm lại bài và thời gian chờ nhảy cấp gắn liền với tiến trình học tập."
    )

    # ==========================================
    # SLIDE 12: TRACEABILITY MATRIX (Refined Typography)
    # ==========================================
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_background(s12)
    add_editorial_header(s12, "Ma Trận Truy Vết Nghiệp Vụ Toàn Diện (Traceability Matrix)", "Truy vết yêu cầu", 12)

    rows = 16
    cols = 5
    table_shape = s12.shapes.add_table(rows, cols, Inches(0.8), Inches(1.45), Inches(11.733), Inches(5.15))
    table = table_shape.table
    table.columns[0].width = Inches(1.0)
    table.columns[1].width = Inches(3.6)
    table.columns[2].width = Inches(2.2)
    table.columns[3].width = Inches(2.7)
    table.columns[4].width = Inches(2.233)

    headers = ["UC ID", "Tên Ca Sử Dụng Chuẩn Tắc", "Sơ Đồ Hoạt Động", "Lớp Dữ Liệu", "Phạm Vi Triển Khai"]
    for j, h in enumerate(headers):
        cell = table.cell(0, j)
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY
        cell.margin_top = cell.margin_bottom = Inches(0.04)
        cell.margin_left = cell.margin_right = Inches(0.08)
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.name = "Calibri"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = RGBColor(255, 255, 255)
        p.alignment = PP_ALIGN.CENTER

    matrix_data = [
        ("UC-01", "Authenticate & Manage Session", "—", "Profile, Role", "CORE (Phase 2 MVP)"),
        ("UC-02", "Configure Goals & Study Time", "—", "Profile", "CORE (Phase 2 MVP)"),
        ("UC-03", "Take Placement Test", "Slide 6 (Diagnostic Test)", "AssessmentResult, SkillProfile", "CORE (Phase 2 MVP)"),
        ("UC-04", "Browse Learning Path & Conditional Jump", "Slide 8 (Conditional Jump)", "Course, Unit, Lesson, UserProgress", "CORE (Phase 2 MVP)"),
        ("UC-05", "Complete Lesson Exercises & Controlled Retry", "Slide 7 (Learning & Retry)", "Lesson, Exercise, UserProgress", "CORE (Phase 2 MVP)"),
        ("UC-06", "Spaced Repetition Review (SRS)", "—", "Vocabulary, UserVocabSrs, ReviewLog", "CORE (Phase 2 MVP)"),
        ("UC-07", "Track Progress, Mastery & Streak", "Slide 7 (Streak Update)", "Profile, UserProgress", "CORE (Phase 2 MVP)"),
        ("UC-08", "Create & Edit Lesson Draft", "Slide 9 (Governance & Clone)", "Lesson, LessonRevision, Exercise", "CORE (Phase 2 MVP)"),
        ("UC-09", "Review & Moderate Content", "Slide 9 (Moderator Review)", "LessonRevision, AuditLog", "CORE (Phase 2 MVP)"),
        ("UC-10", "Publish Approved Content", "Slide 9 (Publication Flow)", "Unit, Lesson, LessonRevision, AuditLog", "CORE (Phase 2 MVP)"),
        ("UC-11", "Manage Accounts & Roles", "—", "Profile, Role, AuditLog", "CORE (Phase 2 MVP)"),
        ("UC-12", "View System Reports", "—", "UserProgress, AuditLog", "CORE (Phase 2 MVP)"),
        ("UC-13", "View & Audit Security Logs", "—", "AuditLog", "CORE (Phase 2 MVP)"),
        ("UC-14", "Handle Support Tickets", "—", "—", "MVP (Điều phối hỗ trợ)"),
        ("UC-15", "Manage Cohorts & Group Progress", "—", "—", "FUTURE EXTENSION")
    ]

    for i, row in enumerate(matrix_data):
        for j, val in enumerate(row):
            cell = table.cell(i + 1, j)
            cell.fill.solid()
            # Very subtle zebra striping
            cell.fill.fore_color.rgb = RGBColor(248, 249, 250) if i % 2 == 1 else RGBColor(255, 255, 255)
            cell.margin_top = cell.margin_bottom = Inches(0.02)
            cell.margin_left = cell.margin_right = Inches(0.06)
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = "Calibri"
            p.font.size = Pt(10.5)
            
            if j == 0:
                p.font.bold = True
                p.alignment = PP_ALIGN.CENTER
                p.font.color.rgb = ACCENT_BLUE
            elif j == 2 and val != "—":
                p.font.bold = True
                p.font.color.rgb = ACCENT_GREEN
            elif j == 4:
                p.font.bold = True
                p.alignment = PP_ALIGN.CENTER
                if "FUTURE" in val:
                    p.font.color.rgb = MUTED
                elif "MVP" in val and "hỗ trợ" in val:
                    p.font.color.rgb = RGBColor(13, 148, 136)
                else:
                    p.font.color.rgb = ACCENT_GREEN
            else:
                p.font.color.rgb = SLATE

    # Explanatory footnote
    fn_box = s12.shapes.add_textbox(Inches(0.8), Inches(6.68), Inches(11.733), Inches(0.35))
    tf_fn = fn_box.text_frame
    tf_fn.word_wrap = True
    tf_fn.margin_left = tf_fn.margin_top = tf_fn.margin_right = tf_fn.margin_bottom = 0
    pfn = tf_fn.paragraphs[0]
    pfn.text = "Ghi chú: Cột Sơ đồ hoạt động chỉ dẫn chiếu tới các slide có biểu đồ thực tế trong tài liệu; các Use Case còn lại đánh dấu '—'. UC-14 và UC-15 không ánh xạ lớp thực thể nội bộ."
    pfn.font.name = "Calibri"
    pfn.font.size = Pt(10)
    pfn.font.color.rgb = MUTED

    s12.notes_slide.notes_text_frame.text = (
        "Ma trận truy vết bảo đảm tính liên kết giữa các ca sử dụng với biểu đồ hoạt động và cấu trúc dữ liệu. "
        "Các ca sử dụng có biểu đồ hoạt động trong bài trình bày được dẫn chiếu trực tiếp đến số slide tương ứng. "
        "Phân định rõ ràng phạm vi triển khai cốt lõi MVP và các thành phần mở rộng trong tương lai."
    )

    prs.save(output_pptx)
    print(f"Presentation v7 successfully built and saved to: {output_pptx}")

if __name__ == "__main__":
    build_deck_v7()
