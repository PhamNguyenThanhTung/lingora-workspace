from pathlib import Path
import subprocess,json
D=Path(__file__).resolve().parent
exe='C:/Users/tungt/.cache/lingora-diagram-tools/drawio-32.4.1/draw.io.exe'
r=json.loads((D/'draft-report.json').read_text());results=[]
for page,item in r['pages'].items():
 for fmt in ['png','svg']:
  cmd=[exe,'--no-sandbox','--export','--format',fmt,'--page-index',str(item['index']),'--output',str(D/(page.removeprefix('page-')+'.'+fmt)),str(D/'candidate.drawio')]
  out=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace',creationflags=subprocess.CREATE_NO_WINDOW,timeout=90)
  results.append({'command':cmd,'exit':out.returncode,'stdout':out.stdout,'stderr':out.stderr})
  print(page,fmt,out.returncode,flush=True)
(D/'export-results.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
