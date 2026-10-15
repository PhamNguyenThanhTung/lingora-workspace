import zlib
import urllib.request
import sys

def plantuml_encode(text):
    zlibbed = zlib.compress(text.encode('utf-8'))
    compressed = zlibbed[2:-4]
    mapping = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'
    def encode3bytes(b1, b2, b3):
        c1 = b1 >> 2
        c2 = ((b1 & 0x3) << 4) | (b2 >> 4)
        c3 = ((b2 & 0xF) << 2) | (b3 >> 6)
        c4 = b3 & 0x3F
        return mapping[c1 & 0x3F] + mapping[c2 & 0x3F] + mapping[c3 & 0x3F] + mapping[c4 & 0x3F]
    res = ''
    for i in range(0, len(compressed), 3):
        b1 = compressed[i]
        b2 = compressed[i+1] if i+1 < len(compressed) else 0
        b3 = compressed[i+2] if i+2 < len(compressed) else 0
        res += encode3bytes(b1, b2, b3)
    return res

def render(puml_file, out_png):
    with open(puml_file, 'r', encoding='utf-8') as f:
        text = f.read()
    encoded = plantuml_encode(text)
    url = 'https://www.plantuml.com/plantuml/png/' + encoded
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp, open(out_png, 'wb') as f:
        f.write(resp.read())
    print(f'Rendered {puml_file} -> {out_png}')

if __name__ == '__main__':
    puml = sys.argv[1] if len(sys.argv) > 1 else 'docs/plantuml/uc-general.puml'
    out = sys.argv[2] if len(sys.argv) > 2 else 'docs/plantuml/uc-general.png'
    render(puml, out)
