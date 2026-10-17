from pathlib import Path
import xml.etree.ElementTree as E
import copy,json,subprocess
D=Path(__file__).resolve().parent
SRC=D.parent/'2026-10-12-ad-layout-v2/candidate.drawio'
t=E.parse(SRC); original=copy.deepcopy(t.getroot())
def objects(pid): return {o.get('id'):o for o in t.find(f"diagram[@id='page-{pid}']").findall('.//UserObject')}
def route(pid,eid,points,exit=(.5,1),entry=(.5,0),label=None):
 o=objects(pid)[eid]; c=o.find('mxCell'); g=c.find('mxGeometry')
 style=dict(x.split('=',1) for x in c.get('style').split(';') if '=' in x)
 style.update(exitX=str(exit[0]),exitY=str(exit[1]),entryX=str(entry[0]),entryY=str(entry[1]),jumpStyle='arc',jumpSize='8')
 c.set('style',';'.join(f'{k}={v}' for k,v in style.items())+';')
 for child in list(g): g.remove(child)
 E.SubElement(g,'mxPoint',x=str(points[0][0]),y=str(points[0][1]),attrib={'as':'sourcePoint'})
 E.SubElement(g,'mxPoint',x=str(points[-1][0]),y=str(points[-1][1]),attrib={'as':'targetPoint'})
 if len(points)>2:
  a=E.SubElement(g,'Array',attrib={'as':'points'})
  for x,y in points[1:-1]: E.SubElement(a,'mxPoint',x=str(x),y=str(y))
 if label:
  g.set('x','-1');g.set('y','0');E.SubElement(g,'mxPoint',x=str(label[0]),y=str(label[1]),attrib={'as':'offset'})
# Distinct branch exits prevent opposite guards sharing a visible line.
route('ACT-01','e_90',[(1074.5,2128),(1074.5,2145),(887,2145),(887,2162)],label=(32,18))
route('ACT-01','e_26',[(378.46,792),(378.46,809),(1143.4,809),(1143.4,826)],label=(-30,16))
# Self-report branch downward; default remains east.
o=objects('ACT-01'); eid=next(k for k,v in o.items() if v.find('mxCell').get('source')=='diamond_107' and v.find('mxCell').get('target')=='action_111')
route('ACT-01',eid,[(539,1930),(539,1947),(616,1947),(616,1964)],label=(-24,15))
route('ACT-03','e_94',[(1609.87,1868),(1609.87,1885),(1502.5,1885),(1502.5,1902)],label=(28,14))
route('ACT-03','e_162',[(950.04,3758),(1041.43,3758),(1041.43,3826)],exit=(1,.5),label=(130,-22))
route('ACT-06','e_125',[(310.83,2542),(250,2542),(250,2822),(413.83,2822)],exit=(0,.5),entry=(0,.5),label=(-40,-20))
# Validation loop occupies separate right corridor; accepted path goes left and below.
route('ACT-08','e_55',[(1008.53,1709),(1192,1709),(1192,1418),(1054.53,1418)],exit=(1,.5),entry=(1,.5))
# Source-traced native importer repairs: optional enrollment must not enter automatic core branch.
o=objects('ACT-06');o['e_16'].find('mxCell').attrib.pop('target');o['e_18'].find('mxCell').attrib.pop('source')
route('ACT-06','e_16',[(1334.09,344),(1334.09,360),(425.82,360)],label=(-35,18))
route('ACT-06','e_18',[(425.82,360),(425.82,378)])
# Assignment leads to clone, not withdrawal; both original segment IDs retained.
o=objects('ACT-09');o['e_12'].find('mxCell').set('target','action_10')
route('ACT-09','e_11',[(201,434),(201,450),(952.73,450)])
route('ACT-09','e_12',[(952.73,450),(952.73,468)])
route('ACT-09','e_71',[(716,403),(1295.69,403),(1295.69,444.07)],exit=(1,.5))
# Withdrawal bypass stays outside publication actions; crossings show jumps.
route('ACT-09','e_81',[(1455.68,807),(1706,807),(1706,1896),(1295.69,1896)],exit=(1,.5))
# Distinguish the review horizontal line from withdrawal exit.
route('ACT-09','e_23',[(1922.11,838),(1922.11,860),(217,860),(217,876)])
# Invariants: all wrapper payloads, IDs, labels, vertex attributes, and all other pages unchanged.
exceptions={('page-ACT-06','e_16','target'),('page-ACT-06','e_18','source'),('page-ACT-09','e_12','target')}
changes=[]
for old,new in zip(original.findall('diagram'),t.findall('diagram')):
 assert old.attrib==new.attrib
 if E.tostring(old)==E.tostring(new): continue
 assert old.get('id') in ['page-ACT-01','page-ACT-03','page-ACT-06','page-ACT-08','page-ACT-09']
 oo=old.findall('.//UserObject'); nn=new.findall('.//UserObject');assert len(oo)==len(nn)
 for a,b in zip(oo,nn):
  assert a.attrib==b.attrib
  ac=a.find('mxCell');bc=b.find('mxCell')
  for k in set(ac.attrib)|set(bc.attrib):
   if k=='style':continue
   if ac.get(k)!=bc.get(k):assert (old.get('id'),a.get('id'),k) in exceptions
 changes.append(old.get('id'))
t.write(D/'candidate.drawio',encoding='utf-8',xml_declaration=True)
(D/'verification.json').write_text(json.dumps({'verdict':'PASS','changed_pages':changes,'all_ids_labels_payloads_preserved':True,'source_traced_endpoint_exceptions':[list(x) for x in sorted(exceptions)]},indent=2))
print('PASS: layout and three source-traced endpoint attribute repairs; remaining pages invariant')
