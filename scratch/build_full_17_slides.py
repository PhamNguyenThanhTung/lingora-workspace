import os, sys, shutil
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

sys.stdout.reconfigure(encoding='utf-8')

# Palette
C_NAVY = RGBColor(26, 54, 93)      # #1A365D Title Primary
C_BLUE = RGBColor(37, 99, 235)     # #2563EB Learner
C_PURPLE = RGBColor(124, 58, 237)  # #7C3AED Manager
C_ORANGE = RGBColor(234, 88, 12)   # #EA580C Creator
C_GREEN = RGBColor(22, 163, 74)    # #16A34A Moderator
C_GRAY = RGBColor(75, 85, 99)      # #4B5563 Operations
C_RED = RGBColor(153, 27, 27)      # #991B1B Administrator
C_DARK = RGBColor(15, 23, 42)      # #0F172A Body text
C_MUTED = RGBColor(100, 116, 139)  # #64748B Secondary text
C_BG_CARD = RGBColor(248, 250, 252)# #F8FAFC Card BG
C_BORDER = RGBColor(226, 232, 240) # #E2E8F0 Border
C_WHITE = RGBColor(255, 255, 255)

FONT_HEADING = "Segoe UI"
FONT_BODY = "Segoe UI"

def build_full_deck():
    prs = Presentation('scratch/clean_template.pptx')
    
    # Remove existing slides
    while len(prs.slides) > 0:
        rId = prs.slides._sldIdLst[0].rId
        prs.part.drop_rel(rId)
        del prs.slides._sldIdLst[0]
        
    blank_layout = prs.slide_layouts[6]
    
    def add_header(slide, cat_text, title_text, subtitle_text=""):
        txBox = slide.shapes.add_textbox(Inches(1.8), Inches(0.2), Inches(10.8), Inches(1.1))
        tf = txBox.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        p0 = tf.paragraphs[0]
        p0.text = cat_text.upper()
        p0.font.name = FONT_HEADING
        p0.font.size = Pt(9.5)
        p0.font.bold = True
        p0.font.color.rgb = C_BLUE
        p0.space_after = Pt(2)
        
        p1 = tf.add_paragraph()
        p1.text = title_text
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(19)
        p1.font.bold = True
        p1.font.color.rgb = C_NAVY
        
        if subtitle_text:
            p1.space_after = Pt(2)
            p2 = tf.add_paragraph()
            p2.text = subtitle_text
            p2.font.name = FONT_BODY
            p2.font.size = Pt(10.5)
            p2.font.color.rgb = C_MUTED

    def add_card(slide, left, top, width, height, bg_color=C_BG_CARD, border_color=C_BORDER):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_color
        if border_color:
            shape.line.color.rgb = border_color
            shape.line.width = Pt(1)
        else:
            shape.line.fill.background()
        return shape

    def add_footer(slide, text=""):
        if text:
            txBox = slide.shapes.add_textbox(Inches(0.8), Inches(7.0), Inches(11.7), Inches(0.3))
            tf = txBox.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = text
            p.font.name = FONT_BODY
            p.font.size = Pt(9)
            p.font.color.rgb = C_MUTED

    # ==================== SLIDE 1: COVER ====================
    s1 = prs.slides.add_slide(blank_layout)
    tbox = s1.shapes.add_textbox(Inches(1.8), Inches(1.5), Inches(6.5), Inches(4.5))
    tf = tbox.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = "LINGORA"
    p.font.name = FONT_HEADING
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p.space_after = Pt(6)
    
    p = tf.add_paragraph()
    p.text = "Phân tích yêu cầu nền tảng học ngoại ngữ trực tuyến"
    p.font.name = FONT_HEADING
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = C_NAVY
    p.space_after = Pt(10)
    
    p = tf.add_paragraph()
    p.text = "Từ nhu cầu người học đến yêu cầu nghiệp vụ và quy trình vận hành"
    p.font.name = FONT_BODY
    p.font.size = Pt(13)
    p.font.color.rgb = C_MUTED
    p.space_after = Pt(24)
    
    p = tf.add_paragraph()
    p.text = "Học phần: Dự án 1 — Hệ thống Thông tin\nNhóm thực hiện · 09/2026"
    p.font.name = FONT_BODY
    p.font.size = Pt(11)
    p.font.color.rgb = C_DARK
    
    add_card(s1, Inches(8.5), Inches(1.3), Inches(4.0), Inches(5.0), bg_color=C_WHITE, border_color=C_BLUE)
    tbox_m = s1.shapes.add_textbox(Inches(8.8), Inches(1.6), Inches(3.4), Inches(4.4))
    tf_m = tbox_m.text_frame
    tf_m.word_wrap = True
    
    pm = tf_m.paragraphs[0]
    pm.text = "📱 LINGORA MOBILE LEARNING"
    pm.font.name = FONT_HEADING
    pm.font.size = Pt(10)
    pm.font.bold = True
    pm.font.color.rgb = C_BLUE
    pm.space_after = Pt(14)
    
    pm = tf_m.add_paragraph()
    pm.text = "Good morning"
    pm.font.name = FONT_HEADING
    pm.font.size = Pt(24)
    pm.font.bold = True
    pm.font.color.rgb = C_NAVY
    
    pm = tf_m.add_paragraph()
    pm.text = "/ɡʊd ˈmɔːrnɪŋ/ • [🔊 Nghe audio]"
    pm.font.name = FONT_BODY
    pm.font.size = Pt(11)
    pm.font.color.rgb = C_BLUE
    pm.space_after = Pt(4)
    
    pm = tf_m.add_paragraph()
    pm.text = "Chào buổi sáng"
    pm.font.name = FONT_BODY
    pm.font.size = Pt(13)
    pm.font.color.rgb = C_DARK
    pm.space_after = Pt(16)
    
    pm = tf_m.add_paragraph()
    pm.text = "💡 6 Vai trò hệ thống phối hợp:"
    pm.font.name = FONT_HEADING
    pm.font.size = Pt(10)
    pm.font.bold = True
    pm.font.color.rgb = C_NAVY
    pm.space_after = Pt(4)
    
    pm = tf_m.add_paragraph()
    pm.text = "• Learner (Học & Ôn tập ngắt quãng)\n• Organizational Manager (Khung & Xuất bản)\n• Lesson Creator (Soạn bài & Tải audio chuẩn)\n• Moderator (Kiểm duyệt độc lập 6 tiêu chí)\n• Operations Staff (Hỗ trợ người dùng)\n• Administrator (Phân quyền & Audit Log)"
    pm.font.name = FONT_BODY
    pm.font.size = Pt(9.5)
    pm.font.color.rgb = C_MUTED

    # ==================== SLIDE 2: AGENDA ====================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "Mục lục chương trình", "Từ vấn đề thực tế đến yêu cầu hệ thống", "Lộ trình 5 phần logic dẫn dắt từ nỗi đau người học đến mô hình phần mềm")
    
    parts = [
        ("01 — BÀI TOÁN", "Slide 3", "Vấn đề hay quên, gián đoạn của người học và bài toán quản trị học liệu phía sau nền tảng.", C_BLUE),
        ("02 — DỮ LIỆU & THỰC CHỨNG", "Slide 4–10", "Khảo sát N=15, N=35 · Phỏng vấn định tính N=3 · Phỏng vấn chuyên môn 7 Stakeholders · Benchmark · Legal Review.", C_PURPLE),
        ("03 — ĐẶC TẢ YÊU CẦU", "Slide 11–13", "Đối chuẩn thiết kế · Ma trận truy vết Evidence → Requirement · Bộ 12 CORE + 8 EXT + NFRs.", C_ORANGE),
        ("04 — MÔ HÌNH HÓA", "Slide 14–16", "Actors & SoD · Quy trình kép (Content & Learner) · Mô hình 15 Canonical Use Cases chuẩn.", C_GREEN),
        ("05 — HIỆN TRẠNG & KẾT LUẬN", "Slide 17", "Kết quả đạt được, tiến độ các Milestone kỹ thuật (Phase 0, M1, M2) và giới hạn nghiên cứu.", C_RED),
    ]
    for i, (p_title, p_slide, p_desc, p_col) in enumerate(parts):
        top_pos = Inches(1.45 + i * 1.05)
        add_card(s2, Inches(1.8), top_pos, Inches(10.7), Inches(0.95), bg_color=C_WHITE, border_color=C_BORDER)
        tag = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.8), top_pos, Inches(0.15), Inches(0.95))
        tag.fill.solid()
        tag.fill.fore_color.rgb = p_col
        tag.line.fill.background()
        
        tbox = s2.shapes.add_textbox(Inches(2.1), top_pos + Inches(0.08), Inches(10.2), Inches(0.8))
        tf = tbox.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = f"{p_title}  ({p_slide})"
        p.font.name = FONT_HEADING
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = p_col
        p2 = tf.add_paragraph()
        p2.text = p_desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = C_DARK
    add_footer(s2, "Người học → Stakeholders → Nghiên cứu bổ trợ → Yêu cầu → Mô hình hệ thống")

    # ==================== SLIDE 3: WHY LINGORA? ====================
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "Bối cảnh thực tế & Bài toán", "Vấn đề không chỉ là học, mà là học đều và học đúng cách", "Người học dễ quên, dễ gián đoạn; học liệu cũng cần một quy trình kiểm soát rõ ràng.")
    
    add_card(s3, Inches(1.8), Inches(1.4), Inches(5.2), Inches(5.3), bg_color=C_WHITE, border_color=C_BLUE)
    tbox = s3.shapes.add_textbox(Inches(2.0), Inches(1.5), Inches(4.8), Inches(5.1))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "👤 PHÍA NGƯỜI HỌC (THỰC TRẠNG)"
    p.font.name = FONT_HEADING
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p.space_after = Pt(10)
    
    learner_pains = [
        ("01 — Mau quên từ vựng (15/15 — 100%)", "100% người khảo sát từng quên từ đã học → Cần cơ chế ôn tập ngắt quãng tự động (Spaced Review)."),
        ("02 — Khó duy trì thói quen (13/15 — 86.7%)", "Từng học không đều hoặc bỏ dở vì bận rộn → Cần bài học vi mô 5–10 phút và chuỗi ngày liên tục (Streak)."),
        ("03 — Thiếu phản hồi sư phạm (10/15 — 66.7%)", "Muốn được chỉ rõ lỗi sai khi viết câu → Bắt buộc có giải thích quy tắc đáp án tại chỗ khi làm sai."),
        ("04 — Lộ trình chưa phù hợp (14/15 — 93.3%)", "Quan tâm hệ thống tự đề xuất bài theo kết quả → Cần bài kiểm tra xếp lớp (Placement Test) đầu vào."),
    ]
    for h, d in learner_pains:
        p = tf.add_paragraph()
        p.text = h
        p.font.name = FONT_HEADING
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = C_NAVY
        p2 = tf.add_paragraph()
        p2.text = d
        p2.font.name = FONT_BODY
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = C_MUTED
        p2.space_after = Pt(8)

    add_card(s3, Inches(7.3), Inches(1.4), Inches(5.2), Inches(5.3), bg_color=C_WHITE, border_color=C_PURPLE)
    tbox = s3.shapes.add_textbox(Inches(7.5), Inches(1.5), Inches(4.8), Inches(5.1))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "📚 PHÍA QUẢN TRỊ HỌC LIỆU (VẬN HÀNH)"
    p.font.name = FONT_HEADING
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = C_PURPLE
    p.space_after = Pt(10)
    
    content_questions = [
        ("❓ Ai thiết kế chương trình?", "Người quản lý đào tạo thiết lập khung Khóa học, Unit và giao việc cho Soạn giả."),
        ("❓ Ai biên soạn nội dung?", "Soạn giả bài học nhập từ vựng, bắt buộc tải audio chuẩn và tạo bài tập tương tác."),
        ("❓ Ai kiểm tra chất lượng?", "Kiểm duyệt viên độc lập thẩm định 6 tiêu chí QC, nghe 100% audio trước khi duyệt."),
        ("❓ Ai quyết định phát hành?", "Chỉ xuất bản khi bài đã duyệt và đủ 4/4 bài trong Unit mới mở khóa cho học viên."),
    ]
    for h, d in content_questions:
        p = tf.add_paragraph()
        p.text = h
        p.font.name = FONT_HEADING
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = C_NAVY
        p2 = tf.add_paragraph()
        p2.text = d
        p2.font.name = FONT_BODY
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = C_MUTED
        p2.space_after = Pt(8)
        
    p_sum = tf.add_paragraph()
    p_sum.text = "💡 KẾT LUẬN: Lingora giải quyết đồng thời trải nghiệm người học và kỷ luật vận hành học liệu."
    p_sum.font.name = FONT_HEADING
    p_sum.font.size = Pt(10.5)
    p_sum.font.bold = True
    p_sum.font.color.rgb = C_PURPLE

    add_footer(s3, "Nguồn: Khảo sát thực nghiệm nhu cầu người học N=15, 24 câu hỏi · Báo cáo phân tích yêu cầu nghiệp vụ.")

    # ==================== SLIDE 4: METHODOLOGY ====================
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "Phương pháp luận nghiên cứu", "Mỗi câu hỏi được trả lời bằng phương pháp phù hợp", "Kết hợp định lượng, định tính, phỏng vấn chuyên gia, đối chuẩn sản phẩm và rà soát pháp lý")
    
    blocks = [
        ("1. NGƯỜI HỌC (LEARNERS)", C_BLUE, [
            ("Khảo sát định lượng (N=15)", "24 câu hỏi bao quát hành vi, khó khăn, dạng bài ưa thích và nhu cầu nhắc ôn tự động."),
            ("Khảo sát bổ sung (N=35)", "Google Forms (10–14/09/2026): khảo sát khung giờ học tối ưu và việc làm lại câu sai (~10%)."),
            ("Phỏng vấn định tính (N=3)", "Phỏng vấn bán cấu trúc 3 sinh viên từng bỏ dở app để tìm hiểu rào cản tâm lý cốt lõi."),
        ]),
        ("2. STAKEHOLDERS (7 CHUYÊN GIA)", C_PURPLE, [
            ("Manager ×2 (16–18/09/2026)", "Phiếu giao việc (Task Spec), đóng gói Unit 4 bài, tỷ lệ hoàn thành, theo dõi trạng thái."),
            ("Creator ×2 & Moderator ×1", "Quy trình nhập liệu, chuẩn bị audio (tốn 60% công sức), Bulk Import, QC 6 tiêu chí."),
            ("Ops ×1 & System Admin ×1", "Phân luồng 3 loại phiếu hỗ trợ, 6 trường Audit Log, quyền Emergency Publish có giải trình."),
        ]),
        ("3. NGHIÊN CỨU BỔ TRỢ", C_ORANGE, [
            ("Benchmark 3 ứng dụng", "Duolingo (micro-learning, Streak), Quizlet (flashcard, ôn tập), ELSA Speak (audio chuẩn)."),
            ("Legal Review 3 Nghị định", "Nghị định 147/2024 (lưu trữ nhật ký), 53/2022 (an ninh mạng), 13/2023 (bảo vệ dữ liệu cá nhân)."),
            ("Ranh giới liêm chính", "Không đưa số đo thử nghiệm đơn lẻ (Time-study) của sinh viên vào deck; không gộp nguồn."),
        ]),
    ]
    for i, (b_title, b_col, b_items) in enumerate(blocks):
        left_pos = Inches(1.8 + i * 3.65)
        add_card(s4, left_pos, Inches(1.4), Inches(3.45), Inches(5.3), bg_color=C_WHITE, border_color=b_col)
        tbox = s4.shapes.add_textbox(left_pos + Inches(0.2), Inches(1.55), Inches(3.05), Inches(5.0))
        tf = tbox.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = b_title
        p.font.name = FONT_HEADING
        p.font.size = Pt(11.5)
        p.font.bold = True
        p.font.color.rgb = b_col
        p.space_after = Pt(12)
        
        for it_title, it_desc in b_items:
            p = tf.add_paragraph()
            p.text = f"• {it_title}:"
            p.font.name = FONT_HEADING
            p.font.size = Pt(10)
            p.font.bold = True
            p.font.color.rgb = C_NAVY
            p2 = tf.add_paragraph()
            p2.text = it_desc
            p2.font.name = FONT_BODY
            p2.font.size = Pt(9.5)
            p2.font.color.rgb = C_MUTED
            p2.space_after = Pt(10)
            
    add_footer(s4, "Không đồng nhất Survey, Interview, Benchmark và Legal Review thành một nguồn; mỗi kết luận gắn với nguồn bằng chứng độc lập.")

    # ==================== SLIDE 5: SURVEY N=15 ====================
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "Khảo sát thực nghiệm ban đầu", "Khảo sát ban đầu N=15: vấn đề nào cần được giải quyết?", "Xác lập các vấn đề cốt lõi của người học ngoại ngữ trong mẫu khảo sát thực tế")
    
    metrics = [
        ("13/15 (86.7%)", "HỌC TIẾNG ANH", "Ưu tiên phát triển bộ học liệu Tiếng Anh A1 cho giai đoạn MVP."),
        ("15/15 (100%)", "HAY QUÊN TỪ VỰNG", "Cơ sở thực tế bắt buộc cho thuật toán ôn tập ngắt quãng (Spaced Review)."),
        ("13/15 (86.7%)", "HỌC KHÔNG ĐỀU", "Cơ sở thiết kế bài học vi mô ngắn 5–10 phút và động lực chuỗi ngày (Streak)."),
        ("14/15 (93.3%)", "ĐỀ XUẤT NỘI DUNG", "Cần bài kiểm tra xếp lớp (Placement Test) để xác định điểm xuất phát."),
    ]
    for i, (num, label, desc) in enumerate(metrics):
        left_pos = Inches(1.8 + i * 2.7)
        add_card(s5, left_pos, Inches(1.4), Inches(2.55), Inches(2.4), bg_color=C_WHITE, border_color=C_BLUE)
        tbox = s5.shapes.add_textbox(left_pos + Inches(0.15), Inches(1.5), Inches(2.25), Inches(2.2))
        tf = tbox.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = num
        p.font.name = FONT_HEADING
        p.font.size = Pt(20)
        p.font.bold = True
        p.font.color.rgb = C_BLUE
        
        p = tf.add_paragraph()
        p.text = label
        p.font.name = FONT_HEADING
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = C_NAVY
        p.space_after = Pt(4)
        
        p = tf.add_paragraph()
        p.text = desc
        p.font.name = FONT_BODY
        p.font.size = Pt(9.5)
        p.font.color.rgb = C_MUTED

    add_card(s5, Inches(1.8), Inches(4.0), Inches(5.25), Inches(2.7), bg_color=C_WHITE, border_color=C_BORDER)
    tbox = s5.shapes.add_textbox(Inches(2.0), Inches(4.1), Inches(4.85), Inches(2.5))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "📊 CÂU HỎI Q13: MỨC ĐỘ CẦN THIẾT NHẮC ÔN TỰ ĐỘNG"
    p.font.name = FONT_HEADING
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_NAVY
    p.space_after = Pt(6)
    
    p = tf.add_paragraph()
    p.text = "• 12/15 người (80.0%) đánh giá mức 4–5 sao cấp thiết (Rất cần thiết).\n• Điểm trung bình đánh giá: 4.13 / 5.0 (62/15 = 4.133).\n• Phân bố: 8 người (5★), 4 người (4★), 1 người (3★), 1 người (2★), 1 người (1★).\n→ Minh chứng rõ nét cho tính năng tự động lọc từ đến hạn ôn tập."
    p.font.name = FONT_BODY
    p.font.size = Pt(10)
    p.font.color.rgb = C_DARK

    add_card(s5, Inches(7.25), Inches(4.0), Inches(5.25), Inches(2.7), bg_color=C_WHITE, border_color=C_BORDER)
    tbox = s5.shapes.add_textbox(Inches(7.45), Inches(4.1), Inches(4.85), Inches(2.5))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "📝 CÂU HỎI Q17: DẠNG BÀI TẬP TƯƠNG TÁC ƯA THÍCH"
    p.font.name = FONT_HEADING
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_NAVY
    p.space_after = Pt(6)
    
    p = tf.add_paragraph()
    p.text = "• Điền từ vào chỗ trống: 11/15 (73.3%)\n• Trắc nghiệm: 9/15 (60.0%)\n• Nghe nhận diện từ: 8/15 (53.3%)\n• Ghép từ: 7/15 (46.7%) | Sắp xếp từ thành câu: 6/15 (40.0%)\n→ Căn cứ lựa chọn 5 dạng bài tập chuẩn MVP (thay nối từ bằng sắp xếp câu để rèn cú pháp)."
    p.font.name = FONT_BODY
    p.font.size = Pt(10)
    p.font.color.rgb = C_DARK

    add_footer(s5, "Khảo sát ban đầu cho biết 'vấn đề gì'; cần khảo sát bổ sung và phỏng vấn để biết 'nên thiết kế như thế nào'.")

    # ==================== SLIDE 6: SURVEY N=35 ====================
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "Khảo sát sơ bộ bổ sung", "Khảo sát bổ sung N=35: trả lời các câu hỏi thiết kế cụ thể", "10–14/09/2026 · Google Forms · N=35 người học tiếng Anh cơ bản tại Hà Nội · Chọn mẫu thuận tiện")
    
    add_card(s6, Inches(1.8), Inches(1.4), Inches(5.2), Inches(5.3), bg_color=C_WHITE, border_color=C_BLUE)
    tbox = s6.shapes.add_textbox(Inches(2.0), Inches(1.55), Inches(4.8), Inches(5.0))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "⏰ KHUNG GIỜ TỰ HỌC THUẬN TIỆN NHẤT"
    p.font.name = FONT_HEADING
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p.space_after = Pt(8)
    
    p = tf.add_paragraph()
    p.text = "\"Khung giờ nào trong ngày bạn cảm thấy thuận tiện và có khả năng tập trung tự học tốt nhất?\""
    p.font.name = FONT_BODY
    p.font.size = Pt(10)
    p.font.italic = True
    p.font.color.rgb = C_MUTED
    p.space_after = Pt(12)
    
    hours = [
        ("20:00 – 22:00 (Buổi tối)", "18/35 — 51.4%", C_BLUE),
        ("12:00 – 13:00 (Nghỉ trưa)", "8/35 — 22.9%", C_NAVY),
        ("Linh hoạt khi rảnh rỗi", "6/35 — 17.1%", C_MUTED),
        ("06:00 – 07:30 (Sáng sớm)", "3/35 — 8.6%", C_MUTED),
    ]
    for h, v, c in hours:
        p = tf.add_paragraph()
        p.text = f"{h}: {v}"
        p.font.name = FONT_HEADING
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = c
        p.space_after = Pt(4)
        
    p = tf.add_paragraph()
    p.text = "\n💡 Ý nghĩa thiết kế:\n• Khung giờ 20:00–22:00 là thời điểm học tập tập trung nhất.\n• Dùng làm tham số định hướng cấu hình In-app Reminder và mốc tính ngày Streak (23:59:59 local-tz).\n• Không suy ra đây là khung giờ ép buộc mọi người học."
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_DARK

    add_card(s6, Inches(7.3), Inches(1.4), Inches(5.2), Inches(5.3), bg_color=C_WHITE, border_color=C_ORANGE)
    tbox = s6.shapes.add_textbox(Inches(7.5), Inches(1.55), Inches(4.8), Inches(5.0))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🔄 THÁI ĐỘ LÀM LẠI CÂU SAI CUỐI BÀI"
    p.font.name = FONT_HEADING
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = C_ORANGE
    p.space_after = Pt(8)
    
    p = tf.add_paragraph()
    p.text = "\"Bạn có đồng ý làm lại các câu đã trả lời sai ở cuối bài học với tỷ lệ khoảng 10% nội dung để củng cố không?\""
    p.font.name = FONT_BODY
    p.font.size = Pt(10)
    p.font.italic = True
    p.font.color.rgb = C_MUTED
    p.space_after = Pt(12)
    
    retries = [
        ("Đồng ý cần gặp lại để nhớ", "19/35 — 54.3%", C_GREEN),
        ("Phân vân / Muốn có tùy chọn", "11/35 — 31.4%", C_ORANGE),
        ("Không muốn lặp lại", "5/35 — 14.3%", C_RED),
    ]
    for h, v, c in retries:
        p = tf.add_paragraph()
        p.text = f"{h}: {v}"
        p.font.name = FONT_HEADING
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = c
        p.space_after = Pt(4)
        
    p = tf.add_paragraph()
    p.text = "\n💡 Ý nghĩa thiết kế:\n• 30/35 (85.7%) không từ chối hoàn toàn việc gặp lại câu sai.\n• Xác lập cơ sở thực nghiệm đưa Controlled Retry vào cuối bài.\n• Tỷ lệ 10% là tham số cấu hình linh hoạt có thể tinh chỉnh."
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_DARK

    add_footer(s6, "Nguồn: Khảo sát sơ bộ bổ sung N=35, thực hiện 10–14/09/2026. Chọn mẫu thuận tiện khám phá, không suy rộng thống kê.")

    # ==================== SLIDE 7: INTERVIEW N=3 ====================
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "Phỏng vấn định tính chuyên sâu", "Phỏng vấn N=3: nguyên nhân phía sau việc bỏ dở", "Giải thích những rào cản tâm lý mà số liệu định lượng chưa thể hiện đầy đủ")
    
    cases = [
        ("CASE 1 — NỘI DUNG DỒN Ứ", "Sinh viên năm 3", "Duy trì học tốt 4 ngày đầu. Khi bận học trên trường quên mở app 1 ngày; ngày hôm sau thấy lượng từ dồn lại quá lớn nên nản lòng và bỏ học.", "Áp lực từ nội dung tồn đọng khi lỡ nhịp.", "Bài học vi mô ngắn + kiểm soát số lượng từ vựng đến hạn ôn tập hàng ngày ở mức vừa sức.", C_BLUE),
        ("CASE 2 — THIẾU PHẢN HỒI", "Sinh viên mới tốt nghiệp", "Khi làm bài tập bị sai, ứng dụng chỉ báo sai và hiện đáp án đúng mà không giải thích vì sao; phải tự tra cứu ngoài làm đứt mạch học.", "Thiếu phản hồi sư phạm tại chỗ khi sai.", "Bắt buộc Soạn giả phải nhập giải thích quy tắc đáp án ngắn gọn (tối đa 2 câu) cho 100% câu hỏi.", C_PURPLE),
        ("CASE 3 — BÀI HỌC QUÁ DÀI", "Sinh viên năm 2", "Khi mệt mỏi hoặc bận rộn chỉ muốn học nhanh 5 phút, nhưng bài học dài lê thê (>15 phút) khiến người học nản chí và bỏ qua luôn phiên học.", "Thời lượng bài học vượt ngưỡng tập trung.", "Chuẩn hóa bài học vi mô: chỉ 8–10 từ vựng và 5 câu bài tập tương tác, hoàn thành trong 5–10 phút.", C_ORANGE),
    ]
    for i, (c_title, c_sub, c_story, c_insight, c_action, c_col) in enumerate(cases):
        left_pos = Inches(1.8 + i * 3.65)
        add_card(s7, left_pos, Inches(1.4), Inches(3.45), Inches(5.3), bg_color=C_WHITE, border_color=c_col)
        tbox = s7.shapes.add_textbox(left_pos + Inches(0.18), Inches(1.55), Inches(3.09), Inches(5.0))
        tf = tbox.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = c_title
        p.font.name = FONT_HEADING
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = c_col
        
        p = tf.add_paragraph()
        p.text = c_sub
        p.font.name = FONT_BODY
        p.font.size = Pt(9.5)
        p.font.color.rgb = C_MUTED
        p.space_after = Pt(8)
        
        p = tf.add_paragraph()
        p.text = "📖 Tình huống ghi nhận:"
        p.font.name = FONT_HEADING
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = C_NAVY
        p = tf.add_paragraph()
        p.text = c_story
        p.font.name = FONT_BODY
        p.font.size = Pt(9)
        p.font.color.rgb = C_DARK
        p.space_after = Pt(8)
        
        p = tf.add_paragraph()
        p.text = "💡 Insight tâm lý:"
        p.font.name = FONT_HEADING
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = c_col
        p = tf.add_paragraph()
        p.text = c_insight
        p.font.name = FONT_BODY
        p.font.size = Pt(9)
        p.font.color.rgb = C_DARK
        p.space_after = Pt(8)
        
        p = tf.add_paragraph()
        p.text = "🎯 Quyết định thiết kế:"
        p.font.name = FONT_HEADING
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = C_GREEN
        p = tf.add_paragraph()
        p.text = c_action
        p.font.name = FONT_BODY
        p.font.size = Pt(9)
        p.font.color.rgb = C_DARK

    add_footer(s7, "Nguồn: Phỏng vấn bán cấu trúc N=3 sinh viên từng bỏ dở app, 15–16/09/2026. Nghiên cứu định tính, tuyệt đối không gán ghép %.")

    # ==================== SLIDE 8: STAKEHOLDER METHODOLOGY ====================
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "Nghiên cứu phía chuyên gia & vận hành", "Kiểm chứng yêu cầu với các vai trò trực tiếp vận hành hệ thống", "7 chuyên gia và cán bộ thuộc 5 vai trò nghiệp vụ đã được phỏng vấn chuyên sâu (16–18/09/2026)")
    
    stakeholders = [
        ("Manager (2 người)", C_PURPLE, "Lập kế hoạch & Quản trị", "• Task Specification: phiếu giao bài 5 trường.\n• Unit Completeness: chỉ mở Unit khi đủ 4 bài.\n• Completion Rate: theo dõi tỷ lệ hoàn thành.\n• Dashboard: giám sát tiến độ toàn đội."),
        ("Creator (2 người)", C_ORANGE, "Biên soạn học liệu", "• Input Workflow: nhập từ vựng và bài tập.\n• Chuẩn bị audio: tốn 60% thời gian soạn bài.\n• Bulk Import: nhu cầu nạp nhanh từ Excel.\n• Revision Workflow: sửa bài khi bị trả về."),
        ("Moderator (1 người)", C_GREEN, "Kiểm định chất lượng", "• QC Checklist: bộ 6 tiêu chí nhị phân.\n• Audio Review: bắt buộc nghe 100% audio.\n• Phản hồi chi tiết: nhập lý do khi yêu cầu sửa.\n• Độc lập: cấm tự duyệt bài mình soạn."),
        ("Operations (1 người)", C_GRAY, "Hỗ trợ người dùng", "• Phân luồng 3 nhánh ticket hỗ trợ.\n• Thông tin hỗ trợ tối thiểu (không lộ dữ liệu).\n• Khung câu hỏi thường gặp (FAQ).\n• Ranh giới: không được sửa trực tiếp học liệu."),
        ("Admin (1 người)", C_RED, "Quản trị an toàn", "• Quản lý tài khoản & phân quyền 6 vai trò.\n• Audit Log: 6 trường dữ liệu bất biến.\n• Emergency Publish: xuất bản khẩn cấp bài đã duyệt kèm lý do giải trình bắt buộc."),
    ]
    for i, (role_title, r_col, r_sub, r_desc) in enumerate(stakeholders):
        left_pos = Inches(1.8 + i * 2.15)
        add_card(s8, left_pos, Inches(1.4), Inches(2.05), Inches(5.3), bg_color=C_WHITE, border_color=r_col)
        tbox = s8.shapes.add_textbox(left_pos + Inches(0.1), Inches(1.5), Inches(1.85), Inches(5.1))
        tf = tbox.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = role_title
        p.font.name = FONT_HEADING
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = r_col
        
        p = tf.add_paragraph()
        p.text = r_sub
        p.font.name = FONT_BODY
        p.font.size = Pt(9)
        p.font.color.rgb = C_MUTED
        p.space_after = Pt(10)
        
        p = tf.add_paragraph()
        p.text = r_desc
        p.font.name = FONT_BODY
        p.font.size = Pt(8.8)
        p.font.color.rgb = C_DARK
        
    add_footer(s8, "Kết quả phỏng vấn chuyên môn là căn cứ trực tiếp để thiết lập quy tắc nghiệp vụ và ma trận SoD của Lingora.")

    # ==================== SLIDE 9: MANAGER & CREATOR ====================
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "Kết quả phỏng vấn chuyên sâu (1)", "Manager & Creator: quy trình quản lý và biên soạn", "Chuẩn hóa phiếu phân công nhiệm vụ và giải quyết nút thắt chuẩn bị âm thanh")
    
    # Left: Manager
    add_card(s9, Inches(1.8), Inches(1.4), Inches(5.2), Inches(5.3), bg_color=C_WHITE, border_color=C_PURPLE)
    tbox = s9.shapes.add_textbox(Inches(2.0), Inches(1.55), Inches(4.8), Inches(5.0))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "📋 ORGANIZATIONAL MANAGER (QUẢN LÝ ĐÀO TẠO)"
    p.font.name = FONT_HEADING
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = C_PURPLE
    p.space_after = Pt(8)
    
    p = tf.add_paragraph()
    p.text = "🎯 Output 1: Phiếu phân công nhiệm vụ (Task Specification 5 trường):"
    p.font.name = FONT_HEADING
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_NAVY
    p = tf.add_paragraph()
    p.text = "1. Mã bài học & Tên chủ đề (gắn với Unit).\n2. Soạn giả phụ trách (Assignee).\n3. Định mức bài học: 8–10 từ vựng + 5 câu bài tập đủ 5 dạng chuẩn.\n4. Thời hạn hoàn thành (Deadline).\n5. Trạng thái luân chuyển bài học."
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_DARK
    p.space_after = Pt(10)
    
    p = tf.add_paragraph()
    p.text = "🎯 Output 2: Quy tắc đóng gói Unit hoàn chỉnh:"
    p.font.name = FONT_HEADING
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_NAVY
    p = tf.add_paragraph()
    p.text = "• Một Unit chỉ mở khóa cho học viên khi đủ cả 4/4 bài học Đã xuất bản.\n• Giám sát tỷ lệ hoàn thành (Completion Rate) để phát hiện bài học quá khó.\n→ Yêu cầu hệ thống tương ứng: CORE-02, CORE-05."
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_DARK

    # Right: Creator
    add_card(s9, Inches(7.3), Inches(1.4), Inches(5.2), Inches(5.3), bg_color=C_WHITE, border_color=C_ORANGE)
    tbox = s9.shapes.add_textbox(Inches(7.5), Inches(1.55), Inches(4.8), Inches(5.0))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "✍️ LESSON CREATOR (SOẠN GIẢ BÀI HỌC)"
    p.font.name = FONT_HEADING
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = C_ORANGE
    p.space_after = Pt(8)
    
    p = tf.add_paragraph()
    p.text = "🎯 Output 1: Nút thắt chuẩn bị âm thanh phát âm chuẩn:"
    p.font.name = FONT_HEADING
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_NAVY
    p = tf.add_paragraph()
    p.text = "• Khâu thu âm hoặc tạo tệp TTS, cắt lọc và nghe kiểm tra tốn ~60% thời gian.\n• Soạn giả cần tính năng 'Xem trước bài học' để nghe thử audio trước khi nộp.\n• Bắt buộc tải tệp audio chuẩn cho 100% từ mới; cấm bỏ sót."
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_DARK
    p.space_after = Pt(10)
    
    p = tf.add_paragraph()
    p.text = "🎯 Output 2: Nhu cầu nạp bài hàng loạt (Bulk Import):"
    p.font.name = FONT_HEADING
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_NAVY
    p = tf.add_paragraph()
    p.text = "• Nhập form Web thuận tiện cho sửa bài nhỏ; tạo nhiều bài cần file Excel/CSV.\n• Ràng buộc: Bài nạp từ file vẫn bắt buộc ở trạng thái Bản thảo và qua duyệt.\n→ Yêu cầu hệ thống tương ứng: CORE-03, EXT-08."
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_DARK

    add_footer(s9, "Nguồn: Phỏng vấn chuyên sâu 2 Manager và 2 Creator từ ngày 16–18/09/2026.")

    # ==================== SLIDE 10: MOD / OPS / ADMIN ====================
    s10 = prs.slides.add_slide(blank_layout)
    add_header(s10, "Kết quả phỏng vấn chuyên sâu (2)", "Kiểm soát chất lượng, hỗ trợ và quản trị an toàn", "Thiết lập hàng rào kiểm duyệt độc lập, ranh giới dữ liệu và truy vết kiểm toán bất biến")
    
    sections = [
        ("MODERATOR (KIỂM DUYỆT)", C_GREEN, [
            ("QC Checklist 6 tiêu chí", "1. Chính xác ngôn ngữ (chính tả, dịch nghĩa).\n2. Chất lượng âm thanh (rõ ràng, không tạp âm).\n3. Logic bài tập (đúng 5 dạng chuẩn).\n4. Giải thích đáp án (tối đa 2 câu rõ nghĩa).\n5. Quy chuẩn thời lượng (8–10 từ / 5–10p).\n6. Độc lập kiểm duyệt (nghe 100% audio)."),
            ("Quy tắc vàng phân định SoD", "Creator_ID == Moderator_ID → KHÓA DUYỆT (Cấm tự duyệt bài mình soạn) → CORE-04."),
        ]),
        ("OPERATIONS STAFF (HỖ TRỢ)", C_GRAY, [
            ("3 Luồng xử lý Ticket", "• Kỹ thuật / Tài khoản → Chuyển Admin.\n• Lỗi nội dung học liệu → Chuyển Moderator + Manager để xem xét clone sửa bài.\n• Thắc mắc chung → Operations giải quyết qua FAQ."),
            ("Ranh giới quyền hạn", "Nhân viên vận hành tuyệt đối không được sửa trực tiếp cơ sở dữ liệu học liệu → EXT-04."),
        ]),
        ("SYSTEM ADMIN (QUẢN TRỊ)", C_RED, [
            ("Audit Log 6 trường bắt buộc", "1. Timestamp (có múi giờ)\n2. Actor ID & Role\n3. Action (loại thao tác)\n4. Target Entity (đối tượng)\n5. Result (thành công/thất bại)\n6. IP & User-Agent"),
            ("Emergency Publish", "Chỉ xuất bản bài ĐÃ DUYỆT (APPROVED) + Bắt buộc nhập Justification → Ghi Audit Log → CORE-05, CORE-12."),
        ]),
    ]
    for i, (sec_title, sec_col, sec_items) in enumerate(sections):
        left_pos = Inches(1.8 + i * 3.65)
        add_card(s10, left_pos, Inches(1.4), Inches(3.45), Inches(5.3), bg_color=C_WHITE, border_color=sec_col)
        tbox = s10.shapes.add_textbox(left_pos + Inches(0.18), Inches(1.55), Inches(3.09), Inches(5.0))
        tf = tbox.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = sec_title
        p.font.name = FONT_HEADING
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = sec_col
        p.space_after = Pt(8)
        
        for it_h, it_b in sec_items:
            p = tf.add_paragraph()
            p.text = f"📌 {it_h}:"
            p.font.name = FONT_HEADING
            p.font.size = Pt(9.5)
            p.font.bold = True
            p.font.color.rgb = C_NAVY
            p = tf.add_paragraph()
            p.text = it_b
            p.font.name = FONT_BODY
            p.font.size = Pt(9)
            p.font.color.rgb = C_DARK
            p.space_after = Pt(8)

    add_footer(s10, "Lưu ý: Justification là điều kiện nghiệp vụ bắt buộc riêng cho Emergency Publish; không nằm trong 6 trường log thông thường.")

    # ==================== SLIDE 11: BENCHMARK & DECISIONS ====================
    s11 = prs.slides.add_slide(blank_layout)
    add_header(s11, "Đối chuẩn & Quyết định thiết kế", "Đối chuẩn để hoàn thiện các quyết định thiết kế cốt lõi", "Kế thừa thế mạnh của các ứng dụng dẫn đầu và khắc phục nhược điểm thực tế")
    
    # Benchmark table
    add_card(s11, Inches(1.8), Inches(1.4), Inches(10.7), Inches(2.5), bg_color=C_WHITE, border_color=C_BORDER)
    tbox = s11.shapes.add_textbox(Inches(2.0), Inches(1.5), Inches(10.3), Inches(2.3))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🔍 BẢNG ĐỐI CHUẨN 3 ỨNG DỤNG DẪN ĐẦU (BENCHMARK ANALYSIS)"
    p.font.name = FONT_HEADING
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_NAVY
    p.space_after = Pt(6)
    
    bm_data = [
        ("Duolingo", "Bài học vi mô 5–10p; lộ trình tuyến tính; Streak tạo thói quen.", "Thiếu giải thích tại chỗ khi làm sai; Streak Freeze phức tạp gây ỷ lại.", "Kế thừa bài 5–10p; bắt buộc giải thích đáp án; Streak đứt về 1 ở MVP."),
        ("Quizlet", "Flashcard lật mặt trực quan; cơ chế tự ôn tập từ vựng chủ động.", "Thiếu câu theo ngữ cảnh; nội dung do cộng đồng tự chia sẻ thiếu kiểm duyệt.", "Chuẩn hóa thẻ từ có phiên âm, câu ví dụ; kiểm duyệt độc lập 100% trước khi phát hành."),
        ("ELSA Speak", "Phát âm chuẩn bản xứ; phản hồi tức thì sau mỗi bài tập.", "Nhận diện giọng nói phức tạp, dễ lỗi do micro gây ức chế tâm lý người học.", "Tải sẵn audio chuẩn cho 100% từ mới; thay chấm giọng nói bằng bài tập nghe nhận diện."),
    ]
    for app, pros, cons, dec in bm_data:
        p = tf.add_paragraph()
        p.text = f"• {app}: Kế thừa: {pros} | Hạn chế: {cons} → Áp dụng: {dec}"
        p.font.name = FONT_BODY
        p.font.size = Pt(9)
        p.font.color.rgb = C_DARK
        p.space_after = Pt(4)

    # 6 Frozen Decisions
    add_card(s11, Inches(1.8), Inches(4.1), Inches(10.7), Inches(2.6), bg_color=C_WHITE, border_color=C_BLUE)
    tbox = s11.shapes.add_textbox(Inches(2.0), Inches(4.2), Inches(10.3), Inches(2.4))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🎯 6 QUYẾT ĐỊNH THIẾT KẾ ĐÃ KHÓA CỨNG CHO LINGORA"
    p.font.name = FONT_HEADING
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p.space_after = Pt(6)
    
    decisions = [
        "1. 5 Dạng bài tập cốt lõi: Trắc nghiệm · Điền từ · Sắp xếp câu · Nghe nhận diện · Ngữ pháp (câu hỏi kèm giải thích quy tắc).",
        "2. Thuật toán Spaced Review cố định: 5 mốc chu kỳ giãn cách: 1 → 3 → 7 → 14 → 30 ngày (trực quan, khả thi kỹ thuật).",
        "3. Chuỗi ngày học (Streak) theo múi giờ địa phương: Đứt chuỗi về 1 khi quay lại, không có bảo vệ chuỗi (Streak Freeze) ở MVP.",
        "4. Điều kiện hiển thị Unit: Chỉ xuất hiện và mở khóa cho học viên khi có đủ 4/4 bài học đạt trạng thái Đã xuất bản.",
        "5. Tiêu chuẩn âm thanh phát âm chuẩn: Bắt buộc 100% từ mới có audio chuẩn; Kiểm duyệt viên phải nghe kiểm tra trước khi duyệt.",
        "6. Bài kiểm tra xếp lớp (Placement Test): Gồm đúng 30 câu hỏi bao quát Unit 1–6; có tùy chọn 'Bỏ qua bài kiểm tra' để học từ đầu.",
    ]
    for dec in decisions:
        p = tf.add_paragraph()
        p.text = dec
        p.font.name = FONT_BODY
        p.font.size = Pt(9)
        p.font.color.rgb = C_DARK
        p.space_after = Pt(2)

    add_footer(s11, "Kiến trúc độc lập 3 tầng ngôn ngữ: Giao diện (Việt/Anh) — Ngôn ngữ nguồn (Tiếng Việt) — Ngôn ngữ đích (English A1 pilot).")

    # ==================== SLIDE 12: EVIDENCE TRACEABILITY ====================
    s12 = prs.slides.add_slide(blank_layout)
    add_header(s12, "Ma trận truy vết yêu cầu", "Từ bằng chứng thực tế đến yêu cầu hệ thống", "Mỗi yêu cầu chức năng đều bắt nguồn trực tiếp từ khảo sát thực nghiệm hoặc căn cứ vận hành")
    
    # Traceability Table
    add_card(s12, Inches(1.8), Inches(1.4), Inches(10.7), Inches(5.3), bg_color=C_WHITE, border_color=C_BORDER)
    
    t_shape = s12.shapes.add_table(15, 3, Inches(1.9), Inches(1.5), Inches(10.5), Inches(5.0))
    table = t_shape.table
    table.columns[0].width = Inches(2.2)
    table.columns[1].width = Inches(5.8)
    table.columns[2].width = Inches(2.5)
    
    headers = ["Nguồn bằng chứng", "Phát hiện cốt lõi từ thực tế", "Yêu cầu hệ thống giải quyết"]
    for col_idx, h in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_NAVY
        for p in cell.text_frame.paragraphs:
            p.font.name = FONT_HEADING
            p.font.size = Pt(9.5)
            p.font.bold = True
            p.font.color.rgb = C_WHITE
            
    trace_rows = [
        ("N=15, Q8: 15/15 (100%)", "100% người khảo sát từng quên từ vựng đã học", "CORE-08 (Ôn ngắt quãng chu kỳ)"),
        ("N=15, Q13: 12/15 (80%)", "Nhu cầu tự động nhắc ôn từ vựng ở mức rất cấp thiết (4.13/5)", "CORE-08 (Lọc từ đến hạn ôn)"),
        ("N=15, Q15: 14/15 (93.3%)", "Quan tâm tính năng tự đề xuất bài học theo kết quả trước đó", "CORE-09 (Placement) + EXT-03"),
        ("N=15, Q17 & Q7", "Nhu cầu bài tập điền từ, trắc nghiệm, nghe và giải thích ngữ pháp", "CORE-03, CORE-07 (5 Dạng bài)"),
        ("N=35: 18/35 (51.4%)", "Khung giờ 20:00–22:00 buổi tối là thời điểm tự học phổ biến nhất", "CORE-10 (In-app Reminder)"),
        ("N=35: 19/35 (54.3%)", "Đa số người học đồng ý làm lại câu sai ở cuối bài học (~10%)", "CORE-07 (Controlled Retry)"),
        ("N=3, Case 1", "Tâm lý nản lòng vì nội dung bị dồn ứ sau khi lỡ nhịp 1 ngày", "CORE-07 (Bài vi mô) + CORE-08"),
        ("N=3, Case 2", "Bức xúc vì làm sai nhưng không được giải thích lý do tại chỗ", "CORE-03, CORE-07 (Giải thích)"),
        ("N=3, Case 3", "Bỏ học vì bài học quá dài dòng lê thê (>15 phút)", "CORE-02, CORE-05 (Bài 5–10p)"),
        ("PV Manager (2 người)", "Cần Task Spec 5 trường và quy tắc đóng gói Unit hoàn chỉnh", "CORE-02 (Giao việc) + CORE-05"),
        ("PV Creator (2 người)", "Khâu chuẩn bị audio tốn thời gian; cần tính năng nạp bài hàng loạt", "CORE-03 (Audio) + EXT-08"),
        ("PV Moderator (1 người)", "Cần bộ tiêu chí QC 6 điểm và khóa cấm tự duyệt bài mình soạn", "CORE-04 (Kiểm duyệt độc lập)"),
        ("PV Operations (1 người)", "Cần phân luồng 3 nhánh hỗ trợ; không được sửa trực tiếp học liệu", "EXT-04 (Xử lý phiếu hỗ trợ)"),
        ("PV Admin & Legal Review", "Cần bảo vệ phiên, phân quyền 6 vai trò và ghi Audit Log bất biến", "CORE-05, CORE-12 + NFR-AUD"),
    ]
    for row_idx, (src, find, req) in enumerate(trace_rows):
        r = row_idx + 1
        for c_idx, val in enumerate([src, find, req]):
            cell = table.cell(r, c_idx)
            cell.text = val
            for p in cell.text_frame.paragraphs:
                p.font.name = FONT_BODY
                p.font.size = Pt(8.5)
                p.font.color.rgb = C_DARK
                if c_idx == 0:
                    p.font.bold = True
                elif c_idx == 2:
                    p.font.bold = True
                    p.font.color.rgb = C_BLUE

    add_footer(s12, "Requirement không đứng độc lập; mỗi yêu cầu đều có nguồn bằng chứng hoặc quyết định thiết kế tương ứng.")

    # ==================== SLIDE 13: SYSTEM REQUIREMENTS ====================
    s13 = prs.slides.add_slide(blank_layout)
    add_header(s13, "Đặc tả yêu cầu hệ thống", "Bộ yêu cầu hệ thống: 12 CORE + 8 EXT + NFRs", "Phân định rõ ràng giữa nhóm chức năng cốt lõi MVP và nhóm chức năng mở rộng")
    
    # 12 CORE Box
    add_card(s13, Inches(1.8), Inches(1.4), Inches(5.8), Inches(5.3), bg_color=C_WHITE, border_color=C_BLUE)
    tbox = s13.shapes.add_textbox(Inches(2.0), Inches(1.5), Inches(5.4), Inches(5.1))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "⭐ 12 YÊU CẦU CỐT LÕI (CORE — MUST HAVE CHO MVP)"
    p.font.name = FONT_HEADING
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p.space_after = Pt(8)
    
    core_items = [
        ("Tài khoản:", "CORE-01 (Đăng ký, đăng nhập an toàn, quên mật khẩu, phân định quyền 6 vai trò)."),
        ("Quản lý học liệu:", "CORE-02 (Tạo khung khóa học, Unit, Task Spec 5 trường và giao việc).\nCORE-03 (Soạn bài 8–10 từ, tải 100% audio chuẩn, 5 dạng bài tập có giải thích).\nCORE-04 (Kiểm duyệt độc lập 6 tiêu chí, bắt buộc nghe audio, khóa tự duyệt).\nCORE-05 (Xuất bản chính thức khi đủ 4/4 bài Unit; xuất bản khẩn cấp có giải trình).\nCORE-06 (Nhân bản bản thảo Clone-to-Draft khi cần sửa bài đang phát hành)."),
        ("Học tập & Tiến độ:", "CORE-07 (Duyệt lộ trình, học bài vi mô 5–10p, 5 dạng bài tập và retry câu sai ~10%).\nCORE-08 (Ôn tập ngắt quãng Spaced Review theo chu kỳ cố định 1-3-7-14-30 ngày).\nCORE-09 (Bài kiểm tra xếp lớp Placement Test 30 câu, có tùy chọn bỏ qua).\nCORE-10 (Theo dõi chuỗi Streak theo múi giờ địa phương; cài đặt mục tiêu ngày).\nCORE-11 (Bảng tổng hợp tiến độ và báo cáo học tập cá nhân)."),
        ("Quản trị hệ thống:", "CORE-12 (Quản trị tài khoản, gán vai trò và ghi nhận Audit Log bất biến)."),
    ]
    for h, desc in core_items:
        p = tf.add_paragraph()
        p.text = h
        p.font.name = FONT_HEADING
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = C_NAVY
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(8.8)
        p2.font.color.rgb = C_DARK
        p2.space_after = Pt(4)

    # 8 EXT Box & NFR
    add_card(s13, Inches(7.8), Inches(1.4), Inches(4.7), Inches(5.3), bg_color=C_WHITE, border_color=C_ORANGE)
    tbox = s13.shapes.add_textbox(Inches(8.0), Inches(1.5), Inches(4.3), Inches(5.1))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🚀 8 YÊU CẦU MỞ RỘNG (EXTENSIONS)"
    p.font.name = FONT_HEADING
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_ORANGE
    p.space_after = Pt(6)
    
    ext_items = [
        ("Ưu tiên vừa (SHOULD):", "• EXT-01: Phân tích ngữ pháp câu tự luận (GEC).\n• EXT-02: Luyện hội thoại theo kịch bản tình huống.\n• EXT-03: Đề xuất lộ trình và bài ôn tập thích ứng.\n• EXT-04: Tiếp nhận & điều phối phiếu hỗ trợ (Ops).\n• EXT-05: Màn hình tra cứu & lọc nhật ký kiểm toán."),
        ("Ưu tiên thấp (COULD):", "• EXT-06: Chuyển đổi giao diện song ngữ Việt–Anh.\n• EXT-07: Gửi email nhắc học khi nguy cơ đứt Streak.\n• EXT-08: Nhập bài học hàng loạt từ file Excel/CSV."),
    ]
    for h, desc in ext_items:
        p = tf.add_paragraph()
        p.text = h
        p.font.name = FONT_HEADING
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = C_NAVY
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(8.8)
        p2.font.color.rgb = C_DARK
        p2.space_after = Pt(4)
        
    p = tf.add_paragraph()
    p.text = "🔒 YÊU CẦU PHI CHỨC NĂNG (NFRs)"
    p.font.name = FONT_HEADING
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_RED
    p.space_after = Pt(4)
    p = tf.add_paragraph()
    p.text = "• MUST: Security (phân quyền DB/server, bảo vệ phiên), Reliability (mất mạng không sai điểm), Auditability (ghi vết bất biến).\n• SHOULD: Performance (<1s chuyển câu, ≤3s ngữ pháp, 99.5% sẵn sàng — mục tiêu đề xuất), Mobile-first, Đa ngôn ngữ độc lập."
    p.font.name = FONT_BODY
    p.font.size = Pt(8.5)
    p.font.color.rgb = C_MUTED

    add_footer(s13, "Lưu ý: Các mục tiêu hiệu năng (<1s, ≤3s, 99.5%) là ngưỡng kỹ thuật đề xuất, chưa phải số đo nghiệm thu thực tế.")

    # ==================== SLIDE 14: ACTORS & SOD ====================
    s14 = prs.slides.add_slide(blank_layout)
    add_header(s14, "Tác nhân & Phân định trách nhiệm", "Ai làm gì — và ai không được làm gì?", "Ma trận phân định quyền hạn ngăn ngừa xung đột lợi ích và bảo đảm an toàn hệ thống")
    
    # 6 Actors horizontal mini cards
    actors_info = [
        ("Learner", C_BLUE, "Học · Ôn tập · Streak"),
        ("Manager", C_PURPLE, "Khung · Giao việc · Xuất bản"),
        ("Creator", C_ORANGE, "Soạn bài · Audio · Nộp duyệt"),
        ("Moderator", C_GREEN, "Kiểm duyệt 6 tiêu chí · Nghe audio"),
        ("Operations", C_GRAY, "Tiếp nhận ticket · Hỗ trợ (Mở rộng)"),
        ("Admin", C_RED, "Tài khoản · Phân quyền · Audit Log"),
    ]
    for i, (act_name, act_col, act_desc) in enumerate(actors_info):
        left_pos = Inches(1.8 + i * 1.8)
        add_card(s14, left_pos, Inches(1.4), Inches(1.7), Inches(1.1), bg_color=C_WHITE, border_color=act_col)
        tbox = s14.shapes.add_textbox(left_pos + Inches(0.08), Inches(1.48), Inches(1.54), Inches(0.95))
        tf = tbox.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = act_name
        p.font.name = FONT_HEADING
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = act_col
        p = tf.add_paragraph()
        p.text = act_desc
        p.font.name = FONT_BODY
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_MUTED

    # SoD Table
    add_card(s14, Inches(1.8), Inches(2.65), Inches(10.7), Inches(2.6), bg_color=C_WHITE, border_color=C_BORDER)
    t_shape = s14.shapes.add_table(8, 7, Inches(1.9), Inches(2.75), Inches(10.5), Inches(2.4))
    table = t_shape.table
    table.columns[0].width = Inches(2.7)
    for c in range(1, 7):
        table.columns[c].width = Inches(1.3)
        
    sod_headers = ["Hành động hệ thống", "Learner", "Manager", "Creator", "Moderator", "Operations", "Admin"]
    for c_idx, h in enumerate(sod_headers):
        cell = table.cell(0, c_idx)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_NAVY
        for p in cell.text_frame.paragraphs:
            p.font.name = FONT_HEADING
            p.font.size = Pt(9.5)
            p.font.bold = True
            p.font.color.rgb = C_WHITE
            p.alignment = PP_ALIGN.CENTER if c_idx > 0 else PP_ALIGN.LEFT
            
    sod_rows = [
        ("Tạo khung & Giao việc", "✖", "✔", "✖", "✖", "✖", "✖"),
        ("Biên soạn bài học & Nộp", "✖", "✖", "✔", "Giới hạn*", "✖", "✖"),
        ("Kiểm duyệt độc lập", "✖", "✖", "✖", "✔", "✖", "✖"),
        ("Xuất bản bài học", "✖", "✔", "✖", "✖", "✖", "Khẩn cấp**"),
        ("Học bài & Ôn ngắt quãng", "✔", "✖", "✖", "✖", "✖", "✖"),
        ("Tiếp nhận phiếu hỗ trợ", "✖", "✖", "✖", "✖", "✔ (Mở rộng)", "✖"),
        ("Quản trị tài khoản & Audit", "✖", "✖", "✖", "✖", "✖", "✔"),
    ]
    for r_idx, row_vals in enumerate(sod_rows):
        r = r_idx + 1
        for c_idx, val in enumerate(row_vals):
            cell = table.cell(r, c_idx)
            cell.text = val
            for p in cell.text_frame.paragraphs:
                p.font.name = FONT_BODY
                p.font.size = Pt(9)
                p.font.color.rgb = C_GREEN if val == "✔" else (C_RED if val == "✖" else C_DARK)
                p.font.bold = True if val in ["✔", "✖"] else False
                p.alignment = PP_ALIGN.CENTER if c_idx > 0 else PP_ALIGN.LEFT

    # Admin Principles
    add_card(s14, Inches(1.8), Inches(5.35), Inches(10.7), Inches(1.4), bg_color=C_WHITE, border_color=C_RED)
    tbox = s14.shapes.add_textbox(Inches(2.0), Inches(5.42), Inches(10.3), Inches(1.25))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🛡️ 3 NGUYÊN TẮC AN TOÀN BẮT BUỘC CỦA ADMINISTRATOR:"
    p.font.name = FONT_HEADING
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_RED
    p.space_after = Pt(2)
    
    p = tf.add_paragraph()
    p.text = "1. Không can thiệp chuyên môn: Admin tuyệt đối không sửa nội dung học liệu theo quy trình nghiệp vụ.\n2. Không xuất bản bài chưa duyệt: Chỉ Emergency Publish bài ĐÃ DUYỆT (APPROVED); tuyệt đối không có luồng IN_REVIEW → PUBLISHED.\n3. Bắt buộc kiểm toán: Mọi quyền Admin tạo tài khoản, đổi quyền, xuất bản khẩn cấp (kèm Justification) đều tự động ghi vào Audit Log."
    p.font.name = FONT_BODY
    p.font.size = Pt(8.8)
    p.font.color.rgb = C_DARK

    add_footer(s14, "* Nếu Moderator kiêm soạn bài thì cấm tự duyệt bài mình soạn. Operations Staff chỉ thao tác ở giai đoạn mở rộng (EXT-04).")

    # ==================== SLIDE 15: WORKFLOWS ====================
    s15 = prs.slides.add_slide(blank_layout)
    add_header(s15, "Quy trình nghiệp vụ hệ thống", "Hai luồng nghiệp vụ cốt lõi: Quản trị học liệu & Trải nghiệm người học", "Sự phối hợp chặt chẽ giữa đội ngũ nội dung và hành trình tiếp thu kiến thức của người học")
    
    # Left: Content Workflow
    add_card(s15, Inches(1.8), Inches(1.4), Inches(5.2), Inches(5.3), bg_color=C_WHITE, border_color=C_PURPLE)
    tbox = s15.shapes.add_textbox(Inches(2.0), Inches(1.5), Inches(4.8), Inches(5.1))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🔄 LUỒNG 1: QUẢN TRỊ HỌC LIỆU (CONTENT WORKFLOW)"
    p.font.name = FONT_HEADING
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_PURPLE
    p.space_after = Pt(6)
    
    p = tf.add_paragraph()
    p.text = "3 Làn phối hợp nhịp nhàng:"
    p.font.name = FONT_HEADING
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = C_NAVY
    p = tf.add_paragraph()
    p.text = "• Manager: Tạo Khóa học → Unit → Khung 4 bài → Task Spec 5 trường → Giao việc → Xuất bản.\n• Creator: Nhận bài → Nhập 8–10 từ → Tải 100% audio chuẩn → Soạn 5 bài tập có giải thích → Nộp duyệt.\n• Moderator: Nhận bài → Thẩm định 6 tiêu chí QC → Nghe 100% audio → Phê duyệt / Yêu cầu sửa."
    p.font.name = FONT_BODY
    p.font.size = Pt(9)
    p.font.color.rgb = C_DARK
    p.space_after = Pt(8)
    
    p = tf.add_paragraph()
    p.text = "Vòng đời 6 trạng thái bài học (Lifecycle):"
    p.font.name = FONT_HEADING
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = C_NAVY
    p = tf.add_paragraph()
    p.text = "Draft → In Review → Changes Requested ⇄ Approved → Published → Archived"
    p.font.name = FONT_BODY
    p.font.size = Pt(9)
    p.font.color.rgb = C_PURPLE
    p.space_after = Pt(8)
    
    p = tf.add_paragraph()
    p.text = "2 Ràng buộc kiểm soát chất lượng then chốt:"
    p.font.name = FONT_HEADING
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = C_NAVY
    p = tf.add_paragraph()
    p.text = "• Điều kiện Unit: Chỉ mở khóa khi đủ cả 4/4 bài học Đã xuất bản.\n• Clone-to-Draft: Sửa bài đang phát hành bằng bản thảo mới; bài cũ vẫn phục vụ học viên bình thường cho đến khi bản mới được duyệt và thay thế."
    p.font.name = FONT_BODY
    p.font.size = Pt(9)
    p.font.color.rgb = C_DARK

    # Right: Learner Journey
    add_card(s15, Inches(7.3), Inches(1.4), Inches(5.2), Inches(5.3), bg_color=C_WHITE, border_color=C_BLUE)
    tbox = s15.shapes.add_textbox(Inches(7.5), Inches(1.5), Inches(4.8), Inches(5.1))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🎓 LUỒNG 2: HÀNH TRÌNH NGƯỜI HỌC (LEARNER JOURNEY)"
    p.font.name = FONT_HEADING
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p.space_after = Pt(6)
    
    steps = [
        ("1. Khởi đầu & Xếp lớp:", "Đăng nhập, chọn ngôn ngữ đích (English A1 pilot) → Làm Placement Test 30 câu (được xếp Unit tương ứng) hoặc bấm 'Bỏ qua' để học từ Unit 1."),
        ("2. Tiếp thu kiến thức vi mô:", "Mở bài học trong Unit đã mở khóa (đủ 4 bài published): học 8–10 từ mới, nghe 100% audio chuẩn bản xứ, đọc câu ví dụ ngữ cảnh."),
        ("3. Luyện tập phản xạ 2 vòng:", "• Vòng 1: Làm 5 câu bài tập thuộc 5 dạng chuẩn (nhận phản hồi và giải thích tại chỗ).\n• Vòng 2: Gom các câu trả lời sai làm lại ở cuối bài (Controlled Retry ~10%)."),
        ("4. Ghi nhận thành tích & Động lực:", "Hoàn thành bài học mở khóa bài kế tiếp; cộng dồn chuỗi Streak trong ngày theo múi giờ địa phương (đứt về 1, không đóng băng ở MVP)."),
        ("5. Ôn tập ngắt quãng tự động (SRS):", "Từ mới tự động nạp vào kho thẻ nhớ; mỗi ngày hệ thống lọc từ đến hạn ôn theo chu kỳ cố định: 1 → 3 → 7 → 14 → 30 ngày để học viên lật thẻ ôn tập."),
    ]
    for st_title, st_desc in steps:
        p = tf.add_paragraph()
        p.text = st_title
        p.font.name = FONT_HEADING
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = C_NAVY
        p = tf.add_paragraph()
        p.text = st_desc
        p.font.name = FONT_BODY
        p.font.size = Pt(8.8)
        p.font.color.rgb = C_DARK
        p.space_after = Pt(4)

    add_footer(s15, "Thông điệp: Bài học đang phát hành không bị sửa trực tiếp; người học trải qua chu trình học tập và ôn tập khép kín.")

    # ==================== SLIDE 16: USE CASE MODEL (CORRECTED) ====================
    s16 = prs.slides.add_slide(blank_layout)
    add_header(s16, "Mô hình hóa Use Case hệ thống", "Mô hình Use Case: 14 Core Use Cases & 1 Phân hệ mở rộng", "Chuẩn hóa đúng 15 Canonical Use Cases (UC-01 đến UC-15) phân định theo 3 phân hệ nghiệp vụ")
    
    add_card(s16, Inches(1.8), Inches(1.4), Inches(10.7), Inches(5.3), bg_color=C_WHITE, border_color=C_BORDER)
    
    t_shape = s16.shapes.add_table(16, 6, Inches(1.9), Inches(1.48), Inches(10.5), Inches(5.1))
    table = t_shape.table
    table.columns[0].width = Inches(0.8)  # Mã UC
    table.columns[1].width = Inches(2.9)  # Tên Use Case
    table.columns[2].width = Inches(2.0)  # Tác nhân chính
    table.columns[3].width = Inches(1.3)  # Phân hệ
    table.columns[4].width = Inches(1.8)  # MVP Functions
    table.columns[5].width = Inches(1.7)  # YC Hệ thống
    
    uc_headers = ["Mã UC", "Tên Use Case chuẩn", "Tác nhân chính", "Phân hệ", "Chức năng MVP", "Yêu cầu hệ thống"]
    for c_idx, h in enumerate(uc_headers):
        cell = table.cell(0, c_idx)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_NAVY
        for p in cell.text_frame.paragraphs:
            p.font.name = FONT_HEADING
            p.font.size = Pt(9.5)
            p.font.bold = True
            p.font.color.rgb = C_WHITE
            p.alignment = PP_ALIGN.CENTER if c_idx in [0, 3] else PP_ALIGN.LEFT
            
    # EXACT 15 CANONICAL USE CASES
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
        ("UC-15", "[OPTIONAL B2B] Manage Cohorts", "Organizational Manager", "Cohort B2B", "MVP-17", "Phân hệ Cohort B2B"),
    ]
    for r_idx, (uid, uname, uact, upkg, umvp, ureq) in enumerate(uc_rows):
        r = r_idx + 1
        for c_idx, val in enumerate([uid, uname, uact, upkg, umvp, ureq]):
            cell = table.cell(r, c_idx)
            cell.text = val
            for p in cell.text_frame.paragraphs:
                p.font.name = FONT_BODY
                p.font.size = Pt(8.5)
                p.font.color.rgb = C_DARK
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
                elif c_idx == 3:
                    p.alignment = PP_ALIGN.CENTER

    add_footer(s16, "Danh mục chuẩn hóa trọn vẹn 15 Canonical Use Cases (UC-01 đến UC-15), đảm bảo tính phân quyền SoD và tính truy vết hệ thống.")

    # ==================== SLIDE 17: CONCLUSION ====================
    s17 = prs.slides.add_slide(blank_layout)
    add_header(s17, "Hiện trạng & Định hướng", "Kết quả nghiên cứu, hiện trạng hệ thống và định hướng phát triển", "Tổng kết kết quả đặc tả, hiện trạng triển khai kỹ thuật và ranh giới liêm chính học thuật")
    
    concl_blocks = [
        ("1. KẾT QUẢ ĐẶC TẢ YÊU CẦU", C_BLUE, [
            ("Cơ sở thực nghiệm vững chắc", "Bộ yêu cầu được xây dựng từ bằng chứng đa nguồn: N=15 khảo sát gốc, N=35 khảo sát bổ sung, N=3 phỏng vấn định tính, 7 chuyên gia và 3 Nghị định pháp lý."),
            ("Mô hình quản trị chặt chẽ", "Chuẩn hóa 6 vai trò độc lập, ma trận SoD chống gian lận học liệu, quy trình kiểm soát 6 trạng thái và cơ chế Clone-to-Draft."),
            ("Đặc tả chức năng toàn diện", "12 CORE (Must) + 8 EXT (Should/Could) ánh xạ nhất quán sang 15 Canonical Use Cases và 19 chức năng MVP."),
        ]),
        ("2. HIỆN TRẠNG KỸ THUẬT LINGORA", C_PURPLE, [
            ("Phase 0 — Đặc tả & Phân tích", "Đã HOÀN TẤT và được kiểm chứng độc lập (Pass toàn bộ Verification Gates về bằng chứng và truy vết)."),
            ("Milestone M1 — Nền tảng Core", "Đã HOÀN TẤT xác thực an toàn (Next.js 15 SSR Auth, Supabase GoTrue), cơ sở dữ liệu PostgreSQL RLS, Prisma ORM và API Skeleton."),
            ("Milestone M2 — Kế hoạch tiếp theo", "Sẵn sàng triển khai Web Core Lesson Flow và công cụ bài tập tương tác 5 dạng chuẩn."),
        ]),
        ("3. GIỚI HẠN & LIÊM CHÍNH", C_ORANGE, [
            ("Quy mô mẫu nghiên cứu", "Khảo sát N=15 và N=35 là mẫu sơ bộ thuận tiện; phỏng vấn N=3 là nghiên cứu định tính khám phá; nhóm cam kết không suy rộng thống kê."),
            ("Chỉ số phi chức năng NFR", "Các mục tiêu (<1s, ≤3s, 99.5%) là ngưỡng kỹ thuật đề xuất, sẽ được đo kiểm chính xác bằng công cụ chuyên dụng khi nghiệm thu."),
            ("Thông điệp cốt lõi", "Lingora là nền tảng vận hành học liệu có kiểm soát, giải quyết thực chất bài toán duy trì kỷ luật và ghi nhớ."),
        ]),
    ]
    for i, (b_title, b_col, b_items) in enumerate(concl_blocks):
        left_pos = Inches(1.8 + i * 3.65)
        add_card(s17, left_pos, Inches(1.4), Inches(3.45), Inches(5.3), bg_color=C_WHITE, border_color=b_col)
        tbox = s17.shapes.add_textbox(left_pos + Inches(0.18), Inches(1.55), Inches(3.09), Inches(5.0))
        tf = tbox.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = b_title
        p.font.name = FONT_HEADING
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = b_col
        p.space_after = Pt(10)
        
        for it_h, it_b in b_items:
            p = tf.add_paragraph()
            p.text = f"✔ {it_h}:"
            p.font.name = FONT_HEADING
            p.font.size = Pt(9.5)
            p.font.bold = True
            p.font.color.rgb = C_NAVY
            p = tf.add_paragraph()
            p.text = it_b
            p.font.name = FONT_BODY
            p.font.size = Pt(8.8)
            p.font.color.rgb = C_DARK
            p.space_after = Pt(8)

    add_footer(s17, "Cảm ơn Quý Thầy/Cô và các bạn đã lắng nghe! — HỘI ĐỒNG TRAO ĐỔI & CÂU HỎI (Q&A)")

    # Save outputs
    out_report = 'docs/report/Lingora-Project-1-Requirements-Presentation.pptx'
    out_p1 = 'docs/project-1/Lingora-Project-1-Requirements-Presentation.pptx'
    
    prs.save(out_report)
    shutil.copyfile(out_report, out_p1)
    print(f'Successfully built 17 slides in:\n  -> {out_report}\n  -> {out_p1}')

build_full_deck()
