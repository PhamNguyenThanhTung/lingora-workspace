from PIL import Image

imgs = {
    'Slide 7 (05b-activity-placement-branches.png)': 'docs/diagrams/lingora-modeling/out/05b-activity-placement-branches.png',
    'Slide 11 (07b-activity-jump-result.png)': 'docs/diagrams/lingora-modeling/out/07b-activity-jump-result.png',
    'Slide 14 (09-class-content.png)': 'docs/diagrams/lingora-modeling/out/09-class-content.png',
    'Slide 15 (10-class-learner-assessment.png)': 'docs/diagrams/lingora-modeling/out/10-class-learner-assessment.png'
}

max_w = 11.733

for name, path in imgs.items():
    im = Image.open(path)
    w_px, h_px = im.size
    orig_ratio = w_px / h_px
    max_h = 4.9 if ('Slide 7' in name or 'Slide 11' in name) else 4.8
    h_fit = max_h
    w_fit = h_fit * orig_ratio
    if w_fit > max_w:
        w_fit = max_w
        h_fit = w_fit / orig_ratio
    
    left = 0.800 + (max_w - w_fit) / 2
    top = 1.250 + (max_h - h_fit) / 2
    placed_ratio = w_fit / h_fit
    diff = abs(placed_ratio - orig_ratio) / orig_ratio * 100
    print(f'{name}:')
    print(f'  px: {w_px}x{h_px}, orig_ratio: {orig_ratio:.4f}')
    print(f'  placed: w={w_fit:.3f}\", h={h_fit:.3f}\", left={left:.3f}\", top={top:.3f}\"')
    print(f'  placed_ratio: {placed_ratio:.4f}, error: {diff:.4f}%\n')
