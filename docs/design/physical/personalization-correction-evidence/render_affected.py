"""Render exact affected artifacts, retaining all other modeling records."""
from pathlib import Path
import hashlib,json,re,subprocess,sys,xml.etree.ElementTree as ET
from PIL import Image
ROOT=Path(__file__).resolve().parents[4]
E=Path(__file__).resolve().parent
P=ROOT/'docs/design/physical'
M=ROOT/'docs/modeling/current-target'
R=ROOT/'docs/modeling/report-usecases'
JAR=Path('C:/Users/PC/scoop/apps/plantuml/current/plantuml.jar')
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def render(source,out):
    for fmt in ['svg','png']:
        cmd=['java','-Djava.awt.headless=true','-DPLANTUML_LIMIT_SIZE=16384','-jar',str(JAR),'-charset','UTF-8','--check-before-run','--no-error-image','--format',fmt,'--output-dir',str(out),str(source)]
        run=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace')
        print(json.dumps(dict(command=cmd,exit=run.returncode,stdout=run.stdout,stderr=run.stderr),ensure_ascii=False))
        if run.returncode: raise SystemExit(run.returncode)
def inspect(p):
    if p.suffix=='.svg':
        text=' '.join(ET.parse(p).getroot().itertext())
        assert 'Syntax Error' not in text and 'An error has occurred' not in text
        return dict(sha256=sha(p))
    with Image.open(p) as im: size=im.size; im.verify()
    return dict(sha256=sha(p),dimensions=size)

if '--physical' in sys.argv:
    render(P/'physical-erd.puml',P)
    data={n:inspect(P/n) for n in [f'physical-erd-{view}.{fmt}' for view in ['identity','content','learning','assessment'] for fmt in ['svg','png']]}
    (E/'physical-render-manifest.json').write_text(json.dumps(dict(source_sha256=sha(P/'physical-erd.puml'),outputs=data),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('PHYSICAL 4 views rendered; source/entity checks run separately')
if '--logical' in sys.argv:
    stems=['ACT-01-learner-onboarding','ACT-03-lesson-learning','ACT-06-srs-review','SEQ-06-lesson-exercise-submission','SEQ-08-srs-review','DOM-01-core-domain-model','DATA-03-target-logical-erd']
    manifest=json.loads((M/'render-manifest.json').read_text(encoding='utf-8'))
    results={}
    for stem in stems:
        src=M/'src'/f'{stem}.puml'
        render(src,M/'rendered')
        row=next(x for x in manifest['records'] if x['source']==f'src/{stem}.puml')
        row['source_sha256']=sha(src)
        row['output_sha256']={fmt:inspect(M/row['outputs'][fmt])['sha256'] for fmt in ['svg','png']}
        results[stem]={fmt:inspect(M/row['outputs'][fmt]) for fmt in ['svg','png']}
    (M/'render-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    for stem in ['VIEW-RUC-02-learning-context','VIEW-RUC-03-lesson-practice','VIEW-RUC-04-srs-review']:
        render(R/f'{stem}.puml',R/'rendered')
        results[stem]={fmt:inspect(R/'rendered'/f'{stem}.{fmt}') for fmt in ['svg','png']}
    (E/'affected-render-manifest.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('TARGETED 7 canonical + 3 report views rendered; no other sources rendered')
