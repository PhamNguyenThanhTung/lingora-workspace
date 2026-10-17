"""Focused class acceptance; preserves unrelated pages, artifacts and old evidence."""
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
from PIL import Image, ImageFont
from build_candidate import parse_source

sys.stdout.reconfigure(encoding='utf-8')
HERE = Path(__file__).resolve().parent
BASE = HERE.parents[1]
ROOT = BASE.parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
from validate_drawio import validate_document, load_all_sources


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require(ok, message):
    if not ok:
        raise SystemExit('FAIL: ' + message)
    print('PASS: ' + message)


candidate = '--candidate' in sys.argv
source_path = HERE/'candidate-source.txt' if candidate else BASE/'src/DOM-01-core-domain-model.puml'
drawio = HERE/'candidate.drawio' if candidate else BASE/'lingora-all-diagrams.drawio'
render_dir = HERE if candidate else BASE/'rendered'
source = source_path.read_text(encoding='utf-8')
classes, relations = parse_source(source)
require(sum(c['kind']=='class' for c in classes)==22 and sum(c['kind']=='enum' for c in classes)==1,
        '22 domain classes + 1 enum; unique classifier names')
require(len({c['name'] for c in classes})==23 and len(relations)==28,
        '23 unique classifiers / 28 explicit relationships')
require(sum(r['kind']=='composition' for r in relations)==6,
        '6 compositions / 22 plain associations; no inheritance or aggregation')
visible = '\n'.join(l for l in source.splitlines() if not l.lstrip().startswith("'"))
require(not re.search(r'\b(Creator|Moderator|Manager|SuperAdmin|assignedRoles|LogicalUnit|AssessmentVersion|Enrollment|SkillProfile)\b|<<PK|<<FK|varchar|uuid|/api/', visible, re.I),
        'no old roles, duplicate names or physical/API artifacts')
expected = load_all_sources()
style = '\n'.join(l for l in (BASE/'style.puml').read_text(encoding='utf-8').splitlines()
                  if not re.match(r'^\s*@(start|end)uml\b', l)).strip('\n')
expected['DOM-01'] = source.replace('!include ../style.puml', style)
root = ET.parse(drawio).getroot()
require(not validate_document(root, expected), 'existing native validator: 44 pages, identities and expanded source payloads')
page = root.find("diagram[@id='page-DOM-01']")
objects = {o.get('id'):o for o in page.findall('.//UserObject')}
old_model = json.loads((BASE/'evidence/2026-10-12-class-design-completion/model.json').read_text(encoding='utf-8'))
ids = {c['name']:c['native_id'] for c in old_model['classifiers']}
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 20)
for classifier in classes:
    identifier = ids[classifier['name']]
    node = objects[identifier]
    require(node.get('label').split(' <<')[0] == classifier['name'], 'native classifier '+classifier['name'])
    children = sorted((o for o in objects.values() if o.find('mxCell').get('parent')==identifier),
                      key=lambda o:float(o.find('mxCell/mxGeometry').get('y')))
    require([o.get('label') for o in children]==classifier['attributes'], 'exact ordered members '+classifier['name'])
    for child in children:
        geometry = child.find('mxCell/mxGeometry')
        header = float(re.search(r'startSize=(\d+)',node.find('mxCell').get('style'))[1])
        assert float(geometry.get('y'))>=header+4, 'member crosses header '+child.get('id')
        assert font.getlength(child.get('label'))+24 <= float(geometry.get('width')), 'member overflows '+child.get('id')
    print('PASS: member bounds/header clearance '+classifier['name'])
edges = [o for o in objects.values() if o.find('mxCell').get('edge')=='1']
require(len(edges)==28, 'exact native edge inventory')
for relation, edge in zip(relations, edges):
    cell = edge.find('mxCell')
    identifier = edge.get('id')
    require((cell.get('source'),cell.get('target'))==(ids[relation['source']],ids[relation['target']]) and
            objects[identifier+'-source-card'].get('label')==relation['source_multiplicity'] and
            objects[identifier+'-target-card'].get('label')==relation['target_multiplicity'],
            'endpoints + multiplicities '+identifier)
    require(('startArrow=diamond;' in cell.get('style'))==(relation['kind']=='composition') and
            (not relation['label'] or objects[identifier+'-role'].get('label')==relation['label']),
            'composition/association + label '+identifier)


def box(identifier):
    cell = objects[identifier].find('mxCell')
    geom = cell.find('mxGeometry')
    result = [float(geom.get(k,'0')) for k in ('x','y','width','height')]
    if cell.get('parent') in objects:
        parent = box(cell.get('parent'))
        result[0] += parent[0]
        result[1] += parent[1]
    return result


boxes = {i:box(i) for i in ids.values()}
def overlap(a, b):
    return min(a[0]+a[2],b[0]+b[2])-max(a[0],b[0])>1 and min(a[1]+a[3],b[1]+b[3])-max(a[1],b[1])>1

require(not any(overlap(a,b) for i,a in enumerate(boxes.values()) for b in list(boxes.values())[i+1:]),
        'native classifier boxes do not overlap')
labels = {i:box(i) for i in objects if i.endswith(('-card','-role'))}
require(not any(overlap(a,b) for a in labels.values() for b in boxes.values()), 'native relationship labels clear of class boxes')
require(not any(overlap(a,b) for i,a in enumerate(labels.values()) for b in list(labels.values())[i+1:]),
        'native multiplicity/role labels do not overlap')
for edge in edges:
    cell = edge.find('mxCell')
    settings = dict(s.split('=',1) for s in cell.get('style').split(';') if '=' in s)
    path = []
    for end, xkey, ykey in [('source','exitX','exitY'),('target','entryX','entryY')]:
        x,y,w,h = boxes[cell.get(end)]
        path.append((x+w*float(settings[xkey]),y+h*float(settings[ykey])))
    points = [(float(p.get('x')),float(p.get('y'))) for p in cell.findall('mxGeometry/Array/mxPoint')]
    points = [path[0],*points,path[1]]
    for a,b in zip(points,points[1:]):
        require(a[0]==b[0] or a[1]==b[1], 'orthogonal segment '+edge.get('id'))
        for x,y,w,h in boxes.values():
            blocked = (a[0]==b[0] and x+1<a[0]<x+w-1 and max(min(a[1],b[1]),y+1)<min(max(a[1],b[1]),y+h-1)) or (
                       a[1]==b[1] and y+1<a[1]<y+h-1 and max(min(a[0],b[0]),x+1)<min(max(a[0],b[0]),x+w-1))
            assert not blocked, 'route crosses class interior '+edge.get('id')
print('PASS: all 28 native routes avoid class interiors')

svg = ET.parse(render_dir/'DOM-01-core-domain-model.svg').getroot()
require('Syntax Error' not in ' '.join(svg.itertext()), 'PlantUML SVG parses without an error image')
texts = []
for text in svg.iter('{http://www.w3.org/2000/svg}text'):
    height = float(text.get('font-size','16'))
    texts.append((float(text.get('x','0')),float(text.get('y','0'))-height*.85,float(text.get('textLength','0')),height))
require(not any(overlap(a,b) for i,a in enumerate(texts) for b in texts[i+1:]), 'PlantUML text/multiplicity bounds do not overlap')
with Image.open(render_dir/'DOM-01-core-domain-model.png') as image:
    require(image.width>1000 and image.height>1000, 'full-size source PNG decodes')
    image.verify()
native_svg = ET.parse(HERE/'native-DOM-01.svg').getroot()
native_text = ' '.join(native_svg.itertext())
require(all(c['name'] in native_text for c in classes), 'native SVG export contains every classifier')
with Image.open(HERE/'native-DOM-01.png') as image:
    require(image.size==(4205,2737), 'full-size native PNG decodes without layout crop')
    image.verify()
baseline = json.loads((HERE/'baseline.json').read_text(encoding='utf-8'))
fragments = re.findall(rb'<diagram\b.*?</diagram>',drawio.read_bytes(),re.S)
page_hashes = {ET.fromstring(p).get('id'):hashlib.sha256(p).hexdigest() for p in fragments}
require(len(fragments)==44 and all(page_hashes[k]==v for k,v in baseline['primary_pages'].items() if k!='page-DOM-01'),
        '43 unrelated primary pages byte-identical; all 44 identities retained')
allowed = {'plans/current-task.md','HANDOFF.md','docs/README.md','docs/QUICK-REF.md',
           'docs/modeling/current-target/README.md','docs/modeling/current-target/src/DOM-01-core-domain-model.puml',
           'docs/modeling/current-target/rendered/DOM-01-core-domain-model.png',
           'docs/modeling/current-target/rendered/DOM-01-core-domain-model.svg',
           'docs/modeling/current-target/render-manifest.json','docs/modeling/current-target/lingora-all-diagrams.drawio',
           'logs/test-log.md','logs/development-log.md'}
changed = [name for name,digest in baseline['tracked_sha256'].items() if not (ROOT/name).is_file() or sha(ROOT/name)!=digest]
require(set(changed)<=allowed, 'all unrelated tracked files, UC/ACT candidates and historical evidence unchanged')
if not candidate:
    require(source_path.read_bytes()==(HERE/'candidate-source.txt').read_bytes(), 'canonical source is reviewed candidate')
    manifest = json.loads((BASE/'render-manifest.json').read_text(encoding='utf-8'))
    row = next(r for r in manifest['records'] if r['id']=='DOM-01')
    require(row['source_sha256']==sha(source_path) and all(row['output_sha256'][fmt]==sha(BASE/name) for fmt,name in row['outputs'].items()),
            'fresh canonical DOM source/render manifest hashes')
    require(row['native_page_sha256']==page_hashes['page-DOM-01'] and all(row['native_output_sha256'][fmt]==sha(BASE/name) for fmt,name in row['native_outputs'].items()),
            'fresh native DOM export/page provenance hashes')
    reviewed = (HERE/'independent-review.md').read_text(encoding='utf-8')
    require(all(digest in reviewed for digest in [row['source_sha256'],row['native_page_sha256'],row['output_sha256']['png'],row['native_output_sha256']['png']]),
            'canonical identities equal independent reviewer accepted hashes')
    entry_manifest = json.loads(__import__('subprocess').check_output(['git','show',baseline['head']+':docs/modeling/current-target/render-manifest.json'],cwd=ROOT))
    require([r for r in manifest['records'] if r['id']!='DOM-01']==[r for r in entry_manifest['records'] if r['id']!='DOM-01'],
            'all 35 other render-manifest records unchanged')
for doc in [BASE/'class-review-2026-10-16.md', BASE/'README.md', ROOT/'docs/README.md', ROOT/'docs/QUICK-REF.md', ROOT/'HANDOFF.md', ROOT/'plans/current-task.md']:
    for link in re.findall(r'\]\(([^)]+)\)',doc.read_text(encoding='utf-8')):
        if not re.match(r'https?://|#',link):
            require((doc.parent/link.split('#')[0]).exists(),'local link '+link)
print('CLASS DIAGRAM DETERMINISTIC VERIFICATION PASS; manual/independent review recorded separately.')
