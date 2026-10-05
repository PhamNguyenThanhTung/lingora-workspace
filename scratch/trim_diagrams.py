import os
from PIL import Image, ImageChops

def trim_image(im):
    # If image has an alpha channel, use alpha for bounding box, or background color
    bg = Image.new(im.mode, im.size, (255, 255, 255))
    diff = ImageChops.difference(im, bg)
    bbox = diff.getbbox()
    if bbox:
        # Add a tiny 10px margin around bbox
        pad = 10
        w, h = im.size
        left = max(0, bbox[0] - pad)
        top = max(0, bbox[1] - pad)
        right = min(w, bbox[2] + pad)
        bottom = min(h, bbox[3] + pad)
        return im.crop((left, top, right, bottom))
    return im

out_dir = "docs/diagrams/lingora-modeling/out"
for fname in os.listdir(out_dir):
    if fname.endswith(".png") and not fname.startswith("_") and fname != "smoke.png":
        fpath = os.path.join(out_dir, fname)
        with Image.open(fpath) as img:
            img_rgb = img.convert("RGB")
            trimmed = trim_image(img_rgb)
            trimmed.save(fpath, "PNG")
            print(f"Trimmed {fname}: original {img.size} -> trimmed {trimmed.size}")
