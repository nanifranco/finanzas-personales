from PIL import Image, ImageDraw
import sys
def icon(size, pad_ratio, path):
    S = size*4
    im = Image.new('RGB', (S, S), (14,17,23))
    d = ImageDraw.Draw(im)
    pad = S*pad_ratio
    box = [pad, pad, S-pad, S-pad]
    w = int((S-2*pad)*0.16)
    d.ellipse(box, outline=(35,41,55), width=w)
    segs = [(-90, 40, (201,167,255)), (48, 150, (234,213,124)), (158, 228, (121,215,181))]
    for a, b, col in segs:
        d.arc(box, a, b, fill=col, width=w)
    im = im.resize((size, size), Image.LANCZOS)
    im.save(path)
out = sys.argv[1]
icon(180, 0.2, f'{out}/apple-touch-icon.png')
icon(192, 0.2, f'{out}/icon-192.png')
icon(512, 0.2, f'{out}/icon-512.png')
icon(512, 0.28, f'{out}/icon-maskable-512.png')
