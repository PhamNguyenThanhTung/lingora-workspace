import win32com.client
import os

pptx_abs = os.path.abspath(r"docs/diagrams/lingora-modeling/deck/Lingora-System-Modeling-Presentation-v13.pptx")
out_dir = os.path.abspath(r"scratch/slides_export")
os.makedirs(out_dir, exist_ok=True)

powerpoint = win32com.client.Dispatch("PowerPoint.Application")
# don't make it visible if not necessary, but PowerPoint might require it or run fine in background
prs = powerpoint.Presentations.Open(pptx_abs, WithWindow=False)

slide_numbers = [7, 11, 14, 15]
for sn in slide_numbers:
    slide = prs.Slides(sn)
    export_path = os.path.join(out_dir, f"Slide_{sn}.png")
    slide.Export(export_path, "PNG", 1920, 1080)
    print(f"Exported Slide {sn} to {export_path}")

prs.Close()
powerpoint.Quit()
print("Done exporting slides!")
