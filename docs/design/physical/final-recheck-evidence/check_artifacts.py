"""Independent final-recheck artifact/scope checks. No DB/runtime access."""
from pathlib import Path
import hashlib, json, re, subprocess, sys, platform
from collections import Counter
from xml.etree import ElementTree
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
HERE = ROOT / 'docs/design/physical'
EVIDENCE = Path(__file__).resolve().parent
SLUG = '2026-10-11-final-physical-design-recheck'
BASE = json.loads((ROOT/'plans/approved'/f'{SLUG}-BASELINE.json').read_text(encoding='utf-8'))
failures = []
def check(ok, label):
    print(('PASS ' if ok else 'FAIL ') + label)
    if not ok: failures.append(label)
def sha(data): return hashlib.sha256(data).hexdigest()
def git(*args): return subprocess.check_output(['git',*args],cwd=ROOT,text=True,encoding='utf-8').strip()

main = (HERE/'README.md').read_text(encoding='utf-8')
source = (HERE/'physical-erd.puml').read_text(encoding='utf-8')
catalog = re.findall(r'^\| `([a-z_]+)` \|',main,re.M)
details = re.findall(r'^- \*\*`(?:app_private\.)?([a-z_]+)`:\*\*',main,re.M)
entities = re.findall(r'entity "(?:app|app_private)\.([a-z_]+)" as',source)
check(len(catalog)==34 and len(set(catalog))==34, '34 unique catalog tables')
check(set(catalog)==set(details)==set(entities), 'catalog/detail/ERD unique table sets agree')
print('ERD_REPEATED_TABLE_DEFINITIONS', {n:c for n,c in Counter(entities).items() if c>1})
panels=[p for p in source.split('@enduml') if '@startuml' in p]
check(len(panels)==4,'four ERD panels')
for panel in panels:
    name=re.search(r'@startuml\s+(\S+)',panel).group(1)
    local=set(re.findall(r'entity "[^"]+" as ([a-z_]+)',panel))
    edges=re.findall(r'^([a-z_]+) [|}o].*? ([a-z_]+)$',panel,re.M)
    check(all(a in local and b in local for a,b in edges),f'ERD edge endpoints: {name}')
    check('PROPOSED PHYSICAL DESIGN - NOT IMPLEMENTED' in panel,f'proposed/not-implemented caption: {name}')
manifest={}
for panel in ['identity','content','learning','assessment']:
    for ext in ['png','svg']:
        name=f'physical-erd-{panel}.{ext}'
        p=EVIDENCE/'rendered'/name; data=p.read_bytes()
        check(data==(HERE/name).read_bytes(),f'fresh render equals primary: {name}')
        entry={'sha256':sha(data)}
        if ext=='svg': ElementTree.fromstring(data); entry['svg_parse']='PASS'
        else:
            with Image.open(p) as im: im.verify()
            with Image.open(p) as im: entry['dimensions']=list(im.size)
        manifest[name]=entry
check(sha((EVIDENCE/'physical-erd.puml').read_bytes())==sha((HERE/'physical-erd.puml').read_bytes()),'render source copy exact')
(EVIDENCE/'render-manifest.json').write_text(json.dumps({'source_sha256':sha((HERE/'physical-erd.puml').read_bytes()),'outputs':manifest},indent=2)+'\n',encoding='utf-8')

docs=[HERE/n for n in ['README.md','security-and-rls.md','rebuild-plan.md','review-and-verification.md','correction-pass.md','independent-recheck.md','final-review.md']]
if (HERE/'final-recheck.md').exists(): docs.append(HERE/'final-recheck.md')
docs.extend([EVIDENCE/'verification.md',ROOT/'plans/approved'/f'{SLUG}-APPROVED.md'])
links=0
for doc in docs:
    for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)',doc.read_text(encoding='utf-8')):
        target=target.strip('<>').split('#',1)[0]
        if not target or re.match(r'https?://',target): continue
        check((doc.parent/target).resolve().exists(),f'link {doc.name} -> {target}'); links+=1
print('LOCAL_LINK_COUNT',links)
report=(HERE/'final-recheck.md').read_text(encoding='utf-8')
check(re.findall(r'^## ([A-R])\.',report,re.M)==list('ABCDEFGHIJKLMNOPQR'),'complete requested A-R report')
rows=re.findall(r'^\| (F\d\d) \|.*\| (CLOSED|STILL OPEN|REGRESSED) \|$',report,re.M)
check([n for n,v in rows]==[f'F{i:02}' for i in range(1,13)],'all twelve independent closure rows')
print('INDEPENDENT_SEMANTIC_VERDICTS',dict(rows))
check(git('rev-parse','HEAD')==BASE['head'],'HEAD unchanged')
check(git('diff','--cached','--raw')==BASE['index_raw'].strip(),'original index unchanged')
allowed={'plans/current-task.md','plans/approved/README.md','plans/archive/README.md','HANDOFF.md','docs/README.md','docs/QUICK-REF.md','docs/design/physical/README.md','logs/test-log.md','logs/development-log.md','logs/decision-log.md'}
unexpected=[]
for n,h in BASE['existing_sha256'].items():
    p=ROOT/n
    if (sha(p.read_bytes()) if p.is_file() else None)!=h and n not in allowed: unexpected.append(n)
check(not unexpected,'pre-existing out-of-scope files preserved: '+str(unexpected))
modeling=[n for n in BASE['existing_sha256'] if n.startswith('docs/modeling/current-target/')]
check(all(sha((ROOT/n).read_bytes())==BASE['existing_sha256'][n] for n in modeling),f'all {len(modeling)} approved modeling files unchanged')
for n in ['logs/test-log.md','logs/development-log.md','logs/decision-log.md']:
    digest=hashlib.sha256(); found=False
    for line in (ROOT/n).read_bytes().splitlines(keepends=True):
        digest.update(line)
        if digest.hexdigest()==BASE['existing_sha256'][n]: found=True; break
    check(found,f'append-only original log prefix: {n}')
names={n.replace('\\','/') for n in subprocess.check_output(['rg','--files','--hidden','-g','!.git','-g','!node_modules','-g','!.next','-g','!dist','-g','!build'],cwd=ROOT,text=True,encoding='utf-8').splitlines()}
new=names-set(BASE['existing_sha256'])
observation=EVIDENCE/'concurrent-observation.json'
concurrent=json.loads(observation.read_text(encoding='utf-8'))['paths'] if observation.exists() else {}
for n,record in concurrent.items():
    check(sha((ROOT/n).read_bytes())==record['sha256'],f'separately observed concurrent artifact unchanged: {n}')
extra=[n for n in sorted(new) if n not in concurrent and not (n.startswith('docs/design/physical/final-recheck-evidence/') or n=='docs/design/physical/final-recheck.md' or n.startswith(f'plans/approved/{SLUG}-') or n==f'plans/archive/{SLUG}-DONE.md')]
check(not extra,'new paths confined to final recheck: '+str(extra))
print('NEW_TEXT_FILE_LINE_COUNTS')
for n in sorted(new):
    if Path(n).suffix in {'.md','.txt','.py','.json','.puml'}: print(n, len((ROOT/n).read_text(encoding='utf-8-sig').splitlines()))
print('ENVIRONMENT',platform.platform(),platform.python_version(),BASE['head'])
print('FINAL RECHECK ARTIFACT CHECKS '+('FAIL' if failures else 'PASS'))
sys.exit(bool(failures))
