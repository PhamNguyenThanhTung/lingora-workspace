import zipfile, re

# Read clean bg image
with open('tmp_clean_bg.png', 'rb') as f:
    clean_img_data = f.read()

src_pptx = 'D:/TimHieuPaper_Nhom16.pptx'
dst_pptx = 'docs/scratch/clean_template.pptx'

with zipfile.ZipFile(src_pptx, 'r') as zin, zipfile.ZipFile(dst_pptx, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        
        # Replace image1.png
        if item.filename == 'ppt/media/image1.png':
            data = clean_img_data
            
        # Remove yellow bar from slideMaster1.xml
        elif item.filename == 'ppt/slideMasters/slideMaster1.xml':
            xml = data.decode('utf-8')
            # Remove Google Shape;14;p5
            xml = re.sub(r'<p:sp>\s*<p:nvSpPr>\s*<p:cNvPr[^>]*name="Google Shape;14;p5"[^>]*>.*?</p:sp>', '', xml, flags=re.DOTALL)
            data = xml.encode('utf-8')
            
        # Remove yellow bar from slideLayout2.xml
        elif item.filename == 'ppt/slideLayouts/slideLayout2.xml':
            xml = data.decode('utf-8')
            # Remove Google Shape;30;p7
            xml = re.sub(r'<p:sp>\s*<p:nvSpPr>\s*<p:cNvPr[^>]*name="Google Shape;30;p7"[^>]*>.*?</p:sp>', '', xml, flags=re.DOTALL)
            data = xml.encode('utf-8')
            
        zout.writestr(item, data)

print('Created docs/scratch/clean_template.pptx successfully!')
