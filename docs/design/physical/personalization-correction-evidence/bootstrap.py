"""Capture immutable task entry evidence; documentation only."""
from pathlib import Path
import hashlib, json, shutil, subprocess

ROOT = Path(__file__).resolve().parents[4]
E = Path(__file__).resolve().parent
SLUG = '2026-10-12-study-focus-personalization-f01-f02'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
names = subprocess.check_output(['rg','--files','--hidden','-g','!.git','-g','!node_modules','-g','!.next','-g','!dist','-g','!build'],cwd=ROOT,text=True,encoding='utf-8').splitlines()
baseline = dict(head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(), index_raw=subprocess.check_output(['git','diff','--cached','--raw'],cwd=ROOT,text=True), existing_sha256={n.replace('\\','/'):sha(ROOT/n) for n in names})
dest = ROOT/'plans/approved'/f'{SLUG}-BASELINE.json'
assert not dest.exists(), 'Do not overwrite immutable entry snapshot'
dest.write_text(json.dumps(baseline,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
shutil.copyfile('C:/Users/PC/.codex/attachments/a539c88e-bc20-4cde-9d3d-5b90277585b4/Pasted text.txt',ROOT/'plans/approved'/f'{SLUG}-REQUEST.txt')
for name in ['verify.py','physical-erd.puml']:
    shutil.copyfile(ROOT/'docs/design/physical'/name,E/f'entry-{name}')
(E/'entry-current-task.md').write_bytes((ROOT/'plans/current-task.md').read_bytes())
(E/'entry-status.txt').write_text(subprocess.check_output(['git','status','--short'],cwd=ROOT,text=True,encoding='utf-8'),encoding='utf-8')
print(f'ENTRY {len(names)} files; HEAD/index captured; physical verifier/source preserved')
