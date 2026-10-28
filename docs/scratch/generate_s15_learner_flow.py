# -*- coding: utf-8 -*-
"""
Generate modernized Learner Daily Routine & SRS Interleaving Flow for Slide 15
Feedback-driven:
- Onboarding (Goals & Placement Test) is 1-time setup, not daily.
- Daily Routine (Duolingo style): Login & open current lesson -> Micro-learning (5-10m) 
  -> Controlled retry on mistakes -> SRS Interleaving (inserting questions from due past lessons) 
  -> Update Streak & schedule next SRS intervals.
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Fonts
matplotlib.rcParams['font.sans-serif'] = ['Segoe UI', 'Arial', 'DejaVu Sans']
matplotlib.rcParams['font.family'] = 'sans-serif'

def generate_learner_flow():
    fig, ax = plt.subplots(figsize=(15.6, 3.2), facecolor='white', dpi=250)
    ax.set_xlim(0, 15.6)
    ax.set_ylim(0, 3.2)
    ax.axis('off')

    # Top indicator banner: Distinction between Onboarding (1-time) vs Daily Loop
    onboard_rect = patches.FancyBboxPatch((0.4, 2.65), 3.4, 0.45,
                                          boxstyle="round,pad=0.04,rounding_size=0.08",
                                          facecolor="#F1F5F9", edgecolor="#94A3B8", linewidth=1.2, linestyle=':')
    ax.add_patch(onboard_rect)
    ax.text(2.1, 2.87, "KHỞI TẠO BAN ĐẦU (1 LẦN DUY NHẤT)", ha='center', va='center',
            fontsize=8.2, fontweight='bold', color="#475569")
    ax.text(2.1, 2.73, "Đặt mục tiêu ngày & Làm bài xếp lớp 30 câu (hoặc bắt đầu bài 1)",
            ha='center', va='center', fontsize=7.2, color="#64748B")

    # Connector arrow from Onboarding to Step 1
    ax.annotate('', xy=(1.55, 2.38), xytext=(2.1, 2.65),
                arrowprops=dict(arrowstyle="->", color="#94A3B8", lw=1.2, linestyle=':'))

    # Daily Routine Banner
    loop_rect = patches.FancyBboxPatch((4.2, 2.65), 11.0, 0.45,
                                       boxstyle="round,pad=0.04,rounding_size=0.08",
                                       facecolor="#EFF6FF", edgecolor="#3B82F6", linewidth=1.2)
    ax.add_patch(loop_rect)
    ax.text(9.7, 2.87, "VÒNG LẶP HỌC TẬP & ÔN TẬP HÀNG NGÀY (DAILY LEARNER ROUTINE & SRS INTERLEAVING)",
            ha='center', va='center', fontsize=8.5, fontweight='bold', color="#1D4ED8")
    ax.text(9.7, 2.73, "Cơ chế đan xen bài mới và câu ôn bài cũ theo chuẩn khoa học nhận thức (Spaced Retrieval Practice)",
            ha='center', va='center', fontsize=7.2, color="#2563EB")

    # 5 Daily Step Cards
    steps = [
        {
            "num": "1. ĐĂNG NHẬP & VÀO BÀI",
            "tag": "BẮT ĐẦU PHIÊN",
            "desc": "Mở ngay bài học hiện tại\ntrên lộ trình (hoặc nhận\nnhắc nhở In-app khung giờ)",
            "col_border": "#2563EB",
            "col_bg": "#F8FAFC",
            "col_title": "#1D4ED8"
        },
        {
            "num": "2. HỌC BÀI VI MÔ (5-10p)",
            "tag": "BÀI HỌC CỐT LÕI",
            "desc": "Thực hành 5 dạng tương tác\n(Nghe audio chuẩn, MCQ,\nĐiền từ, Sắp xếp, Ngữ pháp)",
            "col_border": "#059669",
            "col_bg": "#F0FDF4",
            "col_title": "#047857"
        },
        {
            "num": "3. SỬA LỖI CUỐI BÀI",
            "tag": "CONTROLLED RETRY",
            "desc": "Làm lại các câu sai trong bài\n(tối đa 10% số câu) kèm giải\nthích tức thời, củng cố nhớ",
            "col_border": "#D97706",
            "col_bg": "#FFFBEB",
            "col_title": "#B45309"
        },
        {
            "num": "4. ĐAN XEN ÔN SRS",
            "tag": "SPACED INTERLEAVING",
            "desc": "Hệ thống nhét thêm câu hỏi\ntừ các bài cũ đến hạn chu kỳ\n(mốc 1-3-7-14-30 ngày)",
            "col_border": "#7C3AED",
            "col_bg": "#F5F3FF",
            "col_title": "#6D28D9"
        },
        {
            "num": "5. STREAK & LỊCH ÔN",
            "tag": "TÍCH LŨY TIẾN ĐỘ",
            "desc": "Cộng chuỗi ngày học Streak,\nlưu điểm tiến độ và tự động\nxếp lịch ôn tập chu kỳ tới",
            "col_border": "#DB2777",
            "col_bg": "#FDF2F8",
            "col_title": "#BE185D"
        }
    ]

    card_w = 2.65
    card_h = 2.05
    card_y = 0.25
    spacing = 0.38
    start_x = 0.4

    for i, s in enumerate(steps):
        cx = start_x + i * (card_w + spacing)
        
        # Card background
        card = patches.FancyBboxPatch((cx, card_y), card_w, card_h,
                                      boxstyle="round,pad=0.03,rounding_size=0.12",
                                      facecolor=s["col_bg"], edgecolor=s["col_border"],
                                      linewidth=1.8, zorder=2)
        ax.add_patch(card)

        # Header accent band
        band = patches.FancyBboxPatch((cx + 0.08, card_y + card_h - 0.42), card_w - 0.16, 0.34,
                                      boxstyle="round,pad=0.02,rounding_size=0.06",
                                      facecolor=s["col_border"], edgecolor='none', zorder=3)
        ax.add_patch(band)
        
        # Header text
        ax.text(cx + card_w / 2, card_y + card_h - 0.25, s["num"],
                ha='center', va='center', fontsize=8.3, fontweight='bold', color='white', zorder=4)

        # Sub-badge
        tag_box = patches.FancyBboxPatch((cx + 0.25, card_y + card_h - 0.72), card_w - 0.5, 0.22,
                                         boxstyle="round,pad=0.02,rounding_size=0.05",
                                         facecolor='white', edgecolor=s["col_border"], linewidth=0.9, zorder=3)
        ax.add_patch(tag_box)
        ax.text(cx + card_w / 2, card_y + card_h - 0.61, s["tag"],
                ha='center', va='center', fontsize=7.2, fontweight='bold', color=s["col_title"], zorder=4)

        # Description text
        ax.text(cx + card_w / 2, card_y + 0.65, s["desc"],
                ha='center', va='center', fontsize=8.0, color="#1E293B", linespacing=1.28, zorder=4)

        # Forward connecting arrow (between cards)
        if i < len(steps) - 1:
            ax.annotate('', xy=(cx + card_w + spacing - 0.05, card_y + card_h / 2),
                        xytext=(cx + card_w + 0.05, card_y + card_h / 2),
                        arrowprops=dict(arrowstyle="-|>", color="#334155", lw=2.0, mutation_scale=14),
                        zorder=5)

    plt.tight_layout(pad=0.1)
    out_path = "docs/scratch/assets/s15_learner_flow.png"
    plt.savefig(out_path, dpi=250, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"Generated {out_path} successfully!")

if __name__ == "__main__":
    generate_learner_flow()
