from pathlib import Path
import re,xml.etree.ElementTree as E
p=Path('docs/design/evidence/2026-10-20-design-correction/native/candidate.drawio');text=p.read_text(encoding='utf-8');frag=next(x for x in re.findall(r'<diagram\b[^>]*>.*?</diagram>',text,re.S) if 'id="page-STA-03"' in x);page=E.fromstring(frag);o={u.get('id'):u for u in page.findall('.//UserObject')}
# Return path enters review from above; no shared draft-entry segment.
c=o['t_21'].find('mxCell');c.set('style',c.get('style').replace('entryX=0;entryY=0.5;','entryX=0.5;entryY=0;'));g=c.find('mxGeometry');a=g.find('Array');a.clear();a.set('as','points')
for x,y in [(460,500),(460,110),(665,110)]:E.SubElement(a,'mxPoint',x=str(x),y=str(y))
# Label boxes sit next to routes, so arrows remain visibly continuous.
for id,x,y,w,h in [('t_24',890,315,300,70),('t_25',945,440,250,60),('t_26',1250,445,180,55),('t_32',890,1120,300,80),('t_33',945,1340,250,70),('t_34',1250,1340,180,65)]:
 g=o['label_'+id].find('mxCell/mxGeometry');g.attrib.update(x=str(x),y=str(y),width=str(w),height=str(h))
for id in ['t_24','t_32']:
 c=o[id].find('mxCell');c.set('style',c.get('style').replace('entryX=0.5;entryY=1;','entryX=0.5;entryY=0;'));g=c.find('mxGeometry');a=g.find('Array');a.clear();a.set('as','points');off=0 if id=='t_24' else 800
 for x,y in [(1580,185+off),(1580,120+off),(1425,120+off)]:E.SubElement(a,'mxPoint',x=str(x),y=str(y))
text=text.replace(frag,E.tostring(page,encoding='unicode'));p.write_text(text,encoding='utf-8')
print('State route continuity fixed')
