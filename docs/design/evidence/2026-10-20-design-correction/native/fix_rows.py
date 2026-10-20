from pathlib import Path
import re,xml.etree.ElementTree as E
p=Path('docs/design/evidence/2026-10-20-design-correction/native/candidate.drawio');text=p.read_text(encoding='utf-8')
for pid in ['DATA-03','STA-03']:
 frag=next(x for x in re.findall(r'<diagram\b[^>]*>.*?</diagram>',text,re.S) if 'id="page-'+pid+'"' in x);page=E.fromstring(frag)
 if pid=='DATA-03':
  users=page.findall('.//UserObject')
  for parent in [u for u in users if u.get('id','').startswith('cls_')]:
   fields=[u for u in users if u.get('id','').startswith('mb_') and u.find('mxCell').get('parent')==parent.get('id')]
   for i,u in enumerate(fields):u.find('mxCell/mxGeometry').set('y',str(38.28875 if i==0 else 68.41125+(i-1)*20.12375))
 else:
  u=next(u for u in page.findall('.//UserObject') if u.get('id')=='label_t_19');u.find('mxCell/mxGeometry').attrib.update(x='475',y='235',width='180',height='50')
 text=text.replace(frag,E.tostring(page,encoding='unicode'))
p.write_text(text,encoding='utf-8');print('Repaired duplicate-label SVG mapping; all data fields now use native source-order rows')
