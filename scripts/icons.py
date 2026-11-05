"""Genera los iconos de la app a partir de una foto.

Uso: python3 scripts/icons.py <imagen_origen> <carpeta_salida>
Ejemplo: python3 scripts/icons.py scripts/icon-source.jpg public
"""
from PIL import Image
import sys

# Recorte cuadrado (izq, arriba, lado) sobre la imagen original de 1105x1293:
# encuadra al gato y deja el dinero a la derecha.
CROP = (0, 110, 1000)
BG = (14, 17, 23)


def square(src):
    x, y, s = CROP
    return src.crop((x, y, x + s, y + s))


def icon(base, size, pad_ratio, path):
    if pad_ratio == 0:
        im = base.resize((size, size), Image.LANCZOS)
    else:
        # Versión "maskable": la foto se reduce dentro de la zona segura.
        im = Image.new('RGB', (size, size), BG)
        inner = int(size * (1 - 2 * pad_ratio))
        off = (size - inner) // 2
        im.paste(base.resize((inner, inner), Image.LANCZOS), (off, off))
    im.save(path, optimize=True)


src = Image.open(sys.argv[1]).convert('RGB')
out = sys.argv[2]
base = square(src)
icon(base, 180, 0, f'{out}/apple-touch-icon.png')
icon(base, 192, 0, f'{out}/icon-192.png')
icon(base, 512, 0, f'{out}/icon-512.png')
icon(base, 512, 0, f'{out}/icon-maskable-512.png')
