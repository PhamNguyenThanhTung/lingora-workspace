from pathlib import Path
import xml.etree.ElementTree as E,subprocess
D=Path('docs/modeling/current-target/evidence/2026-10-16-activity-layout').resolve()
exe=Path('C:/Users/tungt/.cache/lingora-diagram-tools/drawio-32.4.1/draw.io.exe')
t=E.parse(D/'candidate.drawio')
for i,p in enumerate(t.findall('diagram')):
 pid=p.get('id','').replace('page-','')
 if pid not in ['ACT-01','ACT-02','ACT-03','ACT-04','ACT-06','ACT-07','ACT-08','ACT-09']:continue
 for fmt in ['png','svg']:
  cp=subprocess.run([str(exe),'--no-sandbox','--export','--format',fmt,'--page-index',str(i+1),'--output',str(D/f'{pid}.{fmt}'),str(D/'candidate.drawio')],capture_output=True,text=True,timeout=60)
  (D/f'{pid}.{fmt}.stdout.txt').write_text(cp.stdout,encoding='utf8');(D/f'{pid}.{fmt}.stderr.txt').write_text(cp.stderr,encoding='utf8')
  assert cp.returncode==0 and (D/f'{pid}.{fmt}').stat().st_size>1000
  print(pid,fmt,'PASS',flush=True)
