from pathlib import Path
import re,xml.etree.ElementTree as E
D=Path('docs/design/evidence/2026-10-20-design-correction/native');p=D/'candidate.drawio';text=p.read_text(encoding='utf-8')
frag=next(x for x in re.findall(r'<diagram\b[^>]*>.*?</diagram>',text,re.S) if 'id="page-DATA-03"' in x)
page=E.fromstring(frag);r=page.find('.//root');o={u.get('id'):u for u in r.findall('UserObject')}
for id,u in o.items():
 c=u.find('mxCell');g=c.find('mxGeometry');par=c.get('parent','')
 if par.startswith('cls_'):
  pg=o[par].find('mxCell/mxGeometry');g.set('x','0');g.set('width',pg.get('width'))
  if id.startswith('mb_'):
   style=c.get('style').replace('spacingLeft=20;','spacingLeft=30;').replace('overflow=hidden;','overflow=visible;');c.set('style',style)
 if id.startswith('vis_'):
  g.set('x','10');g.set('y','8');g.set('width','7');g.set('height','7')
for id,u in o.items():
 if id.startswith('cls_'):
  c=u.find('mxCell');c.set('style',re.sub(r'childLayout=[^;]*;','',c.get('style')))
text=text.replace(frag,E.tostring(page,encoding='unicode'));p.write_text(text,encoding='utf-8')
print('DATA child label/separator bounds match native parent')
