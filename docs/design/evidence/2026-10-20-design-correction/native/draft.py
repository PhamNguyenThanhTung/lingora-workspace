from pathlib import Path
import sys,re,json,hashlib,xml.etree.ElementTree as E
D=Path(__file__).resolve().parent; ROOT=D.parents[4];sys.path.insert(0,str(ROOT/'scripts'))
import layout_drawio_native as layout
ids=['ACT-08','SEQ-03','SEQ-04','SEQ-08','STA-03','DATA-03']
base=(ROOT/'docs/modeling/current-target/lingora-all-diagrams.drawio').read_bytes()
text=base.decode('utf-8'); patt=r'<diagram\b[^>]*>.*?</diagram>'
frags=re.findall(patt,text,re.S); pages={E.fromstring(x).get('id'):x for x in frags}; results=[]
for id in ids:
 old=E.fromstring(pages['page-'+id]);raw=E.parse(D/(id+'.raw.xml')).getroot(); rr=raw.find('.//root')
 if rr is None and raw.tag=='root':rr=raw
 model=old.find('mxGraphModel');model.remove(model.find('root'));model.append(rr)
 # imported converter geometry is native; data diagram uses SVG reference for scaled layout.
 svg=next((ROOT/'docs/modeling/current-target/rendered').glob(id+'-*.svg'))
 result=layout.LayoutResult(preserved_native_layout=True) if id=='STA-03' else layout.transfer_page_geometry(old,E.parse(svg).getroot())
 # Pad the native graph page to actual cell bounds.
 maxx=maxy=0
 for g in model.findall('.//mxGeometry'):
  maxx=max(maxx,float(g.get('x',0))+float(g.get('width',0)))
  maxy=max(maxy,float(g.get('y',0))+float(g.get('height',0)))
 model.set('pageWidth',str(int(maxx+100)));model.set('pageHeight',str(int(maxy+100)))
 new=E.tostring(old,encoding='unicode'); text=text.replace(pages['page-'+id],new,1)
 results.append({'id':id,'layout':vars(result)})
(D/'candidate.drawio').write_bytes(text.encode('utf-8'))
newpages={E.fromstring(x).get('id'):x for x in re.findall(patt,text,re.S)}
assert len(newpages)==44
unchanged=[p for p in pages if p.removeprefix('page-') not in ids]
assert len(unchanged)==38 and all(pages[p]==newpages[p] for p in unchanged)
sha=lambda b:hashlib.sha256(b).hexdigest()
report={'preserved_pages':38,'native_pages':44,'candidate_sha256':sha(text.encode()),'pages':{},'layout_results':results}
for i,id in enumerate(pages,1):
 if id.removeprefix('page-') in ids:
  source=next((ROOT/'docs/modeling/current-target/src').glob(id.removeprefix('page-')+'-*.puml'))
  report['pages'][id]={'index':i,'source_sha256':sha(source.read_bytes()),'page_sha256':sha(newpages[id].encode())}
(D/'draft-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=True))
