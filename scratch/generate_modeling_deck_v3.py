import os
import sys
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.dml.color import RGBColor

def create_deck(output_path):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Canonical Role & Theme Colors
    COLOR_LEARNER = RGBColor(37, 99, 235)      # Blue #2563EB
    COLOR_ORG_MGR = RGBColor(124, 58, 237)    # Purple #7C3AED
    COLOR_CREATOR = RGBColor(234, 88, 12)     # Orange #EA580C
    COLOR_MODERATOR = RGBColor(22, 163, 74)   # Green #16A34A
    COLOR_ADMIN = RGBColor(159, 18, 57)       # Maroon/Crimson #9F1239
    COLOR_OPS = RGBColor(13, 148, 136)        # Teal #0D9488
    COLOR_FUTURE = RGBColor(148, 163, 184)    # Slate/Gray #94A3B8

    # Backgrounds & Neutrals
    BG_DARK = RGBColor(15, 23, 42)           # Slate 900 #0F172A
    BG_LIGHT = RGBColor(248, 250, 252)       # Slate 50 #F8FAFC
    CARD_BG = RGBColor(255, 255, 255)        # Pure White
    CARD_BORDER = RGBColor(226, 232, 240)    # Slate 200 #E2E8F0
    TEXT_MAIN = RGBColor(30, 41, 59)         # Slate 800 #1E293B
    TEXT_MUTED = RGBColor(100, 116, 139)     # Slate 500 #64748B
    ACCENT_BLUE = RGBColor(2, 132, 199)      # Sky 600

    def add_header(slide, title_text, category_text="PHÂN TÍCH & MÔ HÌNH HÓA HỆ THỐNG"):
        # Category tag
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.5), Inches(0.3))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        tf_cat.margin_left = tf_cat.margin_top = tf_cat.margin_right = tf_cat.margin_bottom = 0
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.size = Pt(9.5)
        p_cat.font.bold = True
        p_cat.font.color.rgb = ACCENT_BLUE
        p_cat.font.name = "Segoe UI"

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.5), Inches(0.6))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(20)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_MAIN
        p_title.font.name = "Segoe UI"

    def set_speaker_notes(slide, notes_text):
        notes_slide = slide.notes_slide
        tf = notes_slide.notes_text_frame
        tf.text = notes_text

    # =========================================================================
    # SLIDE 1: COVER
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = BG_DARK
    bg1.line.color.rgb = BG_DARK

    cover_box = slide1.shapes.add_textbox(Inches(1.2), Inches(1.8), Inches(10.9), Inches(4.0))
    tf1 = cover_box.text_frame
    tf1.word_wrap = True

    p0 = tf1.paragraphs[0]
    p0.text = "LINGORA"
    p0.font.size = Pt(48)
    p0.font.bold = True
    p0.font.color.rgb = RGBColor(255, 255, 255)
    p0.font.name = "Segoe UI"
    p0.space_after = Pt(12)

    p1 = tf1.add_paragraph()
    p1.text = "Phân tích và mô hình hóa hệ thống nền tảng học ngoại ngữ trực tuyến"
    p1.font.size = Pt(22)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(56, 189, 248) # Sky 400
    p1.font.name = "Segoe UI"
    p1.space_after = Pt(28)

    p2 = tf1.add_paragraph()
    p2.text = "Use Case  ·  Activity Diagram  ·  Class Diagram  ·  Traceability"
    p2.font.size = Pt(14)
    p2.font.color.rgb = RGBColor(148, 163, 184)
    p2.font.name = "Segoe UI"
    p2.space_after = Pt(36)

    p3 = tf1.add_paragraph()
    p3.text = "Hệ thống chuẩn mực Kỹ nghệ Phần mềm  |  Giai đoạn 2 (Phase 2 SE Core Baseline)"
    p3.font.size = Pt(12)
    p3.font.color.rgb = RGBColor(203, 213, 225)
    p3.font.name = "Segoe UI"

    set_speaker_notes(slide1, 
        "Chào mừng Hội đồng và Thầy Cô. Bài báo cáo này tập trung chuyên sâu vào phân tích và mô hình hóa hệ thống của nền tảng học ngoại ngữ Lingora theo chuẩn mực Kỹ nghệ Phần mềm. "
        "Nội dung trình bày đi xuyên suốt từ mô hình ca sử dụng (Use Case), mô hình hoạt động nghiệp vụ (Activity Diagram), cấu trúc dữ liệu tĩnh (Class Diagram), đến ma trận truy vết yêu cầu (Traceability). "
        "Hệ thống vận hành trên nền tảng Web với 6 vai trò chuẩn tắc và các giải thuật học tập tất định."
    )

    # =========================================================================
    # SLIDE 2: TỔNG QUAN HỆ THỐNG
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_header(slide2, "Tổng quan Hệ thống: Phân rã Gói chức năng & 6 Vai trò Chuẩn tắc")

    # 3 Packages Cards (Horizontally)
    pkg_data = [
        ("PACKAGE LEARNING", RGBColor(37, 99, 235), [
            "• Quản lý phiên làm việc & xác thực học viên",
            "• Đánh giá chẩn đoán đầu vào (Placement Mapping A)",
            "• Điều hướng giáo trình (Curriculum Dashboard)",
            "• Xem nội dung bài học (Lesson Content Viewer)",
            "• Luyện tập tương tác (5 dạng bài tập chuẩn tắc)",
            "• Làm lại có kiểm soát (Controlled Retry ≤70% credit)",
            "• Ôn tập ngắt quãng tất định (SRS Policy B)",
            "• Theo dõi chuỗi học tập cá nhân theo múi giờ IANA"
        ]),
        ("PACKAGE CONTENT", RGBColor(124, 58, 237), [
            "• Quản lý giáo trình (Course / Unit / Lesson)",
            "• Phân công biên soạn bài học cho Creator",
            "• Soạn thảo bản thảo bài học & ngân hàng bài tập",
            "• Hàng đợi kiểm duyệt chuyên môn sư phạm (Moderator)",
            "• Quy trình xuất bản & kiểm soát hiển thị (Unit 4/4)",
            "• Nhân bản bài học nâng cấp (Clone-to-Draft v2)",
            "• Xuất bản khẩn cấp có lý do giải trình & audit trail",
            "• Lưu trữ bài học đã hết hiệu lực (Archived)"
        ]),
        ("PACKAGE ADMINISTRATION", RGBColor(159, 18, 57), [
            "• Quản trị tài khoản & gán 6 vai trò người dùng",
            "• Bảo vệ thuộc tính hồ sơ bằng PostgreSQL grants",
            "• Điều phối & xử lý hỗ trợ người dùng (UC-14 MVP)",
            "• Báo cáo tổng hợp vận hành & tỷ lệ hoàn thành",
            "• Sổ cái kiểm toán an ninh bất biến (11 loại sự kiện)",
            "• Quản lý nhóm học & lớp học (UC-15 Future)",
            "  ↳ Phân định ranh giới mở rộng ngoài MVP cốt lõi",
            "  ↳ Nét đứt, không phụ thuộc vào Core Learning"
        ])
    ]

    for i, (title, color, items) in enumerate(pkg_data):
        card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8 + i*3.95), Inches(1.5), Inches(3.8), Inches(4.2))
        card.fill.solid()
        card.fill.fore_color.rgb = RGBColor(255, 255, 255)
        card.line.color.rgb = color
        card.line.width = Pt(2)

        header_strip = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8 + i*3.95), Inches(1.5), Inches(3.8), Inches(0.55))
        header_strip.fill.solid()
        header_strip.fill.fore_color.rgb = color
        header_strip.line.fill.background()
        tf_h = header_strip.text_frame
        p_h = tf_h.paragraphs[0]
        p_h.text = title
        p_h.font.size = Pt(12)
        p_h.font.bold = True
        p_h.font.color.rgb = RGBColor(255, 255, 255)
        p_h.font.name = "Segoe UI"
        p_h.alignment = PP_ALIGN.CENTER

        tb = slide2.shapes.add_textbox(Inches(0.9 + i*3.95), Inches(2.15), Inches(3.6), Inches(3.4))
        tf = tb.text_frame
        tf.word_wrap = True
        for j, item in enumerate(items):
            p = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
            p.text = item
            p.font.size = Pt(10)
            p.font.name = "Segoe UI"
            if "UC-15" in item:
                p.font.color.rgb = COLOR_FUTURE
                p.font.bold = True
            elif "UC-14" in item:
                p.font.color.rgb = COLOR_OPS
                p.font.bold = True
            else:
                p.font.color.rgb = TEXT_MAIN
            p.space_after = Pt(4)

    # Bottom Banner: 6 Canonical Roles Badge Strip
    roles_box = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.9), Inches(11.7), Inches(1.1))
    roles_box.fill.solid()
    roles_box.fill.fore_color.rgb = RGBColor(241, 245, 249)
    roles_box.line.color.rgb = CARD_BORDER

    rf = roles_box.text_frame
    rf.word_wrap = True
    p_rf0 = rf.paragraphs[0]
    p_rf0.text = "6 VAI TRÒ CHUẨN TẮC TRONG HỆ THỐNG LINGORA (CANONICAL HUMAN ROLES)"
    p_rf0.font.size = Pt(10)
    p_rf0.font.bold = True
    p_rf0.font.color.rgb = TEXT_MUTED
    p_rf0.font.name = "Segoe UI"
    p_rf0.alignment = PP_ALIGN.CENTER

    # 6 Role badges
    role_names = [
        ("Learner", COLOR_LEARNER),
        ("Lesson Creator", COLOR_CREATOR),
        ("Moderator", COLOR_MODERATOR),
        ("Org Manager", COLOR_ORG_MGR),
        ("Operations Staff", COLOR_OPS),
        ("Administrator", COLOR_ADMIN)
    ]
    for k, (r_name, r_col) in enumerate(role_names):
        badge = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0 + k*1.9), Inches(6.25), Inches(1.75), Inches(0.55))
        badge.fill.solid()
        badge.fill.fore_color.rgb = r_col
        badge.line.fill.background()
        tf_b = badge.text_frame
        p_b = tf_b.paragraphs[0]
        p_b.text = r_name
        p_b.font.size = Pt(10.5)
        p_b.font.bold = True
        p_b.font.color.rgb = RGBColor(255, 255, 255)
        p_b.font.name = "Segoe UI"
        p_b.alignment = PP_ALIGN.CENTER

    set_speaker_notes(slide2,
        "Hệ thống Lingora được phân rã thành ba gói kiến trúc nghiệp vụ rõ ràng: Learning, Content và Administration. "
        "Mô hình con người chuẩn hóa trên đúng 6 vai trò, loại bỏ hoàn toàn các vai trò phân mảnh trước đây như Teacher hay Student. "
        "Trong đó, chức năng hỗ trợ người dùng UC-14 thuộc phạm vi MVP ở mức điều phối hỗ trợ, còn UC-15 quản lý nhóm học Cohort là ranh giới mở rộng trong tương lai (Future Extension)."
    )

    # Helper function for drawing rounded Use Case ovals
    def draw_usecase(slide, x, y, w, h, text, color=ACCENT_BLUE, is_dashed=False):
        uc = slide.shapes.add_shape(MSO_SHAPE.OVAL, x, y, w, h)
        uc.fill.solid()
        uc.fill.fore_color.rgb = RGBColor(255, 255, 255)
        uc.line.color.rgb = color
        uc.line.width = Pt(1.5)
        if is_dashed:
            # Fake dash with color tone
            uc.line.color.rgb = COLOR_FUTURE
        tf = uc.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = Inches(0.05)
        p = tf.paragraphs[0]
        p.text = text
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = color if not is_dashed else COLOR_FUTURE
        p.font.name = "Segoe UI"
        p.alignment = PP_ALIGN.CENTER
        return uc

    def draw_actor(slide, x, y, name, color):
        box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(1.7), Inches(0.55))
        box.fill.solid()
        box.fill.fore_color.rgb = color
        box.line.fill.background()
        tf = box.text_frame
        p = tf.paragraphs[0]
        p.text = f"«Actor»\n{name}"
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = RGBColor(255, 255, 255)
        p.font.name = "Segoe UI"
        p.alignment = PP_ALIGN.CENTER
        return box

    # =========================================================================
    # SLIDE 3: OVERALL USE CASE DIAGRAM
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_header(slide3, "Overall Use Case Diagram: Tổng quan Ca Sử dụng & 3 Phân hệ Nghiệp vụ")

    # Left Column: Generalization of Actors
    auth_user = draw_actor(slide3, Inches(0.8), Inches(1.5), "Authenticated User", RGBColor(71, 85, 105))
    
    # Label Generalization
    gen_lbl = slide3.shapes.add_textbox(Inches(0.8), Inches(2.15), Inches(1.7), Inches(0.3))
    tf_g = gen_lbl.text_frame
    p_g = tf_g.paragraphs[0]
    p_g.text = "▲ generalization"
    p_g.font.size = Pt(9)
    p_g.font.color.rgb = TEXT_MUTED
    p_g.alignment = PP_ALIGN.CENTER

    actors_pos = [
        ("Learner", COLOR_LEARNER, Inches(2.5)),
        ("Lesson Creator", COLOR_CREATOR, Inches(3.2)),
        ("Moderator", COLOR_MODERATOR, Inches(3.9)),
        ("Org Manager", COLOR_ORG_MGR, Inches(4.6)),
        ("Operations Staff", COLOR_OPS, Inches(5.3)),
        ("Administrator", COLOR_ADMIN, Inches(6.0))
    ]
    for a_name, a_col, a_y in actors_pos:
        draw_actor(slide3, Inches(0.8), a_y, a_name, a_col)

    # Central Boundary
    sys_bound = slide3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(2.8), Inches(1.4), Inches(9.8), Inches(5.5))
    sys_bound.fill.solid()
    sys_bound.fill.fore_color.rgb = RGBColor(255, 255, 255)
    sys_bound.line.color.rgb = RGBColor(203, 213, 225)
    sys_bound.line.width = Pt(1.5)

    sb_lbl = slide3.shapes.add_textbox(Inches(2.9), Inches(1.45), Inches(4.0), Inches(0.3))
    sb_lbl.text_frame.paragraphs[0].text = "System Boundary: Lingora Learning Platform"
    sb_lbl.text_frame.paragraphs[0].font.size = Pt(10)
    sb_lbl.text_frame.paragraphs[0].font.bold = True
    sb_lbl.text_frame.paragraphs[0].font.color.rgb = TEXT_MUTED

    # Top Central: Authenticate (linked to Authenticated User)
    draw_usecase(slide3, Inches(3.2), Inches(1.85), Inches(2.2), Inches(0.75), "UC-01: Authenticate\n& Manage Session", RGBColor(71, 85, 105))

    # Package LEARNING inside boundary
    pkg_lrn = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(3.0), Inches(2.75), Inches(4.5), Inches(3.95))
    pkg_lrn.fill.solid()
    pkg_lrn.fill.fore_color.rgb = RGBColor(239, 246, 255) # Blue tint
    pkg_lrn.line.color.rgb = COLOR_LEARNER

    lbl_l = slide3.shapes.add_textbox(Inches(3.1), Inches(2.8), Inches(3.0), Inches(0.3))
    lbl_l.text_frame.paragraphs[0].text = "Package LEARNING"
    lbl_l.text_frame.paragraphs[0].font.bold = True
    lbl_l.text_frame.paragraphs[0].font.size = Pt(10)
    lbl_l.text_frame.paragraphs[0].font.color.rgb = COLOR_LEARNER

    draw_usecase(slide3, Inches(3.2), Inches(3.15), Inches(2.0), Inches(0.65), "UC-03: Placement\nAssessment", COLOR_LEARNER)
    draw_usecase(slide3, Inches(5.35), Inches(3.15), Inches(1.9), Inches(0.6), "«extend»\nSkip / Retake", COLOR_LEARNER)
    draw_usecase(slide3, Inches(3.2), Inches(3.95), Inches(2.0), Inches(0.65), "UC-04: Browse Path &\nJump Challenge*", COLOR_LEARNER)
    draw_usecase(slide3, Inches(3.2), Inches(4.75), Inches(2.0), Inches(0.65), "UC-05: Complete\nLesson Exercises", COLOR_LEARNER)
    draw_usecase(slide3, Inches(5.35), Inches(4.75), Inches(1.9), Inches(0.6), "«include»\nUpdate Streak", COLOR_LEARNER)
    draw_usecase(slide3, Inches(3.2), Inches(5.55), Inches(2.0), Inches(0.65), "UC-06: Spaced\nRepetition (SRS)", COLOR_LEARNER)
    draw_usecase(slide3, Inches(5.35), Inches(5.55), Inches(1.9), Inches(0.6), "«include»\nUpdate Streak", COLOR_LEARNER)

    # Package CONTENT & ADMINISTRATION
    pkg_cnt = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.7), Inches(1.85), Inches(4.7), Inches(2.6))
    pkg_cnt.fill.solid()
    pkg_cnt.fill.fore_color.rgb = RGBColor(245, 243, 255) # Purple tint
    pkg_cnt.line.color.rgb = COLOR_ORG_MGR

    lbl_c = slide3.shapes.add_textbox(Inches(7.8), Inches(1.9), Inches(3.0), Inches(0.3))
    lbl_c.text_frame.paragraphs[0].text = "Package CONTENT (SoD Enforcement)"
    lbl_c.text_frame.paragraphs[0].font.bold = True
    lbl_c.text_frame.paragraphs[0].font.size = Pt(10)
    lbl_c.text_frame.paragraphs[0].font.color.rgb = COLOR_ORG_MGR

    draw_usecase(slide3, Inches(7.9), Inches(2.25), Inches(2.0), Inches(0.6), "UC-08: Create/Edit\nLesson Draft", COLOR_CREATOR)
    draw_usecase(slide3, Inches(10.1), Inches(2.25), Inches(2.1), Inches(0.6), "UC-09: Moderate &\nApprove Content", COLOR_MODERATOR)
    draw_usecase(slide3, Inches(7.9), Inches(3.0), Inches(2.0), Inches(0.6), "UC-10: Publish\nApproved Content", COLOR_ORG_MGR)
    draw_usecase(slide3, Inches(10.1), Inches(3.0), Inches(2.1), Inches(0.6), "«extend» Emergency\nPublish (Admin only)", COLOR_ADMIN)
    draw_usecase(slide3, Inches(8.9), Inches(3.75), Inches(2.3), Inches(0.6), "Clone-to-Draft v2\n(supersedes_id)", COLOR_ORG_MGR)

    pkg_adm = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.7), Inches(4.6), Inches(4.7), Inches(2.1))
    pkg_adm.fill.solid()
    pkg_adm.fill.fore_color.rgb = RGBColor(255, 241, 242) # Rose tint
    pkg_adm.line.color.rgb = COLOR_ADMIN

    lbl_a = slide3.shapes.add_textbox(Inches(7.8), Inches(4.65), Inches(3.0), Inches(0.3))
    lbl_a.text_frame.paragraphs[0].text = "Package ADMINISTRATION & SUPPORT"
    lbl_a.text_frame.paragraphs[0].font.bold = True
    lbl_a.text_frame.paragraphs[0].font.size = Pt(10)
    lbl_a.text_frame.paragraphs[0].font.color.rgb = COLOR_ADMIN

    draw_usecase(slide3, Inches(7.9), Inches(5.0), Inches(2.1), Inches(0.6), "UC-11: Manage\nAccounts & Roles", COLOR_ADMIN)
    draw_usecase(slide3, Inches(10.1), Inches(5.0), Inches(2.1), Inches(0.6), "UC-13: Audit\nSecurity Logs", COLOR_ADMIN)
    draw_usecase(slide3, Inches(7.9), Inches(5.8), Inches(2.1), Inches(0.6), "UC-14: Support\nCoordination (MVP)", COLOR_OPS)
    draw_usecase(slide3, Inches(10.1), Inches(5.8), Inches(2.1), Inches(0.6), "UC-15: Cohorts\n(Future Extension)", COLOR_FUTURE, is_dashed=True)

    # Note on Jump
    jp_note = slide3.shapes.add_textbox(Inches(2.8), Inches(6.9), Inches(9.8), Inches(0.4))
    jp_note.text_frame.paragraphs[0].text = "* Ghi chú: Conditional Jump Challenge là sub-flow thuộc phạm vi nghiệp vụ UC-04, không tạo Use Case ID mới ngoài 15 canonical UCs."
    jp_note.text_frame.paragraphs[0].font.size = Pt(9)
    jp_note.text_frame.paragraphs[0].font.italic = True
    jp_note.text_frame.paragraphs[0].font.color.rgb = TEXT_MUTED

    set_speaker_notes(slide3,
        "Ở góc nhìn Use Case tổng quan, 6 vai trò chuyên biệt đều kế thừa từ Authenticated User để sử dụng dịch vụ xác thực phiên làm việc tập trung UC-01. "
        "Quan hệ include được áp dụng chặt chẽ: học bài hoặc ôn tập SRS thành công sẽ kích hoạt cập nhật chuỗi Streak theo múi giờ. "
        "Nhánh Skip và Retake mở rộng từ Placement, và xuất bản khẩn cấp của Admin là quan hệ extend từ Publish với điều kiện bài đã Approved."
    )

    # =========================================================================
    # SLIDE 4: USE CASE: LEARNER
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_header(slide4, "Use Case Chi tiết: Phân hệ Học viên (Learner Core Learning)")

    draw_actor(slide4, Inches(0.8), Inches(3.2), "Learner", COLOR_LEARNER)

    # Box boundary
    lrn_bound = slide4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(3.0), Inches(1.4), Inches(9.5), Inches(5.6))
    lrn_bound.fill.solid()
    lrn_bound.fill.fore_color.rgb = RGBColor(255, 255, 255)
    lrn_bound.line.color.rgb = COLOR_LEARNER
    lrn_bound.line.width = Pt(1.5)

    # Use cases
    draw_usecase(slide4, Inches(3.5), Inches(1.7), Inches(2.5), Inches(0.8), "UC-02: Configure Goals\n& Local Timezone", COLOR_LEARNER)
    draw_usecase(slide4, Inches(3.5), Inches(2.75), Inches(2.5), Inches(0.8), "UC-03: Take Placement\nDiagnostic (30 items)", COLOR_LEARNER)
    draw_usecase(slide4, Inches(6.8), Inches(2.35), Inches(2.2), Inches(0.65), "«extend»\nSkip Pathway (U1)", COLOR_LEARNER)
    draw_usecase(slide4, Inches(6.8), Inches(3.15), Inches(2.2), Inches(0.65), "«extend»\nRetake from Profile", COLOR_LEARNER)

    draw_usecase(slide4, Inches(3.5), Inches(4.0), Inches(2.5), Inches(0.8), "UC-04: Browse Path\n(English A1 6 Units)", COLOR_LEARNER)
    draw_usecase(slide4, Inches(6.8), Inches(4.0), Inches(2.6), Inches(0.8), "«sub-flow» Conditional\nJump Challenge (≥95%)", COLOR_LEARNER)

    draw_usecase(slide4, Inches(3.5), Inches(5.1), Inches(2.5), Inches(0.8), "UC-05: Complete Lesson\n& Controlled Retry", COLOR_LEARNER)
    draw_usecase(slide4, Inches(3.5), Inches(6.05), Inches(2.5), Inches(0.7), "UC-06: Spaced Repetition\nReview (Policy B)", COLOR_LEARNER)

    # Streak target
    draw_usecase(slide4, Inches(7.5), Inches(5.45), Inches(2.3), Inches(0.8), "«included by UC-05,06»\nUC-07: Update Daily\nStreak & Progress", COLOR_LEARNER)

    # Request Support
    draw_usecase(slide4, Inches(10.0), Inches(3.2), Inches(2.2), Inches(0.8), "Submit Support\nTicket (to UC-14)", COLOR_OPS)

    # Callout Note
    c_note = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(9.6), Inches(4.4), Inches(2.7), Inches(2.2))
    c_note.fill.solid()
    c_note.fill.fore_color.rgb = RGBColor(241, 245, 249)
    c_note.line.color.rgb = CARD_BORDER
    tf_cn = c_note.text_frame
    tf_cn.word_wrap = True
    p_cn = tf_cn.paragraphs[0]
    p_cn.text = "RÀNG BUỘC NGHIỆP VỤ HỌC VIÊN:\n• Streak không phải ca sử dụng độc lập do học viên gọi tùy tiện; chỉ cập nhật qua hoàn thành bài hoặc SRS.\n• Jump là cơ chế thử thách gắn trong UC-04, có khóa hồi chiêu 24h khi trượt.\n• Điểm đúng bài tập ≠ Hoàn thành bài ≠ Mastery ≠ Năng lực."
    p_cn.font.size = Pt(8.5)
    p_cn.font.name = "Segoe UI"
    p_cn.font.color.rgb = TEXT_MAIN

    set_speaker_notes(slide4,
        "Sơ đồ ca sử dụng của học viên thể hiện chu trình học tập khép kín. Người học thiết lập mục tiêu, làm bài kiểm tra xếp lớp 30 câu hoặc chọn bỏ qua để vào thẳng Unit 1. "
        "Tính năng nhảy cóc Jump Challenge là luồng kiểm tra vượt cấp nằm trong UC-04. "
        "Chuỗi ngày học liên tục UC-07 hoàn toàn tự động được include bởi UC-05 và UC-06 dựa trên hoạt động thực chất, loại bỏ hành vi gian lận tự bấm tăng chuỗi."
    )

    # =========================================================================
    # SLIDE 5: USE CASE: CONTENT GOVERNANCE & ADMINISTRATION
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_header(slide5, "Use Case Chi tiết: Quản trị Nội dung, Phân tách Nhiệm vụ & Vận hành")

    # Actors Left Column
    draw_actor(slide5, Inches(0.8), Inches(1.6), "Lesson Creator", COLOR_CREATOR)
    draw_actor(slide5, Inches(0.8), Inches(2.9), "Moderator", COLOR_MODERATOR)
    draw_actor(slide5, Inches(0.8), Inches(4.2), "Org Manager", COLOR_ORG_MGR)
    draw_actor(slide5, Inches(0.8), Inches(5.5), "Administrator", COLOR_ADMIN)
    draw_actor(slide5, Inches(0.8), Inches(6.5), "Operations Staff", COLOR_OPS)

    # Central Boundary
    gov_bound = slide5.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(2.9), Inches(1.4), Inches(9.6), Inches(5.7))
    gov_bound.fill.solid()
    gov_bound.fill.fore_color.rgb = RGBColor(255, 255, 255)
    gov_bound.line.color.rgb = COLOR_ORG_MGR
    gov_bound.line.width = Pt(1.5)

    # Use cases
    draw_usecase(slide5, Inches(3.3), Inches(1.6), Inches(2.5), Inches(0.75), "UC-08: Author Lesson\n& 5 Exercise Payloads", COLOR_CREATOR)
    draw_usecase(slide5, Inches(6.2), Inches(1.6), Inches(2.2), Inches(0.75), "Submit Lesson\nfor Review", COLOR_CREATOR)

    draw_usecase(slide5, Inches(3.3), Inches(2.8), Inches(2.5), Inches(0.75), "UC-09: Moderate &\nEvaluate Pedagogical Quality", COLOR_MODERATOR)
    draw_usecase(slide5, Inches(6.2), Inches(2.8), Inches(2.2), Inches(0.75), "Approve / Request\nChanges (review notes)", COLOR_MODERATOR)

    draw_usecase(slide5, Inches(3.3), Inches(4.0), Inches(2.5), Inches(0.75), "UC-10: Publish Approved\nContent (Unit 4/4 Rule)", COLOR_ORG_MGR)
    draw_usecase(slide5, Inches(6.2), Inches(4.0), Inches(2.2), Inches(0.75), "Clone-to-Draft v2\n(supersedes_id)", COLOR_ORG_MGR)

    draw_usecase(slide5, Inches(9.0), Inches(4.0), Inches(2.6), Inches(0.75), "«extend» Emergency\nPublish (Admin Only)*", COLOR_ADMIN)

    draw_usecase(slide5, Inches(3.3), Inches(5.1), Inches(2.5), Inches(0.75), "UC-11: Manage Accounts\n& Column Security Grants", COLOR_ADMIN)
    draw_usecase(slide5, Inches(6.2), Inches(5.1), Inches(2.2), Inches(0.75), "UC-13: Audit Security\n& Inspect 11 Events", COLOR_ADMIN)

    draw_usecase(slide5, Inches(3.3), Inches(6.15), Inches(2.5), Inches(0.75), "UC-14: Coordinate User\nSupport Tickets (MVP)", COLOR_OPS)
    draw_usecase(slide5, Inches(6.2), Inches(6.15), Inches(2.2), Inches(0.75), "UC-15: Cohort / Group\nManagement (Future)", COLOR_FUTURE, is_dashed=True)

    # Callout Note for SoD
    sod_note = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.9), Inches(1.6), Inches(3.4), Inches(2.1))
    sod_note.fill.solid()
    sod_note.fill.fore_color.rgb = RGBColor(254, 242, 242) # Red tint
    sod_note.line.color.rgb = COLOR_ADMIN
    tf_sn = sod_note.text_frame
    tf_sn.word_wrap = True
    p_sn0 = tf_sn.paragraphs[0]
    p_sn0.text = "NGUYÊN TẮC PHÂN TÁCH NHIỆM VỤ (SOD):\nCreator ≠ Moderator ≠ Publisher"
    p_sn0.font.bold = True
    p_sn0.font.size = Pt(9.5)
    p_sn0.font.color.rgb = COLOR_ADMIN
    p_sn1 = tf_sn.add_paragraph()
    p_sn1.text = "• Creator cấm tự duyệt bài học.\n• Moderator cấm tự xuất bản bài học.\n• Manager xuất bản thông thường.\n• *Admin xuất bản khẩn cấp: Chỉ áp dụng trên bài đã APPROVED kèm lý do bắt buộc và ghi Audit Log."
    p_sn1.font.size = Pt(8.5)
    p_sn1.font.color.rgb = TEXT_MAIN

    set_speaker_notes(slide5,
        "Phân hệ quản trị và kiểm duyệt thực thi nghiêm ngặt nguyên tắc phân tách nhiệm vụ (SoD). "
        "Creator biên soạn, Moderator kiểm duyệt chuyên môn, và Organizational Manager giữ thẩm quyền xuất bản. "
        "Admin không có quyền xuất bản tự do mà chỉ được xuất bản khẩn cấp khi bài học đã qua phê duyệt Approved, đồng thời bắt buộc phải có lý do giải trình để ghi vết vào sổ cái AuditLog."
    )

    # =========================================================================
    # SLIDE 6: ACTIVITY: PLACEMENT / STARTING POINT
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_header(slide6, "Activity Diagram: Quy trình Đánh giá Chẩn đoán & Xác định Điểm Xuất phát")

    # Swimlanes
    sw_learner = slide6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.4), Inches(5.7), Inches(5.5))
    sw_learner.fill.solid()
    sw_learner.fill.fore_color.rgb = RGBColor(255, 255, 255)
    sw_learner.line.color.rgb = COLOR_LEARNER
    sw_learner.line.width = Pt(1.5)

    sw_sys = slide6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.5), Inches(1.4), Inches(6.0), Inches(5.5))
    sw_sys.fill.solid()
    sw_sys.fill.fore_color.rgb = RGBColor(248, 250, 252)
    sw_sys.line.color.rgb = ACCENT_BLUE
    sw_sys.line.width = Pt(1.5)

    # Swimlane headers
    h_l = slide6.shapes.add_textbox(Inches(0.8), Inches(1.45), Inches(5.7), Inches(0.4))
    h_l.text_frame.paragraphs[0].text = "HỌC VIÊN (LEARNER)"
    h_l.text_frame.paragraphs[0].font.bold = True
    h_l.text_frame.paragraphs[0].font.color.rgb = COLOR_LEARNER
    h_l.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

    h_s = slide6.shapes.add_textbox(Inches(6.5), Inches(1.45), Inches(6.0), Inches(0.4))
    h_s.text_frame.paragraphs[0].text = "HỆ THỐNG (SYSTEM ENGINE)"
    h_s.text_frame.paragraphs[0].font.bold = True
    h_s.text_frame.paragraphs[0].font.color.rgb = ACCENT_BLUE
    h_s.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

    def draw_node(slide, x, y, w, h, text, color=ACCENT_BLUE):
        node = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
        node.fill.solid()
        node.fill.fore_color.rgb = RGBColor(255, 255, 255)
        node.line.color.rgb = color
        node.line.width = Pt(1.5)
        tf = node.text_frame
        tf.word_wrap = True
        tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = Inches(0.04)
        p = tf.paragraphs[0]
        p.text = text
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = TEXT_MAIN
        p.font.name = "Segoe UI"
        p.alignment = PP_ALIGN.CENTER
        return node

    def draw_decision(slide, x, y, w, h, text):
        dec = slide.shapes.add_shape(MSO_SHAPE.DIAMOND, x, y, w, h)
        dec.fill.solid()
        dec.fill.fore_color.rgb = RGBColor(254, 243, 199) # Amber
        dec.line.color.rgb = RGBColor(217, 119, 6)
        dec.line.width = Pt(1.5)
        tf = dec.text_frame
        tf.word_wrap = True
        tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = Inches(0.02)
        p = tf.paragraphs[0]
        p.text = text
        p.font.size = Pt(8.5)
        p.font.bold = True
        p.font.color.rgb = RGBColor(180, 83, 9)
        p.font.name = "Segoe UI"
        p.alignment = PP_ALIGN.CENTER
        return dec

    # Nodes inside Learner Lane
    draw_node(slide6, Inches(1.2), Inches(2.0), Inches(2.0), Inches(0.6), "Start Placement\nAssessment", COLOR_LEARNER)
    draw_decision(slide6, Inches(3.6), Inches(1.95), Inches(1.4), Inches(0.7), "Skip\nDiagnostic?")
    
    # Path No -> Answer 30
    draw_node(slide6, Inches(2.0), Inches(3.2), Inches(2.4), Inches(0.65), "Answer 30 Human-Selected\nQuestions (0–30 Raw)", COLOR_LEARNER)
    draw_node(slide6, Inches(2.2), Inches(4.3), Inches(2.0), Inches(0.6), "Submit Diagnostic\nAnswers", COLOR_LEARNER)

    # Path Skip -> Skip logic in System Lane
    draw_node(slide6, Inches(7.0), Inches(2.0), Inches(4.8), Inches(0.7), "Skip Pathway: Gán Starting Unit = Unit 1\nTrạng thái UNVERIFIED | 0 AssessmentResult | 0 SkillProfile", COLOR_ORG_MGR)

    # Nodes inside System Lane
    draw_node(slide6, Inches(7.0), Inches(3.05), Inches(4.8), Inches(0.6), "Calculate Raw Score (0–30 điểm thô)\n1 Correct Answer = 1 Raw Point", ACCENT_BLUE)
    draw_node(slide6, Inches(7.0), Inches(3.9), Inches(4.8), Inches(0.65), "Apply Mapping A (Phân lớp tất định)\n0–7→U1 · 8–12→U2 · 13–17→U3 · 18–22→U4 · 23–26→U5 · 27–30→U6", ACCENT_BLUE)
    draw_node(slide6, Inches(7.0), Inches(4.8), Inches(4.8), Inches(0.6), "Store Immutable AssessmentResult\n& Derive SkillProfile (Radar Chart 4 chiều)", ACCENT_BLUE)
    draw_node(slide6, Inches(7.0), Inches(5.65), Inches(4.8), Inches(0.6), "Update Profile Starting Point (verified_starting_unit)\n& Unlock Corresponding Unit Path (U1..U6)", ACCENT_BLUE)

    # Final presentation
    draw_node(slide6, Inches(1.5), Inches(5.65), Inches(3.4), Inches(0.6), "Display Starting Point Recommendation\n& Multidimensional Skill Profile", COLOR_LEARNER)

    # Small Retake Note Box
    rt_box = slide6.shapes.add_textbox(Inches(0.8), Inches(6.35), Inches(11.7), Inches(0.5))
    rt_box.text_frame.paragraphs[0].text = "Nhánh Thi lại (Retake): Khởi tạo từ Profile cá nhân → Sinh AssessmentResult bất biến mới, cập nhật SkillProfile mà không xóa kết quả cũ. " \
                                          "Đặc tả: Đây là cơ chế xác định điểm xuất phát nội bộ (MVP Placement Rule), không cấp chứng chỉ CEFR quốc tế."
    rt_box.text_frame.paragraphs[0].font.size = Pt(8.5)
    rt_box.text_frame.paragraphs[0].font.italic = True
    rt_box.text_frame.paragraphs[0].font.color.rgb = TEXT_MUTED

    set_speaker_notes(slide6,
        "Quy trình đánh giá chẩn đoán đầu vào thực hiện chuẩn hóa trên bộ 30 câu hỏi chọn lọc do con người biên soạn, áp dụng thang điểm thô 0–30 không chuẩn hóa phức tạp. "
        "Thuật toán Mapping A tất định ánh xạ số câu đúng trực tiếp vào các Unit từ 1 đến 6. "
        "Học viên chọn Skip sẽ được xếp vào Unit 1 với trạng thái chưa kiểm định và phát sinh đúng 0 bản ghi kết quả để bảo đảm liêm chính dữ liệu."
    )

    # =========================================================================
    # SLIDE 7: ACTIVITY: LESSON LEARNING FLOW (14 NODES)
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_layout)
    add_header(slide7, "Activity Diagram: Luồng Học Bài Học, Trình Xem Nội Dung & Luyện Tập (14 Nodes)")

    # Swimlanes
    sw_l7 = slide7.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.4), Inches(5.4), Inches(5.6))
    sw_l7.fill.solid()
    sw_l7.fill.fore_color.rgb = RGBColor(255, 255, 255)
    sw_l7.line.color.rgb = COLOR_LEARNER
    sw_l7.line.width = Pt(1.5)

    sw_s7 = slide7.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.2), Inches(1.4), Inches(6.3), Inches(5.6))
    sw_s7.fill.solid()
    sw_s7.fill.fore_color.rgb = RGBColor(248, 250, 252)
    sw_s7.line.color.rgb = ACCENT_BLUE
    sw_s7.line.width = Pt(1.5)

    # Headers
    h_l7 = slide7.shapes.add_textbox(Inches(0.8), Inches(1.45), Inches(5.4), Inches(0.35))
    h_l7.text_frame.paragraphs[0].text = "HỌC VIÊN (LEARNER)"
    h_l7.text_frame.paragraphs[0].font.bold = True
    h_l7.text_frame.paragraphs[0].font.color.rgb = COLOR_LEARNER
    h_l7.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

    h_s7 = slide7.shapes.add_textbox(Inches(6.2), Inches(1.45), Inches(6.3), Inches(0.35))
    h_s7.text_frame.paragraphs[0].text = "HỆ THỐNG (SYSTEM ENGINE)"
    h_s7.text_frame.paragraphs[0].font.bold = True
    h_s7.text_frame.paragraphs[0].font.color.rgb = ACCENT_BLUE
    h_s7.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

    # 14 Canonical Nodes layout
    # 1. Open Unit
    draw_node(slide7, Inches(1.0), Inches(1.9), Inches(1.8), Inches(0.5), "1. Open Unit", COLOR_LEARNER)
    # 2. Unit available? (4/4 Published)
    draw_decision(slide7, Inches(6.5), Inches(1.8), Inches(2.2), Inches(0.75), "2. Unit available?\n(4/4 Lessons Published)")
    # 3. Unit unavailable
    draw_node(slide7, Inches(9.2), Inches(1.85), Inches(2.8), Inches(0.6), "3. Unit unavailable\n(Access blocked 403/404)", COLOR_ADMIN)
    # 4. Open Lesson
    draw_node(slide7, Inches(1.0), Inches(2.75), Inches(1.8), Inches(0.5), "4. Open Lesson", COLOR_LEARNER)
    # 5. Lesson Content Viewer
    draw_node(slide7, Inches(3.1), Inches(2.7), Inches(2.8), Inches(0.6), "5. Lesson Content Viewer\n(Vocab, Audio, Meaning, Grammar)", COLOR_ORG_MGR)
    # 6. Study Content + Start Exercises
    draw_node(slide7, Inches(1.0), Inches(3.6), Inches(2.5), Inches(0.55), "6. Study Content +\nStart Exercises", COLOR_LEARNER)
    # 7. Answer Question
    draw_node(slide7, Inches(3.8), Inches(3.6), Inches(2.1), Inches(0.55), "7. Answer Question\n(5 Unified Types)", COLOR_LEARNER)
    # 8. Correct?
    draw_decision(slide7, Inches(6.5), Inches(3.55), Inches(1.6), Inches(0.65), "8. Correct?")
    # 10. Show Explanation
    draw_node(slide7, Inches(8.6), Inches(3.55), Inches(2.2), Inches(0.55), "10. Show Explanation\n& Pedagogical Rule", ACCENT_BLUE)
    # 11. Retries used < allowance?
    draw_decision(slide7, Inches(8.5), Inches(4.45), Inches(2.4), Inches(0.75), "11. Retries used < allowance?\n[max(1, floor(N×0.10))]")
    # 12. Controlled Retry
    draw_node(slide7, Inches(4.8), Inches(4.55), Inches(3.2), Inches(0.55), "12. Controlled Retry\n(≤70% credit nếu làm lại đúng)", COLOR_CREATOR)
    # 9. More Exercises?
    draw_decision(slide7, Inches(6.5), Inches(5.45), Inches(1.8), Inches(0.65), "9. More Exercises?")
    # 13. Calculate Result + Update Progress
    draw_node(slide7, Inches(8.6), Inches(5.45), Inches(3.6), Inches(0.7), "13. Calculate Result +\nUpdate Progress, Streak & SRS", ACCENT_BLUE)
    # 14. Lesson Complete
    draw_node(slide7, Inches(1.5), Inches(5.5), Inches(2.6), Inches(0.6), "14. Lesson Complete\n(UserProgress = COMPLETED)", COLOR_MODERATOR)

    # Footnote formula
    fn7 = slide7.shapes.add_textbox(Inches(0.8), Inches(6.45), Inches(11.7), Inches(0.5))
    fn7.text_frame.paragraphs[0].text = "Quy tắc cốt lõi: Hạn ngạch allowance = max(1, floor(N×0.10)) tính theo toàn bộ phiên học. Làm lại chỉ áp dụng cho câu vừa sai, trả lời đúng nhận trần 70% credit. " \
                                       "Giao diện Lesson Content Viewer bắt buộc xuất hiện trước bài tập; việc xem nội dung không tự động công nhận hoàn thành bài học."
    fn7.text_frame.paragraphs[0].font.size = Pt(8.5)
    fn7.text_frame.paragraphs[0].font.italic = True
    fn7.text_frame.paragraphs[0].font.color.rgb = TEXT_MUTED

    set_speaker_notes(slide7,
        "Đây là luồng hoạt động trung tâm gồm chính xác 14 bước. Điểm cải tiến quan trọng là Lesson Content Viewer được đặt ngay trước khi bắt đầu bài tập, đảm bảo người học được tiếp thu kiến thức trước khi kiểm tra. "
        "Điều kiện mở Unit 4/4 Published được kiểm tra tự động ở bước 2. "
        "Cơ chế Controlled Retry ở bước 11-12 cho phép làm lại câu sai với trần điểm 70%, và hoàn thành bài học không phụ thuộc vào điểm sàn 80%."
    )

    # =========================================================================
    # SLIDE 8: ACTIVITY: CONDITIONAL JUMP CHALLENGE
    # =========================================================================
    slide8 = prs.slides.add_slide(blank_layout)
    add_header(slide8, "Activity Diagram: Thử thách Vượt cấp Nhảy bài (Conditional Jump Challenge)")

    # Swimlanes
    sw_l8 = slide8.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.4), Inches(5.5), Inches(5.5))
    sw_l8.fill.solid()
    sw_l8.fill.fore_color.rgb = RGBColor(255, 255, 255)
    sw_l8.line.color.rgb = COLOR_LEARNER
    sw_l8.line.width = Pt(1.5)

    sw_s8 = slide8.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.3), Inches(1.4), Inches(6.2), Inches(5.5))
    sw_s8.fill.solid()
    sw_s8.fill.fore_color.rgb = RGBColor(248, 250, 252)
    sw_s8.line.color.rgb = ACCENT_BLUE
    sw_s8.line.width = Pt(1.5)

    # Headers
    h_l8 = slide8.shapes.add_textbox(Inches(0.8), Inches(1.45), Inches(5.5), Inches(0.4))
    h_l8.text_frame.paragraphs[0].text = "HỌC VIÊN (LEARNER)"
    h_l8.text_frame.paragraphs[0].font.bold = True
    h_l8.text_frame.paragraphs[0].font.color.rgb = COLOR_LEARNER
    h_l8.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

    h_s8 = slide8.shapes.add_textbox(Inches(6.3), Inches(1.45), Inches(6.2), Inches(0.4))
    h_s8.text_frame.paragraphs[0].text = "HỆ THỐNG (SYSTEM ENGINE)"
    h_s8.text_frame.paragraphs[0].font.bold = True
    h_s8.text_frame.paragraphs[0].font.color.rgb = ACCENT_BLUE
    h_s8.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

    # Nodes
    draw_node(slide8, Inches(1.2), Inches(2.0), Inches(2.8), Inches(0.65), "Open Conditional\nJump Challenge", COLOR_LEARNER)
    draw_decision(slide8, Inches(7.5), Inches(1.95), Inches(2.0), Inches(0.75), "Check Cooldown\n(24h Active?)")

    # Cooldown Active -> Block
    draw_node(slide8, Inches(10.0), Inches(2.0), Inches(2.2), Inches(0.65), "Block Challenge\n(429 Cooldown Active)", COLOR_ADMIN)

    # Cooldown Inactive -> Start Challenge
    draw_node(slide8, Inches(7.0), Inches(3.1), Inches(3.0), Inches(0.65), "Start Challenge &\nDeliver Questions (20/25-30/40q)", ACCENT_BLUE)
    draw_node(slide8, Inches(1.2), Inches(3.1), Inches(2.8), Inches(0.65), "Answer Challenge\nQuestions", COLOR_LEARNER)

    # Calculate Score
    draw_node(slide8, Inches(7.0), Inches(4.1), Inches(3.0), Inches(0.65), "Calculate Challenge Score\n(So khớp đáp án máy chủ)", ACCENT_BLUE)
    draw_decision(slide8, Inches(7.5), Inches(5.05), Inches(2.0), Inches(0.75), "Score ≥ 95.0%?")

    # Success Path
    draw_node(slide8, Inches(1.0), Inches(5.0), Inches(4.8), Inches(0.85), "JUMP SUCCESS: Unlock Target Unit & Lesson 1\nRecord Provenance: by_jump = true & SKIPPED_BY_JUMP\n(Áp dụng cho các Unit & Lesson bị nhảy qua)", COLOR_MODERATOR)

    # Fail Path
    draw_node(slide8, Inches(9.8), Inches(5.05), Inches(2.4), Inches(0.75), "JUMP FAILED:\nSet 24h Server Cooldown\n(Giữ nguyên vị trí học cũ)", COLOR_ADMIN)

    # Bottom Clarification Banner
    jp_clr = slide8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.15), Inches(11.7), Inches(0.8))
    jp_clr.fill.solid()
    jp_clr.fill.fore_color.rgb = RGBColor(241, 245, 249)
    jp_clr.line.color.rgb = CARD_BORDER
    tf_jc = jp_clr.text_frame
    tf_jc.word_wrap = True
    p_jc = tf_jc.paragraphs[0]
    p_jc.text = "ĐẶC TẢ NGỮ NGHĨA JUMP CHUẨN TẮC (DOCS/09 §3 & M2.2):\n" \
               "• Khi Đạt (≥95%): Toàn bộ bài học thuộc các Unit bị nhảy qua nhận trạng thái SKIPPED_BY_JUMP (by_jump = true). Unit đích được mở khóa để học bình thường.\n" \
               "• Bất biến: Tuyệt đối CẤM gán COMPLETED_BY_JUMP. Vượt cấp Jump không phải là hoàn thành học phần và không cấp chứng chỉ."
    p_jc.font.size = Pt(8.5)
    p_jc.font.name = "Segoe UI"
    p_jc.font.color.rgb = TEXT_MAIN

    set_speaker_notes(slide8,
        "Thử thách Jump Challenge là một hoạt động kiểm tra độc lập trên lộ trình học tập, không tự động kích hoạt sau bài học. "
        "Yêu cầu đạt ngưỡng điểm rất cao là từ 95% trở lên. "
        "Khi vượt qua, các bài học bị nhảy qua sẽ nhận nhãn SKIPPED_BY_JUMP với cờ by_jump = true, và Unit đích được mở khóa. "
        "Nếu không đạt, hệ thống kích hoạt thời gian phạt hồi chiêu 24 giờ trên máy chủ."
    )

    # =========================================================================
    # SLIDE 9: ACTIVITY: CONTENT GOVERNANCE
    # =========================================================================
    slide9 = prs.slides.add_slide(blank_layout)
    add_header(slide9, "Activity Diagram: Vòng đời Quản trị, Kiểm duyệt & Xuất bản Nội dung")

    # 4 Swimlanes layout
    lanes = [
        ("Org Manager", COLOR_ORG_MGR, Inches(0.8), Inches(2.7)),
        ("Lesson Creator", COLOR_CREATOR, Inches(3.5), Inches(2.7)),
        ("Moderator", COLOR_MODERATOR, Inches(6.2), Inches(2.7)),
        ("Administrator", COLOR_ADMIN, Inches(8.9), Inches(3.6))
    ]
    for l_title, l_col, l_x, l_w in lanes:
        lane = slide9.shapes.add_shape(MSO_SHAPE.RECTANGLE, l_x, Inches(1.4), l_w, Inches(4.7))
        lane.fill.solid()
        lane.fill.fore_color.rgb = RGBColor(255, 255, 255)
        lane.line.color.rgb = l_col
        lane.line.width = Pt(1.5)

        lh = slide9.shapes.add_textbox(l_x, Inches(1.45), l_w, Inches(0.35))
        lh.text_frame.paragraphs[0].text = l_title.upper()
        lh.text_frame.paragraphs[0].font.bold = True
        lh.text_frame.paragraphs[0].font.color.rgb = l_col
        lh.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

    # Nodes
    # Org Mgr Assign
    draw_node(slide9, Inches(1.0), Inches(1.9), Inches(2.3), Inches(0.55), "Assign Lesson\n(assigned_creator_id)", COLOR_ORG_MGR)
    # Creator Author
    draw_node(slide9, Inches(3.7), Inches(1.9), Inches(2.3), Inches(0.55), "Author Draft\n(Vocab & 5 Exercises)", COLOR_CREATOR)
    # Creator Submit
    draw_node(slide9, Inches(3.7), Inches(2.7), Inches(2.3), Inches(0.55), "Submit for Review\n(status: IN_REVIEW)", COLOR_CREATOR)
    # Moderator Review
    draw_node(slide9, Inches(6.4), Inches(2.7), Inches(2.3), Inches(0.55), "Review Content\n(Evaluate Quality)", COLOR_MODERATOR)
    # Moderator Decision
    draw_decision(slide9, Inches(6.6), Inches(3.5), Inches(1.9), Inches(0.7), "Approve or\nRequest Changes?")
    # Changes Requested -> Edit
    draw_node(slide9, Inches(3.7), Inches(3.55), Inches(2.3), Inches(0.6), "Edit Revisions\n(CHANGES_REQUESTED)", COLOR_CREATOR)
    # Org Mgr Publish
    draw_node(slide9, Inches(1.0), Inches(4.4), Inches(2.3), Inches(0.6), "Publish Lesson\n(APPROVED → PUBLISHED)", COLOR_ORG_MGR)

    # Sub-branch: Clone-to-Draft v2
    draw_node(slide9, Inches(1.0), Inches(5.2), Inches(4.8), Inches(0.6), "Clone-to-Draft v2: Published v1 → Clone Draft v2 (supersedes_id)\nEdit v2 → Review/Approve → Publish v2 → Archive v1", COLOR_ORG_MGR)

    # Admin Emergency Publish
    draw_node(slide9, Inches(9.1), Inches(2.7), Inches(3.2), Inches(0.75), "Emergency Publish:\nChỉ áp dụng bài đã APPROVED\nBắt buộc lý do + Ghi AuditLog", COLOR_ADMIN)

    # Large Callout SoD Banner
    callout_sod = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.2), Inches(11.7), Inches(0.8))
    callout_sod.fill.solid()
    callout_sod.fill.fore_color.rgb = RGBColor(254, 242, 242)
    callout_sod.line.color.rgb = COLOR_ADMIN
    callout_sod.line.width = Pt(1.5)
    tf_cs = callout_sod.text_frame
    p_cs = tf_cs.paragraphs[0]
    p_cs.text = "NGUYÊN TẮC BẢO MẬT & PHÂN TÁCH NHIỆM VỤ CỐT LÕI (SOD):\n" \
               "Creator ≠ Moderator ≠ Publisher  |  Unit hiển thị khi và chỉ khi đủ 4/4 bài ở trạng thái PUBLISHED"
    p_cs.font.bold = True
    p_cs.font.size = Pt(10)
    p_cs.font.color.rgb = COLOR_ADMIN
    p_cs.alignment = PP_ALIGN.CENTER

    set_speaker_notes(slide9,
        "Quy trình quản trị nội dung thực hiện chu trình kiểm duyệt khép kín 6 trạng thái. "
        "Phân định rõ ràng: Creator soạn bài, Moderator thẩm định, và Manager xuất bản. "
        "Cơ chế Clone-to-Draft v2 đảm bảo nội dung đã xuất bản không bao giờ bị sửa đè trực tiếp mà được tạo revision mới liên kết qua trường supersedes_id."
    )

    # Helper function for drawing UML Class Boxes
    def draw_uml_class(slide, x, y, w, h, class_name, stereotype="CURRENT", attributes=[], operations=[]):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
        card.fill.solid()
        card.fill.fore_color.rgb = RGBColor(255, 255, 255)
        
        is_target = "TARGET" in stereotype
        border_col = RGBColor(234, 88, 12) if is_target else RGBColor(71, 85, 105) # Orange for Target, Slate for Current
        card.line.color.rgb = border_col
        card.line.width = Pt(1.5)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_top = tf.margin_left = tf.margin_right = tf.margin_bottom = Inches(0.04)

        # Stereotype & Name
        p0 = tf.paragraphs[0]
        p0.text = f"«{stereotype}»\n{class_name}"
        p0.font.size = Pt(9.5)
        p0.font.bold = True
        p0.font.color.rgb = border_col
        p0.font.name = "Segoe UI"
        p0.alignment = PP_ALIGN.CENTER
        p0.space_after = Pt(2)

        # Attributes
        for attr in attributes:
            p = tf.add_paragraph()
            p.text = attr
            p.font.size = Pt(8.5)
            p.font.color.rgb = TEXT_MAIN
            p.font.name = "Segoe UI"
            p.space_after = Pt(1)

        return card

    # =========================================================================
    # SLIDE 10: CLASS DIAGRAM: CONTENT DOMAIN
    # =========================================================================
    slide10 = prs.slides.add_slide(blank_layout)
    add_header(slide10, "Class Diagram: Miền Quản trị Nội dung Giáo trình (Content Domain)")

    # Classes in Content Domain
    # Course (Current)
    draw_uml_class(slide10, Inches(0.8), Inches(1.5), Inches(2.6), Inches(2.0), "Course", "CURRENT", [
        "+ id: UUID",
        "+ languageCode: String",
        "+ cefr: Cefr",
        "+ orderIndex: Int",
        "+ status: ContentStatus",
        "+ isPublished: Boolean"
    ])

    # Unit (Current)
    draw_uml_class(slide10, Inches(4.0), Inches(1.5), Inches(2.6), Inches(2.0), "Unit", "CURRENT", [
        "+ id: UUID",
        "+ courseId: UUID",
        "+ orderIndex: Int",
        "+ createdAt: DateTime"
    ])

    # Lesson (Current)
    draw_uml_class(slide10, Inches(7.2), Inches(1.5), Inches(2.6), Inches(2.0), "Lesson", "CURRENT", [
        "+ id: UUID",
        "+ courseId: UUID",
        "+ unitId: UUID [TARGET FK]",
        "+ orderIndex: Int",
        "+ status: ContentStatus"
    ])

    # LessonRevision (Target)
    draw_uml_class(slide10, Inches(10.2), Inches(1.5), Inches(2.4), Inches(2.2), "LessonRevision", "TARGET (PHASE 2)", [
        "+ id: UUID",
        "+ lessonId: UUID",
        "+ version: Int",
        "+ status: ContentStatus",
        "+ supersedesId: UUID?",
        "+ assignedCreatorId: UUID"
    ])

    # Vocabulary (Current)
    draw_uml_class(slide10, Inches(0.8), Inches(4.3), Inches(2.6), Inches(2.1), "Vocabulary", "CURRENT", [
        "+ id: UUID",
        "+ languageCode: String",
        "+ term: String",
        "+ normalizedTerm: String",
        "+ audioUrl: String?",
        "+ cefr: Cefr?"
    ])

    # LessonVocabulary (Current)
    draw_uml_class(slide10, Inches(4.0), Inches(4.3), Inches(2.6), Inches(1.8), "LessonVocabulary", "CURRENT", [
        "+ lessonId: UUID",
        "+ vocabularyId: UUID",
        "+ orderIndex: Int"
    ])

    # Exercise (Current / Target FK)
    draw_uml_class(slide10, Inches(7.2), Inches(4.3), Inches(2.8), Inches(2.1), "Exercise", "CURRENT (SCHEMA)", [
        "+ id: UUID",
        "+ lessonRevisionId: UUID [TARGET]",
        "+ type: ExerciseType (5 types)",
        "+ payload: Json (no answer secret)",
        "+ orderIndex: Int"
    ])

    # Relationships Annotation Box
    rel_box = slide10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(10.2), Inches(4.3), Inches(2.4), Inches(2.1))
    rel_box.fill.solid()
    rel_box.fill.fore_color.rgb = RGBColor(241, 245, 249)
    rel_box.line.color.rgb = CARD_BORDER
    tf_rb = rel_box.text_frame
    tf_rb.word_wrap = True
    p_rb = tf_rb.paragraphs[0]
    p_rb.text = "QUAN HỆ BẮT BUỘC:\n" \
               "• Course 1 ── 1..* Unit\n" \
               "• Unit 1 ── 4 Lesson (exactly)\n" \
               "• Lesson 1 ── 1..* Revision\n" \
               "• Lesson * ── * Vocabulary (qua LessonVocabulary)\n" \
               "• Revision 1 ── 1..* Exercise [TARGET]\n" \
               "• KHÔNG nối Lesson ── Exercise trực tiếp trong Phase 2."
    p_rb.font.size = Pt(8.5)
    p_rb.font.name = "Segoe UI"
    p_rb.font.color.rgb = TEXT_MAIN

    # Constraint banner
    cs_ban = slide10.shapes.add_textbox(Inches(0.8), Inches(6.6), Inches(11.7), Inches(0.4))
    cs_ban.text_frame.paragraphs[0].text = "Ràng buộc cấu trúc giáo trình A1: {Unit = exactly 4 Lessons} và {Unit visible only when all 4 Lessons are Published}."
    cs_ban.text_frame.paragraphs[0].font.size = Pt(9.5)
    cs_ban.text_frame.paragraphs[0].font.bold = True
    cs_ban.text_frame.paragraphs[0].font.color.rgb = COLOR_ORG_MGR

    set_speaker_notes(slide10,
        "Sơ đồ lớp phân hệ nội dung phân định rõ giữa thực thể hiện tại trong database và các thành phần mở rộng Phase 2. "
        "Course, Unit, Lesson, Vocabulary, Exercise là các bảng hiện có. "
        "Bảng LessonRevision là thiết kế mục tiêu để hiện thực hóa cơ chế quản lý phiên bản và Clone-to-Draft v2, trong đó Exercise sẽ trỏ về Revision thay vì trỏ thẳng vào Lesson."
    )

    # =========================================================================
    # SLIDE 11: CLASS DIAGRAM: LEARNER & ASSESSMENT STATE
    # =========================================================================
    slide11 = prs.slides.add_slide(blank_layout)
    add_header(slide11, "Class Diagram: Trạng thái Học viên & Động cơ Đánh giá (Learner & Assessment State)")

    # Profile (Current)
    draw_uml_class(slide11, Inches(0.8), Inches(1.5), Inches(2.7), Inches(2.4), "Profile", "CURRENT", [
        "+ id: UUID",
        "+ email: String",
        "+ role: Role (Single Role)",
        "+ streakCount: Int",
        "+ lastQualifyingDate: Date?",
        "+ timezone: String",
        "+ verified_starting_unit: Int [TARGET]"
    ])

    # UserProgress (Current)
    draw_uml_class(slide11, Inches(3.8), Inches(1.5), Inches(2.7), Inches(2.4), "UserProgress", "CURRENT", [
        "+ id: UUID",
        "+ userId: UUID",
        "+ lessonId: UUID",
        "+ status: ProgressStatus",
        "+ score: Int?",
        "+ completedAt: DateTime?",
        "note: «state» Retry usage",
        "note: «state» Jump cooldown"
    ])

    # UserVocabSrs (Current)
    draw_uml_class(slide11, Inches(6.8), Inches(1.5), Inches(2.7), Inches(2.4), "UserVocabSrs", "CURRENT", [
        "+ id: UUID",
        "+ userId: UUID",
        "+ vocabularyId: UUID",
        "+ intervalDays: Float",
        "+ nextReviewAt: DateTime",
        "+ reviewCount: Int"
    ])

    # ReviewLog (Current)
    draw_uml_class(slide11, Inches(9.8), Inches(1.5), Inches(2.7), Inches(2.0), "ReviewLog", "CURRENT", [
        "+ id: UUID",
        "+ srsCardId: UUID",
        "+ isCorrect: Boolean",
        "+ intervalDays: Float",
        "+ reviewedAt: DateTime"
    ])

    # AssessmentResult (Target)
    draw_uml_class(slide11, Inches(0.8), Inches(4.2), Inches(3.2), Inches(2.1), "AssessmentResult", "TARGET (PHASE 2)", [
        "+ id: UUID",
        "+ userId: UUID",
        "+ assessmentType: Diagnostic/Jump",
        "+ rawScore: Int (0..30)",
        "+ dimensions: Json",
        "+ completedAt: DateTime (Immutable)"
    ])

    # SkillProfile (Target)
    draw_uml_class(slide11, Inches(4.3), Inches(4.2), Inches(3.0), Inches(2.1), "SkillProfile", "TARGET (PHASE 2)", [
        "+ id: UUID",
        "+ userId: UUID",
        "+ vocabLevel: Float",
        "+ grammarLevel: Float",
        "+ readingLevel: Float",
        "+ listeningLevel: Float"
    ])

    # AuditLog (Current)
    draw_uml_class(slide11, Inches(7.6), Inches(4.2), Inches(2.6), Inches(2.1), "AuditLog", "CURRENT", [
        "+ id: UUID",
        "+ actorId: UUID",
        "+ action: String (11 events)",
        "+ entityType: String",
        "+ entityId: String",
        "+ createdAt: DateTime"
    ])

    # Role Enumeration
    draw_uml_class(slide11, Inches(10.5), Inches(4.2), Inches(2.0), Inches(2.1), "«enum» Role", "CURRENT", [
        "LEARNER",
        "LESSON_CREATOR",
        "MODERATOR",
        "ORG_MANAGER",
        "OPERATIONS_STAFF",
        "ADMINISTRATOR"
    ])

    # Invariant Banner
    inv_box = slide11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.45), Inches(11.7), Inches(0.65))
    inv_box.fill.solid()
    inv_box.fill.fore_color.rgb = RGBColor(238, 242, 255) # Indigo tint
    inv_box.line.color.rgb = RGBColor(99, 102, 241)
    tf_ib = inv_box.text_frame
    p_ib = tf_ib.paragraphs[0]
    p_ib.text = "BẤT BIẾN TOÀN VẸN SƯ PHẠM & DỮ LIỆU:  UserProgress ≠ verified proficiency (SkillProfile)  và  AssessmentResult ≠ UserProgress"
    p_ib.font.bold = True
    p_ib.font.size = Pt(10)
    p_ib.font.color.rgb = RGBColor(67, 56, 202)
    p_ib.alignment = PP_ALIGN.CENTER

    set_speaker_notes(slide11,
        "Sơ đồ lớp trạng thái học viên phản ánh tính liêm chính trong đo lường tiến độ. "
        "UserProgress chỉ đo lường tiến trình hoàn thành nội dung bài học, tuyệt đối không đồng nhất với năng lực thực chất (SkillProfile). "
        "Các bảng AssessmentResult và SkillProfile là thiết kế mục tiêu để lưu trữ lịch sử đánh giá chẩn đoán bất biến. "
        "Role được cài đặt dưới dạng enumeration gắn trực tiếp vào Profile theo mô hình vai trò đơn."
    )

    # =========================================================================
    # SLIDE 12: TRACEABILITY MATRIX
    # =========================================================================
    slide12 = prs.slides.add_slide(blank_layout)
    add_header(slide12, "Traceability Matrix: Ma trận Truy vết từ Ca Sử dụng đến Lớp Nghiệp vụ")

    # Table creation
    rows = 9
    cols = 4
    left = Inches(0.8)
    top = Inches(1.5)
    width = Inches(11.7)
    height = Inches(4.4)

    table_shape = slide12.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table

    # Set column widths
    table.columns[0].width = Inches(1.8)
    table.columns[1].width = Inches(2.6)
    table.columns[2].width = Inches(2.6)
    table.columns[3].width = Inches(4.7)

    table_data = [
        ("UC ID (M2.2)", "Use Case Name", "Activity Diagram", "Main Domain Classes"),
        ("UC-03", "Placement Assessment", "Placement Activity", "Profile, AssessmentResult, SkillProfile (chẩn đoán/retake)"),
        ("UC-04", "Browse Learning Path", "Learning Activity", "Course, Unit, Lesson, LessonRevision, Vocabulary"),
        ("UC-05", "Complete Lesson Exercises", "Learning Activity", "LessonRevision, Exercise (5 types), UserProgress"),
        ("UC-06", "Spaced Repetition Review (SRS)", "Learning Activity", "UserVocabSrs, Vocabulary, ReviewLog, UserProgress"),
        ("UC-07", "Track Progress & Streak", "Learning Activity", "Profile (streak_count, lastQualifyingActivityDate, timezone)"),
        ("— (sub-flow)", "Conditional Jump Challenge", "Jump Activity", "UserProgress (by_jump, SKIPPED_BY_JUMP), Unit, AssessmentResult"),
        ("UC-08", "Author Lesson Draft", "Governance Activity", "Lesson, LessonRevision, Exercise, Profile"),
        ("UC-09, 10", "Review & Publish Content", "Governance Activity", "LessonRevision, Profile, AuditLog, Unit")
    ]

    for r_idx, row in enumerate(table_data):
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx, c_idx)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            p.font.name = "Segoe UI"
            if r_idx == 0:
                p.font.bold = True
                p.font.size = Pt(10)
                p.font.color.rgb = RGBColor(255, 255, 255)
                cell.fill.solid()
                cell.fill.fore_color.rgb = RGBColor(30, 41, 59)
            else:
                p.font.size = Pt(9)
                p.font.color.rgb = TEXT_MAIN
                cell.fill.solid()
                cell.fill.fore_color.rgb = RGBColor(255, 255, 255) if r_idx % 2 == 1 else RGBColor(248, 250, 252)
                if c_idx == 0:
                    p.font.bold = True
                    p.font.color.rgb = COLOR_LEARNER if "UC-0" in val else COLOR_ORG_MGR

    # Bottom Notes & Final Thesis Conclusion
    fn12 = slide12.shapes.add_textbox(Inches(0.8), Inches(6.0), Inches(11.7), Inches(0.4))
    fn12.text_frame.paragraphs[0].text = "Ghi chú kỹ thuật: Cooldown là design-level state được kiểm soát từ máy chủ; biểu diễn vật lý tuân thủ thiết kế triển khai đã phê duyệt."
    fn12.text_frame.paragraphs[0].font.size = Pt(8.5)
    fn12.text_frame.paragraphs[0].font.italic = True
    fn12.text_frame.paragraphs[0].font.color.rgb = TEXT_MUTED

    concl_box = slide12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.35), Inches(11.7), Inches(0.8))
    concl_box.fill.solid()
    concl_box.fill.fore_color.rgb = BG_DARK
    concl_box.line.color.rgb = BG_DARK
    tf_c = concl_box.text_frame
    tf_c.word_wrap = True
    p_c0 = tf_c.paragraphs[0]
    p_c0.text = "KẾT LUẬN MÔ HÌNH HÓA KỸ NGHỆ PHẦN MỀM"
    p_c0.font.bold = True
    p_c0.font.size = Pt(9.5)
    p_c0.font.color.rgb = RGBColor(56, 189, 248) # Sky 400
    p_c0.alignment = PP_ALIGN.CENTER

    p_c1 = tf_c.add_paragraph()
    p_c1.text = "Use Case xác định hệ thống phải làm gì.  ·  Activity xác định hành động diễn ra như thế nào.  ·  Class Diagram xác định các đối tượng và quan hệ hỗ trợ những hành động đó."
    p_c1.font.bold = True
    p_c1.font.size = Pt(10.5)
    p_c1.font.color.rgb = RGBColor(255, 255, 255)
    p_c1.alignment = PP_ALIGN.CENTER

    set_speaker_notes(slide12,
        "Ma trận truy vết là mắt xích liên kết toàn diện giữa 15 Ca sử dụng, các biểu đồ hoạt động và các lớp thực thể trong cơ sở dữ liệu. "
        "Mọi hành vi được mô tả trong Activity Diagram đều có các lớp cụ thể bảo trợ dữ liệu, và mọi Use Case đều truy vết được nguồn gốc từ yêu cầu người dùng. "
        "Đây là cơ sở vững chắc để bước vào giai đoạn cài đặt hệ thống ở Giai đoạn 2."
    )

    prs.save(output_path)
    print(f"Presentation successfully saved to: {output_path}")

if __name__ == "__main__":
    out_dir = r"docs\report"
    os.makedirs(out_dir, exist_ok=True)
    target_file = os.path.join(out_dir, "Lingora-System-Modeling-Presentation-v3.pptx")
    create_deck(target_file)
