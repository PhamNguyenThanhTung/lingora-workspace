import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
from PIL import Image

def build_deck_v5():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Theme Colors
    NAVY = RGBColor(15, 23, 42)          # #0F172A
    SLATE = RGBColor(71, 85, 105)        # #475569
    MUTED = RGBColor(100, 116, 139)      # #64748B
    LIGHT_BG = RGBColor(248, 250, 252)   # #F8FAFC
    WHITE = RGBColor(255, 255, 255)
    BORDER_LIGHT = RGBColor(226, 232, 240) # #E2E8F0
    BORDER_CARD = RGBColor(203, 213, 225)  # #CBD5E1

    # Eyebrow category colors
    EYEBROW_COLORS = {
        "USE CASE": RGBColor(2, 132, 199),      # Sky
        "ACTIVITY": RGBColor(16, 185, 129),     # Emerald
        "CLASS": RGBColor(139, 92, 246),        # Purple
        "TRACEABILITY": RGBColor(245, 158, 11), # Amber
        "OVERVIEW": RGBColor(2, 132, 199)
    }

    # Canonical Role Chips
    ROLE_DEFS = [
        ("Learner", RGBColor(37, 99, 235)),             # Blue
        ("Lesson Creator", RGBColor(234, 88, 12)),      # Orange
        ("Moderator", RGBColor(22, 163, 74)),           # Green
        ("Org Manager", RGBColor(124, 58, 237)),        # Purple
        ("Operations Staff", RGBColor(13, 148, 136)),   # Teal
        ("Administrator", RGBColor(159, 18, 57))        # Wine / Crimson
    ]

    diagram_dir = "docs/diagrams/lingora-modeling/out"
    output_pptx = "docs/diagrams/lingora-modeling/deck/Lingora-System-Modeling-Presentation-v5.pptx"

    def apply_slide_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = LIGHT_BG
        bg.line.fill.background()
        return bg

    def add_slide_header(slide, title_text, category_key, slide_num=None):
        # Header text
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.35), Inches(11.0), Inches(0.85))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        eyebrow_col = EYEBROW_COLORS.get(category_key.upper(), RGBColor(2, 132, 199))

        p0 = tf.paragraphs[0]
        p0.text = category_key.upper()
        p0.font.name = "Segoe UI"
        p0.font.size = Pt(9.5)
        p0.font.bold = True
        p0.font.color.rgb = eyebrow_col
        p0.space_after = Pt(2)

        p1 = tf.add_paragraph()
        p1.text = title_text
        p1.font.name = "Segoe UI"
        p1.font.size = Pt(18)
        p1.font.bold = True
        p1.font.color.rgb = NAVY

        # Slide Number in top right
        if slide_num is not None:
            num_box = slide.shapes.add_textbox(Inches(11.8), Inches(0.35), Inches(0.733), Inches(0.4))
            tf_num = num_box.text_frame
            tf_num.word_wrap = False
            tf_num.margin_left = tf_num.margin_top = tf_num.margin_right = tf_num.margin_bottom = 0
            pn = tf_num.paragraphs[0]
            pn.text = f"{slide_num:02d} / 12"
            pn.font.name = "Segoe UI"
            pn.font.size = Pt(11)
            pn.font.bold = True
            pn.font.color.rgb = MUTED
            pn.alignment = PP_ALIGN.RIGHT

    def add_footer_role_chips(slide, active_roles=None, y_pos=6.85):
        # 6 actor role chips at footer
        chip_w = Inches(1.82)
        chip_h = Inches(0.32)
        start_x = Inches(0.8)
        gap = Inches(0.16)

        for i, (r_name, r_col) in enumerate(ROLE_DEFS):
            cx = start_x + i * (chip_w + gap)
            is_active = (active_roles is None) or (r_name in active_roles)
            chip = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, Inches(y_pos), chip_w, chip_h)
            chip.fill.solid()
            chip.fill.fore_color.rgb = WHITE if is_active else RGBColor(241, 245, 249)
            chip.line.color.rgb = r_col if is_active else RGBColor(203, 213, 225)
            chip.line.width = Pt(1.2 if is_active else 0.8)

            tf = chip.text_frame
            tf.word_wrap = False
            tf.margin_top = Inches(0.04)
            tf.margin_bottom = Inches(0.02)
            tf.margin_left = Inches(0.05)
            tf.margin_right = Inches(0.05)
            p = tf.paragraphs[0]
            p.text = r_name
            p.font.name = "Segoe UI"
            p.font.size = Pt(8.5)
            p.font.bold = is_active
            p.font.color.rgb = r_col if is_active else RGBColor(148, 163, 184)
            p.alignment = PP_ALIGN.CENTER

    def add_single_diagram_slide(slide, title, category, img_path, bullets, notes_text="", active_roles=None, slide_num=None):
        apply_slide_bg(slide)
        add_slide_header(slide, title, category, slide_num)
        add_footer_role_chips(slide, active_roles, y_pos=6.92)

        # Left Card (Diagram): 66% width
        card_x = Inches(0.8)
        card_y = Inches(1.25)
        card_w = Inches(7.8)
        card_h = Inches(5.45)

        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, card_x, card_y, card_w, card_h)
        card.fill.solid()
        card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = BORDER_LIGHT
        card.line.width = Pt(1.0)

        # Place image inside card with padding
        pad = 0.15
        max_img_w = 7.8 - 2 * pad
        max_img_h = 5.45 - 2 * pad

        if os.path.exists(img_path):
            with Image.open(img_path) as im:
                iw, ih = im.size
            scale = min(max_img_w / iw, max_img_h / ih)
            fw = iw * scale
            fh = ih * scale
            fx = 0.8 + pad + (max_img_w - fw) / 2
            fy = 1.25 + pad + (max_img_h - fh) / 2
            slide.shapes.add_picture(img_path, Inches(fx), Inches(fy), width=Inches(fw), height=Inches(fh))

        # Right Card (Ý chính): 30% width
        rc_x = Inches(8.8)
        rc_y = Inches(1.25)
        rc_w = Inches(3.733)
        rc_h = Inches(5.45)

        rcard = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, rc_x, rc_y, rc_w, rc_h)
        rcard.fill.solid()
        rcard.fill.fore_color.rgb = WHITE
        rcard.line.color.rgb = BORDER_LIGHT
        rcard.line.width = Pt(1.0)

        tf_r = rcard.text_frame
        tf_r.word_wrap = True
        tf_r.margin_left = tf_r.margin_right = Inches(0.25)
        tf_r.margin_top = Inches(0.25)

        p_rh = tf_r.paragraphs[0]
        p_rh.text = "Ý CHÍNH NGHIỆP VỤ"
        p_rh.font.name = "Segoe UI"
        p_rh.font.size = Pt(11)
        p_rh.font.bold = True
        p_rh.font.color.rgb = NAVY
        p_rh.space_after = Pt(12)

        for b_title, b_desc in bullets:
            pb_t = tf_r.add_paragraph()
            pb_t.text = f"• {b_title}"
            pb_t.font.name = "Segoe UI"
            pb_t.font.size = Pt(9.5)
            pb_t.font.bold = True
            pb_t.font.color.rgb = RGBColor(2, 132, 199)
            pb_t.space_after = Pt(2)

            pb_d = tf_r.add_paragraph()
            pb_d.text = b_desc
            pb_d.font.name = "Segoe UI"
            pb_d.font.size = Pt(9)
            pb_d.font.color.rgb = SLATE
            pb_d.space_after = Pt(8)

        if notes_text:
            slide.notes_slide.notes_text_frame.text = notes_text

    def add_split_activity_slide(slide, title, category, left_info, right_info, bullets, notes_text="", active_roles=None, slide_num=None):
        apply_slide_bg(slide)
        add_slide_header(slide, title, category, slide_num)
        add_footer_role_chips(slide, active_roles, y_pos=7.02)

        # Upper row: 2 side-by-side cards for diagrams
        # Heights: cards top=1.22, height=4.2. Bottom bullet strip top=5.52, height=1.35
        card_y = Inches(1.22)
        card_h = Inches(4.2)
        card_w = Inches(5.72)
        pad = 0.12

        # Left Card
        lc_x = Inches(0.8)
        l_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, lc_x, card_y, card_w, card_h)
        l_card.fill.solid()
        l_card.fill.fore_color.rgb = WHITE
        l_card.line.color.rgb = BORDER_LIGHT
        l_card.line.width = Pt(1.0)

        # Left Subtitle header
        l_title_box = slide.shapes.add_textbox(lc_x + Inches(0.15), card_y + Inches(0.08), card_w - Inches(0.3), Inches(0.3))
        tf_lt = l_title_box.text_frame
        tf_lt.word_wrap = False
        tf_lt.margin_left = tf_lt.margin_top = tf_lt.margin_right = tf_lt.margin_bottom = 0
        p_lt = tf_lt.paragraphs[0]
        p_lt.text = left_info["title"]
        p_lt.font.name = "Segoe UI"
        p_lt.font.size = Pt(10)
        p_lt.font.bold = True
        p_lt.font.color.rgb = NAVY

        # Left Image
        l_img_path = left_info["img"]
        if os.path.exists(l_img_path):
            with Image.open(l_img_path) as im:
                iw, ih = im.size
            max_w = 5.72 - 2 * pad
            max_h = 4.2 - 0.4 - pad
            scale = min(max_w / iw, max_h / ih)
            fw = iw * scale
            fh = ih * scale
            fx = 0.8 + pad + (max_w - fw) / 2
            fy = 1.22 + 0.38 + (max_h - fh) / 2
            slide.shapes.add_picture(l_img_path, Inches(fx), Inches(fy), width=Inches(fw), height=Inches(fh))

        # Right Card
        rc_x = Inches(6.813)
        r_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, rc_x, card_y, card_w, card_h)
        r_card.fill.solid()
        r_card.fill.fore_color.rgb = WHITE
        r_card.line.color.rgb = BORDER_LIGHT
        r_card.line.width = Pt(1.0)

        # Right Subtitle header
        r_title_box = slide.shapes.add_textbox(rc_x + Inches(0.15), card_y + Inches(0.08), card_w - Inches(0.3), Inches(0.3))
        tf_rt = r_title_box.text_frame
        tf_rt.word_wrap = False
        tf_rt.margin_left = tf_rt.margin_top = tf_rt.margin_right = tf_rt.margin_bottom = 0
        p_rt = tf_rt.paragraphs[0]
        p_rt.text = right_info["title"]
        p_rt.font.name = "Segoe UI"
        p_rt.font.size = Pt(10)
        p_rt.font.bold = True
        p_rt.font.color.rgb = NAVY

        # Right Image
        r_img_path = right_info["img"]
        if os.path.exists(r_img_path):
            with Image.open(r_img_path) as im:
                iw, ih = im.size
            max_w = 5.72 - 2 * pad
            max_h = 4.2 - 0.4 - pad
            scale = min(max_w / iw, max_h / ih)
            fw = iw * scale
            fh = ih * scale
            fx = 6.813 + pad + (max_w - fw) / 2
            fy = 1.22 + 0.38 + (max_h - fh) / 2
            slide.shapes.add_picture(r_img_path, Inches(fx), Inches(fy), width=Inches(fw), height=Inches(fh))

        # Bottom Ý chính Card: Full width strip
        bc_x = Inches(0.8)
        bc_y = Inches(5.52)
        bc_w = Inches(11.733)
        bc_h = Inches(1.38)

        b_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, bc_x, bc_y, bc_w, bc_h)
        b_card.fill.solid()
        b_card.fill.fore_color.rgb = WHITE
        b_card.line.color.rgb = BORDER_LIGHT
        b_card.line.width = Pt(1.0)

        tf_bc = b_card.text_frame
        tf_bc.word_wrap = True
        tf_bc.margin_left = tf_bc.margin_right = Inches(0.2)
        tf_bc.margin_top = Inches(0.12)
        tf_bc.margin_bottom = Inches(0.08)

        p_bh = tf_bc.paragraphs[0]
        p_bh.text = "Ý CHÍNH NGHIỆP VỤ & QUY TẮC RÀNG BUỘC"
        p_bh.font.name = "Segoe UI"
        p_bh.font.size = Pt(9.5)
        p_bh.font.bold = True
        p_bh.font.color.rgb = NAVY
        p_bh.space_after = Pt(4)

        # 3 or 4 columns within bottom card or a compact bullet sequence
        for b_title, b_desc in bullets:
            p_item = tf_bc.add_paragraph()
            p_item.text = f"• {b_title}: {b_desc}"
            p_item.font.name = "Segoe UI"
            p_item.font.size = Pt(8.8)
            p_item.font.color.rgb = SLATE
            p_item.space_after = Pt(2)

        if notes_text:
            slide.notes_slide.notes_text_frame.text = notes_text

    # ==========================================
    # SLIDE 1: COVER
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(s1)

    c_box = s1.shapes.add_textbox(Inches(1.2), Inches(1.8), Inches(10.933), Inches(3.8))
    tf1 = c_box.text_frame
    tf1.word_wrap = True

    p0 = tf1.paragraphs[0]
    p0.text = "LINGORA PLATFORM"
    p0.font.name = "Segoe UI"
    p0.font.size = Pt(15)
    p0.font.bold = True
    p0.font.color.rgb = RGBColor(2, 132, 199)
    p0.space_after = Pt(12)

    p1 = tf1.add_paragraph()
    p1.text = "Phân Tích & Mô Hình Hóa Hệ Thống\nNền Tảng Học Ngoại Ngữ Trực Tuyến"
    p1.font.name = "Segoe UI"
    p1.font.size = Pt(30)
    p1.font.bold = True
    p1.font.color.rgb = NAVY
    p1.space_after = Pt(16)

    p2 = tf1.add_paragraph()
    p2.text = "Use Case Diagram · Activity Diagram · Class Diagram · Traceability Matrix"
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(15)
    p2.font.color.rgb = SLATE
    p2.space_after = Pt(28)

    p3 = tf1.add_paragraph()
    p3.text = "Báo cáo Chuyên đề Kỹ thuật Phần mềm — Thiết kế Hệ thống Lingora"
    p3.font.name = "Segoe UI"
    p3.font.size = Pt(12)
    p3.font.color.rgb = RGBColor(148, 163, 184)

    # Clean Cover Footnote chips
    add_footer_role_chips(s1, y_pos=6.8)

    s1.notes_slide.notes_text_frame.text = (
        "Kính chào Thầy Cô và Hội đồng. Bài báo cáo này tập trung vào phân tích và mô hình hóa hệ thống Lingora "
        "dưới các góc nhìn chuẩn mực của Kỹ thuật Phần mềm: Ca sử dụng (Use Case), Sơ đồ hoạt động (Activity Diagram), "
        "Sơ đồ lớp (Class Diagram) và Ma trận truy vết (Traceability Matrix). Toàn bộ mô hình tuân thủ tuyệt đối "
        "các nguyên tắc thiết kế bất biến và kiến trúc đã được thẩm định."
    )

    # ==========================================
    # SLIDE 2: OVERVIEW
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(s2)
    add_slide_header(s2, "Tổng Quan Kiến Trúc Nghiệp Vụ & Ranh Giới Vai Trò", "OVERVIEW", 2)
    add_footer_role_chips(s2, y_pos=6.92)

    # 3 Packages Cards
    pkg_w = Inches(3.75)
    pkg_h = Inches(4.35)
    pkg_y = Inches(1.25)
    pkgs = [
        ("LEARNING PACKAGE", "Phân hệ Học tập Cốt lõi", [
            ("Xác thực & Phiên (UC-01)", "Đăng ký, đăng nhập và quản lý phiên."),
            ("Mục tiêu học (UC-02)", "Thiết lập thời lượng và mục tiêu ngày."),
            ("Chẩn đoán đầu vào (UC-03)", "30 câu hỏi, xác định starting point."),
            ("Lộ trình học (UC-04)", "Duyệt cây bài học, thử thách Jump."),
            ("Bài học & Bài tập (UC-05)", "Viewer lý thuyết trước, bài tập sau."),
            ("Ôn tập SRS (UC-06)", "Lặp lại ngắt quãng củng cố từ vựng."),
            ("Tiến độ & Streak (UC-07)", "Theo dõi chuỗi ngày và hoàn thành.")
        ], RGBColor(239, 246, 255), RGBColor(37, 99, 235)),
        ("CONTENT PACKAGE", "Phân hệ Quản trị Nội dung", [
            ("Soạn thảo bài học (UC-08)", "Tạo dự thảo và bộ bài tập tương tác."),
            ("Kiểm duyệt nội dung (UC-09)", "Phê duyệt hoặc phản hồi yêu cầu sửa."),
            ("Xuất bản nội dung (UC-10)", "Kích hoạt hiển thị cho toàn hệ thống."),
            ("Quy trình Clone-to-Draft", "Bản sửa đổi độc lập, bảo toàn lịch sử."),
            ("Điều kiện đóng băng Unit", "Đủ 4/4 bài học xuất bản mới mở Unit."),
            ("Phân tách SoD nghiêm ngặt", "Creator không tự duyệt bài của mình."),
            ("Xuất bản khẩn cấp (Admin)", "Can thiệp trực tiếp có ghi AuditLog.")
        ], RGBColor(255, 247, 237), RGBColor(234, 88, 12)),
        ("ADMIN & SUPPORT", "Phân hệ Vận hành & Hệ thống", [
            ("Quản lý tài khoản (UC-11)", "Phân quyền chuẩn 6 vai trò hệ thống."),
            ("Báo cáo vận hành (UC-12)", "Thống kê hoạt động và tỷ lệ hoàn thành."),
            ("Kiểm toán an ninh (UC-13)", "AuditLog ghi nhận mọi thay đổi nhạy cảm."),
            ("Hỗ trợ kỹ thuật (UC-14)", "Ticket tiếp nhận sự cố (Phạm vi MVP)."),
            ("Quản lý nhóm (UC-15)", "Cohort/Lớp học (Ranh giới Future)."),
            ("Nguyên tắc toàn vẹn", "Tiến độ tuyến tính tách biệt Năng lực."),
            ("Khả năng mở rộng", "Thiết kế Module hóa sẵn sàng Phase 2.")
        ], RGBColor(240, 253, 244), RGBColor(22, 163, 74))
    ]

    for i, (p_title, p_sub, bullets, bg_col, bdr_col) in enumerate(pkgs):
        px = Inches(0.8 + i * 3.99)
        card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, px, pkg_y, pkg_w, pkg_h)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_col
        card.line.color.rgb = bdr_col
        card.line.width = Pt(1.2)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = Inches(0.18)
        tf.margin_top = Inches(0.18)

        p = tf.paragraphs[0]
        p.text = p_title
        p.font.name = "Segoe UI"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = bdr_col
        p.space_after = Pt(2)

        p_s = tf.add_paragraph()
        p_s.text = p_sub
        p_s.font.name = "Segoe UI"
        p_s.font.size = Pt(9.5)
        p_s.font.color.rgb = SLATE
        p_s.space_after = Pt(8)

        for b_name, b_desc in bullets:
            pb = tf.add_paragraph()
            pb.text = f"• {b_name}: {b_desc}"
            pb.font.name = "Segoe UI"
            pb.font.size = Pt(8.2)
            pb.font.color.rgb = NAVY
            pb.space_after = Pt(2.5)

    # Bottom boundary note
    nb_box = s2.shapes.add_textbox(Inches(0.8), Inches(5.8), Inches(11.733), Inches(0.45))
    tf_nb = nb_box.text_frame
    tf_nb.word_wrap = True
    p = tf_nb.paragraphs[0]
    p.text = "Ranh giới phạm vi: UC-14 Xử lý phản hồi thuộc phạm vi MVP điều phối hỗ trợ; UC-15 Quản lý nhóm thuộc Future Extension (viền xám). Phân tách nhiệm vụ (SoD) giữa các vai trò được thực thi tuyệt đối."
    p.font.name = "Segoe UI"
    p.font.size = Pt(9.5)
    p.font.color.rgb = SLATE
    p.alignment = PP_ALIGN.CENTER

    s2.notes_slide.notes_text_frame.text = (
        "Hệ thống Lingora được tổ chức thành ba phân hệ nghiệp vụ chính: Learning, Content và Admin & Support. "
        "Sáu vai trò người dùng được định danh chuẩn mực, thực thi triệt để nguyên tắc Phân tách nhiệm vụ (Separation of Duties). "
        "UC-14 giải quyết bài toán tiếp nhận hỗ trợ ở mức MVP, trong khi UC-15 quản lý nhóm được định vị là phần mở rộng tương lai."
    )

    # ==========================================
    # SLIDE 3: OVERALL USE CASE
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    add_single_diagram_slide(
        s3,
        "Sơ Đồ Ca Sử Dụng Tổng Quan (Overall Use Case Diagram)",
        "USE CASE",
        os.path.join(diagram_dir, "02-usecase-overall.png"),
        bullets=[
            ("Actor cha Authenticated User", "Được kế thừa bởi 6 vai trò, tránh lặp đường nối đăng nhập (UC-01)."),
            ("Ranh giới 3 phân hệ rõ ràng", "Phân định minh bạch giữa Learning, Content và Administration."),
            ("Quan hệ Include chặt chẽ", "Học lý thuyết và xem giải thích được tích hợp liền mạch vào bài học."),
            ("Ranh giới UC-14 & UC-15", "UC-14 điều phối ở mức MVP; UC-15 định vị là mở rộng tương lai.")
        ],
        notes_text=(
            "Sơ đồ ca sử dụng tổng quan phản ánh toàn bộ 15 ca sử dụng của hệ thống Lingora. Sáu vai trò người dùng đều kế thừa "
            "từ Authenticated User để sử dụng chung cơ chế xác thực UC-01 mà không làm rối sơ đồ. "
            "Các phân hệ Learning, Content và Administration được phân tách độc lập, phản ánh đúng kiến trúc mô-đun."
        ),
        active_roles=["Learner", "Lesson Creator", "Moderator", "Org Manager", "Operations Staff", "Administrator"],
        slide_num=3
    )

    # ==========================================
    # SLIDE 4: LEARNER USE CASE
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    add_single_diagram_slide(
        s4,
        "Sơ Đồ Ca Sử Dụng Chi Tiết — Phân Hệ Học Viên (Learner)",
        "USE CASE",
        os.path.join(diagram_dir, "03-usecase-learner.png"),
        bullets=[
            ("Lesson Content Viewer bắt buộc", "Include trực tiếp vào UC-05, học viên phải nạp lý thuyết trước bài tập."),
            ("Controlled Retry là Extend", "Làm lại câu sai có kiểm soát hạn mức, tối đa 70% điểm công nhận."),
            ("Conditional Jump độc lập", "Extend từ lộ trình UC-04, thử thách nhảy cấp với ngưỡng đạt 95%."),
            ("Chu trình học tập khép kín", "Từ chẩn đoán (UC-03), học bài (UC-05), ôn tập SRS (UC-06) đến Streak (UC-07).")
        ],
        notes_text=(
            "Phân hệ học viên tập trung vào trải nghiệm học tập sư phạm chuẩn mực. Bước đột phá là Lesson Content Viewer "
            "được gắn chặt vào UC-05 thông qua quan hệ Include, đảm bảo học viên không thể làm bài tập mà không xem bài học. "
            "Làm lại có kiểm soát (Retry) và thử thách nhảy cấp (Jump) được mô hình hóa là các quan hệ Extend với điều kiện mở rộng rõ ràng."
        ),
        active_roles=["Learner"],
        slide_num=4
    )

    # ==========================================
    # SLIDE 5: CONTENT & ADMIN USE CASE
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    add_single_diagram_slide(
        s5,
        "Sơ Đồ Ca Sử Dụng Chi Tiết — Phân Hệ Nội Dung & Quản Trị",
        "USE CASE",
        os.path.join(diagram_dir, "04-usecase-content-admin.png"),
        bullets=[
            ("Phân tách nhiệm vụ (SoD)", "Creator soạn thảo (UC-08), Moderator duyệt (UC-09), Org Manager xuất bản (UC-10)."),
            ("Quy trình xuất bản nghiêm ngặt", "Tổ chức xuất bản yêu cầu kiểm tra điều kiện đóng băng 4/4 bài học của Unit."),
            ("Xuất bản khẩn cấp có Audit", "Admin có quyền Emergency Publish nhưng bắt buộc ghi nhận lý do vào AuditLog."),
            ("Hỗ trợ kỹ thuật & Vận hành", "Operations Staff điều phối ticket (UC-14), Admin theo dõi an ninh (UC-13).")
        ],
        notes_text=(
            "Phân hệ nội dung và quản trị thể hiện sự phân định trách nhiệm rõ ràng theo nguyên tắc SoD. "
            "Không một cá nhân nào có thể vừa tạo nội dung vừa tự phê duyệt và xuất bản. "
            "Các hành động can thiệp đặc quyền của Administrator đều phải để lại dấu vết kiểm toán bất biến qua quan hệ Include với AuditLog."
        ),
        active_roles=["Lesson Creator", "Moderator", "Org Manager", "Operations Staff", "Administrator"],
        slide_num=5
    )

    # ==========================================
    # SLIDE 6: ACTIVITY PLACEMENT (SPLIT)
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    add_split_activity_slide(
        s6,
        "Sơ Đồ Hoạt Động — Đánh Giá Chẩn Đoán Đầu Vào (Diagnostic Test)",
        "ACTIVITY",
        left_info={
            "title": "Luồng Chẩn Đoán Chính (30 Câu Hỏi → Xác Định Vị Trí)",
            "img": os.path.join(diagram_dir, "05a-activity-placement-flow.png")
        },
        right_info={
            "title": "Nhánh Bỏ Qua (Skip) & Nhánh Làm Lại (Retake)",
            "img": os.path.join(diagram_dir, "05b-activity-placement-branches.png")
        },
        bullets=[
            ("Chuẩn hóa 30 câu hỏi chuyên gia", "Điểm thô 0–30, thang Mapping A: 0-7 (U1), 8-12 (U2), 13-17 (U3), 18-22 (U4), 23-26 (U5), 27-30 (U6)"),
            ("Nhánh Bỏ qua (Skip Test)", "Gán mặc định Unit 1, selfReportedLevel = UNVERIFIED, KHÔNG tạo bản ghi rác trong AssessmentResult/SkillProfile"),
            ("Nhánh Làm lại (Retake từ Profile)", "Lưu bản ghi AssessmentResult mới độc lập, không ghi đè lịch sử, cập nhật vị trí bắt đầu mới nhất"),
            ("Tính bất biến dữ liệu", "Bản ghi kết quả đánh giá không bao giờ bị sửa đổi hay xóa bỏ sau khi đã nộp bài")
        ],
        notes_text=(
            "Quy trình đánh giá chẩn đoán đầu vào được tách thành luồng chuẩn và các nhánh ngoại lệ. "
            "Hệ thống sử dụng đúng 30 câu hỏi do chuyên gia tuyển chọn, ánh xạ qua Mapping A để xác định Unit khởi đầu. "
            "Khi học viên chọn Skip, hệ thống gán Unit 1 chưa xác minh mà không sinh dữ liệu đánh giá giả mạo. "
            "Khi Retake từ trang cá nhân, kết quả mới được thêm vào lịch sử thay vì ghi đè kết quả cũ."
        ),
        active_roles=["Learner"],
        slide_num=6
    )

    # ==========================================
    # SLIDE 7: ACTIVITY LEARNING (SPLIT)
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    add_split_activity_slide(
        s7,
        "Sơ Đồ Hoạt Động — Chu Trình Học Bài & Làm Lại Có Kiểm Soát",
        "ACTIVITY",
        left_info={
            "title": "Luồng Học Chính (Kiểm Tra Đóng Băng 4/4 → Viewer → Bài Tập)",
            "img": os.path.join(diagram_dir, "06a-activity-learning-main.png")
        },
        right_info={
            "title": "Luồng Làm Lại Có Kiểm Soát (Controlled Retry Flow)",
            "img": os.path.join(diagram_dir, "06b-activity-learning-retry.png")
        },
        bullets=[
            ("Tiền điều kiện Unit đóng băng", "Unit chỉ mở khóa khi đủ 4/4 bài học ở trạng thái PUBLISHED; chặn học nếu nội dung chưa hoàn chỉnh"),
            ("Bắt buộc qua Lesson Content Viewer", "Học viên phải tiếp thu từ vựng và ngữ pháp trước khi được phép nộp đáp án bài tập"),
            ("Công thức hạn mức Controlled Retry", "Hạn mức làm lại = max(1, floor(N * 0.10)); điểm làm lại đúng chỉ công nhận tối đa 70%"),
            ("Cập nhật trạng thái nguyên tử", "Hoàn thành bài học ghi nhận tiến độ, kích hoạt thuật toán SRS và cộng chuỗi ngày học Streak")
        ],
        notes_text=(
            "Chu trình học tập cốt lõi yêu cầu Unit phải đạt chuẩn đóng băng 4/4 bài học trước khi mở cho học viên. "
            "Điểm cải tiến sư phạm lớn nhất là sự hiện diện của Lesson Content Viewer trước phần bài tập. "
            "Cơ chế làm lại bài sai tuân theo công thức kiểm soát chặt chẽ với trần điểm 70%, bảo đảm tính nghiêm túc học thuật "
            "đồng thời vẫn duy trì động lực học tập qua cập nhật Streak và SRS."
        ),
        active_roles=["Learner"],
        slide_num=7
    )

    # ==========================================
    # SLIDE 8: ACTIVITY CONDITIONAL JUMP (SPLIT)
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    add_split_activity_slide(
        s8,
        "Sơ Đồ Hoạt Động — Thử Thách Nhảy Cấp (Conditional Jump)",
        "ACTIVITY",
        left_info={
            "title": "Kiểm Tra Cooldown 24h & Thực Hiện Bài Thi Jump",
            "img": os.path.join(diagram_dir, "07a-activity-jump-check.png")
        },
        right_info={
            "title": "Xử Lý Kết Quả: Vượt Cấp (Đỗ ≥95%) vs Khóa Phạt (Trượt <95%)",
            "img": os.path.join(diagram_dir, "07b-activity-jump-result.png")
        },
        bullets=[
            ("Kiểm tra thời gian chờ Cooldown", "Chặn truy cập bài thi Jump nếu còn trong thời hạn 24 giờ sau lần thi trượt gần nhất"),
            ("Bản ghi đánh giá độc lập", "Tạo AssessmentResult (type: JUMP, deliveryMode: JUMP), ghi nhận điểm và thời gian làm bài"),
            ("Quy chế đỗ vượt cấp (≥95%)", "Gán SKIPPED_BY_JUMP (by_jump = true) cho bài/unit đi qua; mở khóa UNLOCKED cho Unit đích; KHÔNG cấp chứng chỉ"),
            ("Hình phạt khi trượt (<95%)", "Khóa thử thách Jump 24 giờ; giữ nguyên vị trí học tập hiện tại; khuyến nghị học theo lộ trình chuẩn")
        ],
        notes_text=(
            "Thử thách Conditional Jump cho phép người học có trình độ vượt cấp mà không phải làm tuần tự. "
            "Để ngăn chặn gian lận thử sai, hệ thống áp đặt thời gian chờ Cooldown 24 giờ khi làm trượt. "
            "Khi đạt ngưỡng khắt khe 95%, các đơn vị học đi qua nhận cờ SKIPPED_BY_JUMP và Unit đích mở khóa UNLOCKED. "
            "Các nội dung nhảy qua tuyệt đối không được cấp chứng chỉ CEFR nếu không làm bài thi chuẩn hóa tương ứng."
        ),
        active_roles=["Learner"],
        slide_num=8
    )

    # ==========================================
    # SLIDE 9: ACTIVITY GOVERNANCE (SPLIT)
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    add_split_activity_slide(
        s9,
        "Sơ Đồ Hoạt Động — Quản Trị & Xuất Bản Nội Dung (Content Governance)",
        "ACTIVITY",
        left_info={
            "title": "Quy Trình Xuất Bản Chính Thức (Creator → Moderator → Org Manager)",
            "img": os.path.join(diagram_dir, "08a-activity-governance-main.png")
        },
        right_info={
            "title": "Cơ Chế Clone-to-Draft & Xuất Bản Khẩn Cấp (Emergency Publish)",
            "img": os.path.join(diagram_dir, "08b-activity-governance-branches.png")
        },
        bullets=[
            ("Cơ chế Clone-to-Draft", "Khi cần sửa bài đã PUBLISHED, hệ thống sao chép ra bản DRAFT mới, giữ nguyên bài hiện tại cho học viên"),
            ("Kiểm duyệt độc lập (Moderator)", "Đánh giá chất lượng nội dung, phê duyệt (APPROVED) hoặc yêu cầu chỉnh sửa (REJECTED)"),
            ("Thẩm quyền xuất bản (Org Manager)", "Kiểm tra điều kiện tiên quyết 4/4 bài học con hoàn chỉnh trước khi kích hoạt mở Unit"),
            ("Can thiệp khẩn cấp (Administrator)", "Emergency Publish sửa lỗi trực tiếp trên môi trường live, bắt buộc giải trình vào AuditLog")
        ],
        notes_text=(
            "Quy trình quản trị nội dung kết hợp giữa tính toàn vẹn sư phạm và khả năng xử lý sự cố. "
            "Cơ chế Clone-to-Draft đảm bảo quá trình chỉnh sửa không làm gián đoạn bài học đang phát hành cho học viên. "
            "Organizational Manager chỉ mở Unit khi đủ điều kiện đóng băng 4/4 bài học. "
            "Administrator có quyền xuất bản khẩn cấp nhưng hành động này luôn được kiểm soát chặt chẽ bằng nhật ký kiểm toán."
        ),
        active_roles=["Lesson Creator", "Moderator", "Org Manager", "Administrator"],
        slide_num=9
    )

    # ==========================================
    # SLIDE 10: CLASS CONTENT
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    add_single_diagram_slide(
        s10,
        "Sơ Đồ Lớp — Phân Hệ Cấu Trúc Nội Dung & Khóa Học",
        "CLASS",
        os.path.join(diagram_dir, "09-class-content.png"),
        bullets=[
            ("Phân định CURRENT vs TARGET", "CURRENT (viền xanh: Course, Unit, Lesson, Exercise) vs TARGET (viền cam: LessonRevision)."),
            ("Chuẩn hóa cấu trúc phân cấp", "Course chứa Units, Unit chứa Lessons, Lesson gắn với Exercise và Vocabulary."),
            ("Thực thể LessonRevision (Target)", "Quản lý vòng đời dự thảo (DRAFT, SUBMITTED, APPROVED, PUBLISHED) và phiên bản."),
            ("Bảo đảm tính toàn vẹn tham chiếu", "Khóa ngoại unit_id, lesson_revision_id được thiết kế chặt chẽ bảo vệ dữ liệu nội dung.")
        ],
        notes_text=(
            "Sơ đồ lớp cấu trúc nội dung phân tách minh bạch giữa các thực thể hiện hữu trong schema.prisma và các thực thể "
            "mục tiêu cho giai đoạn nâng cấp Phase 2. Thực thể LessonRevision là hạt nhân cho cơ chế Clone-to-Draft, "
            "giúp quản lý trạng thái kiểm duyệt nội dung mà không gây phá vỡ các liên kết bài tập hiện hành."
        ),
        active_roles=["Lesson Creator", "Moderator", "Org Manager"],
        slide_num=10
    )

    # ==========================================
    # SLIDE 11: CLASS LEARNER ASSESSMENT
    # ==========================================
    s11 = prs.slides.add_slide(blank_layout)
    add_single_diagram_slide(
        s11,
        "Sơ Đồ Lớp — Phân Hệ Học Viên, Đánh Giá & Tiến Độ",
        "CLASS",
        os.path.join(diagram_dir, "10-class-learner-assessment.png"),
        bullets=[
            ("Bất biến Tiến độ ≠ Năng lực", "Tách bạch UserProgress (tiến độ tuyến tính) và SkillProfile/AssessmentResult (năng lực thực)."),
            ("Thực thể mục tiêu Phase 2", "AssessmentResult lưu vết bài thi chẩn đoán/Jump; SkillProfile phản ánh hồ sơ kỹ năng."),
            ("Trạng thái Jump & Retry", "Mô hình hóa các cờ SKIPPED_BY_JUMP, thời gian cooldown 24h và hạn mức làm lại."),
            ("Mô hình ôn tập ngắt quãng SRS", "UserVocabSrs và ReviewLog quản lý lịch ôn tập theo đường cong lãng quên.")
        ],
        notes_text=(
            "Sơ đồ lớp học viên phản ánh nguyên lý bất biến cốt lõi: Tiến độ học tập không đồng nhất với Năng lực thực tế. "
            "UserProgress ghi nhận việc hoàn thành bài học, trong khi AssessmentResult và SkillProfile lưu trữ điểm thi chẩn đoán "
            "và nhảy cấp. Các trạng thái về hạn mức Retry và thời gian chờ Jump được đóng gói trong logic nghiệp vụ của các lớp liên quan."
        ),
        active_roles=["Learner", "Operations Staff", "Administrator"],
        slide_num=11
    )

    # ==========================================
    # SLIDE 12: TRACEABILITY MATRIX
    # ==========================================
    s12 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(s12)
    add_slide_header(s12, "Ma Trận Truy Vết Nghiệp Vụ Toàn Diện (Traceability Matrix)", "TRACEABILITY", 12)
    add_footer_role_chips(s12, y_pos=6.92)

    # Native PPTX Table
    rows = 16
    cols = 5
    table_shape = s12.shapes.add_table(rows, cols, Inches(0.8), Inches(1.25), Inches(11.733), Inches(5.45))
    table = table_shape.table
    table.columns[0].width = Inches(1.0)
    table.columns[1].width = Inches(3.2)
    table.columns[2].width = Inches(2.3)
    table.columns[3].width = Inches(3.0)
    table.columns[4].width = Inches(2.233)

    headers = ["UC ID", "Tên Ca Sử Dụng (Use Case)", "Sơ Đồ Hoạt Động (Slide)", "Lớp Dữ Liệu Liên Quan", "Phạm Vi Triển Khai"]
    for j, h in enumerate(headers):
        cell = table.cell(0, j)
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.name = "Segoe UI"
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = WHITE
        p.alignment = PP_ALIGN.CENTER

    # Strict Matrix Data: Only real activity diagrams are cited! Others get "—"
    matrix_data = [
        ("UC-01", "Authenticate & Manage Session", "—", "Profile, Role", "CORE (Phase 2 MVP)"),
        ("UC-02", "Configure Goals & Study Time", "—", "Profile", "CORE (Phase 2 MVP)"),
        ("UC-03", "Take Placement Test", "Slide 6 (Diagnostic Test)", "AssessmentResult, SkillProfile", "CORE (Phase 2 MVP)"),
        ("UC-04", "Browse Learning Path & Progress", "Slide 8 (Conditional Jump)", "Course, Unit, Lesson, UserProgress", "CORE (Phase 2 MVP)"),
        ("UC-05", "Complete Lesson & Exercises", "Slide 7 (Learning & Retry)", "Lesson, Exercise, UserProgress", "CORE (Phase 2 MVP)"),
        ("UC-06", "Spaced Repetition Review (SRS)", "—", "Vocabulary, UserVocabSrs, ReviewLog", "CORE (Phase 2 MVP)"),
        ("UC-07", "Track Learning Progress & Streak", "Slide 7 (Streak Update)", "Profile, UserProgress", "CORE (Phase 2 MVP)"),
        ("UC-08", "Create & Edit Lesson Draft", "Slide 9 (Governance & Clone)", "Lesson, LessonRevision, Exercise", "CORE (Phase 2 MVP)"),
        ("UC-09", "Review & Moderate Content", "Slide 9 (Moderator Review)", "LessonRevision, AuditLog", "CORE (Phase 2 MVP)"),
        ("UC-10", "Publish Approved Content", "Slide 9 (Org Mgr 4/4 Unit)", "Unit, Lesson, LessonRevision, AuditLog", "CORE (Phase 2 MVP)"),
        ("UC-11", "Manage Accounts & Roles", "—", "Profile, Role, AuditLog", "CORE (Phase 2 MVP)"),
        ("UC-12", "View System Operational Reports", "—", "UserProgress, AuditLog", "CORE (Phase 2 MVP)"),
        ("UC-13", "View & Audit Security Logs", "—", "AuditLog", "CORE (Phase 2 MVP)"),
        ("UC-14", "Handle Support Ticket", "—", "SupportTicket (MVP Boundary)", "MVP (Coordination)"),
        ("UC-15", "Manage Cohorts & Groups", "—", "Cohort, CohortMember", "FUTURE EXTENSION")
    ]

    for i, row in enumerate(matrix_data):
        for j, val in enumerate(row):
            cell = table.cell(i + 1, j)
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(241, 245, 249) if i % 2 == 1 else WHITE
            cell.margin_top = cell.margin_bottom = Inches(0.03)
            cell.margin_left = cell.margin_right = Inches(0.06)
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = "Segoe UI"
            p.font.size = Pt(8.2)
            if j == 0:
                p.font.bold = True
                p.alignment = PP_ALIGN.CENTER
                p.font.color.rgb = RGBColor(37, 99, 235)
            elif j == 2 and val != "—":
                p.font.bold = True
                p.font.color.rgb = RGBColor(16, 185, 129)
            elif j == 4:
                p.font.bold = True
                p.alignment = PP_ALIGN.CENTER
                if "FUTURE" in val:
                    p.font.color.rgb = RGBColor(156, 163, 175)
                elif "MVP" in val and "Coordination" in val:
                    p.font.color.rgb = RGBColor(13, 148, 136)
                else:
                    p.font.color.rgb = RGBColor(22, 163, 74)
            else:
                p.font.color.rgb = NAVY

    s12.notes_slide.notes_text_frame.text = (
        "Ma trận truy vết bảo đảm tính nhất quán xuyên suốt từ 15 Ca sử dụng đến các sơ đồ hoạt động và sơ đồ lớp. "
        "Chỉ các Use Case có sơ đồ hoạt động thực tế trong deck mới được liên kết tới slide tương ứng (Slide 6, 7, 8, 9), "
        "các ca sử dụng còn lại được đánh dấu gạch ngang trung thực, không bịa đặt liên kết không tồn tại."
    )

    prs.save(output_pptx)
    print(f"Presentation v5 successfully built and saved to: {output_pptx}")

if __name__ == "__main__":
    build_deck_v5()
