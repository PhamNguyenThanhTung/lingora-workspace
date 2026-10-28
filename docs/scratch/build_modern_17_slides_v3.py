# -*- coding: utf-8 -*-
"""
Lingora Presentation Deck Builder v3 - Modern UI/UX (Refined)
Benchmark: 'D:\\Group Project.pdf' and 'D:\\TimHieuPaper_Nhom16.pptx'
- Team: Nhóm 3
- Students: Phạm Nguyễn Thanh Tùng, Nguyễn Văn Bắc, Lê Thị Thanh Thúy
- Supervisor: TS. Hoàng Văn Thông
- Clean slide template with UTC logo at top-left, zero banner collisions (headers start at x >= 1.65")
- Sleek dark navy bottom bar on every slide with "Dự án 1 — Nhóm 3 | Nền tảng Lingora" and slide numbers
- NO ugly, heavy outer wrapper boxes
- Rich visual diagrams and illustrations across all slides
"""

import os
import sys
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

sys.stdout.reconfigure(encoding='utf-8')

# Colors
C_NAVY      = RGBColor(11, 25, 76)       # #0B194C - Deep Brand Navy
C_HEADER_BG = RGBColor(15, 23, 42)       # #0F172A - Header Dark
C_SUBTITLE  = RGBColor(71, 85, 105)      # #475569 - Subtitle Slate
C_BLUE      = RGBColor(37, 99, 235)      # #2563EB - Vibrant Blue (Learner)
C_PURPLE    = RGBColor(124, 58, 237)     # #7C3AED - Purple (Manager)
C_ORANGE    = RGBColor(234, 88, 12)      # #EA580C - Orange (Creator)
C_GREEN     = RGBColor(16, 185, 129)     # #10B981 - Green (Moderator)
C_GRAY      = RGBColor(100, 116, 139)    # #64748B - Gray (Operations)
C_RED       = RGBColor(220, 38, 38)      # #DC2626 - Red (Admin / Warning)
C_CARD_BG   = RGBColor(255, 255, 255)    # #FFFFFF - Clean White
C_CARD_TINT = RGBColor(248, 250, 252)    # #F8FAFC - Soft Off-White
C_CARD_BLUE = RGBColor(239, 246, 255)    # #EFF6FF - Soft Blue Tint
C_BORDER    = RGBColor(226, 232, 240)    # #E2E8F0 - Subtle Border
C_DARK_TEXT = RGBColor(30, 41, 59)       # #1E293B - Body Dark
C_MUTED     = RGBColor(100, 116, 139)    # #64748B - Body Muted
C_WHITE     = RGBColor(255, 255, 255)

def add_header(slide, category_text, title_text, subtitle_text, cat_color=C_BLUE):
    """Adds a modern pill badge, bold title, two-tone accent bar, and subtitle offset from UTC logo."""
    left_x = Inches(1.65)
    
    # Category Pill Badge
    pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_x, Inches(0.38), Inches(2.6), Inches(0.30))
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
    t_box = slide.shapes.add_textbox(left_x, Inches(0.72), Inches(11.0), Inches(0.52))
    tf_t = t_box.text_frame
    tf_t.word_wrap = True
    tf_t.margin_left = tf_t.margin_right = tf_t.margin_top = tf_t.margin_bottom = 0
    p_t = tf_t.paragraphs[0]
    p_t.text = title_text
    p_t.font.name = "Segoe UI"
    p_t.font.size = Pt(21)
    p_t.font.bold = True
    p_t.font.color.rgb = C_NAVY
    
    # Two-tone accent line below title
    line1 = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left_x, Inches(1.26), Inches(1.2), Inches(0.04))
    line1.fill.solid()
    line1.fill.fore_color.rgb = cat_color
    line1.line.fill.background()
    
    line2 = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left_x + Inches(1.25), Inches(1.26), Inches(1.8), Inches(0.04))
    line2.fill.solid()
    line2.fill.fore_color.rgb = RGBColor(203, 213, 225)
    line2.line.fill.background()
    
    # Subtitle
    if subtitle_text:
        s_box = slide.shapes.add_textbox(left_x, Inches(1.34), Inches(11.0), Inches(0.35))
        tf_s = s_box.text_frame
        tf_s.word_wrap = True
        tf_s.margin_left = tf_s.margin_right = tf_s.margin_top = tf_s.margin_bottom = 0
        p_s = tf_s.paragraphs[0]
        p_s.text = subtitle_text
        p_s.font.name = "Segoe UI"
        p_s.font.size = Pt(11.5)
        p_s.font.color.rgb = C_SUBTITLE

def add_bottom_bar(slide, slide_num):
    """Adds the Group Project benchmark bottom bar with dark navy background and slide number."""
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(7.08), Inches(13.333), Inches(0.42))
    bar.fill.solid()
    bar.fill.fore_color.rgb = C_NAVY
    bar.line.fill.background()
    
    # Left text
    tb_l = slide.shapes.add_textbox(Inches(0.8), Inches(7.12), Inches(5.0), Inches(0.32))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = False
    p_l = tf_l.paragraphs[0]
    p_l.text = "Dự án 1 — Nhóm 3 | Nền tảng Lingora"
    p_l.font.name = "Segoe UI"
    p_l.font.size = Pt(9.5)
    p_l.font.color.rgb = RGBColor(226, 232, 240)
    
    # Thin divider line
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(5.5), Inches(7.28), Inches(6.2), Inches(0.015))
    line.fill.solid()
    line.fill.fore_color.rgb = RGBColor(51, 65, 85)
    line.line.fill.background()
    
    # Right slide number
    tb_r = slide.shapes.add_textbox(Inches(12.0), Inches(7.10), Inches(0.9), Inches(0.35))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = False
    p_r = tf_r.paragraphs[0]
    p_r.text = f"{slide_num:02d}"
    p_r.font.name = "Segoe UI"
    p_r.font.size = Pt(11)
    p_r.font.bold = True
    p_r.font.color.rgb = C_WHITE
    p_r.alignment = PP_ALIGN.RIGHT

def create_floating_card(slide, left, top, width, height, bg_color=C_CARD_BG, border_color=C_BORDER):
    """Creates a sleek floating card without heavy wrapper styling."""
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    if border_color:
        card.line.color.rgb = border_color
        card.line.width = Pt(1)
    else:
        card.line.fill.background()
    return card

def main():
    template_path = "docs/scratch/clean_template.pptx"
    out_paths = [
        "docs/report/Lingora-Project-1-Requirements-Presentation.pptx",
        "docs/project-1/Lingora-Project-1-Requirements-Presentation.pptx",
        "staging/lingora-workspace-public/docs/report/Lingora-Project-1-Requirements-Presentation.pptx"
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
    pill = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_t, Inches(1.1), Inches(2.8), Inches(0.36))
    pill.fill.solid()
    pill.fill.fore_color.rgb = C_BLUE
    pill.line.fill.background()
    tf_p = pill.text_frame
    tf_p.word_wrap = False
    tf_p.margin_left = tf_p.margin_right = tf_p.margin_top = tf_p.margin_bottom = 0
    p_p = tf_p.paragraphs[0]
    p_p.text = "BÁO CÁO DỰ ÁN 1 — NHÓM 3"
    p_p.font.name = "Segoe UI"
    p_p.font.size = Pt(10.5)
    p_p.font.bold = True
    p_p.font.color.rgb = C_WHITE
    p_p.alignment = PP_ALIGN.CENTER
    
    # Title
    t_box = s1.shapes.add_textbox(left_t, Inches(1.58), Inches(6.2), Inches(1.6))
    tf_t = t_box.text_frame
    tf_t.word_wrap = True
    p_t = tf_t.paragraphs[0]
    p_t.text = "LINGORA — NỀN TẢNG HỌC NGOẠI NGỮ TRỰC TUYẾN"
    p_t.font.name = "Segoe UI"
    p_t.font.size = Pt(26)
    p_t.font.bold = True
    p_t.font.color.rgb = C_NAVY
    
    # Accent line
    l1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, left_t, Inches(3.25), Inches(1.2), Inches(0.05))
    l1.fill.solid()
    l1.fill.fore_color.rgb = C_BLUE
    l1.line.fill.background()
    l2 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, left_t + Inches(1.25), Inches(3.25), Inches(2.0), Inches(0.05))
    l2.fill.solid()
    l2.fill.fore_color.rgb = RGBColor(203, 213, 225)
    l2.line.fill.background()
    
    # Subtitle
    s_box = s1.shapes.add_textbox(left_t, Inches(3.38), Inches(6.2), Inches(0.65))
    tf_s = s_box.text_frame
    tf_s.word_wrap = True
    p_s = tf_s.paragraphs[0]
    p_s.text = "Nghiên cứu nhu cầu người học, phân tích nghiệp vụ & đặc tả yêu cầu hệ thống"
    p_s.font.name = "Segoe UI"
    p_s.font.size = Pt(13)
    p_s.font.color.rgb = C_BLUE
    
    # Metadata rows on left with crisp tag pills
    meta_items = [
        ("Cơ sở đào tạo:", "Trường ĐH Giao thông Vận tải (UTC) — Khoa CNTT", "UTC"),
        ("Nhóm thực hiện:", "Nhóm 3 (Lớp Dự án 1 — Phân tích yêu cầu & Thiết kế hệ thống)", "N-03"),
        ("Sinh viên thực hiện:", "Phạm Nguyễn Thanh Tùng • Nguyễn Văn Bắc • Lê Thị Thanh Thúy", "SV"),
        ("Giảng viên hướng dẫn:", "TS. Hoàng Văn Thông", "GV"),
        ("Thời gian thực hiện:", "Tháng 09/2026", "2026")
    ]
    
    meta_top = Inches(4.2)
    for i, (label, val, tag) in enumerate(meta_items):
        y = meta_top + i * Inches(0.52)
        # Small rounded tag pill
        ic = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_t, y + Inches(0.03), Inches(0.48), Inches(0.26))
        ic.fill.solid()
        ic.fill.fore_color.rgb = C_CARD_BLUE
        ic.line.color.rgb = RGBColor(191, 219, 254)
        tf_ic = ic.text_frame
        tf_ic.word_wrap = False
        tf_ic.margin_left = tf_ic.margin_right = tf_ic.margin_top = tf_ic.margin_bottom = 0
        p_ic = tf_ic.paragraphs[0]
        p_ic.text = tag
        p_ic.font.name = "Segoe UI"
        p_ic.font.size = Pt(8.5)
        p_ic.font.bold = True
        p_ic.font.color.rgb = C_BLUE
        p_ic.alignment = PP_ALIGN.CENTER
        
        # Text box
        tb = s1.shapes.add_textbox(left_t + Inches(0.58), y - Inches(0.04), Inches(5.5), Inches(0.44))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        run1 = p.add_run()
        run1.text = label + " "
        run1.font.name = "Segoe UI"
        run1.font.size = Pt(10.5)
        run1.font.bold = True
        run1.font.color.rgb = C_DARK_TEXT
        
        run2 = p.add_run()
        run2.text = val
        run2.font.name = "Segoe UI"
        run2.font.size = Pt(10.5)
        run2.font.color.rgb = C_BLUE if "Thanh Tùng" in val or "Hoàng Văn Thông" in val else C_MUTED
        if "Thanh Tùng" in val or "Hoàng Văn Thông" in val:
            run2.font.bold = True

    # Right Hero Image
    hero_path = "docs/scratch/assets/s1_hero.jpg"
    if os.path.exists(hero_path):
        s1.shapes.add_picture(hero_path, Inches(8.0), Inches(1.15), width=Inches(4.9), height=Inches(5.6))
        
    add_bottom_bar(s1, 1)

    # ==================== SLIDE 2: AGENDA ====================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "MỤC LỤC CHƯƠNG TRÌNH", "Từ vấn đề thực tế đến yêu cầu hệ thống",
               "Lộ trình 5 phần báo cáo được xây dựng trên bằng chứng thực nghiệm và đối chuẩn thực tế", C_BLUE)
    
    agenda_cards = [
        ("01", "Bối cảnh & Phương pháp luận", "Thực trạng học ngoại ngữ, bài toán kỷ luật & 5 phương pháp nghiên cứu tiếp cận.", C_BLUE),
        ("02", "Nghiên cứu thực nghiệm", "Khảo sát ban đầu N=15, khảo sát bổ sung N=35 & phỏng vấn định tính N=3 người học.", C_PURPLE),
        ("03", "Nghiên cứu chuyên gia & Vận hành", "Phỏng vấn chuyên sâu 7 chuyên gia (5 vai trò), đối chuẩn nền tảng & rà soát pháp lý.", C_ORANGE),
        ("04", "Ma trận & Đặc tả yêu cầu", "Ma trận truy vết thực tế, bộ 12 CORE + 8 EXT + NFRs & Ma trận SoD 6 vai trò.", C_GREEN),
        ("05", "Quy trình, Use Case & Kết luận", "2 luồng nghiệp vụ cốt lõi, 15 Canonical Use Cases, hiện trạng kỹ thuật & ranh giới liêm chính.", C_RED)
    ]
    
    # Row 1: 3 cards
    for i in range(3):
        num, title, desc, col = agenda_cards[i]
        x = Inches(0.8) + i * Inches(3.95)
        y = Inches(1.95)
        card = create_floating_card(s2, x, y, Inches(3.8), Inches(2.25), C_CARD_BG, C_BORDER)
        
        # Circle badge with word_wrap = False
        badge = s2.shapes.add_shape(MSO_SHAPE.OVAL, x + Inches(0.2), y + Inches(0.2), Inches(0.55), Inches(0.55))
        badge.fill.solid()
        badge.fill.fore_color.rgb = col
        badge.line.fill.background()
        tf_b = badge.text_frame
        tf_b.word_wrap = False
        tf_b.margin_left = tf_b.margin_right = tf_b.margin_top = tf_b.margin_bottom = 0
        p_b = tf_b.paragraphs[0]
        p_b.text = num
        p_b.font.name = "Segoe UI"
        p_b.font.size = Pt(13)
        p_b.font.bold = True
        p_b.font.color.rgb = C_WHITE
        p_b.alignment = PP_ALIGN.CENTER
        
        # Text
        tb = s2.shapes.add_textbox(x + Inches(0.2), y + Inches(0.85), Inches(3.4), Inches(1.3))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.name = "Segoe UI"
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = C_NAVY
        
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = "Segoe UI"
        p2.font.size = Pt(10)
        p2.font.color.rgb = C_MUTED
        p2.space_before = Pt(6)

    # Row 2: 2 cards centered
    for i in range(2):
        num, title, desc, col = agenda_cards[3 + i]
        x = Inches(1.8) + i * Inches(5.0)
        y = Inches(4.45)
        card = create_floating_card(s2, x, y, Inches(4.7), Inches(2.25), C_CARD_BG, C_BORDER)
        
        badge = s2.shapes.add_shape(MSO_SHAPE.OVAL, x + Inches(0.25), y + Inches(0.2), Inches(0.55), Inches(0.55))
        badge.fill.solid()
        badge.fill.fore_color.rgb = col
        badge.line.fill.background()
        tf_b = badge.text_frame
        tf_b.word_wrap = False
        tf_b.margin_left = tf_b.margin_right = tf_b.margin_top = tf_b.margin_bottom = 0
        p_b = tf_b.paragraphs[0]
        p_b.text = num
        p_b.font.name = "Segoe UI"
        p_b.font.size = Pt(13)
        p_b.font.bold = True
        p_b.font.color.rgb = C_WHITE
        p_b.alignment = PP_ALIGN.CENTER
        
        tb = s2.shapes.add_textbox(x + Inches(0.25), y + Inches(0.85), Inches(4.2), Inches(1.3))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.name = "Segoe UI"
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = C_NAVY
        
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = "Segoe UI"
        p2.font.size = Pt(10)
        p2.font.color.rgb = C_MUTED
        p2.space_before = Pt(6)
        
    add_bottom_bar(s2, 2)

    # ==================== SLIDE 3: BỐI CẢNH & ĐỘT PHÁ ====================
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "BỐI CẢNH THỰC TẾ", "Vấn đề không chỉ là học, mà là học đều và nhớ lâu",
               "Khoảng trống giữa mong muốn học ngoại ngữ và thói quen duy trì kỷ luật học tập hàng ngày", C_BLUE)
    
    # Left Section: Ebbinghaus curve + Problem statements
    x_l = Inches(0.8)
    w_l = Inches(5.7)
    
    p_pill = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x_l, Inches(1.85), Inches(5.7), Inches(0.32))
    p_pill.fill.solid()
    p_pill.fill.fore_color.rgb = RGBColor(254, 242, 242)
    p_pill.line.color.rgb = RGBColor(254, 202, 202)
    tf_pp = p_pill.text_frame
    p_pp = tf_pp.paragraphs[0]
    p_pp.text = "THỰC TRẠNG: ĐƯỜNG CONG QUÊN LÃNG & VÒNG XOÁY BỎ DỞ"
    p_pp.font.name = "Segoe UI"
    p_pp.font.size = Pt(9.5)
    p_pp.font.bold = True
    p_pp.font.color.rgb = C_RED
    p_pp.alignment = PP_ALIGN.CENTER
    
    eb_path = "docs/scratch/assets/s3_ebbinghaus_srs.png"
    if os.path.exists(eb_path):
        s3.shapes.add_picture(eb_path, x_l, Inches(2.25), width=w_l, height=Inches(3.1))
        
    prob_card = create_floating_card(s3, x_l, Inches(5.42), w_l, Inches(1.45), C_CARD_BG, C_BORDER)
    tb_pc = s3.shapes.add_textbox(x_l + Inches(0.15), Inches(5.48), w_l - Inches(0.3), Inches(1.3))
    tf_pc = tb_pc.text_frame
    tf_pc.word_wrap = True
    tf_pc.margin_left = tf_pc.margin_right = tf_pc.margin_top = tf_pc.margin_bottom = 0
    
    probs = [
        ("• Quên 80% sau 3-5 ngày: ", "100% học viên thừa nhận quên sạch nếu không có thuật toán nhắc ôn."),
        ("• Học dồn gây quá tải: ", "Cố học 30–45p ban đầu rồi kiệt sức, nản lòng bỏ cuộc sau 1–2 tuần."),
        ("• Sai không giải thích: ", "Bực bội vì chỉ thấy gạch chéo đỏ, không hiểu bản chất ngữ pháp để sửa.")
    ]
    for i, (title, text) in enumerate(probs):
        p = tf_pc.paragraphs[0] if i == 0 else tf_pc.add_paragraph()
        p.space_after = Pt(3)
        r1 = p.add_run()
        r1.text = title
        r1.font.name = "Segoe UI"
        r1.font.size = Pt(9.5)
        r1.font.bold = True
        r1.font.color.rgb = C_RED
        
        r2 = p.add_run()
        r2.text = text
        r2.font.name = "Segoe UI"
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = C_DARK_TEXT

    # Right Section: 4 modern solution cards
    x_r = Inches(6.8)
    w_r = Inches(5.7)
    
    s_pill = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x_r, Inches(1.85), Inches(5.7), Inches(0.32))
    s_pill.fill.solid()
    s_pill.fill.fore_color.rgb = RGBColor(239, 246, 255)
    s_pill.line.color.rgb = RGBColor(191, 219, 254)
    tf_sp = s_pill.text_frame
    p_sp = tf_sp.paragraphs[0]
    p_sp.text = "GIẢI PHÁP THIẾT KẾ ĐỘT PHÁ CỦA LINGORA"
    p_sp.font.name = "Segoe UI"
    p_sp.font.size = Pt(9.5)
    p_sp.font.bold = True
    p_sp.font.color.rgb = C_BLUE
    p_sp.alignment = PP_ALIGN.CENTER
    
    sol_items = [
        ("1. Bài học vi mô (Micro-learning 5–10p)",
         "Gói gọn 8–10 từ cốt lõi/bài. Hạ thấp rào cản tâm lý, giúp người học dễ dàng duy trì kỷ luật học đều đặn mỗi ngày mà không bị quá tải.",
         C_BLUE),
        ("2. Ôn tập ngắt quãng (SRS 1-3-7-14-30 ngày)",
         "Thuật toán tự động gom từ đến hạn cần ôn. Kéo tỷ lệ ghi nhớ trở lại 100%, bẻ gãy đường cong quên lãng Ebbinghaus bền vững.",
         C_GREEN),
        ("3. Phản hồi tức thì & Controlled Retry",
         "Hiển thị giải thích ngữ pháp/nghĩa chi tiết ngay khi làm sai; tự động gom tối đa 10% câu sai làm lại cuối bài để củng cố kiến thức.",
         C_PURPLE),
        ("4. Mô hình quản trị SoD 4 mắt",
         "Tách biệt nghiêm ngặt: Creator soạn ≠ Moderator duyệt QC 6 điểm ≠ Manager xuất bản Unit. Triệt tiêu hoàn toàn học liệu rác và sai sót.",
         C_ORANGE)
    ]
    
    for i, (title, desc, col) in enumerate(sol_items):
        y_c = Inches(2.25) + i * Inches(1.16)
        card = create_floating_card(s3, x_r, y_c, w_r, Inches(1.10), C_CARD_BG, C_BORDER)
        
        # Left color stripe
        strp = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, x_r, y_c, Inches(0.08), Inches(1.10))
        strp.fill.solid()
        strp.fill.fore_color.rgb = col
        strp.line.fill.background()
        
        # Circular number badge
        ic = s3.shapes.add_shape(MSO_SHAPE.OVAL, x_r + Inches(0.18), y_c + Inches(0.18), Inches(0.42), Inches(0.42))
        ic.fill.solid()
        ic.fill.fore_color.rgb = col
        ic.line.fill.background()
        tf_ic = ic.text_frame
        tf_ic.word_wrap = False
        tf_ic.margin_left = tf_ic.margin_right = tf_ic.margin_top = tf_ic.margin_bottom = 0
        p_ic = tf_ic.paragraphs[0]
        p_ic.text = f"{i+1}"
        p_ic.font.name = "Segoe UI"
        p_ic.font.size = Pt(11)
        p_ic.font.bold = True
        p_ic.font.color.rgb = C_WHITE
        p_ic.alignment = PP_ALIGN.CENTER
        
        # Text box
        tb = s3.shapes.add_textbox(x_r + Inches(0.68), y_c + Inches(0.10), w_r - Inches(0.78), Inches(0.95))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.name = "Segoe UI"
        p1.font.size = Pt(11)
        p1.font.bold = True
        p1.font.color.rgb = col
        
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = "Segoe UI"
        p2.font.size = Pt(9.2)
        p2.font.color.rgb = C_DARK_TEXT
        p2.space_before = Pt(3)

    add_bottom_bar(s3, 3)

    # ==================== SLIDE 4: PHƯƠNG PHÁP LUẬN ====================
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "PHƯƠNG PHÁP LUẬN", "Mỗi câu hỏi được trả lời bằng phương pháp độc lập",
               "Không quy chụp dữ liệu; kết hợp khảo sát định lượng, phỏng vấn định tính và kiểm chứng pháp lý", C_BLUE)
    
    methods = [
        ("Khảo sát sơ bộ N=15", "24 câu hỏi bao quát", C_BLUE,
         "• Phạm vi: 15 người học ngoại ngữ với 24 câu hỏi đa chiều.\n\n"
         "• Phát hiện cốt lõi: 100% quên từ vựng, 4.13/5 nhu cầu nhắc ôn và học vi mô.\n\n"
         "• Ý nghĩa: Xác lập yêu cầu cốt lõi về thuật toán ôn ngắt quãng SRS."),
        ("Khảo sát bổ sung N=35", "Tập trung 2 biến số", C_PURPLE,
         "• Phạm vi: 35 người học khảo sát chuyên sâu 2 quyết định thiết kế.\n\n"
         "• Phát hiện cốt lõi: 51.4% học 20h–22h, 54.3% đồng ý làm lại câu sai (~10%).\n\n"
         "• Ý nghĩa: Định hình giờ vàng thông báo và cơ chế Controlled Retry."),
        ("Phỏng vấn định tính N=3", "Bán cấu trúc chuyên sâu", C_ORANGE,
         "• Phạm vi: 3 người học từng bỏ dở các app tiếng Anh phổ biến.\n\n"
         "• Phát hiện cốt lõi: Bài học quá dài (>15p), sai không giải thích, dồn ứ bài học.\n\n"
         "• Ý nghĩa: Chuẩn hóa bài 5–10p và bắt buộc giải thích ngay khi sai."),
        ("Phỏng vấn chuyên gia (7)", "5 nhóm vai trò", C_GREEN,
         "• Phạm vi: 7 chuyên gia (Manager, Creator, Moderator, Ops, Admin).\n\n"
         "• Phát hiện cốt lõi: Task Spec 5 trường, Unit 4/4 bài, QC 6 điểm và SoD.\n\n"
         "• Ý nghĩa: Xác lập quy trình quản trị 4 mắt và phân quyền chặt chẽ."),
        ("Đối chuẩn & Pháp lý", "Benchmark & Legal", C_RED,
         "• Phạm vi: Đối chuẩn Duolingo, Quizlet + Rà soát văn bản pháp lý ATTT.\n\n"
         "• Phát hiện cốt lõi: Luật ATTT 86/2015 & Nghị định 13/2023/NĐ-CP.\n\n"
         "• Ý nghĩa: Chuẩn hóa Audit Log 6 trường và bảo mật HttpOnly Cookies.")
    ]
    
    for i, (m_title, m_sub, col, details) in enumerate(methods):
        x = Inches(0.8) + i * Inches(2.38)
        y = Inches(1.95)
        w = Inches(2.25)
        h = Inches(4.8)
        card = create_floating_card(s4, x, y, w, h, C_CARD_BG, C_BORDER)
        
        # Top color pill
        cp = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x + Inches(0.12), y + Inches(0.15), w - Inches(0.24), Inches(0.65))
        cp.fill.solid()
        cp.fill.fore_color.rgb = col
        cp.line.fill.background()
        tf_cp = cp.text_frame
        tf_cp.word_wrap = True
        tf_cp.margin_left = tf_cp.margin_right = tf_cp.margin_top = tf_cp.margin_bottom = 0
        p_cp1 = tf_cp.paragraphs[0]
        p_cp1.text = m_title
        p_cp1.font.name = "Segoe UI"
        p_cp1.font.size = Pt(9.5)
        p_cp1.font.bold = True
        p_cp1.font.color.rgb = C_WHITE
        p_cp1.alignment = PP_ALIGN.CENTER
        
        p_cp2 = tf_cp.add_paragraph()
        p_cp2.text = m_sub
        p_cp2.font.name = "Segoe UI"
        p_cp2.font.size = Pt(8.5)
        p_cp2.font.color.rgb = RGBColor(241, 245, 249)
        p_cp2.alignment = PP_ALIGN.CENTER
        
        # Content
        tb = s4.shapes.add_textbox(x + Inches(0.12), y + Inches(0.95), w - Inches(0.24), Inches(3.7))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = details
        p.font.name = "Segoe UI"
        p.font.size = Pt(9.2)
        p.font.color.rgb = C_DARK_TEXT
        
    add_bottom_bar(s4, 4)

    # ==================== SLIDE 5: KHẢO SÁT N=15 ====================
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "KHẢO SÁT THỰC NGHIỆM", "Khảo sát ban đầu N=15: Vấn đề nào cần giải quyết?",
               "24 câu hỏi khảo sát giúp xác định chính xác các rào cản tâm lý và nhu cầu học tập cốt lõi", C_BLUE)
    
    chart_p15 = "docs/scratch/assets/s5_survey_n15.png"
    if os.path.exists(chart_p15):
        s5.shapes.add_picture(chart_p15, Inches(0.8), Inches(1.90), width=Inches(11.7), height=Inches(2.75))
        
    takeaways_15 = [
        ("Trở ngại quên từ vựng (100%)",
         "Toàn bộ 15/15 người được khảo sát thừa nhận thường xuyên quên từ vựng sau khi học. Hệ thống bắt buộc phải có thuật toán ôn tập ngắt quãng (SRS) tự động.",
         C_BLUE),
        ("Nhắc nhở ôn tập (4.13/5)",
         "Nhu cầu tự động nhắc ôn từ vựng ở mức rất cấp thiết (12/15 người đánh giá 4 hoặc 5 điểm Likert). Đòi hỏi cơ chế push notification in-app đúng khung giờ.",
         C_GREEN),
        ("Gợi ý lộ trình (93.3%)",
         "14/15 người học mong muốn hệ thống tự động kiểm tra đầu vào và đề xuất bài học phù hợp với trình độ, tránh học lại kiến thức quá dễ gây nhàm chán.",
         C_PURPLE),
        ("Bài tập tương tác (73.3%)",
         "Người học ưu tiên các dạng bài tập điền từ, trắc nghiệm nhanh và nghe nhận diện từ có phản hồi giải thích ngay lập tức khi làm sai thay vì chỉ báo đúng/sai.",
         C_ORANGE)
    ]
    
    for i, (title, desc, col) in enumerate(takeaways_15):
        x = Inches(0.8) + i * Inches(2.95)
        y = Inches(4.80)
        w = Inches(2.82)
        h = Inches(2.05)
        card = create_floating_card(s5, x, y, w, h, C_CARD_BG, C_BORDER)
        
        top_l = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, Inches(0.06))
        top_l.fill.solid()
        top_l.fill.fore_color.rgb = col
        top_l.line.fill.background()
        
        tb = s5.shapes.add_textbox(x + Inches(0.12), y + Inches(0.15), w - Inches(0.24), h - Inches(0.2))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.name = "Segoe UI"
        p1.font.size = Pt(10.5)
        p1.font.bold = True
        p1.font.color.rgb = col
        
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = "Segoe UI"
        p2.font.size = Pt(9)
        p2.font.color.rgb = C_DARK_TEXT
        p2.space_before = Pt(4)
        
    add_bottom_bar(s5, 5)

    # ==================== SLIDE 6: KHẢO SÁT N=35 ====================
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "KHẢO SÁT THỰC NGHIỆM", "Khảo sát bổ sung N=35: Khung giờ học và cơ chế làm lại câu sai",
               "Thu thập dữ liệu chuyên sâu để định hình 2 quyết định thiết kế then chốt của ứng dụng", C_BLUE)
    
    chart_p35 = "docs/scratch/assets/s6_survey_n35.png"
    if os.path.exists(chart_p35):
        s6.shapes.add_picture(chart_p35, Inches(0.8), Inches(1.90), width=Inches(11.7), height=Inches(2.75))
        
    decisions_35 = [
        ("QUYẾT ĐỊNH 1: NHẮC NHỞ TRONG ỨNG DỤNG THEO KHUNG GIỜ [PRELIMINARY]",
         "• 51.4% (18/35) chọn 20:00–22:00: Tham số định hướng cho In-app Reminder (Web Push DEFERRED).\n"
         "• Hướng dẫn người học cài đặt mốc giờ tự học ưa thích, không ép buộc hay làm phiền ngoài app.\n"
         "• Trạng thái quyết định thiết kế: PENDING-EVIDENCE chờ kiểm chứng thêm.",
         C_BLUE),
        ("QUYẾT ĐỊNH 2: CƠ CHẾ LÀM LẠI CÂU SAI (CONTROLLED RETRY ~10%) [PRELIMINARY]",
         "• Chỉ 5/35 (14.3%) từ chối hoàn toàn việc gặp lại câu sai; 54.3% đồng ý, 31.4% phân vân/tùy bài.\n"
         "• Cơ chế Controlled Retry: Gom tối đa 10% số câu sai vào cuối bài học để củng cố ngay kiến thức.\n"
         "• Tham số cấu hình linh hoạt; trạng thái thiết kế PENDING-EVIDENCE chờ đo kiểm thực nghiệm.",
         C_GREEN)
    ]
    
    for i, (title, desc, col) in enumerate(decisions_35):
        x = Inches(0.8) + i * Inches(5.95)
        y = Inches(4.80)
        w = Inches(5.75)
        h = Inches(2.05)
        card = create_floating_card(s6, x, y, w, h, C_CARD_BG, C_BORDER)
        
        top_l = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, Inches(0.06))
        top_l.fill.solid()
        top_l.fill.fore_color.rgb = col
        top_l.line.fill.background()
        
        tb = s6.shapes.add_textbox(x + Inches(0.2), y + Inches(0.15), w - Inches(0.4), h - Inches(0.2))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.name = "Segoe UI"
        p1.font.size = Pt(11)
        p1.font.bold = True
        p1.font.color.rgb = col
        
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = "Segoe UI"
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = C_DARK_TEXT
        p2.space_before = Pt(4)
        
    add_bottom_bar(s6, 6)

    # ==================== SLIDE 7: PHỎNG VẤN N=3 PERSONAS ====================
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "PHỎNG VẤN ĐỊNH TÍNH", "Phỏng vấn N=3: Vì sao người học từng bỏ dở ứng dụng?",
               "Phỏng vấn bán cấu trúc chuyên sâu giải mã rào cản tâm lý dẫn đến việc bỏ ngang việc học", C_BLUE)
    
    personas = [
        ("01", "Case 1 — Lỡ nhịp & Dồn ứ", "Sinh viên năm 2", C_BLUE,
         "\"Bỏ lỡ 1 ngày bận rộn, hôm sau app dồn bài học gấp đôi kèm danh sách từ ôn tập quá dài khiến em hoảng loạn và từ bỏ.\"",
         "Cảm giác tội lỗi và áp lực bị phạt bài học dồn làm triệt tiêu hoàn toàn động lực học.",
         "Thiết kế bài vi mô 5–10 phút; khống chế số lượng từ cần ôn mỗi ngày, tuyệt đối không dồn bài phạt."),
        ("02", "Case 2 — Làm sai không giải thích", "Người đi làm", C_ORANGE,
         "\"Làm sai bài tập nhưng app chỉ hiển thị dấu X đỏ và đáp án đúng mà hoàn toàn không giải thích vì sao sai.\"",
         "Bức xúc, cảm thấy bị đánh đố và không tiến bộ sau các lỗi sai.",
         "Phản hồi tức thì: Bắt buộc kèm giải thích ngữ pháp và từ vựng chi tiết ngay tại chỗ sau mỗi câu sai."),
        ("03", "Case 3 — Bài học quá dài dòng", "Sinh viên năm 4", C_PURPLE,
         "\"Bài học kéo dài lê thê (>15 phút) khiến người học khó tranh thủ học trong các khoảng thời gian trống ngắn.\"",
         "Khó duy trì thói quen học tập đều đặn khi lịch học và làm việc bận rộn.",
         "Chuẩn hóa mỗi bài học chỉ gồm 8–10 từ vựng cốt lõi, hoàn thành trọn vẹn trong 5–10 phút.")
    ]
    
    for i, (num, title, role, col, quote, impact, solution) in enumerate(personas):
        x = Inches(0.8) + i * Inches(3.95)
        y = Inches(1.95)
        w = Inches(3.8)
        h = Inches(4.9)
        card = create_floating_card(s7, x, y, w, h, C_CARD_BG, C_BORDER)
        
        # Circle badge with word_wrap = False
        badge = s7.shapes.add_shape(MSO_SHAPE.OVAL, x + Inches(0.18), y + Inches(0.18), Inches(0.52), Inches(0.52))
        badge.fill.solid()
        badge.fill.fore_color.rgb = col
        badge.line.fill.background()
        tf_b = badge.text_frame
        tf_b.word_wrap = False
        tf_b.margin_left = tf_b.margin_right = tf_b.margin_top = tf_b.margin_bottom = 0
        p_b = tf_b.paragraphs[0]
        p_b.text = num
        p_b.font.name = "Segoe UI"
        p_b.font.size = Pt(12)
        p_b.font.bold = True
        p_b.font.color.rgb = C_WHITE
        p_b.alignment = PP_ALIGN.CENTER
        
        # Header text
        tb_h = s7.shapes.add_textbox(x + Inches(0.8), y + Inches(0.15), w - Inches(0.9), Inches(0.6))
        tf_h = tb_h.text_frame
        tf_h.word_wrap = True
        tf_h.margin_left = tf_h.margin_right = tf_h.margin_top = tf_h.margin_bottom = 0
        p_h1 = tf_h.paragraphs[0]
        p_h1.text = title
        p_h1.font.name = "Segoe UI"
        p_h1.font.size = Pt(11)
        p_h1.font.bold = True
        p_h1.font.color.rgb = C_NAVY
        p_h2 = tf_h.add_paragraph()
        p_h2.text = role
        p_h2.font.name = "Segoe UI"
        p_h2.font.size = Pt(9.5)
        p_h2.font.color.rgb = col
        
        # Quote card inside
        qc = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x + Inches(0.15), y + Inches(0.85), w - Inches(0.3), Inches(1.15))
        qc.fill.solid()
        qc.fill.fore_color.rgb = C_CARD_TINT
        qc.line.color.rgb = RGBColor(226, 232, 240)
        tf_qc = qc.text_frame
        tf_qc.word_wrap = True
        p_qc = tf_qc.paragraphs[0]
        p_qc.text = quote
        p_qc.font.name = "Segoe UI"
        p_qc.font.size = Pt(8.8)
        p_qc.font.italic = True
        p_qc.font.color.rgb = C_DARK_TEXT
        
        # Details below quote
        tb_d = s7.shapes.add_textbox(x + Inches(0.15), y + Inches(2.10), w - Inches(0.3), Inches(2.65))
        tf_d = tb_d.text_frame
        tf_d.word_wrap = True
        tf_d.margin_left = tf_d.margin_right = tf_d.margin_top = tf_d.margin_bottom = 0
        
        p_imp1 = tf_d.paragraphs[0]
        p_imp1.text = "Tác động tâm lý:"
        p_imp1.font.name = "Segoe UI"
        p_imp1.font.size = Pt(9.5)
        p_imp1.font.bold = True
        p_imp1.font.color.rgb = C_RED
        
        p_imp2 = tf_d.add_paragraph()
        p_imp2.text = impact
        p_imp2.font.name = "Segoe UI"
        p_imp2.font.size = Pt(9)
        p_imp2.font.color.rgb = C_DARK_TEXT
        p_imp2.space_after = Pt(8)
        
        p_sol1 = tf_d.add_paragraph()
        p_sol1.text = "Giải pháp Lingora:"
        p_sol1.font.name = "Segoe UI"
        p_sol1.font.size = Pt(9.5)
        p_sol1.font.bold = True
        p_sol1.font.color.rgb = C_GREEN
        
        p_sol2 = tf_d.add_paragraph()
        p_sol2.text = solution
        p_sol2.font.name = "Segoe UI"
        p_sol2.font.size = Pt(9)
        p_sol2.font.color.rgb = C_DARK_TEXT
        
    add_bottom_bar(s7, 7)

    # ==================== SLIDE 8: 6 VAI TRÒ CHUYÊN GIA ====================
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "GÓC NHÌN CHUYÊN GIA", "Kiểm chứng yêu cầu với 6 vai trò trong hệ thống",
               "7 chuyên gia được phỏng vấn chuyên sâu giúp xác lập mô hình phân quyền và vận hành chặt chẽ", C_BLUE)
    
    roles = [
        ("Learner (Người học)", "Nghiệp vụ Học tập", C_BLUE,
         "Học viên học theo lộ trình, làm bài tập tương tác, tự ôn ngắt quãng (SRS), làm lại câu sai và theo dõi Streak hàng ngày."),
        ("Organizational Manager", "Quản lý Đào tạo", C_PURPLE,
         "Lập khung chương trình, giao việc cho Creator qua Task Spec, phê duyệt xuất bản Unit (4/4 bài) và quản lý lớp học."),
        ("Lesson Creator", "Biên soạn Học liệu", C_ORANGE,
         "Nhập liệu bài học vi mô (8–10 từ), gắn audio chuẩn, tạo bài tập 5 dạng có giải thích. Cấm tự duyệt bài mình tạo."),
        ("Moderator (Kiểm duyệt)", "Kiểm soát Chất lượng", C_GREEN,
         "Thẩm định độc lập theo bộ tiêu chí QC 6 điểm, thẩm âm bắt buộc 100%, trả bài sửa kèm lý do. Cấm xuất bản."),
        ("Operations Staff", "Vận hành & Hỗ trợ", C_GRAY,
         "Tiếp nhận và xử lý phiếu phản ánh học tập (3 nhánh); không được phép can thiệp chỉnh sửa trực tiếp CSDL học liệu."),
        ("Administrator (Quản trị)", "Bảo mật & Kỹ thuật", C_RED,
         "Quản lý tài khoản, phân quyền RBAC, giám sát Audit Log bất biến và can thiệp xuất bản khẩn cấp có giải trình.")
    ]
    
    for i, (r_title, r_sub, col, desc) in enumerate(roles):
        row = i // 3
        col_idx = i % 3
        x = Inches(0.8) + col_idx * Inches(3.95)
        y = Inches(1.95) + row * Inches(2.45)
        w = Inches(3.8)
        h = Inches(2.3)
        card = create_floating_card(s8, x, y, w, h, C_CARD_BG, C_BORDER)
        
        # Pill header inside card
        pill = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x + Inches(0.15), y + Inches(0.15), w - Inches(0.3), Inches(0.38))
        pill.fill.solid()
        pill.fill.fore_color.rgb = col
        pill.line.fill.background()
        tf_p = pill.text_frame
        p_p = tf_p.paragraphs[0]
        p_p.text = f"{r_title} — {r_sub}"
        p_p.font.name = "Segoe UI"
        p_p.font.size = Pt(9.5)
        p_p.font.bold = True
        p_p.font.color.rgb = C_WHITE
        p_p.alignment = PP_ALIGN.CENTER
        
        # Text
        tb = s8.shapes.add_textbox(x + Inches(0.2), y + Inches(0.65), w - Inches(0.4), Inches(1.5))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = desc
        p.font.name = "Segoe UI"
        p.font.size = Pt(9.5)
        p.font.color.rgb = C_DARK_TEXT
        
    add_bottom_bar(s8, 8)

    # ==================== SLIDE 9: MANAGER & CREATOR ====================
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "PHỎNG VẤN CHUYÊN SÂU", "Manager & Creator: Quy trình quản lý và biên soạn học liệu",
               "Xác lập tiêu chuẩn giao việc 5 trường và quy chuẩn đóng gói bài học vi mô", C_BLUE)
    
    # Workflow diagram
    pipe_img = "docs/scratch/assets/s9_content_pipeline.png"
    if os.path.exists(pipe_img):
        s9.shapes.add_picture(pipe_img, Inches(0.8), Inches(1.85), width=Inches(11.7), height=Inches(1.95))
        
    # Manager card
    x_m = Inches(0.8)
    w_m = Inches(5.75)
    y_b = Inches(3.95)
    h_b = Inches(2.95)
    
    card_m = create_floating_card(s9, x_m, y_b, w_m, h_b, C_CARD_BG, C_BORDER)
    top_m = s9.shapes.add_shape(MSO_SHAPE.RECTANGLE, x_m, y_b, w_m, Inches(0.06))
    top_m.fill.solid()
    top_m.fill.fore_color.rgb = C_PURPLE
    top_m.line.fill.background()
    
    tb_m = s9.shapes.add_textbox(x_m + Inches(0.2), y_b + Inches(0.15), w_m - Inches(0.4), h_b - Inches(0.3))
    tf_m = tb_m.text_frame
    tf_m.word_wrap = True
    tf_m.margin_left = tf_m.margin_right = tf_m.margin_top = tf_m.margin_bottom = 0
    p1 = tf_m.paragraphs[0]
    p1.text = "ORGANIZATIONAL MANAGER (QUẢN LÝ ĐÀO TẠO)"
    p1.font.name = "Segoe UI"
    p1.font.size = Pt(11)
    p1.font.bold = True
    p1.font.color.rgb = C_PURPLE
    
    m_bullets = [
        ("• Phiếu giao việc Task Spec chuẩn hóa 5 trường: ", "Mã Unit, Danh sách từ vựng trọng tâm, Ngữ pháp mục tiêu, Creator phụ trách, và Hạn hoàn thành."),
        ("• Quy tắc đóng gói Unit hoàn chỉnh (4/4 bài): ", "Chỉ xuất bản khi đủ trọn vẹn 4 bài học (3 bài học mới + 1 bài tổng hợp). Không xuất bản dở dang làm vỡ lộ trình."),
        ("• Thẩm quyền xuất bản nội dung chính thức: ", "Manager là vai trò duy nhất có thẩm quyền xuất bản học liệu thường nhật sau khi đã qua Moderator phê duyệt.")
    ]
    for title, text in m_bullets:
        p = tf_m.add_paragraph()
        p.space_before = Pt(4)
        r1 = p.add_run()
        r1.text = title
        r1.font.name = "Segoe UI"
        r1.font.size = Pt(9.3)
        r1.font.bold = True
        r1.font.color.rgb = C_NAVY
        r2 = p.add_run()
        r2.text = text
        r2.font.name = "Segoe UI"
        r2.font.size = Pt(9.3)
        r2.font.color.rgb = C_DARK_TEXT

    # Creator card
    x_c = Inches(6.75)
    w_c = Inches(5.75)
    card_c = create_floating_card(s9, x_c, y_b, w_c, h_b, C_CARD_BG, C_BORDER)
    top_c = s9.shapes.add_shape(MSO_SHAPE.RECTANGLE, x_c, y_b, w_c, Inches(0.06))
    top_c.fill.solid()
    top_c.fill.fore_color.rgb = C_ORANGE
    top_c.line.fill.background()
    
    tb_c = s9.shapes.add_textbox(x_c + Inches(0.2), y_b + Inches(0.15), w_c - Inches(0.4), h_b - Inches(0.3))
    tf_c = tb_c.text_frame
    tf_c.word_wrap = True
    tf_c.margin_left = tf_c.margin_right = tf_c.margin_top = tf_c.margin_bottom = 0
    p1 = tf_c.paragraphs[0]
    p1.text = "LESSON CREATOR (BIÊN SOẠN HỌC LIỆU)"
    p1.font.name = "Segoe UI"
    p1.font.size = Pt(11)
    p1.font.bold = True
    p1.font.color.rgb = C_ORANGE
    
    c_bullets = [
        ("• Bộ bài tập 5 dạng chuẩn tương tác cao: ", "Trắc nghiệm, Điền từ vào chỗ trống, Sắp xếp từ thành câu, Nghe chọn từ đúng và Câu hỏi ngữ pháp kèm giải thích."),
        ("• 100% từ vựng có âm thanh phát âm bản xứ: ", "Chuẩn hóa file MP3 chất lượng cao cho toàn bộ từ mới và câu ví dụ, hỗ trợ người học nghe chuẩn ngay từ đầu."),
        ("• Công cụ nhập liệu bài học hàng loạt (Bulk Import): ", "Hỗ trợ nạp bài từ file Excel/CSV theo mẫu chuẩn; toàn bộ dữ liệu nạp vào phải ở trạng thái Draft và qua kiểm duyệt.")
    ]
    for title, text in c_bullets:
        p = tf_c.add_paragraph()
        p.space_before = Pt(4)
        r1 = p.add_run()
        r1.text = title
        r1.font.name = "Segoe UI"
        r1.font.size = Pt(9.3)
        r1.font.bold = True
        r1.font.color.rgb = C_NAVY
        r2 = p.add_run()
        r2.text = text
        r2.font.name = "Segoe UI"
        r2.font.size = Pt(9.3)
        r2.font.color.rgb = C_DARK_TEXT
        
    add_bottom_bar(s9, 9)

    # ==================== SLIDE 10: MODERATOR, OPS & ADMIN ====================
    s10 = prs.slides.add_slide(blank_layout)
    add_header(s10, "PHỎNG VẤN CHUYÊN SÂU", "Kiểm soát chất lượng, hỗ trợ và quản trị an ninh hệ thống",
               "Bộ tiêu chí QC 6 điểm, quy trình xử lý ticket 3 nhánh và ghi nhật ký kiểm toán bất biến", C_BLUE)
    
    # Col 1: Moderator
    x1 = Inches(0.8)
    w1 = Inches(3.7)
    card1 = create_floating_card(s10, x1, Inches(1.95), w1, Inches(4.9), C_CARD_BG, C_BORDER)
    top1 = s10.shapes.add_shape(MSO_SHAPE.RECTANGLE, x1, Inches(1.95), w1, Inches(0.06))
    top1.fill.solid()
    top1.fill.fore_color.rgb = C_GREEN
    top1.line.fill.background()
    
    tb1 = s10.shapes.add_textbox(x1 + Inches(0.15), Inches(2.1), w1 - Inches(0.3), Inches(4.6))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    tf1.margin_left = tf1.margin_right = tf1.margin_top = tf1.margin_bottom = 0
    p = tf1.paragraphs[0]
    p.text = "MODERATOR (KIỂM DUYỆT)"
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_GREEN
    
    mod_bullets = [
        ("• Bộ tiêu chí QC 6 điểm: ", "Đúng ngữ pháp, chính tả, ngữ cảnh, đủ 5 dạng bài, giải thích rõ ràng và âm thanh chuẩn."),
        ("• Thẩm âm bắt buộc: ", "Moderator phải nghe thẩm định 100% file audio trước khi bấm phê duyệt bài học."),
        ("• Khóa cấm tự duyệt (SoD): ", "Hệ thống tự động khóa chức năng duyệt nếu Moderator chính là người biên soạn bài đó."),
        ("• Trả bài kèm lý do: ", "Bắt buộc nhập lý do chi tiết khi từ chối để Creator chỉnh sửa đúng trọng tâm.")
    ]
    for t, txt in mod_bullets:
        p = tf1.add_paragraph()
        p.space_before = Pt(6)
        r1 = p.add_run()
        r1.text = t
        r1.font.name = "Segoe UI"
        r1.font.size = Pt(9)
        r1.font.bold = True
        r1.font.color.rgb = C_NAVY
        r2 = p.add_run()
        r2.text = txt
        r2.font.name = "Segoe UI"
        r2.font.size = Pt(9)
        r2.font.color.rgb = C_DARK_TEXT

    # Col 2: Operations Staff + Graphic
    x2 = Inches(4.75)
    w2 = Inches(3.8)
    card2 = create_floating_card(s10, x2, Inches(1.95), w2, Inches(4.9), C_CARD_BG, C_BORDER)
    top2 = s10.shapes.add_shape(MSO_SHAPE.RECTANGLE, x2, Inches(1.95), w2, Inches(0.06))
    top2.fill.solid()
    top2.fill.fore_color.rgb = C_GRAY
    top2.line.fill.background()
    
    tb2 = s10.shapes.add_textbox(x2 + Inches(0.15), Inches(2.1), w2 - Inches(0.3), Inches(0.5))
    tf2 = tb2.text_frame
    p = tf2.paragraphs[0]
    p.text = "OPERATIONS STAFF (VẬN HÀNH)"
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_GRAY
    
    tr_img = "docs/scratch/assets/s10_ticket_routing.png"
    if os.path.exists(tr_img):
        s10.shapes.add_picture(tr_img, x2 + Inches(0.15), Inches(2.5), width=w2 - Inches(0.3), height=Inches(3.3))
        
    tb2_b = s10.shapes.add_textbox(x2 + Inches(0.15), Inches(5.9), w2 - Inches(0.3), Inches(0.85))
    tf2_b = tb2_b.text_frame
    tf2_b.word_wrap = True
    tf2_b.margin_left = tf2_b.margin_right = tf2_b.margin_top = tf2_b.margin_bottom = 0
    p = tf2_b.paragraphs[0]
    r1 = p.add_run()
    r1.text = "• Ranh giới dữ liệu an toàn: "
    r1.font.name = "Segoe UI"
    r1.font.size = Pt(8.8)
    r1.font.bold = True
    r1.font.color.rgb = C_NAVY
    r2 = p.add_run()
    r2.text = "Operations chỉ xem phiếu và phản hồi; tuyệt đối không có quyền sửa CSDL học liệu."
    r2.font.name = "Segoe UI"
    r2.font.size = Pt(8.8)
    r2.font.color.rgb = C_DARK_TEXT

    # Col 3: Admin & Legal
    x3 = Inches(8.8)
    w3 = Inches(3.7)
    card3 = create_floating_card(s10, x3, Inches(1.95), w3, Inches(4.9), C_CARD_BG, C_BORDER)
    top3 = s10.shapes.add_shape(MSO_SHAPE.RECTANGLE, x3, Inches(1.95), w3, Inches(0.06))
    top3.fill.solid()
    top3.fill.fore_color.rgb = C_RED
    top3.line.fill.background()
    
    tb3 = s10.shapes.add_textbox(x3 + Inches(0.15), Inches(2.1), w3 - Inches(0.3), Inches(4.6))
    tf3 = tb3.text_frame
    tf3.word_wrap = True
    tf3.margin_left = tf3.margin_right = tf3.margin_top = tf3.margin_bottom = 0
    p = tf3.paragraphs[0]
    p.text = "ADMIN & PHÁP LÝ (LEGAL)"
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_RED
    
    adm_bullets = [
        ("• Bảo mật phiên đăng nhập: ", "Sử dụng HttpOnly Cookies chống XSS; phân quyền RBAC chặt chẽ ở tầng CSDL."),
        ("• Ghi nhật ký kiểm toán bất biến: ", "Ghi nhận đầy đủ 6 trường dữ liệu: Timestamp, Actor ID/Role, Action, Target Entity, Result, IP/User-Agent."),
        ("• Tuân thủ pháp lý ATTT: ", "Đáp ứng Luật An toàn thông tin mạng 86/2015 và Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân."),
        ("• Can thiệp khẩn cấp (Emergency): ", "Admin chỉ được can thiệp khi có văn bản giải trình (Justification) lưu vào Audit Log.")
    ]
    for t, txt in adm_bullets:
        p = tf3.add_paragraph()
        p.space_before = Pt(6)
        r1 = p.add_run()
        r1.text = t
        r1.font.name = "Segoe UI"
        r1.font.size = Pt(9)
        r1.font.bold = True
        r1.font.color.rgb = C_NAVY
        r2 = p.add_run()
        r2.text = txt
        r2.font.name = "Segoe UI"
        r2.font.size = Pt(9)
        r2.font.color.rgb = C_DARK_TEXT
        
    add_bottom_bar(s10, 10)

    # ==================== SLIDE 11: ĐỐI CHUẨN & QUYẾT ĐỊNH ====================
    s11 = prs.slides.add_slide(blank_layout)
    add_header(s11, "ĐỐI CHUẨN & QUYẾT ĐỊNH", "Đối chuẩn tính năng và 4 quyết định thiết kế then chốt",
               "Học hỏi ưu điểm của Duolingo, Quizlet và khắc phục nhược điểm bằng thiết kế phù hợp", C_BLUE)
    
    # Left Benchmark card
    x_b = Inches(0.8)
    w_b = Inches(5.7)
    card_b = create_floating_card(s11, x_b, Inches(1.95), w_b, Inches(4.9), C_CARD_BG, C_BORDER)
    top_b = s11.shapes.add_shape(MSO_SHAPE.RECTANGLE, x_b, Inches(1.95), w_b, Inches(0.06))
    top_b.fill.solid()
    top_b.fill.fore_color.rgb = C_BLUE
    top_b.line.fill.background()
    
    tb_b = s11.shapes.add_textbox(x_b + Inches(0.2), Inches(2.1), w_b - Inches(0.4), Inches(4.6))
    tf_b = tb_b.text_frame
    tf_b.word_wrap = True
    tf_b.margin_left = tf_b.margin_right = tf_b.margin_top = tf_b.margin_bottom = 0
    p = tf_b.paragraphs[0]
    p.text = "ĐỐI CHUẨN NỀN TẢNG (BENCHMARK)"
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    
    bm_data = [
        ("Duolingo (Gamification mạnh mẽ):",
         "• Ưu điểm: Giữ chân người học xuất sắc nhờ chuỗi Streak và bài học vi mô.\n"
         "• Nhược điểm: Giải thích ngữ pháp rất sơ sài; bài học thiếu ngữ cảnh giao tiếp thực tế."),
        ("Quizlet (Ghi nhớ từ vựng Flashcard):",
         "• Ưu điểm: Ôn tập từ vựng nhanh, cho phép cộng đồng tự do tạo học liệu.\n"
         "• Nhược điểm: Thiếu lộ trình bài bản; học liệu do người dùng tạo có tỷ lệ sai ngữ pháp và phát âm rất cao."),
        ("Định vị khác biệt của Lingora:",
         "• Kết hợp ưu điểm cả hai: Vừa có tính kỷ luật (Streak, vi mô 5–10p, SRS) vừa có học liệu được kiểm duyệt 4 mắt chặt chẽ kèm giải thích cặn kẽ.")
    ]
    for t, txt in bm_data:
        p = tf_b.add_paragraph()
        p.space_before = Pt(6)
        r1 = p.add_run()
        r1.text = t + "\n"
        r1.font.name = "Segoe UI"
        r1.font.size = Pt(9.5)
        r1.font.bold = True
        r1.font.color.rgb = C_NAVY
        r2 = p.add_run()
        r2.text = txt
        r2.font.name = "Segoe UI"
        r2.font.size = Pt(9)
        r2.font.color.rgb = C_DARK_TEXT

    # Right 4 Decisions
    x_d = Inches(6.8)
    w_d = Inches(5.7)
    decisions = [
        ("1. Chuẩn hóa 5 dạng bài tập tương tác", "Trắc nghiệm, Điền từ, Sắp xếp câu, Nghe nhận diện và Ngữ pháp có giải thích tức thì.", C_BLUE),
        ("2. Thuật toán SRS cố định 5 mốc ngày", "Chu kỳ giãn cách: 1 → 3 → 7 → 14 → 30 ngày (Trực quan, ổn định, dễ dự báo).", C_GREEN),
        ("3. Quy tắc tính Streak chuẩn múi giờ địa phương", "Học xong trước 23:59:59 → +1 ngày; lỡ ngày → về 1 (Không bán Streak Freeze để giữ kỷ luật).", C_PURPLE),
        ("4. Kiểm tra xếp lớp đầu vào (Placement Test)", "30 câu hỏi đánh giá nhanh; cho phép học viên tùy chọn 'Bỏ qua bài test' để học từ đầu.", C_ORANGE)
    ]
    
    for i, (title, desc, col) in enumerate(decisions):
        y_c = Inches(1.95) + i * Inches(1.23)
        card = create_floating_card(s11, x_d, y_c, w_d, Inches(1.15), C_CARD_BG, C_BORDER)
        
        strp = s11.shapes.add_shape(MSO_SHAPE.RECTANGLE, x_d, y_c, Inches(0.08), Inches(1.15))
        strp.fill.solid()
        strp.fill.fore_color.rgb = col
        strp.line.fill.background()
        
        tb = s11.shapes.add_textbox(x_d + Inches(0.2), y_c + Inches(0.12), w_d - Inches(0.3), Inches(0.95))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.name = "Segoe UI"
        p1.font.size = Pt(10.5)
        p1.font.bold = True
        p1.font.color.rgb = col
        
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = "Segoe UI"
        p2.font.size = Pt(9.2)
        p2.font.color.rgb = C_DARK_TEXT
        p2.space_before = Pt(3)
        
    add_bottom_bar(s11, 11)

    # ==================== SLIDE 12: MA TRẬN TRUY VẾT ====================
    s12 = prs.slides.add_slide(blank_layout)
    add_header(s12, "TRUY VẾT YÊU CẦU", "Ma trận truy vết thực tế: Từ nghiên cứu đến tính năng",
               "Mỗi quyết định thiết kế hệ thống đều bắt nguồn từ dữ liệu khảo sát hoặc phỏng vấn đã kiểm chứng", C_BLUE)
    
    rows_data = [
        ("N=15, Q8: 15/15 (100%) gặp trở ngại nhanh quên từ vựng",
         "CORE-08 — Thuật toán ôn tập ngắt quãng (SRS) chu kỳ cố định (1-3-7-14-30 ngày)"),
        ("N=15, Q13: 12/15 (80.0%) rất cần nhắc ôn tự động (4.13/5)",
         "CORE-08 — Bộ lọc từ vựng thông minh: Tự động gom từ đến hạn cần ôn trong ngày"),
        ("N=15, Q15: 14/15 (93.3%) muốn tự đề xuất bài học phù hợp",
         "CORE-09 + EXT-03 — Kiểm tra đầu vào Placement 30 câu + Gợi ý lộ trình cá nhân hóa"),
        ("N=15, Q17 & Q7: Nhu cầu cao bài tập điền từ, trắc nghiệm, nghe",
         "CORE-03, CORE-07 — Bộ bài tập 5 dạng chuẩn tương tác cao kèm giải thích đáp án tức thì"),
        ("N=35: 18/35 (51.4%) tự học khung 20h–22h [Pending-evidence]",
         "CORE-10 — Nhắc nhở trong ứng dụng (In-app Reminder) có tham khảo khung giờ"),
        ("N=35: Chỉ 5/35 (14.3%) từ chối câu sai [Pending-evidence]",
         "CORE-07 — Cơ chế Controlled Retry gom tối đa 10% câu sai làm lại cuối bài"),
        ("N=3 (Case 1): Nản lòng và bỏ dở do bài học cũ dồn ứ sau lỡ nhịp",
         "CORE-07 + CORE-08 — Thiết kế bài vi mô 5–10 phút + khống chế không dồn bài phạt"),
        ("N=3 (Case 2): Bức xúc vì làm sai chỉ thấy dấu X đỏ, không giải thích",
         "CORE-03, CORE-07 — Phản hồi tức thì & Bắt buộc giải thích ngữ pháp/nghĩa câu sai"),
        ("N=3 (Case 3): Bài học dài (>15 phút) gây nản, khó duy trì kỷ luật",
         "CORE-02, CORE-05 — Quy chuẩn bài học tinh gọn (Bài học 5–10 phút, 8–10 từ trọng tâm)"),
        ("Phỏng vấn Manager: Cần kiểm soát tiến độ và đóng gói theo Unit",
         "CORE-02 + CORE-05 — Phân công qua Task Spec 5 trường + Đóng gói Unit đủ 4/4 bài"),
        ("Phỏng vấn Creator: Tốn thời gian làm audio, cần nạp bài hàng loạt",
         "CORE-03 + EXT-08 — Tích hợp 100% audio MP3 bản ngữ + Công cụ nạp bài hàng loạt qua CSV"),
        ("Phỏng vấn Moderator: Nguy cơ học liệu sai sót lọt vào hệ thống",
         "CORE-04 — Kiểm duyệt độc lập theo 6 tiêu chí QC + Khóa cấm tự duyệt (Nguyên tắc SoD)"),
        ("Phỏng vấn Operations Staff: Cần phân luồng khiếu nại & giới hạn",
         "EXT-04 — Kênh tiếp nhận & Phân luồng phiếu hỗ trợ người dùng 3 nhánh tự động"),
        ("Phỏng vấn Admin & Pháp lý: Tuân thủ ATTT & Luật 86/2015; lưu vết",
         "CORE-01, CORE-12 + NFR-AUD — Bảo vệ phiên HttpOnly, RBAC 6 vai trò & Audit Log bất biến")
    ]
    
    t_shape = s12.shapes.add_table(15, 3, Inches(0.8), Inches(1.95), Inches(11.7), Inches(4.85))
    table = t_shape.table
    table.columns[0].width = Inches(0.65)
    table.columns[1].width = Inches(5.1)
    table.columns[2].width = Inches(5.95)
    
    headers = ["STT", "Bằng chứng thực nghiệm / Phát hiện thực tế", "Mã Yêu cầu hệ thống & Giải pháp phần mềm tương ứng"]
    for col_idx, h_text in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_NAVY
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = cell.text_frame.paragraphs[0]
        p.text = h_text
        p.font.name = "Segoe UI"
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = C_WHITE
        p.alignment = PP_ALIGN.CENTER if col_idx == 0 else PP_ALIGN.LEFT
        
    for r_idx, (ev, feat) in enumerate(rows_data):
        row_cells = [table.cell(r_idx + 1, 0), table.cell(r_idx + 1, 1), table.cell(r_idx + 1, 2)]
        bg = C_CARD_BG if r_idx % 2 == 0 else C_CARD_TINT
        for c in row_cells:
            c.fill.solid()
            c.fill.fore_color.rgb = bg
            c.vertical_anchor = MSO_ANCHOR.MIDDLE
            
        p0 = row_cells[0].text_frame.paragraphs[0]
        p0.text = f"{r_idx + 1:02d}"
        p0.font.name = "Segoe UI"
        p0.font.size = Pt(8.5)
        p0.font.bold = True
        p0.font.color.rgb = C_BLUE
        p0.alignment = PP_ALIGN.CENTER
        
        p1 = row_cells[1].text_frame.paragraphs[0]
        p1.text = ev
        p1.font.name = "Segoe UI"
        p1.font.size = Pt(8.2)
        p1.font.color.rgb = C_DARK_TEXT
        
        p2 = row_cells[2].text_frame.paragraphs[0]
        p2.text = feat
        p2.font.name = "Segoe UI"
        p2.font.size = Pt(8.2)
        p2.font.bold = True
        p2.font.color.rgb = C_NAVY
        
    add_bottom_bar(s12, 12)

    # ==================== SLIDE 13: 12 CORE + 8 EXT + NFRS ====================
    s13 = prs.slides.add_slide(blank_layout)
    add_header(s13, "ĐẶC TẢ YÊU CẦU", "Bộ yêu cầu hệ thống: 12 CORE + 8 EXT + NFRs",
               "Phân cấp ưu tiên rõ ràng: Cốt lõi (Must) cho MVP, Mở rộng (Should/Could) và Tiêu chuẩn phi chức năng", C_BLUE)
    
    panels = [
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
    
    for i, (p_title, col, items) in enumerate(panels):
        x = Inches(0.8) + i * Inches(3.95)
        w = Inches(3.8)
        card = create_floating_card(s13, x, Inches(1.95), w, Inches(4.9), C_CARD_BG, C_BORDER)
        
        top_l = s13.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, Inches(1.95), w, Inches(0.06))
        top_l.fill.solid()
        top_l.fill.fore_color.rgb = col
        top_l.line.fill.background()
        
        tb = s13.shapes.add_textbox(x + Inches(0.15), Inches(2.1), w - Inches(0.3), Inches(4.6))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = p_title
        p.font.name = "Segoe UI"
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = col
        
        for h_text, b_text in items:
            p = tf.add_paragraph()
            p.space_before = Pt(6)
            r1 = p.add_run()
            r1.text = h_text + " "
            r1.font.name = "Segoe UI"
            r1.font.size = Pt(8.8)
            r1.font.bold = True
            r1.font.color.rgb = C_NAVY
            r2 = p.add_run()
            r2.text = b_text
            r2.font.name = "Segoe UI"
            r2.font.size = Pt(8.8)
            r2.font.color.rgb = C_DARK_TEXT
            
    add_bottom_bar(s13, 13)

    # ==================== SLIDE 14: MA TRẬN SOD ====================
    s14 = prs.slides.add_slide(blank_layout)
    add_header(s14, "TÁC NHÂN & PHÂN ĐỊNH", "Ma trận phân định trách nhiệm (Separation of Duties — SoD)",
               "Nguyên tắc 4 mắt chống gian lận: Ai được làm gì và ai bị hệ thống nghiêm cấm thực hiện?", C_BLUE)
    
    sod_headers = ["Vai trò (Role)", "Soạn Draft", "Duyệt QC", "Xuất bản", "Quản trị User", "Xử lý Ticket", "Audit Log"]
    sod_rows = [
        ("Learner (Người học)", "✗ CẤM", "✗ CẤM", "✗ CẤM", "✗ CẤM", "✗ CẤM", "✗ CẤM"),
        ("Lesson Creator (Biên soạn)", "✓ CÓ", "✗ CẤM*", "✗ CẤM", "✗ CẤM", "✗ CẤM", "✗ CẤM"),
        ("Moderator (Kiểm duyệt)", "✗ CẤM*", "✓ CÓ", "✗ CẤM", "✗ CẤM", "✗ CẤM", "✗ CẤM"),
        ("Org Manager (Quản lý)", "✓ CÓ", "✓ CÓ", "✓ CÓ", "✗ CẤM", "✗ CẤM", "Xem phân hệ"),
        ("Operations Staff (Vận hành)", "✗ CẤM", "✗ CẤM", "✗ CẤM", "✗ CẤM", "✓ CÓ (Ticket)", "✗ CẤM"),
        ("Administrator (Quản trị)", "✗ CẤM", "✗ CẤM", "Chỉ khẩn cấp", "✓ CÓ (Toàn quyền)", "✓ CÓ", "✓ CÓ (Toàn quyền)")
    ]
    
    t_shape = s14.shapes.add_table(7, 7, Inches(0.8), Inches(1.95), Inches(11.7), Inches(4.5))
    t = t_shape.table
    t.columns[0].width = Inches(2.7)
    for i in range(1, 7):
        t.columns[i].width = Inches(1.5)
        
    for j, h_text in enumerate(sod_headers):
        cell = t.cell(0, j)
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_NAVY
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = cell.text_frame.paragraphs[0]
        p.text = h_text
        p.font.name = "Segoe UI"
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = C_WHITE
        p.alignment = PP_ALIGN.CENTER
        
    for r_idx, row in enumerate(sod_rows):
        bg = C_CARD_BG if r_idx % 2 == 0 else C_CARD_TINT
        for c_idx, val in enumerate(row):
            cell = t.cell(r_idx + 1, c_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = bg
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = "Segoe UI"
            p.font.size = Pt(9)
            p.alignment = PP_ALIGN.LEFT if c_idx == 0 else PP_ALIGN.CENTER
            
            if "✓ CÓ" in val:
                p.font.bold = True
                p.font.color.rgb = C_GREEN
            elif "✗ CẤM" in val:
                p.font.bold = True
                p.font.color.rgb = C_RED
            elif "khẩn cấp" in val or "phân hệ" in val:
                p.font.bold = True
                p.font.color.rgb = C_PURPLE
            else:
                p.font.color.rgb = C_DARK_TEXT
                
    note = s14.shapes.add_textbox(Inches(0.8), Inches(6.55), Inches(11.7), Inches(0.4))
    tf_n = note.text_frame
    p_n = tf_n.paragraphs[0]
    p_n.text = "(*) CẤM tự duyệt: Hệ thống tự động khóa chức năng duyệt nếu người duyệt chính là người tạo bài học đó (Nguyên tắc SoD)."
    p_n.font.name = "Segoe UI"
    p_n.font.size = Pt(8.8)
    p_n.font.italic = True
    p_n.font.color.rgb = C_MUTED
    
    add_bottom_bar(s14, 14)

    # ==================== SLIDE 15: QUY TRÌNH NGHIỆP VỤ ====================
    s15 = prs.slides.add_slide(blank_layout)
    add_header(s15, "QUY TRÌNH NGHIỆP VỤ", "Mô hình hóa 2 quy trình nghiệp vụ cốt lõi",
               "Vòng đời học liệu đảm bảo kiểm soát chất lượng & Quy trình học tập tối ưu hóa khả năng ghi nhớ", C_BLUE)
    
    # Section 1 Header
    t_f1 = s15.shapes.add_textbox(Inches(0.8), Inches(1.75), Inches(11.73), Inches(0.32))
    tf_f1 = t_f1.text_frame
    tf_f1.word_wrap = False
    tf_f1.margin_left = tf_f1.margin_right = tf_f1.margin_top = tf_f1.margin_bottom = 0
    p_f1 = tf_f1.paragraphs[0]
    p_f1.text = "1. VÒNG ĐỜI HỌC LIỆU & KIỂM SOÁT SOD 4 MẮT (CREATOR → MODERATOR → MANAGER)"
    p_f1.font.name = "Segoe UI"
    p_f1.font.size = Pt(11)
    p_f1.font.bold = True
    p_f1.font.color.rgb = C_NAVY

    wf1_img = "docs/scratch/assets/s15_content_flow.png"
    if os.path.exists(wf1_img):
        s15.shapes.add_picture(wf1_img, Inches(0.8), Inches(2.05), width=Inches(11.73), height=Inches(2.38))
        
    # Section 2 Header
    t_f2 = s15.shapes.add_textbox(Inches(0.8), Inches(4.50), Inches(11.73), Inches(0.28))
    tf_f2 = t_f2.text_frame
    tf_f2.word_wrap = False
    tf_f2.margin_left = tf_f2.margin_right = tf_f2.margin_top = tf_f2.margin_bottom = 0
    p_f2 = tf_f2.paragraphs[0]
    p_f2.text = "2. VÒNG LẶP HỌC TẬP HÀNG NGÀY & ĐAN XEN ÔN TẬP SRS (DAILY LEARNER ROUTINE & SRS INTERLEAVING)"
    p_f2.font.name = "Segoe UI"
    p_f2.font.size = Pt(11)
    p_f2.font.bold = True
    p_f2.font.color.rgb = C_BLUE

    wf2_img = "docs/scratch/assets/s15_learner_flow.png"
    if os.path.exists(wf2_img):
        s15.shapes.add_picture(wf2_img, Inches(0.8), Inches(4.78), width=Inches(11.73), height=Inches(2.26))
        
    add_bottom_bar(s15, 15)

    # ==================== SLIDE 16: SƠ ĐỒ USE CASE TỔNG QUÁT (14 CORE FUNCTIONS) ====================
    s16 = prs.slides.add_slide(blank_layout)
    add_header(s16, "MÔ HÌNH HÓA USE CASE", "Sơ đồ Use Case tổng quát: 14 Chức năng cốt lõi hệ thống",
               "Phân rã 3 phân hệ chính quy theo chuẩn UML: Core Learning, Content Workflow (SoD 4 mắt) và Administration & Operations", C_BLUE)
    
    uc_uml_img = "docs/scratch/assets/s16_uml_use_case_clean.png"
    if os.path.exists(uc_uml_img):
        s16.shapes.add_picture(uc_uml_img, Inches(1.8), Inches(1.85), width=Inches(9.73), height=Inches(5.08))
        
    add_bottom_bar(s16, 16)

    # ==================== SLIDE 17: 15 CANONICAL USE CASES TRACEABILITY ====================
    s17 = prs.slides.add_slide(blank_layout)
    add_header(s17, "MA TRẬN TRUY VẾT USE CASE", "Bảng phân loại & Ánh xạ 15 Use Cases chuẩn (Traceability Matrix)",
               "Ánh xạ toàn diện 15 Use Cases với 6 vai trò, 18/19 tính năng MVP và các yêu cầu hệ thống CORE/EXT", C_BLUE)
    
    uc_headers = ["Mã UC", "Tên Use Case chuẩn", "Tác nhân chính", "Phân hệ", "Chức năng MVP", "Yêu cầu hệ thống"]
    uc_rows = [
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
    
    t_shape = s17.shapes.add_table(16, 6, Inches(0.8), Inches(1.95), Inches(11.7), Inches(4.85))
    table = t_shape.table
    table.columns[0].width = Inches(0.9)
    table.columns[1].width = Inches(3.2)
    table.columns[2].width = Inches(2.2)
    table.columns[3].width = Inches(1.4)
    table.columns[4].width = Inches(1.8)
    table.columns[5].width = Inches(2.2)
    
    for c_idx, h_text in enumerate(uc_headers):
        cell = table.cell(0, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_NAVY
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = cell.text_frame.paragraphs[0]
        p.text = h_text
        p.font.name = "Segoe UI"
        p.font.size = Pt(9)
        p.font.bold = True
        p.font.color.rgb = C_WHITE
        p.alignment = PP_ALIGN.CENTER if c_idx in [0, 3] else PP_ALIGN.LEFT
        
    for r_idx, row in enumerate(uc_rows):
        bg = C_CARD_BG if r_idx % 2 == 0 else C_CARD_TINT
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx + 1, c_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = bg
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = "Segoe UI"
            p.font.size = Pt(8.2)
            p.alignment = PP_ALIGN.CENTER if c_idx in [0, 3] else PP_ALIGN.LEFT
            
            if c_idx == 0:
                p.font.bold = True
                p.font.color.rgb = C_BLUE
            elif c_idx == 2:
                p.font.bold = True
                if "Learner" in val:
                    p.font.color.rgb = C_BLUE
                elif "Creator" in val:
                    p.font.color.rgb = C_ORANGE
                elif "Moderator" in val:
                    p.font.color.rgb = C_GREEN
                elif "Manager" in val:
                    p.font.color.rgb = C_PURPLE
                elif "Staff" in val:
                    p.font.color.rgb = C_GRAY
                elif "Administrator" in val:
                    p.font.color.rgb = C_RED
            else:
                p.font.color.rgb = C_DARK_TEXT
                
    add_bottom_bar(s17, 17)

    # ==================== SLIDE 18: KẾT LUẬN & ĐỊNH HƯỚNG ====================
    s18 = prs.slides.add_slide(blank_layout)
    add_header(s18, "KẾT LUẬN & ĐỊNH HƯỚNG", "Hiện trạng kỹ thuật & Ranh giới liêm chính nghiên cứu",
               "Tổng kết kết quả Đồ án 1: Bằng chứng thực nghiệm đầy đủ, thiết kế hệ thống sẵn sàng cho triển khai", C_BLUE)
    
    pillars = [
        ("01", "Truy vết yêu cầu 100%", "100% TRACEABLE", C_BLUE,
         "• 14/14 tính năng phần mềm đều truy xuất được nguồn gốc từ khảo sát N=15, N=35 hoặc phỏng vấn 7 chuyên gia.\n\n"
         "• Không có bất kỳ tính năng nào đưa vào theo suy đoán chủ quan; triệt tiêu hoàn toàn tính năng thừa thãi.\n\n"
         "• 15 Use Cases bao phủ toàn diện 6 vai trò trong hệ thống."),
        ("02", "Hiện trạng kỹ thuật (Phase 0)", "PHASE 0 HOÀN TẤT", C_GREEN,
         "• Báo cáo hoàn tất toàn bộ giai đoạn Phân tích yêu cầu & Thiết kế kiến trúc (Phase 0).\n\n"
         "• CSDL chuẩn hóa 14 bảng dữ liệu, 12 hàm RPC và chính sách bảo mật RLS nghiêm ngặt.\n\n"
         "• Hệ thống sẵn sàng 100% bước vào Phase 1 (Triển khai mã nguồn & Kiểm thử TDD)."),
        ("03", "Ranh giới liêm chính nghiên cứu", "NGHIÊN CỨU TRUNG THỰC", C_PURPLE,
         "• Mọi số liệu khảo sát và phỏng vấn đều được thu thập và lưu trữ minh bạch.\n\n"
         "• Loại bỏ hoàn toàn phương pháp Time-study khỏi báo cáo do chưa đủ điều kiện đo kiểm khách quan.\n\n"
         "• Đồ án phản ánh trung thực năng lực và tiến độ nghiên cứu của sinh viên.")
    ]
    
    for i, (num, title, tag, col, content) in enumerate(pillars):
        x = Inches(0.8) + i * Inches(3.95)
        w = Inches(3.8)
        h = Inches(4.9)
        card = create_floating_card(s18, x, Inches(1.95), w, h, C_CARD_BG, C_BORDER)
        
        top_l = s18.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, Inches(1.95), w, Inches(0.06))
        top_l.fill.solid()
        top_l.fill.fore_color.rgb = col
        top_l.line.fill.background()
        
        badge = s18.shapes.add_shape(MSO_SHAPE.OVAL, x + Inches(0.18), Inches(2.15), Inches(0.55), Inches(0.55))
        badge.fill.solid()
        badge.fill.fore_color.rgb = col
        badge.line.fill.background()
        tf_b = badge.text_frame
        tf_b.word_wrap = False
        tf_b.margin_left = tf_b.margin_right = tf_b.margin_top = tf_b.margin_bottom = 0
        p_b = tf_b.paragraphs[0]
        p_b.text = num
        p_b.font.name = "Segoe UI"
        p_b.font.size = Pt(13)
        p_b.font.bold = True
        p_b.font.color.rgb = C_WHITE
        p_b.alignment = PP_ALIGN.CENTER
        
        tb_h = s18.shapes.add_textbox(x + Inches(0.85), Inches(2.12), w - Inches(0.95), Inches(0.65))
        tf_h = tb_h.text_frame
        tf_h.word_wrap = True
        tf_h.margin_left = tf_h.margin_right = tf_h.margin_top = tf_h.margin_bottom = 0
        p1 = tf_h.paragraphs[0]
        p1.text = title
        p1.font.name = "Segoe UI"
        p1.font.size = Pt(11)
        p1.font.bold = True
        p1.font.color.rgb = C_NAVY
        
        tag_p = s18.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x + Inches(0.85), Inches(2.52), Inches(2.0), Inches(0.24))
        tag_p.fill.solid()
        tag_p.fill.fore_color.rgb = C_CARD_BLUE
        tag_p.line.color.rgb = col
        tf_tag = tag_p.text_frame
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = tag
        p_tag.font.name = "Segoe UI"
        p_tag.font.size = Pt(7.5)
        p_tag.font.bold = True
        p_tag.font.color.rgb = col
        p_tag.alignment = PP_ALIGN.CENTER
        
        tb_c = s18.shapes.add_textbox(x + Inches(0.18), Inches(2.95), w - Inches(0.36), Inches(3.7))
        tf_c = tb_c.text_frame
        tf_c.word_wrap = True
        tf_c.margin_left = tf_c.margin_right = tf_c.margin_top = tf_c.margin_bottom = 0
        p_c = tf_c.paragraphs[0]
        p_c.text = content
        p_c.font.name = "Segoe UI"
        p_c.font.size = Pt(9.2)
        p_c.font.color.rgb = C_DARK_TEXT
        
    add_bottom_bar(s18, 18)

    # ==================== SAVE TO ALL OUTPUT LOCATIONS ====================
    for out_path in out_paths:
        try:
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            prs.save(out_path)
            print(f"Successfully saved to: {out_path}")
        except PermissionError:
            print(f"PermissionError (file locked): {out_path}")
        except Exception as e:
            print(f"Error saving {out_path}: {e}")

if __name__ == "__main__":
    main()
