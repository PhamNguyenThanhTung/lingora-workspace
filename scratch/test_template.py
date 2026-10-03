import zipfile, re

with zipfile.ZipFile('D:/TimHieuPaper_Nhom16.pptx', 'r') as z:
    xml = z.read('ppt/slideMasters/slideMaster1.xml').decode('utf-8')
    print('Length of master xml:', len(xml))
    for m in re.finditer(r'<p:sp>(.*?)</p:sp>', xml, re.DOTALL):
        sp_text = m.group(0)
        name_match = re.search(r'name="([^"]+)"', sp_text)
        name = name_match.group(1) if name_match else 'unknown'
        print('Shape in master:', name)
