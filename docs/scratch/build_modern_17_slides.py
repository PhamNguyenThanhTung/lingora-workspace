# -*- coding: utf-8 -*-
"""
Build complete 17 slides for Lingora presentation with modern UI styling:
- Offset headers from left (x=1.65") to completely avoid colliding with UTC logo.
- NO redundant footers/takeaways at the bottom of any slide.
- Slide 3: 4 sleek horizontal transformation rows (Problem -> Solution) replacing giant boxes.
- Slide 12: Real, human-understandable software features (NO cryptic CORE-xx codes).
- Slide 17: Modern sleek pillar cards with circular number badges, clean status tags, no harsh box wraps.
- Slide 5 & 6: High-DPI analytical chart infographics.
- Slide 15: Clean graphical workflow diagrams (Content Flow & Learner Journey).
- Slide 16: Exact 15 Canonical Use Cases (UC-01 to UC-15) with accurate SoD actor mapping.
"""

import os
import sys
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# Reconfigure stdout for utf-8
sys.stdout.reconfigure(encoding='utf-8')

# Color definitions
C_NAVY      = RGBColor(10, 37, 64)       # #0A2540 - Primary Dark
C_TITLE     = RGBColor(15, 23, 42)       # #0F172A - Title Dark
C_SUBTITLE  = RGBColor(71, 85, 105)      # #475569 - Subtitle Gray
C_BLUE      = RGBColor(37, 99, 235)      # #2563EB - Learner / Primary
C_PURPLE    = RGBColor(124, 58, 237)     # #7C3AED - Manager / Secondary
C_ORANGE    = RGBColor(234, 88, 12)      # #EA580C - Lesson Creator
C_GREEN     = RGBColor(16, 185, 129)     # #10B981 - Moderator
C_GRAY      = RGBColor(100, 116, 139)    # #64748B - Operations
C_RED       = RGBColor(190, 18, 60)      # #BE123C - Administrator
C_CARD_BG   = RGBColor(255, 255, 255)    # #FFFFFF - Solid Card Fill
C_CARD_TINT = RGBColor(248, 250, 252)    # #F8FAFC - Soft Card Tint
C_BORDER    = RGBColor(226, 232, 240)    # #E2E8F0 - Subtle Border
C_DARK_TEXT = RGBColor(30, 41, 59)       # #1E293B - Body Dark
C_MUTED     = RGBColor(100, 116, 139)    # #64748B - Body Muted
C_WHITE     = RGBColor(255, 255, 255)

def add_header(slide, category_text, title_text, subtitle_text, cat_color=C_BLUE):
    """Adds a modern pill badge, bold title, two-tone accent bar, and subtitle offset from UTC logo."""
    left_x = Inches(1.65)
    
    # Category Pill Badge
    pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_x, Inches(0.35), Inches(2.3), Inches(0.30))
    pill.fill.solid()
    pill.fill.fore_color.rgb = cat_color
    pill.line.fill.background()
    tf_p = pill.text_frame
    tf_p.word_wrap = False
    tf_p.margin_left = tf_p.margin_right = tf_p.margin_top = tf_p.margin_bottom = 0
    p_p = tf_p.paragraphs[0]
    p_p.text = category_text.upper()
    p_p.font.name = "Segoe UI"
    p_p.font.size = Pt(9.5)
    p_p.font.bold = True
    p_p.font.color.rgb = C_WHITE
    p_p.alignment = PP_ALIGN.CENTER
    
    # Title
    t_box = slide.shapes.add_textbox(left_x, Inches(0.70), Inches(11.0), Inches(0.55))
    tf_t = t_box.text_frame
    tf_t.word_wrap = True
    tf_t.margin_left = tf_t.margin_right = tf_t.margin_top = tf_t.margin_bottom = 0
    p_t = tf_t.paragraphs[0]
    p_t.text = title_text
    p_t.font.name = "Segoe UI"
    p_t.font.size = Pt(22)
    p_t.font.bold = True
    p_t.font.color.rgb = C_NAVY
    
    # Two-tone accent line below title
    line1 = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left_x, Inches(1.28), Inches(1.0), Inches(0.04))
    line1.fill.solid()
    line1.fill.fore_color.rgb = cat_color
    line1.line.fill.background()
    
    line2 = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left_x + Inches(1.05), Inches(1.28), Inches(1.5), Inches(0.04))
    line2.fill.solid()
    line2.fill.fore_color.rgb = RGBColor(203, 213, 225)
    line2.line.fill.background()
    
    # Subtitle
    if subtitle_text:
        s_box = slide.shapes.add_textbox(left_x, Inches(1.36), Inches(11.0), Inches(0.35))
        tf_s = s_box.text_frame
        tf_s.word_wrap = True
        tf_s.margin_left = tf_s.margin_right = tf_s.margin_top = tf_s.margin_bottom = 0
        p_s = tf_s.paragraphs[0]
        p_s.text = subtitle_text
        p_s.font.name = "Segoe UI"
        p_s.font.size = Pt(12)
        p_s.font.color.rgb = C_SUBTITLE

def create_card(slide, left, top, width, height, bg_color=C_CARD_BG, border_color=C_BORDER, border_width=Pt(1)):
    """Creates a modern rounded card shape with clean background and border."""
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    if border_color:
        card.line.color.rgb = border_color
        card.line.width = border_width
    else:
        card.line.fill.background()
    return card

def main():
    template_path = "docs/scratch/clean_template.pptx"
    out_paths = [
        "docs/report/Lingora-Project-1-Requirements-Presentation.pptx",
        "docs/project-1/Lingora-Project-1-Requirements-Presentation.pptx"
    ]
    
    prs = pptx.Presentation(template_path)
    while len(prs.slides) > 0:
        rId = prs.slides._sldIdLst[0].rId
        prs.part.drop_rel(rId)
        del prs.slides._sldIdLst[0]
        
    blank_layout = prs.slide_layouts[6]

    # ==================== SLIDE 1: TITLE SLIDE ====================
    s1 = prs.slides.add_slide(blank_layout)
    left_t = Inches(1.65)
    
    # Hero category pill
    pill = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_t, Inches(1.4), Inches(2.6), Inches(0.38))
    pill.fill.solid()
    pill.fill.fore_color.rgb = C_BLUE
    pill.line.fill.background()
    tf_p = pill.text_frame
    p_p = tf_p.paragraphs[0]
    p_p.text = "BÁO CÁO DỰ ÁN 1 — CNTT"
    p_p.font.name = "Segoe UI"
    p_p.font.size = Pt(11)
    p_p.font.bold = True
    p_p.font.color.rgb = C_WHITE
    p_p.alignment = PP_ALIGN.CENTER
    
    # Title
    t_box = s1.shapes.add_textbox(left_t, Inches(1.95), Inches(11.0), Inches(1.6))
    tf_t = t_box.text_frame
    tf_t.word_wrap = True
    p_t = tf_t.paragraphs[0]
    p_t.text = "LINGORA — NỀN TẢNG HỌC NGOẠI NGỮ TRỰC TUYẾN"
    p_t.font.name = "Segoe UI"
    p_t.font.size = Pt(28)
    p_t.font.bold = True
    p_t.font.color.rgb = C_NAVY
    
    p_sub = tf_t.add_paragraph()
    p_sub.text = "Nghiên cứu nhu cầu người học, phân tích nghiệp vụ & đặc tả yêu cầu hệ thống"
    p_sub.font.name = "Segoe UI"
    p_sub.font.size = Pt(16)
    p_sub.font.color.rgb = C_BLUE
    p_sub.space_before = Pt(8)
    
    # Two-tone accent line
    l1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, left_t, Inches(3.75), Inches(1.5), Inches(0.05))
    l1.fill.solid()
    l1.fill.fore_color.rgb = C_BLUE
    l1.line.fill.background()
    l2 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, left_t + Inches(1.55), Inches(3.75), Inches(2.5), Inches(0.05))
    l2.fill.solid()
    l2.fill.fore_color.rgb = RGBColor(203, 213, 225)
    l2.line.fill.background()
    
    # Student / Project Info Card
    info_card = create_card(s1, left_t, Inches(4.1), Inches(8.5), Inches(2.2), bg_color=C_CARD_TINT, border_color=C_BORDER)
    tf_info = info_card.text_frame
    tf_info.word_wrap = True
    tf_info.margin_left = Inches(0.3)
    tf_info.margin_top = Inches(0.2)
    
    lines_info = [
        ("Cơ sở đào tạo:", "Trường Đại học Giao thông Vận tải (UTC) — Khoa Công nghệ Thông tin"),
        ("Học phần:", "Dự án 1 — Phân tích yêu cầu & Thiết kế hệ thống"),
        ("Sinh viên thực hiện:", "Phạm Nguyễn Thanh Tùng"),
        ("Giảng viên hướng dẫn:", "TS. Nguyễn Thị Thu Trang"),
        ("Thời gian thực hiện:", "Tháng 09/2026")
    ]
    for idx, (label, val) in enumerate(lines_info):
        p = tf_info.paragraphs[0] if idx == 0 else tf_info.add_paragraph()
        p.space_after = Pt(4)
        run_l = p.add_run()
        run_l.text = f"{label} "
        run_l.font.bold = True
        run_l.font.size = Pt(11)
        run_l.font.color.rgb = C_NAVY
        run_v = p.add_run()
        run_v.text = val
        run_v.font.size = Pt(11)
        run_v.font.color.rgb = C_DARK_TEXT

    # ==================== SLIDE 2: AGENDA ====================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "Mục lục chương trình", "Từ vấn đề thực tế đến yêu cầu hệ thống", "Lộ trình 5 phần báo cáo được xây dựng trên bằng chứng thực nghiệm và đối chuẩn thực tế")
    
    agenda_items = [
        ("01", "Bối cảnh & Phương pháp luận", "Thực trạng học ngoại ngữ, bài toán kỷ luật & 5 phương pháp nghiên cứu tiếp cận.", C_BLUE),
        ("02", "Nghiên cứu thực nghiệm", "Khảo sát ban đầu N=15, khảo sát bổ sung N=35 & phỏng vấn định tính N=3 người học.", C_PURPLE),
        ("03", "Nghiên cứu chuyên gia & Vận hành", "Phỏng vấn chuyên sâu 7 chuyên gia (Manager, Creator, Moderator, Ops, Admin) & Pháp lý.", C_ORANGE),
        ("04", "Ma trận & Đặc tả yêu cầu", "Ma trận truy vết thực tế, bộ yêu cầu 12 CORE + 8 EXT + NFRs & Ma trận SoD 6 vai trò.", C_GREEN),
        ("05", "Quy trình, Use Case & Kết luận", "2 luồng nghiệp vụ cốt lõi, 15 Canonical Use Cases, hiện trạng kỹ thuật & ranh giới liêm chính.", C_RED)
    ]
    
    for idx, (num, title, desc, color) in enumerate(agenda_items):
        top_y = Inches(1.85 + idx * 0.95)
        card = create_card(s2, Inches(0.8), top_y, Inches(11.5), Inches(0.82), bg_color=C_CARD_TINT, border_color=C_BORDER)
        
        # Number Badge Circle
        badge = s2.shapes.add_shape(MSO_SHAPE.OVAL, Inches(1.0), top_y + Inches(0.16), Inches(0.50), Inches(0.50))
        badge.fill.solid()
        badge.fill.fore_color.rgb = color
        badge.line.fill.background()
        tf_b = badge.text_frame
        tf_b.margin_left = tf_b.margin_right = tf_b.margin_top = tf_b.margin_bottom = 0
        tf_b.word_wrap = False
        p_b = tf_b.paragraphs[0]
        p_b.text = num
        p_b.font.name = "Segoe UI"
        p_b.font.size = Pt(12)
        p_b.font.bold = True
        p_b.font.color.rgb = C_WHITE
        p_b.alignment = PP_ALIGN.CENTER
        
        # Text block
        tb = s2.shapes.add_textbox(Inches(1.7), top_y + Inches(0.10), Inches(10.3), Inches(0.65))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = 0
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.bold = True
        p1.font.size = Pt(13)
        p1.font.color.rgb = C_NAVY
        
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = C_MUTED
        p2.space_before = Pt(2)

    # ==================== SLIDE 3: PROBLEM STATEMENT (4 TRANSFORMATION ROWS) ====================
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "Bối cảnh thực tế", "Vấn đề không chỉ là học, mà là học đều và nhớ lâu", "Khoảng trống giữa mong muốn học ngoại ngữ và thói quen duy trì kỷ luật học tập hàng ngày")
    
    rows3 = [
        ("Học dồn & Dễ nản lòng", "Học viên học 30–45 phút ban đầu rồi đuối sức, bỏ dở sau 1–2 tuần.",
         "Bài học vi mô (Micro-learning)", "5–10 phút/bài, chỉ 8–10 từ vựng cốt lõi, dễ duy trì đều đặn mỗi ngày."),
        ("Quên từ vựng (Ebbinghaus)", "100% người học đối mặt với việc quên từ vựng nhanh chóng sau khi học.",
         "Ôn tập ngắt quãng (SRS)", "Tự động tính chu kỳ 1 → 3 → 7 → 14 → 30 ngày, gom từ đến hạn cần ôn."),
        ("Làm sai không có giải thích", "Bực bội vì sai chỉ thấy dấu X đỏ, không biết vì sao sai và cách sửa.",
         "Phản hồi tức thì & Retry", "Giải thích ngữ pháp/nghĩa từ ngay khi sai; làm lại câu sai cuối bài (~10%)."),
        ("Khủng hoảng chất lượng học liệu", "Học liệu lỗi ngữ pháp, audio sai, nguy cơ tự duyệt bài thiếu minh bạch.",
         "Mô hình quản trị SoD 4 mắt", "Creator soạn bài != Moderator duyệt != Manager xuất bản; Audit Log bất biến.")
    ]
    
    for idx, (p_title, p_desc, s_title, s_desc) in enumerate(rows3):
        top_y = Inches(1.85 + idx * 1.25)
        
        # Left Pain Point Cardlet
        c_left = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), top_y, Inches(5.5), Inches(1.12))
        c_left.fill.solid()
        c_left.fill.fore_color.rgb = RGBColor(254, 242, 242)
        c_left.line.color.rgb = RGBColor(254, 202, 202)
        c_left.line.width = Pt(1)
        tf_l = c_left.text_frame
        tf_l.word_wrap = True
        tf_l.margin_left = Inches(0.2)
        tf_l.margin_top = Inches(0.12)
        p1 = tf_l.paragraphs[0]
        p1.text = f"⚠ RÀO CẢN: {p_title.upper()}"
        p1.font.bold = True
        p1.font.size = Pt(10)
        p1.font.color.rgb = RGBColor(220, 38, 38)
        p2 = tf_l.add_paragraph()
        p2.text = p_desc
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = C_DARK_TEXT
        p2.space_before = Pt(3)
        
        # Arrow in middle
        arr = s3.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(6.38), top_y + Inches(0.40), Inches(0.45), Inches(0.28))
        arr.fill.solid()
        arr.fill.fore_color.rgb = C_BLUE
        arr.line.fill.background()
        
        # Right Solution Cardlet
        c_right = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), top_y, Inches(5.5), Inches(1.12))
        c_right.fill.solid()
        c_right.fill.fore_color.rgb = RGBColor(240, 253, 244)
        c_right.line.color.rgb = RGBColor(187, 247, 208)
        c_right.line.width = Pt(1)
        tf_r = c_right.text_frame
        tf_r.word_wrap = True
        tf_r.margin_left = Inches(0.2)
        tf_r.margin_top = Inches(0.12)
        p1 = tf_r.paragraphs[0]
        p1.text = f"✓ GIẢI PHÁP LINGORA: {s_title.upper()}"
        p1.font.bold = True
        p1.font.size = Pt(10)
        p1.font.color.rgb = RGBColor(5, 150, 105)
        p2 = tf_r.add_paragraph()
        p2.text = s_desc
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = C_DARK_TEXT
        p2.space_before = Pt(3)

    # ==================== SLIDE 4: RESEARCH METHODOLOGY ====================
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "Phương pháp luận", "Mỗi câu hỏi được trả lời bằng phương pháp độc lập", "Không quy chụp dữ liệu; kết hợp khảo sát định lượng, phỏng vấn định tính và kiểm chứng pháp lý")
    
    methods = [
        ("Khảo sát sơ bộ N=15", "24 câu hỏi bao quát", "Xác định các trở ngại cốt lõi: 100% quên từ vựng, 4.13/5 nhu cầu nhắc ôn và thói quen tự học.", C_BLUE),
        ("Khảo sát bổ sung N=35", "Tập trung 2 biến số", "Xác định khung giờ vàng tự học (20:00–22:00 chiếm 51.4%) và tỷ lệ đồng ý làm lại câu sai (54.3%).", C_PURPLE),
        ("Phỏng vấn định tính N=3", "Bán cấu trúc chuyên sâu", "Tìm hiểu nguyên nhân bỏ dở ứng dụng: tâm lý nản lòng vì dồn ứ bài, sai không giải thích, bài học quá dài.", C_ORANGE),
        ("Phỏng vấn chuyên gia (7)", "5 nhóm vai trò vận hành", "Xây dựng quy tắc quản trị: Task Spec 5 trường, Unit 4/4 bài, tiêu chí QC 6 điểm và phân định SoD.", C_GREEN),
        ("Đối chuẩn & Pháp lý", "Benchmark & Legal", "So sánh Duolingo/Quizlet; rà soát Luật ATTT 86/2015, Nghị định 13/2023 về bảo vệ dữ liệu cá nhân.", C_RED)
    ]
    
    for idx, (title, sub, desc, color) in enumerate(methods):
        top_y = Inches(1.85 + idx * 0.95)
        card = create_card(s4, Inches(0.8), top_y, Inches(11.5), Inches(0.82), bg_color=C_CARD_TINT, border_color=C_BORDER)
        
        # Left strip
        strip = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), top_y, Inches(0.10), Inches(0.82))
        strip.fill.solid()
        strip.fill.fore_color.rgb = color
        strip.line.fill.background()
        
        # Step tag
        tag = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.1), top_y + Inches(0.18), Inches(2.2), Inches(0.46))
        tag.fill.solid()
        tag.fill.fore_color.rgb = color
        tag.line.fill.background()
        tf_tag = tag.text_frame
        p_t1 = tf_tag.paragraphs[0]
        p_t1.text = title
        p_t1.font.bold = True
        p_t1.font.size = Pt(10)
        p_t1.font.color.rgb = C_WHITE
        p_t1.alignment = PP_ALIGN.CENTER
        
        p_t2 = tf_tag.add_paragraph()
        p_t2.text = sub
        p_t2.font.size = Pt(8)
        p_t2.font.color.rgb = C_WHITE
        p_t2.alignment = PP_ALIGN.CENTER
        
        # Description
        tb = s4.shapes.add_textbox(Inches(3.5), top_y + Inches(0.15), Inches(8.5), Inches(0.55))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = desc
        p.font.size = Pt(11)
        p.font.color.rgb = C_DARK_TEXT

    # ==================== SLIDE 5: SURVEY N=15 ====================
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "Khảo sát thực nghiệm", "Khảo sát ban đầu N=15: Vấn đề nào cần giải quyết?", "24 câu hỏi khảo sát giúp xác định chính xác các rào cản tâm lý và nhu cầu học tập cốt lõi")
    
    s5_chart_path = "docs/scratch/assets/s5_survey_n15.png"
    if os.path.exists(s5_chart_path):
        s5.shapes.add_picture(s5_chart_path, Inches(0.8), Inches(1.8), width=Inches(11.5))
        
    insights = [
        ("Trở ngại quên từ vựng (100%):", "Toàn bộ 15/15 người được khảo sát thừa nhận thường xuyên quên từ vựng sau khi học. Cần thuật toán ôn tập tự động.", C_BLUE),
        ("Nhắc nhở ôn tập (4.13/5):", "Nhu cầu tự động nhắc ôn từ vựng ở mức rất cấp thiết (12/15 người đánh giá 4 hoặc 5 điểm Likert).", C_GREEN),
        ("Gợi ý lộ trình (93.3%):", "14/15 người học mong muốn hệ thống tự động kiểm tra đầu vào và đề xuất bài học phù hợp với trình độ.", C_PURPLE),
        ("Bài tập tương tác (73.3%):", "Người học ưu tiên các dạng bài tập điền từ, trắc nghiệm nhanh và nghe nhận diện từ có phản hồi ngay.", C_ORANGE)
    ]
    for idx, (title, desc, color) in enumerate(insights):
        left_x = Inches(0.8 + idx * 2.92)
        card = create_card(s5, left_x, Inches(4.5), Inches(2.75), Inches(2.2), bg_color=C_CARD_TINT, border_color=C_BORDER)
        
        hbar = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_x + Inches(0.2), Inches(4.5), Inches(2.35), Inches(0.06))
        hbar.fill.solid()
        hbar.fill.fore_color.rgb = color
        hbar.line.fill.background()
        
        tb = s5.shapes.add_textbox(left_x + Inches(0.15), Inches(4.65), Inches(2.45), Inches(1.9))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.bold = True
        p1.font.size = Pt(11)
        p1.font.color.rgb = color
        
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = C_DARK_TEXT
        p2.space_before = Pt(4)

    # ==================== SLIDE 6: SURVEY N=35 ====================
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "Khảo sát thực nghiệm", "Khảo sát bổ sung N=35: Khung giờ học và cơ chế làm lại câu sai", "Thu thập dữ liệu chuyên sâu để định hình 2 quyết định thiết kế then chốt của ứng dụng")
    
    s6_chart_path = "docs/scratch/assets/s6_survey_n35.png"
    if os.path.exists(s6_chart_path):
        s6.shapes.add_picture(s6_chart_path, Inches(0.8), Inches(1.8), width=Inches(11.5))
        
    c1 = create_card(s6, Inches(0.8), Inches(4.6), Inches(5.6), Inches(2.0), bg_color=C_CARD_TINT, border_color=C_BORDER)
    strip1 = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(4.6), Inches(5.2), Inches(0.06))
    strip1.fill.solid()
    strip1.fill.fore_color.rgb = C_BLUE
    strip1.line.fill.background()
    tb1 = s6.shapes.add_textbox(Inches(1.0), Inches(4.7), Inches(5.2), Inches(1.7))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "QUYẾT ĐỊNH 1: CẤU HÌNH THÔNG BÁO NHẮC HỌC (20H–22H)"
    p1.font.bold = True
    p1.font.size = Pt(11.5)
    p1.font.color.rgb = C_BLUE
    p1_sub = tf1.add_paragraph()
    p1_sub.text = "• Dữ liệu N=35 chỉ ra 51.4% (18 người) chọn khung giờ 20:00–22:00 để tự học.\n• Ứng dụng thiết lập mặc định nhắc nhở học tập vào khung giờ vàng này.\n• Cho phép người dùng tùy chỉnh giờ học cá nhân hoặc tắt thông báo nếu muốn."
    p1_sub.font.size = Pt(10)
    p1_sub.font.color.rgb = C_DARK_TEXT
    p1_sub.space_before = Pt(4)

    c2 = create_card(s6, Inches(6.7), Inches(4.6), Inches(5.6), Inches(2.0), bg_color=C_CARD_TINT, border_color=C_BORDER)
    strip2 = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(4.6), Inches(5.2), Inches(0.06))
    strip2.fill.solid()
    strip2.fill.fore_color.rgb = C_GREEN
    strip2.line.fill.background()
    tb2 = s6.shapes.add_textbox(Inches(6.9), Inches(4.7), Inches(5.2), Inches(1.7))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    p2 = tf2.paragraphs[0]
    p2.text = "QUYẾT ĐỊNH 2: CƠ CHẾ LÀM LẠI CÂU SAI (CONTROLLED RETRY)"
    p2.font.bold = True
    p2.font.size = Pt(11.5)
    p2.font.color.rgb = C_GREEN
    p2_sub = tf2.add_paragraph()
    p2_sub.text = "• 54.3% (19/35) đồng ý làm lại câu sai ngay cuối bài; 31.4% đồng ý tùy bài học.\n• Hệ thống đưa ra cơ chế Controlled Retry: Tự động gom tối đa 10% số câu sai vào cuối bài.\n• Giúp người học sửa lỗi ngay lập tức mà không gây cảm giác ức chế hay quá tải."
    p2_sub.font.size = Pt(10)
    p2_sub.font.color.rgb = C_DARK_TEXT
    p2_sub.space_before = Pt(4)

    # ==================== SLIDE 7: QUALITATIVE INTERVIEW N=3 ====================
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "Phỏng vấn định tính", "Phỏng vấn N=3: Vì sao người học từng bỏ dở ứng dụng?", "Phỏng vấn bán cấu trúc chuyên sâu giải mã rào cản tâm lý dẫn đến việc bỏ ngang việc học")
    
    cases = [
        ("Case 1 — Lỡ nhịp & Dồn ứ", "Sinh viên năm 2", C_BLUE, [
            ("Thực trạng:", "Bỏ lỡ 1 ngày học bận rộn, hôm sau app dồn bài học gấp đôi kèm danh sách từ ôn tập quá dài khiến người học hoảng loạn và từ bỏ."),
            ("Tác động tâm lý:", "Cảm giác tội lỗi và áp lực bị phạt bài học dồn làm triệt tiêu hoàn toàn động lực học."),
            ("Giải pháp Lingora:", "Thiết kế bài vi mô 5–10 phút; khống chế số lượng từ cần ôn mỗi ngày, không dồn bài phạt.")
        ]),
        ("Case 2 — Làm sai không giải thích", "Người đi làm", C_ORANGE, [
            ("Thực trạng:", "Làm sai bài tập nhưng app chỉ hiển thị dấu X đỏ và đáp án đúng mà hoàn toàn không giải thích vì sao sai."),
            ("Tác động tâm lý:", "Bức xúc, cảm thấy bị đánh đố và không tiến bộ sau các lỗi sai."),
            ("Giải pháp Lingora:", "Phản hồi tức thì: Bắt buộc kèm giải thích ngữ pháp và từ vựng chi tiết ngay tại chỗ sau mỗi câu sai.")
        ]),
        ("Case 3 — Bài học quá dài dòng", "Sinh viên năm 4", C_PURPLE, [
            ("Thực trạng:", "Bài học kéo dài lê thê (>15 phút) khiến người học khó tranh thủ học trong các khoảng thời gian trống ngắn."),
            ("Tác động tâm lý:", "Khó duy trì thói quen học tập đều đặn khi lịch học và làm việc bận rộn."),
            ("Giải pháp Lingora:", "Chuẩn hóa mỗi bài học chỉ gồm 8–10 từ vựng cốt lõi, hoàn thành trong 5–10 phút.")
        ])
    ]
    
    for idx, (title, role, color, details) in enumerate(cases):
        left_x = Inches(0.8 + idx * 3.9)
        card = create_card(s7, left_x, Inches(1.85), Inches(3.75), Inches(4.8), bg_color=C_CARD_BG, border_color=C_BORDER)
        
        # Accent top bar
        strip = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_x + Inches(0.3), Inches(1.85), Inches(3.15), Inches(0.06))
        strip.fill.solid()
        strip.fill.fore_color.rgb = color
        strip.line.fill.background()
        
        # Round icon badge
        badge = s7.shapes.add_shape(MSO_SHAPE.OVAL, left_x + Inches(0.2), Inches(2.05), Inches(0.50), Inches(0.50))
        badge.fill.solid()
        badge.fill.fore_color.rgb = RGBColor(241, 245, 249)
        badge.line.color.rgb = color
        badge.line.width = Pt(1)
        tf_b = badge.text_frame
        tf_b.margin_left = tf_b.margin_right = tf_b.margin_top = tf_b.margin_bottom = 0
        tf_b.word_wrap = False
        p_b = tf_b.paragraphs[0]
        p_b.text = f"0{idx+1}"
        p_b.font.bold = True
        p_b.font.size = Pt(11)
        p_b.font.color.rgb = color
        p_b.alignment = PP_ALIGN.CENTER
        
        tb_t = s7.shapes.add_textbox(left_x + Inches(0.80), Inches(2.02), Inches(2.8), Inches(0.55))
        tf_t = tb_t.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = tf_t.margin_top = 0
        p_t = tf_t.paragraphs[0]
        p_t.text = title
        p_t.font.bold = True
        p_t.font.size = Pt(11)
        p_t.font.color.rgb = C_NAVY
        p_sub = tf_t.add_paragraph()
        p_sub.text = role
        p_sub.font.size = Pt(9.5)
        p_sub.font.color.rgb = color
        
        tb = s7.shapes.add_textbox(left_x + Inches(0.2), Inches(2.65), Inches(3.35), Inches(3.8))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = 0
        for d_idx, (h, b) in enumerate(details):
            p = tf.paragraphs[0] if d_idx == 0 else tf.add_paragraph()
            p.space_after = Pt(8)
            r1 = p.add_run()
            r1.text = f"{h}\n"
            r1.font.bold = True
            r1.font.size = Pt(10)
            r1.font.color.rgb = color
            r2 = p.add_run()
            r2.text = b
            r2.font.size = Pt(9)
            r2.font.color.rgb = C_DARK_TEXT
            r2.line_spacing = 1.15

    # ==================== SLIDE 8: STAKEHOLDERS (6 ROLES) ====================
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "Góc nhìn chuyên gia", "Kiểm chứng yêu cầu với 6 vai trò trong hệ thống", "7 chuyên gia được phỏng vấn chuyên sâu giúp xác lập mô hình phân quyền và vận hành chặt chẽ")
    
    roles = [
        ("Learner (Người học)", "Nghiệp vụ Học tập", C_BLUE, "Học viên học theo lộ trình, làm bài tập tương tác, tự ôn ngắt quãng (SRS), làm lại câu sai và theo dõi Streak."),
        ("Organizational Manager", "Quản lý Đào tạo", C_PURPLE, "Lập khung chương trình, giao việc cho Creator qua Task Spec, phê duyệt xuất bản Unit (4/4 bài) và quản lý lớp học."),
        ("Lesson Creator", "Biên soạn Học liệu", C_ORANGE, "Nhập liệu bài học vi mô (8–10 từ), gắn audio chuẩn, tạo bài tập 5 dạng có giải thích. Cấm tự duyệt bài mình tạo."),
        ("Moderator (Kiểm duyệt)", "Kiểm soát Chất lượng", C_GREEN, "Thẩm định độc lập theo bộ tiêu chí QC 6 điểm, thẩm âm bắt buộc, trả bài sửa kèm lý do. Cấm xuất bản."),
        ("Operations Staff", "Vận hành & Hỗ trợ", C_GRAY, "Tiếp nhận và xử lý phiếu phản ánh học tập (3 nhánh); không được phép can thiệp chỉnh sửa học liệu."),
        ("Administrator (Quản trị)", "Bảo mật & Kỹ thuật", C_RED, "Quản lý tài khoản, phân quyền RBAC, giám sát Audit Log bất biến và can thiệp xuất bản khẩn cấp có giải trình.")
    ]
    
    for idx, (r_name, r_sub, color, r_desc) in enumerate(roles):
        row = idx // 3
        col = idx % 3
        left_x = Inches(0.8 + col * 3.9)
        top_y = Inches(1.85 + row * 2.50)
        
        card = create_card(s8, left_x, top_y, Inches(3.75), Inches(2.30), bg_color=C_CARD_BG, border_color=C_BORDER)
        
        # Pill tag
        pill = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_x + Inches(0.2), top_y + Inches(0.18), Inches(3.35), Inches(0.35))
        pill.fill.solid()
        pill.fill.fore_color.rgb = color
        pill.line.fill.background()
        tf_p = pill.text_frame
        p_p = tf_p.paragraphs[0]
        p_p.text = f"{r_name} — {r_sub}"
        p_p.font.bold = True
        p_p.font.size = Pt(10)
        p_p.font.color.rgb = C_WHITE
        p_p.alignment = PP_ALIGN.CENTER
        
        tb = s8.shapes.add_textbox(left_x + Inches(0.2), top_y + Inches(0.65), Inches(3.35), Inches(1.5))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = r_desc
        p.font.size = Pt(10)
        p.font.color.rgb = C_DARK_TEXT
        p.line_spacing = 1.15

    # ==================== SLIDE 9: MANAGER & CREATOR ====================
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "Phỏng vấn chuyên sâu", "Manager & Creator: Quy trình quản lý và biên soạn học liệu", "Xác lập tiêu chuẩn giao việc 5 trường và quy chuẩn đóng gói bài học vi mô")
    
    # Manager Card
    cm = create_card(s9, Inches(0.8), Inches(1.85), Inches(5.6), Inches(4.8), bg_color=C_CARD_BG, border_color=C_BORDER)
    strip_m = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(1.85), Inches(5.2), Inches(0.06))
    strip_m.fill.solid()
    strip_m.fill.fore_color.rgb = C_PURPLE
    strip_m.line.fill.background()
    
    tbm = s9.shapes.add_textbox(Inches(1.1), Inches(2.05), Inches(5.0), Inches(4.4))
    tfm = tbm.text_frame
    tfm.word_wrap = True
    p_mh = tfm.paragraphs[0]
    p_mh.text = "ORGANIZATIONAL MANAGER (QUẢN LÝ TỔ CHỨC)"
    p_mh.font.bold = True
    p_mh.font.size = Pt(12)
    p_mh.font.color.rgb = C_PURPLE
    
    m_pts = [
        ("Phiếu giao việc Task Spec chuẩn hóa 5 trường:", "Bao gồm: Mã Unit, Danh sách từ vựng trọng tâm, Ngữ pháp mục tiêu, Creator phụ trách, và Hạn hoàn thành."),
        ("Quy tắc đóng gói Unit hoàn chỉnh (4/4 bài):", "Chỉ xuất bản khi đủ trọn vẹn 4 bài học (3 bài học mới + 1 bài tổng hợp). Không xuất bản dở dang làm vỡ lộ trình."),
        ("Thẩm quyền xuất bản nội dung chính thức:", "Manager là vai trò duy nhất có thẩm quyền xuất bản học liệu thường nhật sau khi đã qua Moderator phê duyệt.")
    ]
    for idx, (h, b) in enumerate(m_pts):
        p = tfm.add_paragraph()
        p.space_before = Pt(12)
        r1 = p.add_run()
        r1.text = f"• {h}\n"
        r1.font.bold = True
        r1.font.size = Pt(10.5)
        r1.font.color.rgb = C_PURPLE
        r2 = p.add_run()
        r2.text = b
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = C_DARK_TEXT

    # Creator Card
    cc = create_card(s9, Inches(6.7), Inches(1.85), Inches(5.6), Inches(4.8), bg_color=C_CARD_BG, border_color=C_BORDER)
    strip_c = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.85), Inches(5.2), Inches(0.06))
    strip_c.fill.solid()
    strip_c.fill.fore_color.rgb = C_ORANGE
    strip_c.line.fill.background()
    
    tbc = s9.shapes.add_textbox(Inches(7.0), Inches(2.05), Inches(5.0), Inches(4.4))
    tfc = tbc.text_frame
    tfc.word_wrap = True
    p_ch = tfc.paragraphs[0]
    p_ch.text = "LESSON CREATOR (NGƯỜI BIÊN SOẠN HỌC LIỆU)"
    p_ch.font.bold = True
    p_ch.font.size = Pt(12)
    p_ch.font.color.rgb = C_ORANGE
    
    c_pts = [
        ("Bộ bài tập 5 dạng chuẩn tương tác cao:", "Trắc nghiệm, Điền từ vào chỗ trống, Sắp xếp từ thành câu, Nghe chọn từ đúng và Câu hỏi ngữ pháp kèm giải thích."),
        ("100% từ vựng có âm thanh phát âm bản xứ:", "Chuẩn hóa file MP3 chất lượng cao cho toàn bộ từ mới và câu ví dụ, hỗ trợ người học nghe chuẩn ngay từ đầu."),
        ("Công cụ nhập liệu bài học hàng loạt (Bulk Import):", "Hỗ trợ nạp bài từ file Excel/CSV theo mẫu chuẩn; toàn bộ dữ liệu nạp vào phải ở trạng thái Draft và qua kiểm duyệt.")
    ]
    for idx, (h, b) in enumerate(c_pts):
        p = tfc.add_paragraph()
        p.space_before = Pt(12)
        r1 = p.add_run()
        r1.text = f"• {h}\n"
        r1.font.bold = True
        r1.font.size = Pt(10.5)
        r1.font.color.rgb = C_ORANGE
        r2 = p.add_run()
        r2.text = b
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = C_DARK_TEXT

    # ==================== SLIDE 10: MODERATOR, OPS & ADMIN ====================
    s10 = prs.slides.add_slide(blank_layout)
    add_header(s10, "Phỏng vấn chuyên sâu", "Kiểm soát chất lượng, hỗ trợ và quản trị an ninh hệ thống", "Bộ tiêu chí QC 6 điểm, quy trình xử lý ticket 3 nhánh và ghi nhật ký kiểm toán bất biến")
    
    cards10 = [
        ("MODERATOR (KIỂM DUYỆT)", C_GREEN, [
            ("Bộ tiêu chí QC 6 điểm:", "Đúng ngữ pháp, chính tả, ngữ cảnh, đủ 5 dạng bài, giải thích rõ ràng và âm thanh chuẩn."),
            ("Thẩm âm bắt buộc:", "Moderator phải nghe thẩm định 100% file audio trước khi bấm phê duyệt bài học."),
            ("Khóa cấm tự duyệt (SoD):", "Hệ thống tự động khóa chức năng duyệt nếu Moderator chính là người biên soạn bài đó.")
        ]),
        ("OPERATIONS STAFF (VẬN HÀNH)", C_GRAY, [
            ("Phân luồng hỗ trợ 3 nhánh:", "Nội dung sai sót → Moderator; Lỗi kỹ thuật hệ thống → Dev/Admin; Tài khoản → Ops xử lý."),
            ("Ranh giới dữ liệu an toàn:", "Operations chỉ xem nội dung phiếu và phản hồi; tuyệt đối không có quyền sửa trực tiếp CSDL học liệu.")
        ]),
        ("ADMIN & PHÁP LÝ (LEGAL)", C_RED, [
            ("Bảo mật phiên đăng nhập:", "Sử dụng HttpOnly Cookies chống XSS; phân quyền RBAC chặt chẽ ở tầng CSDL."),
            ("Ghi nhật ký kiểm toán bất biến:", "Ghi nhận đầy đủ 6 trường dữ liệu; tuân thủ nghiêm ngặt Luật ATTT 86/2015 và Nghị định 13/2023/NĐ-CP.")
        ])
    ]
    for idx, (title, color, items) in enumerate(cards10):
        left_x = Inches(0.8 + idx * 3.9)
        card = create_card(s10, left_x, Inches(1.85), Inches(3.75), Inches(4.8), bg_color=C_CARD_BG, border_color=C_BORDER)
        
        strip = s10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_x + Inches(0.3), Inches(1.85), Inches(3.15), Inches(0.06))
        strip.fill.solid()
        strip.fill.fore_color.rgb = color
        strip.line.fill.background()
        
        tb = s10.shapes.add_textbox(left_x + Inches(0.2), Inches(2.05), Inches(3.35), Inches(4.4))
        tf = tb.text_frame
        tf.word_wrap = True
        p_th = tf.paragraphs[0]
        p_th.text = title
        p_th.font.bold = True
        p_th.font.size = Pt(11)
        p_th.font.color.rgb = color
        
        for i_idx, (h, b) in enumerate(items):
            p = tf.add_paragraph()
            p.space_before = Pt(10)
            r1 = p.add_run()
            r1.text = f"• {h}\n"
            r1.font.bold = True
            r1.font.size = Pt(10)
            r1.font.color.rgb = color
            r2 = p.add_run()
            r2.text = b
            r2.font.size = Pt(9)
            r2.font.color.rgb = C_DARK_TEXT

    # ==================== SLIDE 11: BENCHMARK & DESIGN DECISIONS ====================
    s11 = prs.slides.add_slide(blank_layout)
    add_header(s11, "Đối chuẩn & Quyết định", "Đối chuẩn tính năng và 4 quyết định thiết kế then chốt", "Học hỏi ưu điểm của Duolingo, Quizlet và khắc phục nhược điểm bằng thiết kế phù hợp")
    
    # Left: Benchmark Card
    cb = create_card(s11, Inches(0.8), Inches(1.85), Inches(5.6), Inches(4.8), bg_color=C_CARD_BG, border_color=C_BORDER)
    strip_b = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(1.85), Inches(5.2), Inches(0.06))
    strip_b.fill.solid()
    strip_b.fill.fore_color.rgb = C_BLUE
    strip_b.line.fill.background()
    
    tbb = s11.shapes.add_textbox(Inches(1.1), Inches(2.05), Inches(5.0), Inches(4.4))
    tfb = tbb.text_frame
    tfb.word_wrap = True
    p_bh = tfb.paragraphs[0]
    p_bh.text = "ĐỐI CHUẨN NỀN TẢNG (BENCHMARK)"
    p_bh.font.bold = True
    p_bh.font.size = Pt(12)
    p_bh.font.color.rgb = C_BLUE
    
    b_pts = [
        ("Duolingo (Gamification mạnh mẽ):", "Ưu điểm: Giữ chân người học tốt nhờ chuỗi Streak và bài tập vi mô.\nNhược điểm: Giải thích ngữ pháp rất sơ sài, bài học thiếu ngữ cảnh thực tế."),
        ("Quizlet (Ghi nhớ từ vựng Flashcard):", "Ưu điểm: Ôn tập từ vựng nhanh, cho phép tự tạo học liệu.\nNhược điểm: Thiếu lộ trình có cấu trúc; học liệu do người dùng tạo có tỷ lệ lỗi phát âm và ngữ pháp rất cao."),
        ("Định vị khác biệt của Lingora:", "Kết hợp ưu điểm của cả hai: Vừa có tính kỷ luật (Streak, vi mô 5–10p, SRS) vừa có học liệu được kiểm duyệt 4 mắt chặt chẽ kèm giải thích cặn kẽ.")
    ]
    for idx, (h, b) in enumerate(b_pts):
        p = tfb.add_paragraph()
        p.space_before = Pt(10)
        r1 = p.add_run()
        r1.text = f"{h}\n"
        r1.font.bold = True
        r1.font.size = Pt(10)
        r1.font.color.rgb = C_BLUE
        r2 = p.add_run()
        r2.text = b
        r2.font.size = Pt(9)
        r2.font.color.rgb = C_DARK_TEXT

    # Right: 4 Decisions Card
    cd = create_card(s11, Inches(6.7), Inches(1.85), Inches(5.6), Inches(4.8), bg_color=C_CARD_BG, border_color=C_BORDER)
    strip_d = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.85), Inches(5.2), Inches(0.06))
    strip_d.fill.solid()
    strip_d.fill.fore_color.rgb = C_GREEN
    strip_d.line.fill.background()
    
    tbd = s11.shapes.add_textbox(Inches(7.0), Inches(2.05), Inches(5.0), Inches(4.4))
    tfd = tbd.text_frame
    tfd.word_wrap = True
    p_dh = tfd.paragraphs[0]
    p_dh.text = "4 QUYẾT ĐỊNH THIẾT KẾ THEN CHỐT [ĐÃ CHỐT]"
    p_dh.font.bold = True
    p_dh.font.size = Pt(12)
    p_dh.font.color.rgb = C_GREEN
    
    d_pts = [
        ("1. Chuẩn hóa 5 dạng bài tập tương tác:", "Trắc nghiệm, Điền từ, Sắp xếp câu, Nghe nhận diện và Ngữ pháp có giải thích."),
        ("2. Thuật toán SRS cố định 5 mốc ngày:", "Chu kỳ giãn cách: 1 → 3 → 7 → 14 → 30 ngày (Trực quan, ổn định, dễ dự báo)."),
        ("3. Quy tắc tính Streak chuẩn múi giờ địa phương:", "Học xong trước 23:59:59 → +1 ngày; lỡ ngày → về 1 (Không bán Streak Freeze)."),
        ("4. Kiểm tra xếp lớp đầu vào (Placement Test):", "30 câu hỏi đánh giá nhanh; cho phép học viên tùy chọn 'Bỏ qua bài test' để học từ đầu.")
    ]
    for idx, (h, b) in enumerate(d_pts):
        p = tfd.add_paragraph()
        p.space_before = Pt(10)
        r1 = p.add_run()
        r1.text = f"{h} "
        r1.font.bold = True
        r1.font.size = Pt(10)
        r1.font.color.rgb = C_GREEN
        r2 = p.add_run()
        r2.text = b
        r2.font.size = Pt(9)
        r2.font.color.rgb = C_DARK_TEXT

    # ==================== SLIDE 12: TRACEABILITY MATRIX (REAL FEATURES) ====================
    s12 = prs.slides.add_slide(blank_layout)
    add_header(s12, "Ma trận truy vết", "Từ bằng chứng thực tế đến tính năng phần mềm", "Mỗi tính năng của Lingora đều giải quyết trực tiếp một phát hiện thực nghiệm hoặc yêu cầu chuyên gia")
    
    table_card = create_card(s12, Inches(0.8), Inches(1.85), Inches(11.5), Inches(4.8), bg_color=C_CARD_BG, border_color=C_BORDER)
    
    table_shape = s12.shapes.add_table(15, 3, Inches(0.9), Inches(1.95), Inches(11.3), Inches(4.5))
    table = table_shape.table
    table.columns[0].width = Inches(2.2)
    table.columns[1].width = Inches(4.4)
    table.columns[2].width = Inches(4.7)
    
    headers12 = ["Nguồn bằng chứng thực tế", "Phát hiện cốt lõi từ thực tế", "Tính năng / Giải pháp phần mềm tương ứng"]
    for c_idx, h in enumerate(headers12):
        cell = table.cell(0, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_NAVY
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.name = "Segoe UI"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = C_WHITE
        p.alignment = PP_ALIGN.CENTER if c_idx != 1 else PP_ALIGN.LEFT
        
    matrix_rows = [
        ("N=15, Q8: 15/15 (100%)", "100% người khảo sát từng quên từ vựng đã học", "Thuật toán ôn tập ngắt quãng (SRS) tự động tính chu kỳ quên"),
        ("N=15, Q13: 12/15 (80%)", "Nhu cầu tự động nhắc ôn từ vựng ở mức rất cấp thiết (4.13/5)", "Bộ lọc thông minh: Tự động gom từ vựng đến hạn cần ôn trong ngày"),
        ("N=15, Q15: 14/15 (93.3%)", "Quan tâm tính năng tự đề xuất bài học theo năng lực", "Kiểm tra trình độ đầu vào (Placement 30 câu) & Gợi ý bài học cá nhân"),
        ("N=15, Q17 & Q7", "Nhu cầu bài tập điền từ, trắc nghiệm, nghe và giải thích ngữ pháp", "Bộ bài tập tương tác 5 dạng: Trắc nghiệm, Điền từ, Nghe, Ghép, Viết"),
        ("N=35: 18/35 (51.4%)", "Khung giờ 20:00–22:00 buổi tối là thời điểm tự học phổ biến nhất", "Nhắc nhở học tập thông minh qua thông báo đẩy vào khung giờ vàng (20h–22h)"),
        ("N=35: 19/35 (54.3%)", "Đa số người học đồng ý làm lại câu sai ở cuối bài học (~10%)", "Cơ chế tự động cho phép làm lại câu sai (Controlled Retry) ngay cuối bài"),
        ("N=3, Case 1", "Tâm lý nản lòng vì nội dung bị dồn ứ sau khi lỡ nhịp 1 ngày", "Thiết kế bài học vi mô (Micro-learning 5–10 phút) tránh dồn ứ kiến thức"),
        ("N=3, Case 2", "Bức xúc vì làm sai nhưng không được giải thích lý do tại chỗ", "Phản hồi tức thì & Giải thích ngữ pháp/nghĩa từ cặn kẽ ngay khi làm sai"),
        ("N=3, Case 3", "Bỏ học vì bài học quá dài dòng lê thê (>15 phút)", "Quy chuẩn bài học tinh gọn (Unit 5–10 phút) giúp duy trì kỷ luật học tập"),
        ("PV Manager (2 người)", "Cần Task Spec 5 trường và quy tắc đóng gói Unit hoàn chỉnh", "Phân công bài học theo Task Spec 5 trường & Đóng gói Unit 4/4 hoàn chỉnh"),
        ("PV Creator (2 người)", "Khâu chuẩn bị audio tốn thời gian; cần tính năng nạp bài hàng loạt", "Tích hợp Audio phát âm bản xứ chuẩn & Công cụ nhập học liệu hàng loạt"),
        ("PV Moderator (1 người)", "Cần bộ tiêu chí QC 6 điểm và khóa cấm tự duyệt bài mình soạn", "Kiểm duyệt 2 cấp độc lập: Khóa cấm tự duyệt bài mình biên soạn (SoD)"),
        ("PV Operations (1 người)", "Cần phân luồng 3 nhánh hỗ trợ; không được sửa trực tiếp học liệu", "Kênh tiếp nhận & Phân luồng phiếu khiếu nại/hỗ trợ người dùng 3 nhánh"),
        ("PV Admin & Legal", "Cần bảo vệ phiên, phân quyền 6 vai trò và ghi Audit Log bất biến", "Bảo vệ phiên đăng nhập, phân quyền 6 vai trò & Nhật ký kiểm toán bất biến")
    ]
    for r_idx, (c0, c1, c2) in enumerate(matrix_rows, 1):
        for col_idx, text in enumerate([c0, c1, c2]):
            cell = table.cell(r_idx, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = C_WHITE if r_idx % 2 == 1 else C_CARD_TINT
            p = cell.text_frame.paragraphs[0]
            p.text = text
            p.font.name = "Segoe UI"
            p.font.size = Pt(9)
            if col_idx == 0:
                p.font.bold = True
                p.font.color.rgb = C_BLUE
            elif col_idx == 2:
                p.font.bold = True
                p.font.color.rgb = C_NAVY
            else:
                p.font.color.rgb = C_DARK_TEXT

    # ==================== SLIDE 13: SYSTEM REQUIREMENTS ====================
    s13 = prs.slides.add_slide(blank_layout)
    add_header(s13, "Đặc tả yêu cầu", "Bộ yêu cầu hệ thống: 12 CORE + 8 EXT + NFRs", "Phân cấp ưu tiên rõ ràng: Cốt lõi (Must) cho MVP, Mở rộng (Should/Could) và Tiêu chuẩn phi chức năng")
    
    cards13 = [
        ("12 YÊU CẦU CỐT LÕI (CORE — MUST)", C_BLUE, [
            ("Xác thực & Bảo mật:", "Đăng ký, đăng nhập an toàn, phân quyền 6 vai trò chuẩn RBAC."),
            ("Biên soạn học liệu vi mô:", "Lập Task Spec 5 trường, soạn bài 8–10 từ kèm 100% audio bản xứ và 5 dạng bài tập."),
            ("Kiểm soát chất lượng SoD:", "Kiểm duyệt độc lập 6 điểm QC, cấm tự duyệt bài mình; Manager xuất bản khi đủ Unit 4/4."),
            ("Cơ chế Clone-to-Draft:", "Sửa bài xuất bản tạo bản sao Draft mới, bảo toàn tiến trình học viên."),
            ("Trải nghiệm học & SRS:", "Học bài 5–10p, Controlled Retry cuối bài, Placement test 30 câu, SRS 1-3-7-14-30 ngày."),
            ("Động lực học tập:", "Theo dõi Streak theo múi giờ địa phương, báo cáo tiến độ và lịch sử làm bài.")
        ]),
        ("8 YÊU CẦU MỞ RỘNG (EXTENSIONS)", C_PURPLE, [
            ("Ưu tiên vừa (SHOULD):", "Kiểm tra ngữ pháp tự luận (GEC service); Luyện hội thoại theo kịch bản tình huống đời sống; Đề xuất bài học thích ứng theo lịch sử sai; Kênh tiếp nhận & điều phối phiếu hỗ trợ 3 nhánh; Giao diện tra cứu Audit Log cho Admin."),
            ("Ưu tiên thấp (COULD):", "Chuyển đổi giao diện song ngữ Việt – Anh; Gửi email nhắc Streak khi có nguy cơ đứt chuỗi; Nhập bài học hàng loạt từ file Excel/CSV.")
        ]),
        ("TIÊU CHUẨN PHI CHỨC NĂNG (NFRs)", C_GREEN, [
            ("Bảo mật & Kiểm toán (MUST):", "HttpOnly Cookies chống XSS; RLS ở tầng CSDL; Audit Log 6 trường bất biến."),
            ("Độ tin cậy & Sẵn sàng (MUST):", "Mất mạng không ghi điểm dở dang; dịch vụ ngoài sập không làm hỏng luồng học cốt lõi."),
            ("Mục tiêu kỹ thuật (SHOULD):", "Chuyển câu <1s, phản hồi ngữ pháp ≤3s, độ sẵn sàng 99.5% (đo kiểm thực tế)."),
            ("Kiến trúc độc lập 3 tầng:", "Phân tách: Giao diện — Ngôn ngữ nguồn (Tiếng Việt) — Ngôn ngữ đích (Tiếng Anh).")
        ])
    ]
    for idx, (title, color, items) in enumerate(cards13):
        left_x = Inches(0.8 + idx * 3.9)
        card = create_card(s13, left_x, Inches(1.85), Inches(3.75), Inches(4.8), bg_color=C_CARD_BG, border_color=C_BORDER)
        
        strip = s13.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_x + Inches(0.3), Inches(1.85), Inches(3.15), Inches(0.06))
        strip.fill.solid()
        strip.fill.fore_color.rgb = color
        strip.line.fill.background()
        
        tb = s13.shapes.add_textbox(left_x + Inches(0.2), Inches(2.05), Inches(3.35), Inches(4.4))
        tf = tb.text_frame
        tf.word_wrap = True
        p_th = tf.paragraphs[0]
        p_th.text = title
        p_th.font.bold = True
        p_th.font.size = Pt(11)
        p_th.font.color.rgb = color
        
        for i_idx, (h, b) in enumerate(items):
            p = tf.add_paragraph()
            p.space_before = Pt(8)
            r1 = p.add_run()
            r1.text = f"{h} "
            r1.font.bold = True
            r1.font.size = Pt(9.5)
            r1.font.color.rgb = color
            r2 = p.add_run()
            r2.text = b
            r2.font.size = Pt(8.5)
            r2.font.color.rgb = C_DARK_TEXT

    # ==================== SLIDE 14: ACTORS & SOD MATRIX ====================
    s14 = prs.slides.add_slide(blank_layout)
    add_header(s14, "Tác nhân & Phân định", "Ma trận phân định trách nhiệm (Separation of Duties — SoD)", "Nguyên tắc 4 mắt chống gian lận: Ai được làm gì và ai bị hệ thống nghiêm cấm thực hiện?")
    
    table_card14 = create_card(s14, Inches(0.8), Inches(1.85), Inches(11.5), Inches(4.8), bg_color=C_CARD_BG, border_color=C_BORDER)
    
    t_shape14 = s14.shapes.add_table(7, 7, Inches(0.9), Inches(1.95), Inches(11.3), Inches(4.5))
    table14 = t_shape14.table
    table14.columns[0].width = Inches(2.3)
    for c in range(1, 7):
        table14.columns[c].width = Inches(1.5)
        
    cols14 = ["Vai trò (Role)", "Soạn Draft", "Duyệt QC", "Xuất bản", "Quản trị User", "Xử lý Ticket", "Audit Log"]
    for c_idx, h in enumerate(cols14):
        cell = table14.cell(0, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_NAVY
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.name = "Segoe UI"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = C_WHITE
        p.alignment = PP_ALIGN.CENTER
        
    sod_data = [
        ("Learner (Người học)", ["✗ CẤM", "✗ CẤM", "✗ CẤM", "✗ CẤM", "✗ CẤM", "✗ CẤM"]),
        ("Lesson Creator (Biên soạn)", ["✓ CÓ", "✗ CẤM*", "✗ CẤM", "✗ CẤM", "✗ CẤM", "✗ CẤM"]),
        ("Moderator (Kiểm duyệt)", ["✗ CẤM*", "✓ CÓ", "✗ CẤM", "✗ CẤM", "✗ CẤM", "✗ CẤM"]),
        ("Org Manager (Quản lý)", ["✓ CÓ", "✓ CÓ", "✓ CÓ", "✗ CẤM", "✗ CẤM", "Xem phân hệ"]),
        ("Operations Staff (Vận hành)", ["✗ CẤM", "✗ CẤM", "✗ CẤM", "✗ CẤM", "✓ CÓ (Ticket)", "✗ CẤM"]),
        ("Administrator (Quản trị)", ["✗ CẤM", "✗ CẤM", "Chỉ khẩn cấp", "✓ CÓ (Toàn quyền)", "✓ CÓ", "✓ CÓ (Toàn quyền)"])
    ]
    for r_idx, (role_name, perms) in enumerate(sod_data, 1):
        cell_r = table14.cell(r_idx, 0)
        cell_r.fill.solid()
        cell_r.fill.fore_color.rgb = C_WHITE if r_idx % 2 == 1 else C_CARD_TINT
        p_r = cell_r.text_frame.paragraphs[0]
        p_r.text = role_name
        p_r.font.name = "Segoe UI"
        p_r.font.size = Pt(9.5)
        p_r.font.bold = True
        p_r.font.color.rgb = C_NAVY
        
        for p_idx, perm in enumerate(perms, 1):
            cell_p = table14.cell(r_idx, p_idx)
            cell_p.fill.solid()
            cell_p.fill.fore_color.rgb = C_WHITE if r_idx % 2 == 1 else C_CARD_TINT
            p_p = cell_p.text_frame.paragraphs[0]
            p_p.text = perm
            p_p.font.name = "Segoe UI"
            p_p.font.size = Pt(9.5)
            p_p.alignment = PP_ALIGN.CENTER
            if "✓" in perm:
                p_p.font.bold = True
                p_p.font.color.rgb = C_GREEN
            elif "✗" in perm:
                p_p.font.bold = True
                p_p.font.color.rgb = C_RED
            else:
                p_p.font.bold = True
                p_p.font.color.rgb = C_PURPLE

    # ==================== SLIDE 15: BUSINESS WORKFLOWS ====================
    s15 = prs.slides.add_slide(blank_layout)
    add_header(s15, "Quy trình nghiệp vụ", "Hai luồng nghiệp vụ cốt lõi: Quản trị học liệu & Học tập", "Quy trình kiểm soát trạng thái học liệu bất biến và chu trình khép kín giúp người học duy trì kỷ luật")
    
    c_flow1 = create_card(s15, Inches(0.8), Inches(1.85), Inches(11.5), Inches(2.3), bg_color=C_CARD_BG, border_color=C_BORDER)
    s15_flow1_path = "docs/scratch/assets/s15_content_flow.png"
    if os.path.exists(s15_flow1_path):
        s15.shapes.add_picture(s15_flow1_path, Inches(0.9), Inches(1.90), width=Inches(11.3))
        
    c_flow2 = create_card(s15, Inches(0.8), Inches(4.35), Inches(11.5), Inches(2.3), bg_color=C_CARD_BG, border_color=C_BORDER)
    s15_flow2_path = "docs/scratch/assets/s15_learner_flow.png"
    if os.path.exists(s15_flow2_path):
        s15.shapes.add_picture(s15_flow2_path, Inches(0.9), Inches(4.40), width=Inches(11.3))

    # ==================== SLIDE 16: USE CASE MODELING (15 CANONICAL) ====================
    s16 = prs.slides.add_slide(blank_layout)
    add_header(s16, "Mô hình Use Case", "Mô hình Use Case: 14 Core Use Cases & 1 Optional B2B", "Chuẩn hóa danh mục 15 Use Cases chính quy, gắn kết chặt chẽ với yêu cầu hệ thống và chức năng MVP")
    
    tc16 = create_card(s16, Inches(0.8), Inches(1.85), Inches(11.5), Inches(4.8), bg_color=C_CARD_BG, border_color=C_BORDER)
    
    t_shape16 = s16.shapes.add_table(16, 6, Inches(0.85), Inches(1.90), Inches(11.4), Inches(4.6))
    t16 = t_shape16.table
    t16.columns[0].width = Inches(1.0)
    t16.columns[1].width = Inches(3.2)
    t16.columns[2].width = Inches(2.3)
    t16.columns[3].width = Inches(1.5)
    t16.columns[4].width = Inches(1.6)
    t16.columns[5].width = Inches(1.8)
    
    cols16 = ["Mã UC", "Tên Use Case chuẩn", "Tác nhân chính", "Phân hệ", "Chức năng MVP", "Yêu cầu hệ thống"]
    for c_idx, h in enumerate(cols16):
        cell = t16.cell(0, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_NAVY
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.name = "Segoe UI"
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = C_WHITE
        p.alignment = PP_ALIGN.CENTER
        
    uc_catalog = [
        ("UC-01", "Authenticate & Manage Session", "Learner, Admin", "Learning", "MVP-01", "CORE-01"),
        ("UC-02", "Configure Goals & Study Time", "Learner", "Learning", "MVP-02, MVP-10", "CORE-01, CORE-10"),
        ("UC-03", "Take Placement Test (30 câu)", "Learner", "Learning", "MVP-03", "CORE-09"),
        ("UC-04", "Browse Learning Path", "Learner", "Learning", "MVP-04", "CORE-07"),
        ("UC-05", "Complete Lesson Exercises & Retry", "Learner", "Learning", "MVP-05, 06, 07", "CORE-03, CORE-07"),
        ("UC-06", "Spaced Repetition Review (SRS)", "Learner", "Learning", "MVP-09", "CORE-08"),
        ("UC-07", "Track Progress & Streak", "Learner", "Learning", "MVP-08, 10, 11", "CORE-10, CORE-11"),
        ("UC-08", "Create & Edit Lesson Draft", "Lesson Creator", "Content", "MVP-05, 06, 12", "CORE-02, 03, 06"),
        ("UC-09", "Review & Approve Content", "Moderator", "Content", "MVP-07, MVP-13", "CORE-04"),
        ("UC-10", "Publish Approved Content", "Organizational Manager", "Content", "MVP-13", "CORE-05"),
        ("UC-11", "Manage Accounts & Roles", "Administrator", "Admin/Ops", "MVP-14, MVP-19", "CORE-12"),
        ("UC-12", "View System Reports", "Administrator", "Admin/Ops", "MVP-15", "EXT-05 (Báo cáo)"),
        ("UC-13", "View & Audit Security Logs", "Administrator", "Admin/Ops", "MVP-19", "CORE-05, 12, EXT-05"),
        ("UC-14", "Handle Support Tickets", "Operations Staff", "Admin/Ops", "MVP-16", "EXT-04"),
        ("UC-15", "[OPTIONAL B2B] Manage Cohorts", "Organizational Manager", "Cohort B2B", "MVP-17", "Phân hệ Cohort B2B")
    ]
    for r_idx, row in enumerate(uc_catalog, 1):
        for c_idx, val in enumerate(row):
            cell = t16.cell(r_idx, c_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = C_WHITE if r_idx % 2 == 1 else C_CARD_TINT
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = "Segoe UI"
            p.font.size = Pt(8.5)
            if c_idx == 0:
                p.font.bold = True
                p.font.color.rgb = C_BLUE
                p.alignment = PP_ALIGN.CENTER
            elif c_idx == 2:
                p.font.bold = True
                if "Creator" in val: p.font.color.rgb = C_ORANGE
                elif "Moderator" in val: p.font.color.rgb = C_GREEN
                elif "Manager" in val: p.font.color.rgb = C_PURPLE
                elif "Admin" in val: p.font.color.rgb = C_RED
                elif "Operations" in val: p.font.color.rgb = C_GRAY
                else: p.font.color.rgb = C_BLUE
            elif c_idx in [3, 4, 5]:
                p.alignment = PP_ALIGN.CENTER

    # ==================== SLIDE 17: CONCLUSION & NEXT STEPS (SLEEK PILLAR CARDS) ====================
    s17 = prs.slides.add_slide(blank_layout)
    add_header(s17, "Hiện trạng & Định hướng", "Kết quả nghiên cứu, hiện trạng hệ thống và định hướng phát triển", "Tổng kết kết quả đặc tả, hiện trạng triển khai kỹ thuật và ranh giới liêm chính học thuật", cat_color=C_PURPLE)
    
    pillars = [
        ("1. KẾT QUẢ ĐẶC TẢ YÊU CẦU", "100% TRACEABLE (ĐA NGUỒN)", C_BLUE, RGBColor(219, 234, 254), [
            ("Cơ sở thực nghiệm đa nguồn:", "Xây dựng từ N=15 khảo sát gốc, N=35 khảo sát bổ sung, N=3 phỏng vấn định tính, 7 chuyên gia và 3 Nghị định pháp lý."),
            ("Mô hình quản trị chặt chẽ:", "Chuẩn hóa 6 vai trò độc lập, ma trận SoD chống gian lận học liệu, quy trình kiểm soát 6 trạng thái và cơ chế Clone-to-Draft."),
            ("Đặc tả chức năng toàn diện:", "12 Yêu cầu cốt lõi (Must) + 8 Mở rộng (Should/Could) ánh xạ nhất quán sang 15 Canonical Use Cases và 19 chức năng MVP.")
        ]),
        ("2. HIỆN TRẠNG KỸ THUẬT LINGORA", "PHASE 0: HOÀN TẤT (VERIFIED)", C_PURPLE, RGBColor(243, 232, 255), [
            ("Phase 0 — Đặc tả & Phân tích:", "ĐÃ HOÀN TẤT và được kiểm chứng độc lập (Pass toàn bộ Verification Gates về bằng chứng và ma trận truy vết)."),
            ("Milestone M1 — Nền tảng Core:", "ĐÃ HOÀN TẤT xác thực an toàn (Next.js 15 SSR Auth, Supabase GoTrue, PostgreSQL RLS, Prisma ORM và API Skeleton)."),
            ("Milestone M2 — Kế hoạch tiếp theo:", "Sẵn sàng triển khai Web Core Lesson Flow và công cụ bài tập tương tác 5 dạng chuẩn.")
        ]),
        ("3. GIỚI HẠN & LIÊM CHÍNH KHOA HỌC", "NGHIÊN CỨU TRUNG THỰC", C_GREEN, RGBColor(209, 250, 229), [
            ("Quy mô mẫu nghiên cứu:", "Khảo sát N=15 và N=35 là mẫu sơ bộ thuận tiện; phỏng vấn N=3 là nghiên cứu định tính khám phá; nhóm cam kết không suy rộng thống kê sai lệch."),
            ("Chỉ số phi chức năng NFR:", "Các mục tiêu (<1s, ≤3s, 99.5%) là ngưỡng kỹ thuật đề xuất, sẽ được đo kiểm chính xác bằng công cụ chuyên dụng khi nghiệm thu."),
            ("Thông điệp cốt lõi:", "Lingora là nền tảng vận hành học liệu có kiểm soát, giải quyết thực chất bài toán duy trì kỷ luật và ghi nhớ từ vựng.")
        ])
    ]
    
    for idx, (title, tag_text, color, icon_bg, items) in enumerate(pillars):
        left_c = Inches(0.8 + idx * 3.9)
        top_c = Inches(1.85)
        
        card = s17.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_c, top_c, Inches(3.75), Inches(4.8))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_BG
        card.line.color.rgb = C_BORDER
        card.line.width = Pt(1.5)
        
        strip = s17.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_c + Inches(0.3), top_c, Inches(3.15), Inches(0.06))
        strip.fill.solid()
        strip.fill.fore_color.rgb = color
        strip.line.fill.background()
        
        badge = s17.shapes.add_shape(MSO_SHAPE.OVAL, left_c + Inches(0.2), top_c + Inches(0.22), Inches(0.52), Inches(0.52))
        badge.fill.solid()
        badge.fill.fore_color.rgb = icon_bg
        badge.line.fill.background()
        tf_b = badge.text_frame
        tf_b.margin_left = tf_b.margin_right = tf_b.margin_top = tf_b.margin_bottom = 0
        tf_b.word_wrap = False
        p_b = tf_b.paragraphs[0]
        p_b.text = f"0{idx+1}"
        p_b.font.name = "Segoe UI"
        p_b.font.size = Pt(11)
        p_b.font.bold = True
        p_b.font.color.rgb = color
        p_b.alignment = PP_ALIGN.CENTER
        
        tb_t = s17.shapes.add_textbox(left_c + Inches(0.82), top_c + Inches(0.20), Inches(2.8), Inches(0.55))
        tf_t = tb_t.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = tf_t.margin_top = 0
        p_t = tf_t.paragraphs[0]
        p_t.text = title
        p_t.font.name = "Segoe UI"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = C_NAVY
        
        chip = s17.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_c + Inches(0.2), top_c + Inches(0.82), Inches(3.35), Inches(0.28))
        chip.fill.solid()
        chip.fill.fore_color.rgb = C_CARD_TINT
        chip.line.color.rgb = color
        chip.line.width = Pt(0.75)
        tf_c = chip.text_frame
        p_c = tf_c.paragraphs[0]
        p_c.text = f"✓ {tag_text}"
        p_c.font.name = "Segoe UI"
        p_c.font.size = Pt(8.5)
        p_c.font.bold = True
        p_c.font.color.rgb = color
        p_c.alignment = PP_ALIGN.CENTER
        
        tb = s17.shapes.add_textbox(left_c + Inches(0.2), top_c + Inches(1.22), Inches(3.35), Inches(3.45))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = 0
        for i_idx, (h, b) in enumerate(items):
            p = tf.paragraphs[0] if i_idx == 0 else tf.add_paragraph()
            p.space_after = Pt(10)
            r1 = p.add_run()
            r1.text = f"{h}\n"
            r1.font.name = "Segoe UI"
            r1.font.bold = True
            r1.font.size = Pt(9.5)
            r1.font.color.rgb = color
            r2 = p.add_run()
            r2.text = b
            r2.font.name = "Segoe UI"
            r2.font.size = Pt(9)
            r2.font.color.rgb = C_DARK_TEXT
            r2.line_spacing = 1.15

    # Save presentations
    for out_path in out_paths:
        try:
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            prs.save(out_path)
            print(f"Saved: {out_path}")
        except Exception as e:
            print(f"Could not save {out_path}: {e}")
        
    print("All 17 slides generated successfully!")

if __name__ == "__main__":
    main()
