import win32com.client
import os

ppt_path = os.path.abspath("docs/project-1/Lingora-Project-1-Requirements-Presentation.pptx")
out_dir = os.path.abspath("scratch/exported_v3")
os.makedirs(out_dir, exist_ok=True)

ppt_app = win32com.client.Dispatch("PowerPoint.Application")
# ppt_app.Visible = 1
pres = ppt_app.Presentations.Open(ppt_path, WithWindow=False)

print(f"Total slides: {pres.Slides.Count}")
for s_num in [15, 16, 17, 18]:
    if s_num <= pres.Slides.Count:
        slide = pres.Slides(s_num)
        out_file = os.path.join(out_dir, f"slide_{s_num}.png")
        slide.Export(out_file, "PNG", 1920, 1080)
        print(f"Exported slide {s_num} to {out_file}")

pres.Close()
print("Done exporting slides!")
