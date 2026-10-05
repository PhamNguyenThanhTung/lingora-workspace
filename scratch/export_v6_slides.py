import comtypes.client
import os

ppt_path = os.path.abspath("docs/diagrams/lingora-modeling/deck/Lingora-System-Modeling-Presentation-v6.pptx")
out_dir = os.path.abspath("docs/diagrams/lingora-modeling/deck/slides_v6_png")
os.makedirs(out_dir, exist_ok=True)

ppt_app = comtypes.client.CreateObject("PowerPoint.Application")
pres = ppt_app.Presentations.Open(ppt_path, WithWindow=False)

print(f"Total slides in Deck v6: {pres.Slides.Count}")
for s_num in range(1, pres.Slides.Count + 1):
    slide = pres.Slides(s_num)
    out_file = os.path.join(out_dir, f"slide_{s_num:02d}.png")
    slide.Export(out_file, "PNG", 1920, 1080)
    print(f"Exported slide {s_num:02d} to {out_file}")

pres.Close()
ppt_app.Quit()
print("Done exporting all Deck v6 slides to PNG!")
