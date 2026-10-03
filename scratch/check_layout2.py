import zipfile, re, sys
sys.stdout.reconfigure(encoding='utf-8')

with zipfile.ZipFile('D:/TimHieuPaper_Nhom16.pptx', 'r') as z:
    xml = z.read('ppt/slideLayouts/slideLayout2.xml').decode('utf-8')
    for m in re.finditer(r'<p:sp>(.*?)</p:sp>', xml, re.DOTALL):
        sp = m.group(0)
        name = re.search(r'name="([^"]+)"', sp)
        print('Shape in layout2:', name.group(1) if name else 'unknown')
        if 'FFFF00' in sp or 'ffff00' in sp:
            print('  -> contains yellow!')
