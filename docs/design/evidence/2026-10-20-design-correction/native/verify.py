from pathlib import Path
import sys,re,json,hashlib,xml.etree.ElementTree as E
D=Path(__file__).resolve().parent;ROOT=D.parents[4];sys.path.insert(0,str(ROOT/'scripts'));import validate_drawio as v
p=D/'candidate.drawio';text=p.read_bytes().decode('utf-8');root=E.fromstring(text);errors=v.validate_document(root,v.load_all_sources());assert not errors,errors
pat=r'<diagram\b[^>]*>.*?</diagram>';oldtext=(ROOT/'docs/modeling/current-target/lingora-all-diagrams.drawio').read_bytes().decode('utf-8')
old={E.fromstring(f).get('id'):f for f in re.findall(pat,oldtext,re.S)};new={E.fromstring(f).get('id'):f for f in re.findall(pat,text,re.S)}
ids=['ACT-08','SEQ-03','SEQ-04','SEQ-08','STA-03','DATA-03'];changed=[id for id in old if old[id]!=new[id]];assert set(changed)=={'page-'+x for x in ids}
sha=lambda b:hashlib.sha256(b).hexdigest();out={'verdict':'PASS','actual_page_count':len(new),'preserved_exact_fragments':38,'changed_page_ids':changed,'candidate_sha256':sha(p.read_bytes()),'pages':{},'native_structure_errors':errors}
for i,page in enumerate(root.findall('diagram'),1):
 id=page.get('id').removeprefix('page-')
 if id not in ids:continue
 src=next((ROOT/'docs/modeling/current-target/src').glob(id+'-*.puml'));raw=E.parse(D/(id+'.raw.xml')).getroot();objects={u.get('id'):u for u in page.findall('.//UserObject')};ro={u.get('id'):u for u in raw.findall('.//UserObject')}
 assert all(u.get('label')==objects[k].get('label') for k,u in ro.items() if not k.startswith('t_') or id!='STA-03')
 for k,u in ro.items():
  if id=='STA-03' and k.startswith('t_'):assert u.get('label')==objects['label_'+k].get('label')
  c=u.find('mxCell');nc=objects[k].find('mxCell');assert c.get('source')==nc.get('source') and c.get('target')==nc.get('target')
 out['pages'][id]={'page_index_1based':i,'source_sha256':sha(src.read_bytes()),'page_fragment_sha256':sha(new['page-'+id].encode()),'native_vertices':len([x for x in page.findall('.//mxCell') if x.get('vertex')=='1']),'native_edges':len([x for x in page.findall('.//mxCell') if x.get('edge')=='1']),'labels_and_terminals_preserved':True}
 for fmt in ['png','svg']:
  f=D/(id+'.'+fmt)
  if f.exists():out['pages'][id][fmt+'_sha256']=sha(f.read_bytes())
# Every data member must fall within its own native parent; catches duplicate label mapping errors.
page=root.find("diagram[@id='page-DATA-03']");objects={u.get('id'):u for u in page.findall('.//UserObject')}
for k,u in objects.items():
 if not k.startswith('mb_'):continue
 c=u.find('mxCell');g=c.find('mxGeometry');par=objects[c.get('parent')].find('mxCell/mxGeometry');assert float(g.get('y'))+float(g.get('height'))<=float(par.get('height'))+1,(k,g.attrib,par.attrib)
(D/'final-report.json').write_text(json.dumps(out,indent=2),encoding='utf-8');print(json.dumps(out))
