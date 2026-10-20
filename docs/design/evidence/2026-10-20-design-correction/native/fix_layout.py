from pathlib import Path
import re,xml.etree.ElementTree as E,json
D=Path(__file__).resolve().parent
p=D/'candidate.drawio';s=p.read_text(encoding='utf-8');frags=re.findall(r'<diagram\b[^>]*>.*?</diagram>',s,re.S)
for frag in frags:
 page=E.fromstring(frag);pid=page.get('id');model=page.find('mxGraphModel');r=model.find('root')
 if pid=='page-DATA-03':
  for g in r.findall('.//mxGeometry'):
   for key,scale in [('x',1.8),('width',1.8),('y',1.25),('height',1.25)]:
    if g.get(key) is not None:g.set(key,str(float(g.get(key))*scale))
  for pt in r.findall('.//mxPoint'):
   for key,scale in [('x',1.8),('y',1.25)]:
    if pt.get(key) is not None:pt.set(key,str(float(pt.get(key))*scale))
  model.set('pageWidth','3900');model.set('pageHeight','1500')
 elif pid=='page-STA-03':
  o={u.get('id'):u for u in r.findall('UserObject')};group=next(k for k in o if k.startswith('plantuml-'))
  def geo(id,x,y,w,h,parent=None):
   c=o[id].find('mxCell');g=c.find('mxGeometry');g.attrib.update(x=str(x),y=str(y),width=str(w),height=str(h))
   if parent:c.set('parent',parent)
  geo('title_0',250,10,1100,35)
  geo('s_0',20,70,1590,760);geo('s_9',20,870,1590,760)
  coords={
  'sc_8':(60,185,20,20),'sc_1':(170,170,230,60),'sc_2':(550,170,230,60),'sc_3':(550,470,230,60),'sc_4':(930,170,230,60),'sc_5':(1310,170,230,60),'sc_6':(1100,600,230,60),'sc_7':(1360,600,230,60),
  'sc_16':(60,990,20,20),'sc_10':(350,970,270,60),'sc_11':(350,1270,300,70),'sc_12':(840,970,230,60),'sc_13':(1310,970,230,60),'sc_14':(1100,1500,230,60),'sc_15':(1360,1500,230,60),'sc_17':(500,1540,24,24)}
  for k,v in coords.items():geo(k,*v,parent=group)
  # Flat native state nodes with no empty compartment.
  for k in coords:
   if k not in ['sc_8','sc_16','sc_17']:o[k].find('mxCell').set('style','rounded=1;arcSize=15;whiteSpace=wrap;html=1;fontSize=14;fontFamily=Arial;fillColor=#FFFFFF;strokeColor=#000000;')
  def edge(id,points,labelbox):
   u=o[id];c=u.find('mxCell');g=c.find('mxGeometry')
   for ch in list(g):g.remove(ch)
   g.attrib.clear();g.attrib.update(relative='1',**{'as':'geometry'})
   c.set('style','endArrow=block;endFill=1;strokeColor=#000000;strokeWidth=1;html=1;rounded=0;exitX='+str(points[0][2])+';exitY='+str(points[0][3])+';entryX='+str(points[-1][2])+';entryY='+str(points[-1][3])+';')
   if len(points)>2:
    arr=E.SubElement(g,'Array',{'as':'points'})
    for x,y,*_ in points[1:-1]:E.SubElement(arr,'mxPoint',x=str(x),y=str(y))
   text=u.get('label');u.set('label','')
   lab=E.SubElement(r,'UserObject',id='label_'+id,label=text);lc=E.SubElement(lab,'mxCell',vertex='1',parent=group,style='text;html=1;whiteSpace=wrap;overflow=visible;fontSize=14;fontFamily=Arial;fillColor=#FFFFFF;strokeColor=none;align=center;verticalAlign=middle;');E.SubElement(lc,'mxGeometry',x=str(labelbox[0]),y=str(labelbox[1]),width=str(labelbox[2]),height=str(labelbox[3]),attrib={'as':'geometry'})
  edges={
  't_18':([(80,195,1,.5),(170,200,0,.5)],(80,110,160,60)),
  't_19':([(400,200,1,.5),(550,200,0,.5)],(400,235,150,75)),
  't_20':([(665,230,.5,1),(665,470,.5,0)],(680,315,180,50)),
  't_21':([(550,500,0,.5),(460,500),(460,200),(550,200,0,.5)],(245,360,210,100)),
  't_22':([(780,200,1,.5),(930,200,0,.5)],(785,235,140,60)),
  't_23':([(1160,200,1,.5),(1310,200,0,.5)],(1160,235,150,60)),
  't_24':([(1540,185,1,.25),(1580,185),(1580,280),(1425,280),(1425,230,.5,1)],(1280,300,290,65)),
  't_25':([(1367,230,.25,1),(1215,420),(1215,600,.5,0)],(1000,440,240,60)),
  't_26':([(1482,230,.75,1),(1482,600,.5,0)],(1410,445,170,55)),
  't_27':([(80,1000,1,.5),(350,1000,0,.5)],(85,1040,245,85)),
  't_28':([(485,1030,.5,1),(485,1270,.45,0)],(505,1100,250,65)),
  't_29':([(500,1340,.5,1),(512,1540,.5,0)],(535,1400,300,100)),
  't_30':([(620,1000,1,.5),(840,1000,0,.5)],(630,1035,200,70)),
  't_31':([(1070,1000,1,.5),(1310,1000,0,.5)],(1085,1035,210,65)),
  't_32':([(1540,985,1,.25),(1580,985),(1580,1080),(1425,1080),(1425,1030,.5,1)],(1260,1110,300,80)),
  't_33':([(1367,1030,.25,1),(1215,1320),(1215,1500,.5,0)],(1000,1340,230,70)),
  't_34':([(1482,1030,.75,1),(1482,1500,.5,0)],(1400,1340,180,65))}
  for id,(pts,lab) in edges.items():edge(id,pts,lab)
  model.set('pageWidth','1650');model.set('pageHeight','1680')
 else:continue
 s=s.replace(frag,E.tostring(page,encoding='unicode'),1)
p.write_text(s,encoding='utf-8')
print('Native state rerouted and data expanded')
