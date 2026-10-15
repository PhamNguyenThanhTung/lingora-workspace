"""Run and retain observed verification output, including relevant diff evidence."""
from pathlib import Path
import json,subprocess,sys,difflib
ROOT=Path(__file__).resolve().parents[4];E=Path(__file__).resolve().parent
sys.stdout.reconfigure(encoding='utf-8')
results=[]
for name,cmd in [
 ('scope-output.txt',[sys.executable,'docs/design/physical/personalization-correction-evidence/check_task.py']),
 ('modeling-output.txt',[sys.executable,'docs/modeling/current-target/verify.py']),
 ('physical-output.txt',[sys.executable,'docs/design/physical/verify.py']),
 ('diff-check-output.txt',['git','diff','--check']),
 ('diff-stat-output.txt',['git','diff','--stat'])]:
    r=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
    (E/name).write_text('COMMAND '+subprocess.list2cmdline(cmd)+'\n'+r.stdout+r.stderr+'\nEXIT '+str(r.returncode)+'\n',encoding='utf-8')
    print(name,'exit',r.returncode)
    if r.returncode: print('\n'.join(l for l in (r.stdout+r.stderr).splitlines() if 'FAIL' in l or 'Error' in l or 'whitespace' in l)[:2500])
    results.append((name,r.returncode))
inventory=json.loads((E/'task-inventory.json').read_text(encoding='utf-8'));counts=[]
for n in inventory['authorized_new']:
    p=ROOT/n
    if p.is_file() and p.suffix in ['.md','.py','.txt','.puml','.json']:counts.append(f'{n}: {len(p.read_text(encoding="utf-8").splitlines())}')
(E/'file-line-counts.txt').write_text('\n'.join(counts)+'\n',encoding='utf-8')
print('NEW TEXT FILES',len(counts))
sys.exit(any(code for _,code in results))
