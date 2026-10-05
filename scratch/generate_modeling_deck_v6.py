import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
from PIL import Image

def build_deck_v6():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Theme Colors - Minimal Academic
    NAVY = RGBColor(15, 23, 42)          # #0F172A
    SLATE = RGBColor(51, 65, 85)         # #334155
    MUTED = RGBColor(148, 163, 184)      # #94A3B8
    BORDER_LIGHT = RGBColor(226, 232, 240) # #E2E8F0
    WHITE = RGBColor(255, 255, 255)
    DIVIDER_COLOR = RGBColor(226, 232, 240)

    # Eyebrow category colors
    EYEBROW_COLORS = {
        "USE CASE": RGBColor(37, 99, 235),     # #2563EB
        "ACTIVITY": RGBColor(22, 163, 74),     # #16A34A
        "CLASS": RGBColor(124, 58, 237),       # #7C3AED
        "TRACEABILITY": RGBColor(51, 65, 85),  # #334155
        "OVERVIEW": RGBColor(37, 99, 235)
    }

    # Canonical Role Definitions (dots)
    ROLE_DEFS = [
        ("Learner", RGBColor(37, 99, 235)),             # Blue
        ("Lesson Creator", RGBColor(234, 88, 12)),      # Orange
        ("Moderator", RGBColor(22, 163, 74)),           # Green
        ("Org Manager", RGBColor(124, 58, 237)),        # Purple
        ("Operations Staff", RGBColor(13, 148, 136)),   # Teal
        ("Administrator", RGBColor(159, 18, 57))        # Crimson
    ]

    diagram_dir = "docs/diagrams/lingora-modeling/out"
    output_pptx = "docs/diagrams/lingora-modeling/deck/Lingora-System-Modeling-Presentation-v6.pptx"
    os.makedirs(os.path.dirname(output_pptx), exist_ok=True)

    def apply_white_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = WHITE
        bg.line.fill.background()
        return bg

    def add_slide_header(slide, title_text, category_key):
        header_box = slide.shapes.add_textbox(Inches(0.6), Inches(0.4), Inches(12.133), Inches(0.95))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        eyebrow_col = EYEBROW_COLORS.get(category_key.upper(), RGBColor(51, 65, 85))

        p0 = tf.paragraphs[0]
        p0.text = category_key.upper()
        p0.font.name = "Calibri"
        p0.font.size = Pt(12)
        p0.font.bold = True
        p0.font.color.rgb = eyebrow_col
        p0.space_after = Pt(2)

        p1 = tf.add_paragraph()
        p1.text = title_text
        p1.font.name = "Calibri"
        p1.font.size = Pt(28)
        p1.font.bold = True
        p1.font.color.rgb = NAVY

    def add_page_number(slide, slide_num):
        num_box = slide.shapes.add_textbox(Inches(11.5), Inches(7.05), Inches(1.233), Inches(0.35))
        tf = num_box.text_frame
        tf.word_wrap = False
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = f"{slide_num} / 12"
        p.font.name = "Calibri"
        p.font.size = Pt(10)
        p.font.color.rgb = MUTED
        p.alignment = PP_ALIGN.RIGHT

    def add_role_legend_footer(slide, y_pos=7.08):
        # Only at slide 3, 4, 5, 9: small colored dots (0.12 in) + role name 11pt
        # Total roles = 6
        start_x = Inches(0.6)
        item_w = Inches(1.8)
        dot_size = Inches(0.12)
        
        for i, (r_name, r_col) in enumerate(ROLE_DEFS):
            ix = start_x + i * item_w
            # Add small circle dot
            dot = slide.shapes.add_shape(MSO_SHAPE.OVAL, ix, Inches(y_pos + 0.03), dot_size, dot_size)
            dot.fill.solid()
            dot.fill.fore_color.rgb = r_col
            dot.line.fill.background()

            # Add label
            lbl_box = slide.shapes.add_textbox(ix + Inches(0.16), Inches(y_pos), item_w - Inches(0.16), Inches(0.3))
            tf = lbl_box.text_frame
            tf.word_wrap = False
            tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
            p = tf.paragraphs[0]
            p.text = r_name
            p.font.name = "Calibri"
            p.font.size = Pt(11)
            p.font.color.rgb = SLATE

    def place_diagram_with_border(slide, img_path, left_in, top_in, max_w_in, max_h_in):
        # Adds 1px light gray border rect, then image inside
        if not os.path.exists(img_path):
            return

        with Image.open(img_path) as im:
            iw, ih = im.size

        scale = min(max_w_in / iw, max_h_in / ih)
        fw = iw * scale
        fh = ih * scale
        fx = left_in + (max_w_in - fw) / 2
        fy = top_in + (max_h_in - fh) / 2

        # 1px border rectangle exactly behind the image
        bdr = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(fx), Inches(fy), Inches(fw), Inches(fh))
        bdr.fill.background()
        bdr.line.color.rgb = BORDER_LIGHT
        bdr.line.width = Pt(1.0)

        slide.shapes.add_picture(img_path, Inches(fx), Inches(fy), width=Inches(fw), height=Inches(fh))

    def add_single_diagram_slide(slide, title, category, img_path, bullets, notes_text="", show_roles=False, slide_num=None):
        apply_white_bg(slide)
        add_slide_header(slide, title, category)
        add_page_number(slide, slide_num)
        if show_roles:
            add_role_legend_footer(slide)

        # Diagram region: left = 0.6, top = 1.5, width ≈ 8.8, max height = 5.4
        place_diagram_with_border(slide, img_path, 0.6, 1.5, 8.8, 5.4)

        # Vertical divider line at x = 9.55, y = 1.5, height = 5.3
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(9.55), Inches(1.5), Pt(1.0), Inches(5.3))
        line.fill.solid()
        line.fill.fore_color.rgb = DIVIDER_COLOR
        line.line.fill.background()

        # Right column: left = 9.7, top = 1.5, width = 3.0, height = 5.3. NO bounding box.
        rc_box = slide.shapes.add_textbox(Inches(9.7), Inches(1.5), Inches(3.0), Inches(5.3))
        tf_r = rc_box.text_frame
        tf_r.word_wrap = True
        tf_r.margin_left = tf_r.margin_top = tf_r.margin_right = tf_r.margin_bottom = 0

        eyebrow_col = EYEBROW_COLORS.get(category.upper(), RGBColor(37, 99, 235))

        p_h = tf_r.paragraphs[0]
        p_h.text = "Ý CHÍNH"
        p_h.font.name = "Calibri"
        p_h.font.size = Pt(11)
        p_h.font.bold = True
        p_h.font.color.rgb = eyebrow_col
        p_h.space_after = Pt(14)

        for b_text in bullets:
            pb = tf_r.add_paragraph()
            pb.text = f"• {b_text}"
            pb.font.name = "Calibri"
            pb.font.size = Pt(13)
            pb.font.color.rgb = SLATE
            pb.space_after = Pt(14)

        if notes_text:
            slide.notes_slide.notes_text_frame.text = notes_text

    def add_split_activity_slide(slide, title, category, left_info, right_info, bullets_3col, notes_text="", show_roles=False, slide_num=None):
        apply_white_bg(slide)
        add_slide_header(slide, title, category)
        add_page_number(slide, slide_num)
        if show_roles:
            add_role_legend_footer(slide)

        # Left diagram: title top 1.4, image top 1.7, w ≈ 5.9, h ≈ 4.1
        # Left title
        lt_box = slide.shapes.add_textbox(Inches(0.6), Inches(1.4), Inches(5.9), Inches(0.3))
        tf_lt = lt_box.text_frame
        tf_lt.word_wrap = False
        tf_lt.margin_left = tf_lt.margin_top = tf_lt.margin_right = tf_lt.margin_bottom = 0
        p_lt = tf_lt.paragraphs[0]
        p_lt.text = left_info["title"]
        p_lt.font.name = "Calibri"
        p_lt.font.size = Pt(13)
        p_lt.font.bold = True
        p_lt.font.color.rgb = NAVY

        place_diagram_with_border(slide, left_info["img"], 0.6, 1.7, 5.9, 4.0)

        # Right title
        rt_box = slide.shapes.add_textbox(Inches(6.833), Inches(1.4), Inches(5.9), Inches(0.3))
        tf_rt = rt_box.text_frame
        tf_rt.word_wrap = False
        tf_rt.margin_left = tf_rt.margin_top = tf_rt.margin_right = tf_rt.margin_bottom = 0
        p_rt = tf_rt.paragraphs[0]
        p_rt.text = right_info["title"]
        p_rt.font.name = "Calibri"
        p_rt.font.size = Pt(13)
        p_rt.font.bold = True
        p_rt.font.color.rgb = NAVY

        place_diagram_with_border(slide, right_info["img"], 6.833, 1.7, 5.9, 4.0)

        # Bottom 3-column row: y = 5.85, height = 1.15. 3 columns, each w ≈ 3.8 in
        col_w = Inches(3.8)
        col_gap = Inches(0.36)
        
        for i, (b_title, b_desc) in enumerate(bullets_3col):
            cx = Inches(0.6) + i * (col_w + col_gap)
            c_box = slide.shapes.add_textbox(cx, Inches(5.82), col_w, Inches(1.15))
            tf_c = c_box.text_frame
            tf_c.word_wrap = True
            tf_c.margin_left = tf_c.margin_top = tf_c.margin_right = tf_c.margin_bottom = 0

            p0 = tf_c.paragraphs[0]
            p0.text = b_title
            p0.font.name = "Calibri"
            p0.font.size = Pt(13)
            p0.font.bold = True
            p0.font.color.rgb = NAVY
            p0.space_after = Pt(3)

            p1 = tf_c.add_paragraph()
            p1.text = b_desc
            p1.font.name = "Calibri"
            p1.font.size = Pt(12)
            p1.font.color.rgb = SLATE

        if notes_text:
            slide.notes_slide.notes_text_frame.text = notes_text

    # ==========================================
    # SLIDE 1: COVER
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    apply_white_bg(s1)

    # Vertical Navy accent bar on left edge (w = 0.35 in, full height 7.5 in)
    navy_bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(0.35), Inches(7.5))
    navy_bar.fill.solid()
    navy_bar.fill.fore_color.rgb = NAVY
    navy_bar.line.fill.background()

    # Left-aligned large title
    cov_box = s1.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(11.5), Inches(4.0))
    tf1 = cov_box.text_frame
    tf1.word_wrap = True
    tf1.margin_left = tf1.margin_top = tf1.margin_right = tf1.margin_bottom = 0

    p0 = tf1.paragraphs[0]
    p0.text = "LINGORA PLATFORM"
    p0.font.name = "Calibri"
    p0.font.size = Pt(15)
    p0.font.bold = True
    p0.font.color.rgb = RGBColor(37, 99, 235)
    p0.space_after = Pt(10)

    p1 = tf1.add_paragraph()
    p1.text = "Phân Tích & Mô Hình Hóa Hệ Thống\nNền Tảng Học Ngoại Ngữ Trực Tuyến"
    p1.font.name = "Calibri"
    p1.font.size = Pt(32)
    p1.font.bold = True
    p1.font.color.rgb = NAVY
    p1.space_after = Pt(16)

    p2 = tf1.add_paragraph()
    p2.text = "Use Case · Activity Diagram · Class Diagram · Traceability"
    p2.font.name = "Calibri"
    p2.font.size = Pt(16)
    p2.font.color.rgb = SLATE
    p2.space_after = Pt(28)

    p3 = tf1.add_paragraph()
    p3.text = "Báo cáo Chuyên đề Kỹ thuật Phần mềm — Nhóm Dự án Lingora"
    p3.font.name = "Calibri"
    p3.font.size = Pt(13)
    p3.font.color.rgb = MUTED

    s1.notes_slide.notes_text_frame.text = (
        "Báo cáo trình bày phân tích và mô hình hóa hệ thống học ngoại ngữ trực tuyến Lingora. "
        "Nội dung bao gồm biểu đồ ca sử dụng, biểu đồ hoạt động, biểu đồ lớp và ma trận truy vết yêu cầu. "
        "Mô hình bám sát tài liệu đặc tả hành vi M2.2 và quy tắc nghiệp vụ đã phê duyệt."
    )

    # ==========================================
    # SLIDE 2: OVERVIEW
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    apply_white_bg(s2)
    add_slide_header(s2, "Tổng Quan Kiến Trúc Nghiệp Vụ & Ranh Giới Vai Trò", "OVERVIEW")
    add_page_number(s2, 2)

    # 3 columns: LEARNING, CONTENT, ADMINISTRATION. Top border 4px accent line.
    cols_data = [
        ("LEARNING", RGBColor(37, 99, 235), [
            ("Xác thực & quản lý phiên người dùng", "UC-01"),
            ("Thiết lập mục tiêu & thời lượng học", "UC-02"),
            ("Đánh giá chẩn đoán xếp lớp đầu vào", "UC-03"),
            ("Khám phá lộ trình & thử thách Jump", "UC-04"),
            ("Học qua Viewer & luyện tập bài tập", "UC-05"),
            ("Ôn tập từ vựng ngắt quãng SRS", "UC-06"),
            ("Theo dõi tiến độ & chuỗi ngày Streak", "UC-07")
        ]),
        ("CONTENT", RGBColor(124, 58, 237), [
            ("Lập kế hoạch & soạn bài học, bài tập", "UC-08"),
            ("Kiểm duyệt độc lập & yêu cầu sửa", "UC-09"),
            ("Xuất bản nội dung bài học đã duyệt", "UC-10"),
            ("Cơ chế Clone-to-Draft v2 bảo toàn bài", "Quy trình"),
            ("Điều kiện hiển thị Unit: đủ 4/4 Lesson Published", "Ràng buộc"),
            ("Phân tách nhiệm vụ SoD: Creator không tự duyệt", "Nguyên tắc")
        ]),
        ("ADMINISTRATION", RGBColor(159, 18, 57), [
            ("Quản lý tài khoản & phân quyền 6 vai trò", "UC-11"),
            ("Xem báo cáo & thống kê vận hành", "UC-12"),
            ("Tra cứu nhật ký kiểm toán an ninh bất biến", "UC-13"),
            ("Tiếp nhận & điều phối phiếu hỗ trợ", "UC-14 MVP"),
            ("Xuất bản khẩn cấp bài đã Approved, có lý do và AuditLog", "Admin"),
            ("Quản lý nhóm học viên & tiến độ lớp học", "UC-15 Future")
        ])
    ]

    col_w = Inches(3.8)
    col_gap = Inches(0.36)
    c_y = Inches(1.5)

    for i, (col_title, accent_col, items) in enumerate(cols_data):
        cx = Inches(0.6) + i * (col_w + col_gap)

        # 4px top accent line
        top_bar = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, cx, c_y, col_w, Pt(4.0))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = accent_col
        top_bar.line.fill.background()

        # Title
        t_box = s2.shapes.add_textbox(cx, c_y + Inches(0.12), col_w, Inches(0.4))
        tf_t = t_box.text_frame
        tf_t.word_wrap = False
        tf_t.margin_left = tf_t.margin_top = tf_t.margin_right = tf_t.margin_bottom = 0
        pt = tf_t.paragraphs[0]
        pt.text = col_title
        pt.font.name = "Calibri"
        pt.font.size = Pt(16)
        pt.font.bold = True
        pt.font.color.rgb = accent_col

        # Items list
        list_box = s2.shapes.add_textbox(cx, c_y + Inches(0.6), col_w, Inches(4.5))
        tf_l = list_box.text_frame
        tf_l.word_wrap = True
        tf_l.margin_left = tf_l.margin_top = tf_l.margin_right = tf_l.margin_bottom = 0

        for j, (it_text, it_id) in enumerate(items):
            p = tf_l.paragraphs[0] if j == 0 else tf_l.add_paragraph()
            p.text = f"• {it_text} "
            p.font.name = "Calibri"
            p.font.size = Pt(13)
            p.font.color.rgb = SLATE
            p.space_after = Pt(8)

            # Add gray small badge text
            run = p.add_run()
            run.text = f"[{it_id}]"
            run.font.name = "Calibri"
            run.font.size = Pt(10.5)
            run.font.color.rgb = MUTED

    # Bottom line: 6 actors (dots + names) and scope boundaries
    bot_y = 6.6
    dot_size = Inches(0.11)
    for i, (r_name, r_col) in enumerate(ROLE_DEFS):
        ix = Inches(0.6) + i * Inches(1.5)
        dot = s2.shapes.add_shape(MSO_SHAPE.OVAL, ix, Inches(bot_y + 0.03), dot_size, dot_size)
        dot.fill.solid()
        dot.fill.fore_color.rgb = r_col
        dot.line.fill.background()

        lbl_box = s2.shapes.add_textbox(ix + Inches(0.15), Inches(bot_y), Inches(1.3), Inches(0.3))
        tf = lbl_box.text_frame
        tf.word_wrap = False
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = r_name
        p.font.name = "Calibri"
        p.font.size = Pt(11)
        p.font.color.rgb = SLATE

    # Scope note at bottom
    b_note = s2.shapes.add_textbox(Inches(9.6), Inches(bot_y), Inches(3.1), Inches(0.3))
    tf_bn = b_note.text_frame
    tf_bn.word_wrap = False
    tf_bn.margin_left = tf_bn.margin_top = tf_bn.margin_right = tf_bn.margin_bottom = 0
    pbn = tf_bn.paragraphs[0]
    pbn.text = "UC-14 MVP (điều phối) · UC-15 FUTURE"
    pbn.font.name = "Calibri"
    pbn.font.size = Pt(11)
    pbn.font.color.rgb = MUTED
    pbn.alignment = PP_ALIGN.RIGHT

    s2.notes_slide.notes_text_frame.text = (
        "Kiến trúc nghiệp vụ chia làm ba phân hệ rõ ràng: Learning, Content và Administration. "
        "Sáu vai trò vận hành theo nguyên tắc phân tách nhiệm vụ. "
        "UC-14 thuộc phạm vi MVP điều phối hỗ trợ, còn UC-15 quản lý nhóm thuộc phạm vi mở rộng tương lai."
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
            "Sáu tác nhân kế thừa từ Authenticated User để sử dụng chung phiên đăng nhập UC-01.",
            "Phân định rõ ranh giới ba phân hệ: Học tập, Quản trị nội dung và Vận hành hệ thống.",
            "Tập trung vào các cụm ca sử dụng trọng tâm, kết nối bằng đường trực giao rõ ràng."
        ],
        notes_text=(
            "Sơ đồ ca sử dụng tổng quan thể hiện cấu trúc phân hệ của Lingora. "
            "Sáu tác nhân kế thừa từ Authenticated User nhằm chuẩn hóa cơ chế đăng nhập. "
            "Hệ thống phân tách ranh giới rõ ràng giữa chức năng người học và phân hệ quản trị."
        ),
        show_roles=True,
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
            "Lesson Content Viewer được include bắt buộc vào UC-05 trước khi làm bài tập tương tác.",
            "Controlled Retry là luồng extend có hạn mức và khống chế trần điểm tối đa 70%.",
            "Conditional Jump là năng lực vượt cấp mở rộng từ lộ trình học tập UC-04."
        ],
        notes_text=(
            "Phân hệ học viên chuẩn hóa chu trình học tập khép kín. "
            "Người học bắt buộc xem nội dung bài học qua Lesson Content Viewer trước khi trả lời bài tập. "
            "Các cơ chế làm lại có kiểm soát và nhảy cấp được mô hình hóa qua quan hệ mở rộng."
        ),
        show_roles=True,
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
            "Thực thi nguyên tắc SoD: Creator soạn bài, Moderator thẩm định, Org Manager xuất bản.",
            "Moderator chỉ chuyển trạng thái APPROVED hoặc CHANGES_REQUESTED kèm phản hồi chi tiết.",
            "Emergency Publish chỉ áp dụng cho bài đã APPROVED, bắt buộc giải trình vào AuditLog."
        ],
        notes_text=(
            "Phân hệ quản trị nội dung thực thi nghiêm ngặt nguyên tắc phân tách nhiệm vụ. "
            "Người soạn bài không có quyền tự phê duyệt hay xuất bản nội dung của mình. "
            "Administrator chỉ xuất bản khẩn cấp đối với bài đã qua phê duyệt và phải lưu vết kiểm toán."
        ),
        show_roles=True,
        slide_num=5
    )

    # ==========================================
    # SLIDE 6: ACTIVITY PLACEMENT (SPLIT)
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    add_split_activity_slide(
        s6,
        "Sơ Đồ Hoạt Động — Đánh Giá Chẩn Đoán Đầu Vào (Placement)",
        "ACTIVITY",
        left_info={
            "title": "Luồng Chẩn Đoán Chính (30 Câu Hỏi → Xác Định Vị Trí)",
            "img": os.path.join(diagram_dir, "05a-activity-placement-flow.png")
        },
        right_info={
            "title": "Nhánh Bỏ Qua (Skip) & Nhánh Thi Lại (Retake)",
            "img": os.path.join(diagram_dir, "05b-activity-placement-branches.png")
        },
        bullets_3col=[
            ("Quy mô 30 câu & Mapping A", "Đề thi 30 câu, thang điểm thô 0–30. Ánh xạ ra Starting Unit từ 1 đến 6 theo dải điểm chuẩn."),
            ("Nhánh Bỏ qua (Skip Test)", "Gán mặc định Unit 1 với trạng thái UNVERIFIED, không tạo bản ghi AssessmentResult hay SkillProfile."),
            ("Nhánh Thi lại (Retake)", "Kích hoạt từ Profile, lưu bản ghi mới độc lập mà không ghi đè lịch sử bài thi trước.")
        ],
        notes_text=(
            "Quy trình đánh giá chẩn đoán đầu vào gồm 30 câu hỏi theo ma trận kiến thức phân tầng. "
            "Điểm số thô được ánh xạ qua Mapping A để xác định đơn vị học xuất phát. "
            "Trường hợp bỏ qua không tạo dữ liệu năng lực giả định, và thi lại sẽ lưu vết độc lập."
        ),
        show_roles=False,
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
            "title": "Luồng Học Chính (Kiểm Tra 4/4 Published → Viewer → Bài Tập)",
            "img": os.path.join(diagram_dir, "06a-activity-learning-main.png")
        },
        right_info={
            "title": "Luồng Làm Lại Có Kiểm Soát (Controlled Retry Flow)",
            "img": os.path.join(diagram_dir, "06b-activity-learning-retry.png")
        },
        bullets_3col=[
            ("Điều kiện hiển thị Unit", "Unit chỉ hiển thị mở khóa khi đủ 4/4 Lesson Published, bảo đảm tính trọn vẹn sư phạm."),
            ("Viewer trước bài tập", "Học viên bắt buộc học lý thuyết từ vựng qua Lesson Content Viewer trước khi nộp đáp án."),
            ("Quy chế Retry có kiểm soát", "Sai khi retry quay lại giải thích; hết hạn mức báo No quota; làm lại đúng ghi nhận ≤ 70% credit.")
        ],
        notes_text=(
            "Chu trình học bài yêu cầu bài học thuộc Unit có đủ 4 trên 4 bài đã phát hành. "
            "Học viên tiếp thu kiến thức qua Viewer trước khi thực hiện bộ câu hỏi tương tác. "
            "Cơ chế làm lại giới hạn số lượt thử, hỗ trợ xem giải thích và khống chế trần điểm công nhận."
        ),
        show_roles=False,
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
            "title": "Kiểm Tra Cooldown 24h & Làm Bài Thi Jump",
            "img": os.path.join(diagram_dir, "07a-activity-jump-check.png")
        },
        right_info={
            "title": "Xử Lý Kết Quả: Vượt Cấp (Đỗ ≥95%) vs Khóa Phạt 24h",
            "img": os.path.join(diagram_dir, "07b-activity-jump-result.png")
        },
        bullets_3col=[
            ("Kiểm tra thời gian chờ", "Chặn làm bài nếu đang trong thời gian phạt Cooldown 24 giờ sau lần thi không đạt gần nhất."),
            ("Quy mô bài thi Jump", "Đề thi gồm 20 câu (nhảy 1 Unit), 25–30 câu (nhảy 2–3 Units), hoặc 40 câu (nhảy hơn 3 Units)."),
            ("Xử lý kết quả đỗ và trượt", "Đạt ≥ 95% gán SKIPPED_BY_JUMP (by_jump = true) cho nội dung nhảy qua; trượt khóa làm lại 24 giờ.")
        ],
        notes_text=(
            "Thử thách nhảy cấp cho phép người học bỏ qua nội dung đã nắm vững. "
            "Quy mô bài thi tương ứng với số lượng bài học cần vượt qua và có ngưỡng đạt 95%. "
            "Nội dung bỏ qua được đánh dấu xuất xứ rõ ràng và lần thi không đạt sẽ kích hoạt thời gian chờ."
        ),
        show_roles=False,
        slide_num=8
    )

    # ==========================================
    # SLIDE 9: ACTIVITY GOVERNANCE (SPLIT)
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    add_split_activity_slide(
        s9,
        "Sơ Đồ Hoạt Động — Quản Trị & Xuất Bản Nội Dung",
        "ACTIVITY",
        left_info={
            "title": "Quy Trình Phê Duyệt & Xuất Bản Chính Thức",
            "img": os.path.join(diagram_dir, "08a-activity-governance-main.png")
        },
        right_info={
            "title": "Cơ Chế Clone-to-Draft & Xuất Bản Khẩn Cấp",
            "img": os.path.join(diagram_dir, "08b-activity-governance-branches.png")
        },
        bullets_3col=[
            ("Phê duyệt độc lập", "Moderator chuyển trạng thái APPROVED hoặc CHANGES_REQUESTED kèm ghi chú, không có quyền xuất bản."),
            ("Quyền xuất bản của Org Manager", "Org Manager là tác nhân duy nhất có thẩm quyền xuất bản chính thức học liệu đã duyệt."),
            ("Bảo toàn lịch sử & Audit", "Sửa bài qua Clone-to-Draft v2 và bắt buộc Archive v1 sau khi Publish v2; Admin xuất bản có AuditLog.")
        ],
        notes_text=(
            "Quy trình quản trị học liệu kết hợp thẩm định sư phạm và lưu vết lịch sử. "
            "Moderator chỉ chuyển trạng thái duyệt hoặc yêu cầu chỉnh sửa mà không xuất bản bài học. "
            "Cơ chế nhân bản bản nháp giúp bảo toàn phiên bản đang phát hành cho người học."
        ),
        show_roles=True,
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
            "Phân định rõ thực thể CURRENT trong schema.prisma và TARGET phục vụ quản trị phiên bản.",
            "LessonRevision quản lý đủ 6 trạng thái vòng đời: DRAFT, IN_REVIEW, CHANGES_REQUESTED, APPROVED, PUBLISHED, ARCHIVED.",
            "Exercise liên kết với LessonRevision và Unit tuân thủ ràng buộc hiển thị khi đủ 4/4 bài học."
        ],
        notes_text=(
            "Sơ đồ lớp nội dung phân tách giữa bảng dữ liệu hiện tại và mô hình quản lý phiên bản mục tiêu. "
            "Thực thể LessonRevision hỗ trợ theo dõi vòng đời hoàn chỉnh của bài học. "
            "Quan hệ giữa bài học và bài tập bảo đảm tính toàn vẹn tham chiếu của chương trình học."
        ),
        show_roles=False,
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
            "Tách biệt bất biến giữa UserProgress (tiến độ tuyến tính) và SkillProfile (năng lực đa chiều).",
            "Thuật toán ôn tập SRS tất định theo Policy B với các chu kỳ cố định 1, 3, 7, 14, 30 ngày.",
            "Các trạng thái về hạn mức Retry và thời gian chờ Jump được ghi chú trực tiếp tại UserProgress."
        ],
        notes_text=(
            "Sơ đồ lớp phân hệ học viên thể hiện nguyên tắc tách biệt giữa tiến độ học và hồ sơ năng lực. "
            "Dữ liệu ôn tập từ vựng ngắt quãng được quản lý theo chu kỳ ngày cố định của Policy B. "
            "Các thông tin trạng thái về làm lại bài và thời gian chờ nhảy cấp gắn liền với tiến trình học tập."
        ),
        show_roles=False,
        slide_num=11
    )

    # ==========================================
    # SLIDE 12: TRACEABILITY MATRIX
    # ==========================================
    s12 = prs.slides.add_slide(blank_layout)
    apply_white_bg(s12)
    add_slide_header(s12, "Ma Trận Truy Vết Nghiệp Vụ Toàn Diện (Traceability Matrix)", "TRACEABILITY")
    add_page_number(s12, 12)

    # Native PPTX Table: Font size >= 12pt, alternate row #F8FAFC, navy header with white text.
    rows = 16
    cols = 5
    # Table bounds: left = 0.6, top = 1.45, width = 12.133, height = 5.25
    table_shape = s12.shapes.add_table(rows, cols, Inches(0.6), Inches(1.45), Inches(12.133), Inches(5.15))
    table = table_shape.table
    table.columns[0].width = Inches(1.1)
    table.columns[1].width = Inches(3.6)
    table.columns[2].width = Inches(2.3)
    table.columns[3].width = Inches(2.8)
    table.columns[4].width = Inches(2.333)

    headers = ["UC ID", "Tên Ca Sử Dụng (Use Case)", "Sơ Đồ Hoạt Động", "Lớp Dữ Liệu", "Phạm Vi Triển Khai"]
    for j, h in enumerate(headers):
        cell = table.cell(0, j)
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY
        cell.margin_top = cell.margin_bottom = Inches(0.04)
        cell.margin_left = cell.margin_right = Inches(0.08)
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.name = "Calibri"
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = WHITE
        p.alignment = PP_ALIGN.CENTER

    # Strict Matrix Data: UC-14 & UC-15 have "—" in class column! UC names exactly match M2.2.
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
            cell.fill.fore_color.rgb = RGBColor(248, 250, 252) if i % 2 == 1 else WHITE
            cell.margin_top = cell.margin_bottom = Inches(0.02)
            cell.margin_left = cell.margin_right = Inches(0.06)
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = "Calibri"
            p.font.size = Pt(12)
            if j == 0:
                p.font.bold = True
                p.alignment = PP_ALIGN.CENTER
                p.font.color.rgb = RGBColor(37, 99, 235)
            elif j == 2 and val != "—":
                p.font.bold = True
                p.font.color.rgb = RGBColor(22, 163, 74)
            elif j == 4:
                p.font.bold = True
                p.alignment = PP_ALIGN.CENTER
                if "FUTURE" in val:
                    p.font.color.rgb = MUTED
                elif "MVP" in val and "hỗ trợ" in val:
                    p.font.color.rgb = RGBColor(13, 148, 136)
                else:
                    p.font.color.rgb = RGBColor(22, 163, 74)
            else:
                p.font.color.rgb = SLATE

    # Footnote line under table
    fn_box = s12.shapes.add_textbox(Inches(0.6), Inches(6.68), Inches(12.133), Inches(0.35))
    tf_fn = fn_box.text_frame
    tf_fn.word_wrap = True
    tf_fn.margin_left = tf_fn.margin_top = tf_fn.margin_right = tf_fn.margin_bottom = 0
    pfn = tf_fn.paragraphs[0]
    pfn.text = "Ghi chú: Cột Sơ đồ hoạt động chỉ dẫn chiếu tới các slide có biểu đồ hoạt động thực tế trong tài liệu; các Use Case còn lại đánh dấu '—'. UC-14 và UC-15 không ánh xạ lớp thực thể nội bộ."
    pfn.font.name = "Calibri"
    pfn.font.size = Pt(11)
    pfn.font.color.rgb = MUTED

    s12.notes_slide.notes_text_frame.text = (
        "Ma trận truy vết bảo đảm tính liên kết giữa các ca sử dụng với biểu đồ hoạt động và cấu trúc dữ liệu. "
        "Các ca sử dụng có biểu đồ hoạt động trong bài trình bày được dẫn chiếu trực tiếp đến số slide tương ứng. "
        "Phân định rõ ràng phạm vi triển khai cốt lõi MVP và các thành phần mở rộng trong tương lai."
    )

    prs.save(output_pptx)
    print(f"Presentation v6 successfully built and saved to: {output_pptx}")

if __name__ == "__main__":
    build_deck_v6()
