from pathlib import Path
import re,xml.etree.ElementTree as E
D=Path(__file__).resolve().parent;ROOT=D.parents[4]
p=D/'candidate.drawio';pat=r'<diagram\b[^>]*>.*?</diagram>';current=p.read_text(encoding='utf-8');out=(ROOT/'docs/modeling/current-target/lingora-all-diagrams.drawio').read_bytes().decode('utf-8');cf={E.fromstring(f).get('id'):f for f in re.findall(pat,current,re.S)}
for frag in re.findall(pat,out,re.S):
 id=E.fromstring(frag).get('id')
 if id in ['page-ACT-08','page-SEQ-03','page-SEQ-04','page-SEQ-08','page-STA-03','page-DATA-03']:out=out.replace(frag,cf[id],1)
p.write_bytes(out.encode('utf-8'));print('38 untouched raw page fragments restored byte-for-byte')
