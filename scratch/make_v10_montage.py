import os
from PIL import Image

def make_montage(img_dir, output_file, cols=5, rows=4):
    files = [f"Slide{i}.JPG" for i in range(1, 18)]
    images = []
    for f in files:
        p = os.path.join(img_dir, f)
        if os.path.exists(p):
            images.append(Image.open(p))
        else:
            print(f"Missing {p}")
            return
            
    target_w = 480
    target_h = int(480 * (7.5 / 13.333)) # 270
    
    resized = [im.resize((target_w, target_h), Image.Resampling.LANCZOS) for im in images]
    
    gap = 15
    montage_w = cols * target_w + (cols + 1) * gap
    montage_h = rows * target_h + (rows + 1) * gap
    
    montage = Image.new("RGB", (montage_w, montage_h), (240, 242, 245))
    
    for idx, im in enumerate(resized):
        r = idx // cols
        c = idx % cols
        x = gap + c * (target_w + gap)
        y = gap + r * (target_h + gap)
        montage.paste(im, (x, y))
        
    montage.save(output_file, quality=92)
    print(f"Montage saved to: {output_file}")

if __name__ == "__main__":
    make_montage(
        "docs/diagrams/lingora-modeling/deck/slides_v10_png",
        "docs/diagrams/lingora-modeling/deck/montage_v10.jpg"
    )
