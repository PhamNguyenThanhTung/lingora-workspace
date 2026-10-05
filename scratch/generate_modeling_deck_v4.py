import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6] # blank layout

    # Colors
    NAVY = RGBColor(15, 23, 42)      # #0F172A
    SLATE = RGBColor(71, 85, 105)    # #475569
    LIGHT_BG = RGBColor(248, 250, 252) # #F8FAFC
    WHITE = RGBColor(255, 255, 255)
    BORDER_COLOR = RGBColor(226, 232, 240)
    
    ROLE_COLORS = {
        "Learner": (RGBColor(37, 99, 235), "Learner (Xanh dương)"),
        "Creator": (RGBColor(234, 88, 12), "Lesson Creator (Cam)"),
        "Moderator": (RGBColor(22, 163, 74), "Moderator (Xanh lá)"),
        "OrgMgr": (RGBColor(124, 58, 237), "Org Manager (Tím)"),
        "Ops": (RGBColor(13, 148, 136), "Operations Staff (Xanh ngọc)"),
        "Admin": (RGBColor(159, 18, 57), "Administrator (Đỏ đô)"),
        "Future": (RGBColor(156, 163, 175), "Future / Ngoại vi (Xám đứt)")
    }

    diagram_dir = "docs/diagrams/lingora-modeling/out"
    output_pptx = "docs/diagrams/lingora-modeling/deck/Lingora-System-Modeling-Presentation-v4.pptx"

    def add_header(slide, title_text, category_text):
        # Header box
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.9))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p0 = tf.paragraphs[0]
        p0.text = category_text.upper()
        p0.font.name = "Segoe UI"
        p0.font.size = Pt(10)
        p0.font.bold = True
        p0.font.color.rgb = RGBColor(2, 132, 199) # Sky blue
        p0.space_after = Pt(2)

        p1 = tf.add_paragraph()
        p1.text = title_text
        p1.font.name = "Segoe UI"
        p1.font.size = Pt(20)
        p1.font.bold = True
        p1.font.color.rgb = NAVY

    def add_diagram_slide(slide, title, category, img_path, caption=None, notes_text=""):
        add_header(slide, title, category)
        
        # Available content box: y = 1.35 to 6.85 (height 5.5 in, width 11.733 in)
        max_w = 11.733
        max_h = 5.4
        box_left = 0.8
        box_top = 1.35

        if os.path.exists(img_path):
            from PIL import Image
            with Image.open(img_path) as im:
                img_w, img_h = im.size
            
            # Determine target dimensions preserving aspect ratio
            ratio_w = max_w / img_w
            ratio_h = max_h / img_h
            scale = min(ratio_w, ratio_h)
            
            final_w = img_w * scale
            final_h = img_h * scale
            final_left = box_left + (max_w - final_w) / 2
            final_top = box_top + (max_h - final_h) / 2
            
            slide.shapes.add_picture(img_path, Inches(final_left), Inches(final_top), width=Inches(final_w), height=Inches(final_h))
        
        if caption:
            cap_box = slide.shapes.add_textbox(Inches(0.8), Inches(6.9), Inches(11.733), Inches(0.4))
            tf = cap_box.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = caption
            p.font.name = "Segoe UI"
            p.font.size = Pt(11)
            p.font.bold = True
            p.font.color.rgb = SLATE
            p.alignment = PP_ALIGN.CENTER

        if notes_text:
            slide.notes_slide.notes_text_frame.text = notes_text

    # ==========================================
    # SLIDE 1: COVER
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = WHITE
    bg1.line.fill.background()

    # Title container
    c_box = s1.shapes.add_textbox(Inches(1.5), Inches(2.0), Inches(10.333), Inches(3.5))
    tf1 = c_box.text_frame
    tf1.word_wrap = True

    p0 = tf1.paragraphs[0]
    p0.text = "LINGORA PLATFORM"
    p0.font.name = "Segoe UI"
    p0.font.size = Pt(16)
    p0.font.bold = True
    p0.font.color.rgb = RGBColor(2, 132, 199)
    p0.space_after = Pt(12)

    p1 = tf1.add_paragraph()
    p1.text = "Phân Tích & Mô Hình Hóa Hệ Thống\nNền Tảng Học Ngoại Ngữ Trực Tuyến"
    p1.font.name = "Segoe UI"
    p1.font.size = Pt(32)
    p1.font.bold = True
    p1.font.color.rgb = NAVY
    p1.space_after = Pt(16)

    p2 = tf1.add_paragraph()
    p2.text = "Use Case · Activity Diagram · Class Diagram · Traceability"
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(16)
    p2.font.color.rgb = SLATE
    p2.space_after = Pt(28)

    p3 = tf1.add_paragraph()
    p3.text = "Báo cáo Chuyên đề Kỹ thuật Phần mềm (Phase 1 / M2 Locked Baseline — Deck v4)"
    p3.font.name = "Segoe UI"
    p3.font.size = Pt(12)
    p3.font.color.rgb = RGBColor(148, 163, 184)

    s1.notes_slide.notes_text_frame.text = (
        "Chào mừng Hội đồng và Thầy Cô. Bài báo cáo này tập trung chuyên sâu vào phân tích và mô hình hóa hệ thống Lingora "
        "dưới các góc nhìn chuẩn mực của Kỹ thuật Phần mềm: Ca sử dụng (Use Case), Sơ đồ hoạt động (Activity Diagram), "
        "Sơ đồ lớp (Class Diagram) và Ma trận truy vết (Traceability Matrix). Toàn bộ mô hình tuân thủ thiết kế khóa M2 và Master Plan."
    )

    # ==========================================
    # SLIDE 2: OVERVIEW ARCHITECTURE
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "Tổng Quan Kiến Trúc Nghiệp Vụ & Ranh Giới Vai Trò", "Phân rã hệ thống")

    # 3 Packages Cards
    pkg_w = Inches(3.75)
    pkg_h = Inches(4.2)
    pkg_y = Inches(1.35)
    pkgs = [
        ("LEARNING PACKAGE", "Phân hệ Học tập Cốt lõi", [
            "• Xác thực & quản lý phiên học viên (UC-01)",
            "• Thiết lập mục tiêu & thời lượng học (UC-02)",
            "• Đánh giá chẩn đoán đầu vào (UC-03)",
            "• Khám phá lộ trình học & cây kỹ năng (UC-04)",
            "• Học lý thuyết (Viewer) & làm bài tập (UC-05)",
            "• Ôn tập lặp lại ngắt quãng SRS (UC-06)",
            "• Theo dõi tiến độ & chuỗi ngày học Streak (UC-07)"
        ], RGBColor(239, 246, 255), RGBColor(37, 99, 235)),
        ("CONTENT PACKAGE", "Phân hệ Quản trị Nội dung", [
            "• Lập kế hoạch & soạn thảo bài học (UC-08)",
            "• Soạn thảo bài tập & từ vựng đi kèm (UC-08)",
            "• Đệ trình & kiểm duyệt nội dung (UC-09)",
            "• Phê duyệt hoặc yêu cầu chỉnh sửa (UC-09)",
            "• Xuất bản bài học đã duyệt (UC-10)",
            "• Cơ chế Clone-to-Draft bảo toàn lịch sử",
            "• Xuất bản khẩn cấp có giải trình & audit (Admin)"
        ], RGBColor(255, 247, 237), RGBColor(234, 88, 12)),
        ("ADMIN & SUPPORT", "Phân hệ Vận hành & Hệ thống", [
            "• Quản lý tài khoản & phân quyền 6 vai trò (UC-11)",
            "• Báo cáo tổng hợp vận hành hệ thống (UC-12)",
            "• Nhật ký kiểm toán an ninh AuditLog (UC-13)",
            "• Tiếp nhận & điều phối hỗ trợ (UC-14 MVP)",
            "• Ranh giới mở rộng nhóm/cohort (UC-15 Future)",
            "• Thực thi nguyên tắc phân tách nhiệm vụ (SoD)",
            "• Bất biến bảo vệ tính toàn vẹn dữ liệu"
        ], RGBColor(240, 253, 244), RGBColor(22, 163, 74))
    ]

    for i, (p_title, p_sub, bullets, bg_col, bdr_col) in enumerate(pkgs):
        px = Inches(0.8 + i * 3.99)
        card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, px, pkg_y, pkg_w, pkg_h)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_col
        card.line.color.rgb = bdr_col
        card.line.width = Pt(1.5)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = Inches(0.2)
        tf.margin_top = Inches(0.2)

        p = tf.paragraphs[0]
        p.text = p_title
        p.font.name = "Segoe UI"
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = bdr_col
        p.space_after = Pt(2)

        p_s = tf.add_paragraph()
        p_s.text = p_sub
        p_s.font.name = "Segoe UI"
        p_s.font.size = Pt(10)
        p_s.font.color.rgb = SLATE
        p_s.space_after = Pt(10)

        for b in bullets:
            pb = tf.add_paragraph()
            pb.text = b
            pb.font.name = "Segoe UI"
            pb.font.size = Pt(9.5)
            pb.font.color.rgb = NAVY
            pb.space_after = Pt(3)

    # Actor Chips Row at bottom
    chip_y = Inches(5.75)
    chip_w = Inches(1.85)
    chip_h = Inches(0.55)
    actors = [
        ("Learner", RGBColor(37, 99, 235)),
        ("Lesson Creator", RGBColor(234, 88, 12)),
        ("Moderator", RGBColor(22, 163, 74)),
        ("Org Manager", RGBColor(124, 58, 237)),
        ("Operations Staff", RGBColor(13, 148, 136)),
        ("Administrator", RGBColor(159, 18, 57))
    ]

    for i, (act_name, col) in enumerate(actors):
        ax = Inches(0.8 + i * 1.99)
        chip = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, ax, chip_y, chip_w, chip_h)
        chip.fill.solid()
        chip.fill.fore_color.rgb = WHITE
        chip.line.color.rgb = col
        chip.line.width = Pt(1.5)

        tf = chip.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = act_name
        p.font.name = "Segoe UI"
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = col
        p.alignment = PP_ALIGN.CENTER

    # Boundary notice
    nb_box = s2.shapes.add_textbox(Inches(0.8), Inches(6.45), Inches(11.733), Inches(0.5))
    tf_nb = nb_box.text_frame
    tf_nb.word_wrap = True
    p = tf_nb.paragraphs[0]
    p.text = "Phân định phạm vi: UC-14 Support Ticket thuộc MVP (điều phối hỗ trợ). UC-15 Cohort / Group Management thuộc Future Extension (viền đứt, xám). Ranh giới vai trò thực thi nghiêm ngặt SoD."
    p.font.name = "Segoe UI"
    p.font.size = Pt(10)
    p.font.color.rgb = SLATE
    p.alignment = PP_ALIGN.CENTER

    s2.notes_slide.notes_text_frame.text = (
        "Hệ thống Lingora được phân rã thành ba gói kiến trúc nghiệp vụ rõ ràng: Learning, Content, và Administration. "
        "Mô hình chuẩn hóa 6 vai trò chính thức, trong đó UC-14 xử lý khiếu nại ở mức MVP điều phối hỗ trợ, và UC-15 quản lý nhóm "
        "được định vị là phần mở rộng tương lai (Future Extension). Các nguyên tắc phân tách nhiệm vụ được đảm bảo triệt để."
    )

    # ==========================================
    # SLIDE 3: OVERALL USE CASE
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    add_diagram_slide(
        s3,
        "Sơ Đồ Ca Sử Dụng Tổng Quan (Overall Use Case Diagram)",
        "Mô hình hóa ca sử dụng",
        os.path.join(diagram_dir, "02-usecase-overall.png"),
        "6 tác nhân kế thừa Authenticated User · 15 Use Case nghiệp vụ · Phân tách 3 gói kiến trúc",
        "Ở góc nhìn Use Case tổng quan, 6 vai trò chuyên biệt đều kế thừa từ Authenticated User để dùng chung cơ chế xác thực UC-01. "
        "Ranh giới hệ thống phân định rõ ràng giữa Learning (UC-01 đến 07), Content (UC-08 đến 10), và Administration (UC-11 đến 14). "
        "UC-15 được phân lập hoàn toàn thành khối Future Extension độc lập, không gây phụ thuộc ngược vào lõi."
    )

    # ==========================================
    # SLIDE 4: DETAILED LEARNER USE CASE
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    add_diagram_slide(
        s4,
        "Sơ Đồ Ca Sử Dụng Chi Tiết — Phân Hệ Học Viên (Learner)",
        "Mô hình hóa ca sử dụng",
        os.path.join(diagram_dir, "03-usecase-learner.png"),
        "Bao gồm Lesson Content Viewer trước bài tập · Controlled Retry & Conditional Jump là luồng mở rộng (extend)",
        "Sơ đồ ca sử dụng của học viên thể hiện chu trình học tập khép kín. Điểm mấu chốt được chuẩn hóa là bước Lesson Content Viewer "
        "được include trực tiếp vào UC-05 trước khi làm bài tập. Controlled Retry là luồng extend có kiểm soát điểm, và Conditional Jump Challenge "
        "là một năng lực vượt cấp mở rộng từ UC-04 có quy chế bảo vệ nghiêm ngặt."
    )

    # ==========================================
    # SLIDE 5: CONTENT & ADMIN USE CASE
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    add_diagram_slide(
        s5,
        "Sơ Đồ Ca Sử Dụng Chi Tiết — Phân Hệ Nội Dung & Quản Trị",
        "Mô hình hóa ca sử dụng",
        os.path.join(diagram_dir, "04-usecase-content-admin.png"),
        "Thực thi nguyên tắc SoD (Creator ≠ Moderator ≠ Org Manager) · Admin Emergency Publish bắt buộc AuditLog",
        "Phân hệ quản trị và kiểm duyệt thực thi nghiêm ngặt nguyên tắc Phân tách nhiệm vụ (Separation of Duties). "
        "Lesson Creator tạo bản nháp nhưng không có quyền tự duyệt; Moderator kiểm duyệt đạt chất lượng; Organizational Manager là người duy nhất "
        "có thẩm quyền xuất bản chính thức. Administrator chỉ xuất bản khẩn cấp khi có lý do chính đáng và bắt buộc ghi nhận AuditLog."
    )

    # ==========================================
    # SLIDE 6: ACTIVITY PLACEMENT
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    add_diagram_slide(
        s6,
        "Sơ Đồ Hoạt Động — Đánh Giá Chẩn Đoán Đầu Vào (Diagnostic Test)",
        "Mô hình hóa luồng hoạt động",
        os.path.join(diagram_dir, "05-activity-placement.png"),
        "Chuẩn hóa đúng 30 câu hỏi chuyên gia · Thang điểm 0–30 · Mapping A sang Unit 1–6 · Bất biến xuất xứ",
        "Quy trình đánh giá chẩn đoán đầu vào thực hiện chuẩn hóa trên bộ 30 câu hỏi được hội đồng chuyên môn tuyển chọn thủ công. "
        "Thang điểm thô 0-30 điểm được ánh xạ qua Mapping A để chỉ định Unit bắt đầu từ 1 đến 6. "
        "Trường hợp bỏ qua bài kiểm tra sẽ được gán Unit 1 mặc định với trạng thái chưa xác minh, không tạo bản ghi rác trong SkillProfile."
    )

    # ==========================================
    # SLIDE 7: ACTIVITY LEARNING FLOW
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    add_diagram_slide(
        s7,
        "Sơ Đồ Hoạt Động — Hoàn Thành Bài Học & Bài Tập (14 Bước)",
        "Mô hình hóa luồng hoạt động",
        os.path.join(diagram_dir, "06-activity-learning.png"),
        "Bắt buộc qua Lesson Content Viewer · Hạn mức Retry max(1, floor(N*0.10)) trần 70% · Cập nhật Streak & SRS",
        "Đây là luồng hoạt động trung tâm gồm chính xác 14 bước. Điểm chốt then chốt là học viên bắt buộc đi qua bước 2 và 3 "
        "(Lesson Content Viewer) để học từ vựng và ngữ pháp trước khi bước vào làm bài tập. Cơ chế làm lại bài sai tuân theo công thức "
        "max(1, floor(N*0.10)) với mức điểm trần 70%, bảo đảm tính công bằng học thuật và kích hoạt chuỗi Streak."
    )

    # ==========================================
    # SLIDE 8: ACTIVITY CONDITIONAL JUMP
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    add_diagram_slide(
        s8,
        "Sơ Đồ Hoạt Động — Thử Thách Nhảy Cấp (Conditional Jump)",
        "Mô hình hóa luồng hoạt động",
        os.path.join(diagram_dir, "07-activity-jump.png"),
        "Ngưỡng đỗ ≥95% · Cooldown 24h khi trượt · Đơn vị nhảy qua nhận SKIPPED_BY_JUMP · Mở khóa UNLOCKED cho Unit đích",
        "Thử thách Jump Challenge là một hoạt động kiểm tra độc lập tách biệt khỏi bài học thông thường. "
        "Để vượt cấp, học viên phải đạt điểm số tuyệt đối từ 95% trở lên. Khi đỗ, các bài học đi qua được gắn cờ SKIPPED_BY_JUMP, "
        "và Unit đích được mở khóa ở trạng thái UNLOCKED. Nếu thất bại, hệ thống khóa làm lại 24 giờ để tránh lạm dụng thử sai liên tục."
    )

    # ==========================================
    # SLIDE 9: ACTIVITY GOVERNANCE
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    add_diagram_slide(
        s9,
        "Sơ Đồ Hoạt Động — Quản Trị & Xuất Bản Nội Dung (Content Governance)",
        "Mô hình hóa luồng hoạt động",
        os.path.join(diagram_dir, "08-activity-governance.png"),
        "Vòng đời Clone-to-Draft · Moderator phê duyệt · Org Manager kiểm tra điều kiện 4/4 bài học trước khi mở Unit",
        "Quy trình quản trị nội dung thực hiện chu trình kiểm duyệt khép kín qua 5 làn bơi tương ứng với các vai trò. "
        "Cơ chế Clone-to-Draft tạo bản sửa đổi độc lập giúp bảo toàn tính bất biến của bài học đang phát hành. "
        "Một Unit chỉ được kích hoạt mở cho học viên khi hội đủ điều kiện đóng băng: 4 trên 4 bài học con đã được xuất bản hoàn tất."
    )

    # ==========================================
    # SLIDE 10: CLASS CONTENT
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    add_diagram_slide(
        s10,
        "Sơ Đồ Lớp — Phân Hệ Cấu Trúc Nội Dung & Khóa Học",
        "Mô hình hóa cấu trúc dữ liệu",
        os.path.join(diagram_dir, "09-class-content.png"),
        "Phân định rõ <<CURRENT>> (schema.prisma) và <<TARGET (PHASE 2)>> (LessonRevision, unit_id, lesson_revision_id)",
        "Sơ đồ lớp phân hệ nội dung phân định rõ giữa thực thể hiện tại trong schema.prisma và thiết kế mục tiêu Phase 2. "
        "Trong đó, LessonRevision là thực thể đích quan trọng giúp lưu vết lịch sử các phiên bản nội dung và khóa ngoại unit_id, "
        "lesson_revision_id được chuẩn hóa để đảm bảo quan hệ phân cấp chặt chẽ Course - Unit - Lesson."
    )

    # ==========================================
    # SLIDE 11: CLASS LEARNER ASSESSMENT
    # ==========================================
    s11 = prs.slides.add_slide(blank_layout)
    add_diagram_slide(
        s11,
        "Sơ Đồ Lớp — Phân Hệ Học Viên, Đánh Giá & Tiến Độ",
        "Mô hình hóa cấu trúc dữ liệu",
        os.path.join(diagram_dir, "10-class-learner-assessment.png"),
        "Bảo toàn bất biến: Tiến độ ≠ Năng lực · Thực thể mục tiêu AssessmentResult & SkillProfile · Trạng thái Retry/Jump",
        "Sơ đồ lớp trạng thái học viên phản ánh tính liêm chính trong dữ liệu học tập. Bất biến quan trọng được mô hình hóa là "
        "sự bóc tách giữa UserProgress (tiến độ hoàn thành tuyến tính) và SkillProfile (năng lực kỹ năng thực tế qua AssessmentResult). "
        "Các trạng thái Retry allowance và Jump cooldown được mô hình hóa dưới dạng ghi chú thuộc tính hành vi."
    )

    # ==========================================
    # SLIDE 12: TRACEABILITY MATRIX
    # ==========================================
    s12 = prs.slides.add_slide(blank_layout)
    add_header(s12, "Ma Trận Truy Vết Nghiệp Vụ Toàn Diện (Traceability Matrix)", "Kiểm định & xác minh")

    # Native PPTX Table
    rows = 16
    cols = 5
    table_shape = s12.shapes.add_table(rows, cols, Inches(0.8), Inches(1.35), Inches(11.733), Inches(5.4))
    table = table_shape.table
    table.columns[0].width = Inches(1.1)
    table.columns[1].width = Inches(3.2)
    table.columns[2].width = Inches(2.2)
    table.columns[3].width = Inches(3.0)
    table.columns[4].width = Inches(2.233)

    headers = ["UC ID", "Tên Ca Sử Dụng (Use Case)", "Sơ Đồ Hoạt Động", "Lớp Dữ Liệu Liên Quan", "Phạm Vi Triển Khai"]
    for j, h in enumerate(headers):
        cell = table.cell(0, j)
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.name = "Segoe UI"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = WHITE
        p.alignment = PP_ALIGN.CENTER

    matrix_data = [
        ("UC-01", "Authenticate & Manage Session", "Activity: Learner Journey", "Profile, Role", "CORE (Phase 2 MVP)"),
        ("UC-02", "Configure Goals & Study Time", "Activity: Learner Journey", "Profile", "CORE (Phase 2 MVP)"),
        ("UC-03", "Take Placement Test", "05-activity-placement (Slide 6)", "AssessmentResult, SkillProfile", "CORE (Phase 2 MVP)"),
        ("UC-04", "Browse Learning Path & Progress", "07-activity-jump (Slide 8)", "Course, Unit, Lesson, UserProgress", "CORE (Phase 2 MVP)"),
        ("UC-05", "Complete Lesson & Exercises", "06-activity-learning (Slide 7)", "Lesson, Exercise, UserProgress", "CORE (Phase 2 MVP)"),
        ("UC-06", "Spaced Repetition Review (SRS)", "Activity: SRS Review Flow", "Vocabulary, UserVocabSrs, ReviewLog", "CORE (Phase 2 MVP)"),
        ("UC-07", "Track Learning Progress & Streak", "06-activity-learning (Slide 7)", "Profile, UserProgress", "CORE (Phase 2 MVP)"),
        ("UC-08", "Create & Edit Lesson Draft", "08-activity-governance (Slide 9)", "Lesson, LessonRevision, Exercise", "CORE (Phase 2 MVP)"),
        ("UC-09", "Review & Moderate Content", "08-activity-governance (Slide 9)", "LessonRevision, AuditLog", "CORE (Phase 2 MVP)"),
        ("UC-10", "Publish Approved Content", "08-activity-governance (Slide 9)", "Unit, Lesson, LessonRevision, AuditLog", "CORE (Phase 2 MVP)"),
        ("UC-11", "Manage Accounts & Roles", "Sequence: Admin Ops", "Profile, Role, AuditLog", "CORE (Phase 2 MVP)"),
        ("UC-12", "View System Operational Reports", "Sequence: Admin Ops", "UserProgress, AuditLog", "CORE (Phase 2 MVP)"),
        ("UC-13", "View & Audit Security Logs", "Sequence: Admin Ops", "AuditLog", "CORE (Phase 2 MVP)"),
        ("UC-14", "Handle Support Ticket", "Activity: Support Handling", "SupportTicket (MVP Boundary)", "MVP (Coordination)"),
        ("UC-15", "Manage Cohorts & Groups", "Sequence: Cohort Mgmt", "Cohort, CohortMember", "FUTURE EXTENSION")
    ]

    for i, row in enumerate(matrix_data):
        for j, val in enumerate(row):
            cell = table.cell(i + 1, j)
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(241, 245, 249) if i % 2 == 1 else WHITE
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = "Segoe UI"
            p.font.size = Pt(8.5)
            if j == 0:
                p.font.bold = True
                p.alignment = PP_ALIGN.CENTER
                p.font.color.rgb = RGBColor(37, 99, 235)
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
        "Ma trận truy vết là mắt xích liên kết toàn diện giữa 15 Ca sử dụng nghiệp vụ với các sơ đồ động (Activity/Sequence) "
        "và mô hình tĩnh (Class Diagram). Toàn bộ 13 ca sử dụng đầu tiên thuộc phạm vi cốt lõi đã có liên kết trực tiếp tới cấu trúc "
        "dữ liệu và luồng kiểm thử, bảo đảm không có tính năng nào bị bỏ sót hay tự tạo ngoài đặc tả."
    )

    prs.save(output_pptx)
    print(f"Presentation v4 successfully saved to: {output_pptx}")

if __name__ == "__main__":
    create_deck()
