import zipfile, re

with zipfile.ZipFile('D:/TimHieuPaper_Nhom16.pptx', 'r') as z:
    for name in z.namelist():
        if name.startswith('ppt/slideLayouts/slideLayout') and name.endswith('.xml'):
            xml = z.read(name).decode('utf-8')
            shapes = re.findall(r'name="([^"]+)"', xml)
            print(name, shapes)
