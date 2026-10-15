"""Finite inventory, hashes, links and touched semantics; no DB/runtime claims."""
from pathlib import Path
import hashlib,json,re,subprocess,sys,xml.etree.ElementTree as ET
sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parents[4]
E=Path(__file__).resolve().parent
SLUG='2026-10-12-study-focus-personalization-f01-f02'
base=json.loads((ROOT/'plans/approved'/f'{SLUG}-BASELINE.json').read_text(encoding='utf-8'))
handover=json.loads((E/'concurrent-handover.json').read_text(encoding='utf-8'))
inventory=json.loads((E/'task-inventory.json').read_text(encoding='utf-8'))
allowed=set(inventory['authorized_existing']);new=set(inventory['authorized_new'])
external=handover['observed_sha256']
bad=[]
def check(ok,label):
    print(('PASS ' if ok else 'FAIL ')+label)
    if not ok:bad.append(label)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest() if p.is_file() else None
names={n.replace('\\','/') for n in subprocess.check_output(['rg','--files','--hidden','-g','!.git','-g','!node_modules','-g','!.next','-g','!dist','-g','!build'],cwd=ROOT,text=True,encoding='utf-8').splitlines()}
changed=[]
for n,digest in base['existing_sha256'].items():
    if n in allowed:continue
    if n=='docs/presentation/usecase-activity-presentation.md' and (E/'concurrent-final.json').exists():
        expected=json.loads((E/'concurrent-final.json').read_text(encoding='utf-8'))['presentation_sha256']
    else:expected=external.get(n,digest)
    if sha(ROOT/n)!=expected:changed.append(n)
check(not changed,'unchanged pre-existing files outside exact task/concurrent inventory: '+str(changed))
unexpected=sorted(n for n in names-set(base['existing_sha256']) if n not in new and n not in external)
check(not unexpected,'new artifacts match exact finite task or observed concurrent inventory: '+str(unexpected))
for n,digest in external.items():
    if n not in allowed and n!='docs/presentation/usecase-activity-presentation.md':
        check(sha(ROOT/n)==digest,'preserve exact observed concurrent artifact '+n)
# Presentation is still owned by another user task. It is a single exact path,
# never part of this task's mutation permission; capture its final hash on close.
if (E/'concurrent-final.json').exists():
    final=json.loads((E/'concurrent-final.json').read_text(encoding='utf-8'))
    check(sha(ROOT/'docs/presentation/usecase-activity-presentation.md')==final['presentation_sha256'],'final externally authored presentation remains untouched')
def prefix(p,digest):
    data=p.read_bytes()
    final=json.loads((E/'concurrent-final.json').read_text(encoding='utf-8'))
    return hashlib.sha256(data[:final['log_prefix_lengths'][p.relative_to(ROOT).as_posix()]]).hexdigest()==digest
for n,digest in handover['log_prefix_sha256'].items():check(prefix(ROOT/n,digest),'append-only post-handover log prefix '+n)
check(subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()==base['head'],'HEAD unchanged; no commit')
norm=lambda s:s.replace('\r\n','\n').rstrip('\n')
check(norm(subprocess.check_output(['git','diff','--cached','--raw'],cwd=ROOT,text=True))==norm(base['index_raw']),'preexisting index unchanged; no staging')
link_count=0
docs=[ROOT/n for n in allowed|new if n.endswith('.md') and (ROOT/n).is_file() and not '/evidence/' in n and not '/approved/' in n and not '/archive/' in n and not Path(n).name.startswith(('entry-','handover-'))]
for doc in docs:
    if doc.relative_to(ROOT).as_posix() in handover['log_prefix_sha256']:
        prefix_len=json.loads((E/'concurrent-final.json').read_text(encoding='utf-8'))['log_prefix_lengths'][doc.relative_to(ROOT).as_posix()]
        body=doc.read_bytes()[prefix_len:].decode('utf-8')
    else:body=doc.read_text(encoding='utf-8')
    for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)',body):
        target=target.strip('<>').split('#',1)[0]
        if not target or re.match(r'https?://|codex:',target):continue
        if not (doc.parent/target).resolve().exists():bad.append(f'link {doc.relative_to(ROOT)} -> {target}')
        link_count+=1
check(not any(x.startswith('link ') for x in bad),f'{link_count} local Markdown links resolve')
for root in [ROOT/'docs/modeling/current-target',ROOT/'docs/modeling/report-usecases']:
    m=json.loads((root/'render-manifest.json').read_text(encoding='utf-8'))
    for row in m['records']:
        check(sha(root/row['source'])==row['source_sha256'],'fresh source '+row['id'])
        for fmt,n in row['outputs'].items():check(sha(root/n)==row['output_sha256'][fmt],'fresh '+fmt+' '+row['id'])
affected=[n for n in allowed if n.endswith('.puml') and '/physical/' not in n]
for n in affected:
    s=(ROOT/n).read_text(encoding='utf-8');v='\n'.join(l for l in s.splitlines() if not l.lstrip().startswith("'"))
    check(not re.search(r'(?m)^\s*(note|footer|legend)\b',v),'no rendered note/debug footer '+n)
    check(not re.search(r'\b(?:Creator|Moderator|Manager|SuperAdmin|assignedRoles|A1)\b|100\s*%',v),'no stale role/default/universal readiness '+n)
    check(not re.search(r'(?im)^\s*(?:actor|class|entity|component|node).*\b(?:AI|LLM|Reassessment|MasteryEngine)\b',v),'no active deferred/AI/mastery node '+n)
    check(not re.search(r'\b(?:12|13|30|40)\s*(?:questions|exercises|câu hỏi|bài tập)\b',v,re.I),'no fixed exercise/assessment count '+n)
for n in [x for x in allowed if x.endswith('.svg')]:
    p=ROOT/n
    if not p.exists():continue
    tree=ET.parse(p).getroot();v=' '.join(tree.itertext())
    colors=re.findall(r'#[0-9a-fA-F]{6}',p.read_text(encoding='utf-8'))
    check('Syntax Error' not in v and all(c[1:3].lower()==c[3:5].lower()==c[5:7].lower() for c in colors),'monochrome valid SVG '+n)
uc=(ROOT/'docs/use-case-specifications.md').read_text(encoding='utf-8')
check([int(x) for x in re.findall(r'^## (\d+)\.',uc,re.M)]==list(range(1,16)) and 'không phải UC-15' in uc,'canonical UC-01–14 unchanged; heading 15 only limitations')
main=(ROOT/'docs/design/physical/README.md').read_text(encoding='utf-8');source=(ROOT/'docs/design/physical/physical-erd.puml').read_text(encoding='utf-8')
tables=re.findall(r'^\| `([a-z_]+)` \|',main,re.M)
entities=set(re.findall(r'entity "(?:app|app_private)\.([a-z_]+)" as',source))
check(len(tables)==len(set(tables))==34 and set(tables)==entities,'34→34 table inventory and ERD agree')
physical=json.loads((E/'physical-render-manifest.json').read_text(encoding='utf-8'))
check(sha(ROOT/'docs/design/physical/physical-erd.puml')==physical['source_sha256'] and all(sha(ROOT/'docs/design/physical'/n)==r['sha256'] for n,r in physical['outputs'].items()),'fresh physical source and four output pairs')
for name in ['physical-erd-learning.png','physical-erd-learning.svg','physical-erd-assessment.png','physical-erd-assessment.svg']:
    n='docs/design/physical/'+name;check(sha(ROOT/n)==base['existing_sha256'][n],'unchanged unaffected physical view '+name)
print('TASK SCOPE/FRESHNESS/LINKS '+('FAIL' if bad else 'PASS'))
for x in bad:print('FAIL_DETAIL '+x)
sys.exit(bool(bad))
