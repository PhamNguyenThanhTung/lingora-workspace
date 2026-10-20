from pathlib import Path
import re,xml.etree.ElementTree as E,subprocess,json
D=Path(__file__).resolve().parent;p=D/'candidate.drawio';text=p.read_bytes().decode('utf-8');frag=next(x for x in re.findall(r'<diagram\b[^>]*>.*?</diagram>',text,re.S) if 'id="page-ACT-08"' in x);page=E.fromstring(frag);users=page.findall('.//UserObject');diamonds=[u for u in users if 'diamond_' in u.get('id','')];bands=sorted(float(u.find('mxCell/mxGeometry').get('y')) for u in diamonds)
def Y(y):
 extra=0
 for start in bands:
  if y>=start+24:extra+=36
  elif y>start:extra+=(y-start)*1.5
 return y+extra
for g in page.findall('.//mxGeometry'):
 if g.get('relative')=='1':continue
 y=float(g.get('y',0));h=float(g.get('height',0));g.set('y',str(Y(y)))
 if g.get('height') is not None:g.set('height',str(Y(y+h)-Y(y)))
for point in page.findall('.//mxPoint'):
 if point.get('y') is not None and point.get('as')!='offset':point.set('y',str(Y(float(point.get('y')))))
for u in diamonds:
 g=u.find('mxCell/mxGeometry');g.set('x',str(float(g.get('x'))-50));g.set('width',str(float(g.get('width'))+100))
# The while-loop corridors stay outside the wider decision rhombus.
for u in users:
 if u.get('id') in ['e_45','e_41']:
  for point in u.findall('.//mxPoint'):
   x=float(point.get('x',0))
   if x==859:point.set('x','809')
   if x in [1133,1136]:point.set('x','1190')
   if point.get('as')=='targetPoint' and u.get('id')=='e_41':point.set('x','1168')
page.find('mxGraphModel').set('pageHeight','2600');text=text.replace(frag,E.tostring(page,encoding='unicode'));p.write_bytes(text.encode('utf-8'))
exe='C:/Users/tungt/.cache/lingora-diagram-tools/drawio-32.4.1/draw.io.exe';result=[]
for fmt in ['png','svg']:
 cmd=[exe,'--no-sandbox','--export','--format',fmt,'--page-index','24','--output',str(D/('ACT-08.'+fmt)),str(p)];r=subprocess.run(cmd,capture_output=True,text=True,creationflags=subprocess.CREATE_NO_WINDOW);result.append({'command':cmd,'exit':r.returncode,'stdout':r.stdout,'stderr':r.stderr});print(fmt,r.returncode)
(D/'activity-final-export.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
from PIL import Image
im=Image.open(D/'ACT-08.png');im.crop((750,440,1500,970)).save(D/'ACT-08-crop.png')
