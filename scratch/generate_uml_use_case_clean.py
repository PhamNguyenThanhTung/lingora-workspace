# -*- coding: utf-8 -*-
"""
Generate Clean, Academic UML Use Case Diagram for 14 Core Functions
Constraint: Strict Black & White / Dark Navy Academic UML styling, NO flashy/rainbow colors.
Actors:
- Learner (Left)
- Lesson Creator, Moderator, Org Manager, Administrator, Operations Staff (Right)
Packages:
- Core Learning (UC-01 to UC-07)
- Content Workflow (UC-08 to UC-10, SoD principle: Creator != Moderator)
- Administration & Operations (UC-11 to UC-14)
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Fonts
matplotlib.rcParams['font.sans-serif'] = ['Segoe UI', 'Arial', 'DejaVu Sans']
matplotlib.rcParams['font.family'] = 'sans-serif'

def draw_stick_actor(ax, x, y, name, subname=""):
    # Head
    head = patches.Circle((x, y + 0.38), 0.15, facecolor='white', edgecolor='#0F172A', linewidth=1.8, zorder=5)
    ax.add_patch(head)
    # Body
    ax.plot([x, x], [y + 0.23, y - 0.04], color='#0F172A', lw=1.8, zorder=5)
    # Arms
    ax.plot([x - 0.20, x + 0.20], [y + 0.12, y + 0.12], color='#0F172A', lw=1.8, zorder=5)
    # Legs
    ax.plot([x, x - 0.18], [y - 0.04, y - 0.34], color='#0F172A', lw=1.8, zorder=5)
    ax.plot([x, x + 0.18], [y - 0.04, y - 0.34], color='#0F172A', lw=1.8, zorder=5)
    # Label
    ax.text(x, y - 0.48, name, ha='center', va='top', fontsize=9.5, fontweight='bold', color='#0F172A', zorder=6)
    if subname:
        ax.text(x, y - 0.64, subname, ha='center', va='top', fontsize=8.0, color='#475569', zorder=6)

def draw_use_case_oval(ax, x, y, code, title, width=2.4, height=0.68):
    oval = patches.Ellipse((x, y), width, height, facecolor='#FFFFFF', edgecolor='#0F172A', linewidth=1.5, zorder=3)
    ax.add_patch(oval)
    ax.text(x, y + 0.12, code, ha='center', va='center', fontsize=8.8, fontweight='bold', color='#0F172A', zorder=4)
    ax.text(x, y - 0.12, title, ha='center', va='center', fontsize=7.8, color='#1E293B', zorder=4)

def generate_uml_diagram():
    fig, ax = plt.subplots(figsize=(15.2, 8.4), facecolor='white', dpi=250)
    ax.set_xlim(0, 15.2)
    ax.set_ylim(0, 8.4)
    ax.axis('off')

    # System Boundary (Standard UML Rectangle)
    sys_box = patches.Rectangle((2.6, 0.4), 9.8, 7.5, facecolor='none', edgecolor='#0F172A', linewidth=2.0)
    ax.add_patch(sys_box)
    ax.text(7.5, 7.62, 'Hệ thống Lingora (Lingora Web Learning System)', 
            ha='center', va='center', fontsize=12.5, fontweight='bold', color='#0F172A')

    # Packages (Standard UML Folders / Packages with clean dashed borders)
    # 1. Core Learning
    pkg1 = patches.Rectangle((2.8, 0.6), 4.6, 6.7, facecolor='none', edgecolor='#64748B', linewidth=1.1, linestyle='--')
    ax.add_patch(pkg1)
    ax.text(5.1, 7.08, 'Package: Core Learning (Học tập)', ha='center', va='center', fontsize=9.5, fontweight='bold', color='#334155')

    # 2. Content Workflow
    pkg2 = patches.Rectangle((7.6, 3.9), 4.6, 3.4, facecolor='none', edgecolor='#64748B', linewidth=1.1, linestyle='--')
    ax.add_patch(pkg2)
    ax.text(9.9, 7.08, 'Package: Content Workflow (Học liệu)', ha='center', va='center', fontsize=9.5, fontweight='bold', color='#334155')

    # 3. Administration & Operations
    pkg3 = patches.Rectangle((7.6, 0.6), 4.6, 3.1, facecolor='none', edgecolor='#64748B', linewidth=1.1, linestyle='--')
    ax.add_patch(pkg3)
    ax.text(9.9, 3.48, 'Package: Administration & Operations (Quản trị & Vận hành)', ha='center', va='center', fontsize=9.0, fontweight='bold', color='#334155')

    # Actors
    # Left: Learner
    draw_stick_actor(ax, 1.3, 3.8, 'Learner', '(Người học)')

    # Right Actors
    draw_stick_actor(ax, 13.8, 7.0, 'Lesson Creator', '(Biên soạn)')
    draw_stick_actor(ax, 13.8, 5.5, 'Moderator', '(Kiểm duyệt)')
    draw_stick_actor(ax, 13.8, 4.0, 'Org Manager', '(Quản lý đào tạo)')
    draw_stick_actor(ax, 13.8, 2.3, 'Administrator', '(Quản trị hệ thống)')
    draw_stick_actor(ax, 13.8, 0.9, 'Operations Staff', '(Vận hành)')

    # --- USE CASES ---
    # Package 1: Core Learning
    draw_use_case_oval(ax, 4.3, 6.5, 'UC-01', 'Authenticate & Manage Session', width=2.5, height=0.62)
    draw_use_case_oval(ax, 4.3, 5.6, 'UC-02', 'Configure Goals & Study Time', width=2.5, height=0.62)
    draw_use_case_oval(ax, 4.3, 4.7, 'UC-03', 'Take Placement Test (30 câu)', width=2.5, height=0.62)
    draw_use_case_oval(ax, 4.3, 3.8, 'UC-04', 'Browse Learning Path', width=2.5, height=0.62)
    draw_use_case_oval(ax, 3.9, 2.7, 'UC-05', 'Complete Lesson Exercises', width=2.0, height=0.62)
    draw_use_case_oval(ax, 3.9, 1.4, 'UC-06', 'Spaced Repetition Review (SRS)', width=2.0, height=0.62)
    draw_use_case_oval(ax, 6.4, 2.05, 'UC-07', 'Track Progress & Streak', width=2.0, height=0.62)

    # Package 2: Content Workflow
    draw_use_case_oval(ax, 9.9, 6.35, 'UC-08', 'Create & Edit Lesson Draft', width=2.7, height=0.65)
    draw_use_case_oval(ax, 9.9, 5.25, 'UC-09', 'Review & Approve Content', width=2.7, height=0.65)
    draw_use_case_oval(ax, 9.9, 4.30, 'UC-10', 'Publish Approved Content', width=2.7, height=0.65)

    # SoD Principle Note between UC-08 and UC-09
    sod_note = patches.FancyBboxPatch((7.8, 5.6), 1.6, 0.45, boxstyle="square,pad=0.04",
                                      facecolor='#F8FAFC', edgecolor='#64748B', linewidth=1.0, linestyle=':')
    ax.add_patch(sod_note)
    ax.text(8.6, 5.88, 'Nguyên tắc SoD:', ha='center', va='center', fontsize=7.8, fontweight='bold', color='#1E293B')
    ax.text(8.6, 5.72, '{Creator != Moderator}', ha='center', va='center', fontsize=7.2, color='#475569')
    # Link from note to UC-09
    ax.plot([8.6, 9.0], [5.6, 5.35], color='#64748B', lw=1.0, linestyle=':')

    # Package 3: Admin & Operations
    draw_use_case_oval(ax, 8.7, 2.6, 'UC-11', 'Manage Accounts & Roles', width=2.0, height=0.62)
    draw_use_case_oval(ax, 11.1, 2.6, 'UC-12', 'View System Reports', width=2.0, height=0.62)
    draw_use_case_oval(ax, 8.7, 1.25, 'UC-13', 'View & Audit Security Logs', width=2.0, height=0.62)
    draw_use_case_oval(ax, 11.1, 1.25, 'UC-14', 'Handle Support Tickets', width=2.0, height=0.62)

    # --- ASSOCIATIONS (Solid Lines) ---
    line_kw = dict(color='#0F172A', lw=1.3, zorder=2)

    # Learner connections
    ax.plot([1.45, 3.05], [3.8, 6.5], **line_kw)  # to UC-01
    ax.plot([1.45, 3.05], [3.8, 5.6], **line_kw)  # to UC-02
    ax.plot([1.45, 3.05], [3.8, 4.7], **line_kw)  # to UC-03
    ax.plot([1.45, 3.05], [3.8, 3.8], **line_kw)  # to UC-04
    ax.plot([1.45, 2.90], [3.8, 2.7], **line_kw)  # to UC-05
    ax.plot([1.45, 2.90], [3.8, 1.4], **line_kw)  # to UC-06

    # Include relationships: UC-05 -> UC-07, UC-06 -> UC-07
    # UC-05 to UC-07
    ax.annotate('', xy=(5.45, 2.25), xytext=(4.85, 2.52),
                arrowprops=dict(arrowstyle="->", color="#0F172A", lw=1.3, linestyle='--'), zorder=4)
    # «include» text with white background box to avoid any clipping
    ax.text(5.15, 2.50, '«include»', ha='center', va='center', fontsize=7.2, fontstyle='italic',
            color='#0F172A', bbox=dict(boxstyle='square,pad=0.1', facecolor='white', edgecolor='none'), zorder=5)

    # UC-06 to UC-07
    ax.annotate('', xy=(5.45, 1.85), xytext=(4.85, 1.58),
                arrowprops=dict(arrowstyle="->", color="#0F172A", lw=1.3, linestyle='--'), zorder=4)
    ax.text(5.15, 1.62, '«include»', ha='center', va='center', fontsize=7.2, fontstyle='italic',
            color='#0F172A', bbox=dict(boxstyle='square,pad=0.1', facecolor='white', edgecolor='none'), zorder=5)

    # Right Actor connections
    ax.plot([13.6, 11.25], [7.0, 6.35], **line_kw)   # Creator -> UC-08
    ax.plot([13.6, 11.25], [5.5, 5.25], **line_kw)   # Moderator -> UC-09
    ax.plot([13.6, 11.25], [4.0, 4.30], **line_kw)   # Org Manager -> UC-10

    # Admin connections
    ax.plot([13.6, 9.7], [2.3, 2.6], **line_kw)      # Admin -> UC-11
    ax.plot([13.6, 12.1], [2.3, 2.6], **line_kw)     # Admin -> UC-12
    ax.plot([13.6, 9.7], [2.3, 1.25], **line_kw)     # Admin -> UC-13

    # Admin to UC-01 (Session / Auth) - Dashdot line
    ax.plot([13.6, 5.55], [2.3, 6.5], color='#475569', lw=1.1, linestyle='-.', zorder=2)

    # Operations Staff -> UC-14
    ax.plot([13.6, 12.1], [0.9, 1.25], **line_kw)

    plt.tight_layout(pad=0.1)
    out_path = "scratch/assets/s16_uml_use_case_clean.png"
    plt.savefig(out_path, dpi=250, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"Generated {out_path} successfully!")

if __name__ == "__main__":
    generate_uml_diagram()