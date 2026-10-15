from pathlib import Path
import hashlib,json,re,runpy
from PIL import Image
ROOT=Path(__file__).resolve().parents[4];E=Path(__file__).resolve().parent
M=ROOT/'docs/modeling/current-target';R=ROOT/'docs/modeling/report-usecases';P=ROOT/'docs/design/physical'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
# End-session reinforcement follows all supplementary practice, not just its SRS component.
p=M/'src/SEQ-06-lesson-exercise-submission.puml';s=p.read_text(encoding='utf-8')
block='''    opt Có câu SRS chưa nhớ cần củng cố
      Server --> Web : Một câu củng cố cuối phiên; không lập lịch lại
      Web -> Server : Trả lời củng cố trong phiên đã xác thực
      Server -> DB : Ghi củng cố tối đa một lần; giữ lịch
    end
'''
assert block in s;s=s.replace(block,'')
anchor='  end\nelse Chưa kết thúc hợp lệ'
s=s.replace(anchor,block+anchor);p.write_text(s,encoding='utf-8')
p=P/'physical-erd.puml';s=p.read_text(encoding='utf-8').replace('  gate_config / curriculum_generation','  gate_config / curriculum_generation\n  practice_config (phân bố luyện tập)');p.write_text(s,encoding='utf-8')
api=runpy.run_path(str(E/'render_affected.py'))
api['render'](M/'src/SEQ-06-lesson-exercise-submission.puml',M/'rendered')
api['render'](P/'physical-erd.puml',P)
pm=json.loads((E/'physical-render-manifest.json').read_text(encoding='utf-8'));pm['source_sha256']=sha(P/'physical-erd.puml')
for n,row in pm['outputs'].items():row.update(api['inspect'](P/n))
(E/'physical-render-manifest.json').write_text(json.dumps(pm,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
affected=json.loads((E/'affected-render-manifest.json').read_text(encoding='utf-8'))
affected['SEQ-06-lesson-exercise-submission']={fmt:api['inspect'](M/'rendered'/f'SEQ-06-lesson-exercise-submission.{fmt}') for fmt in ['png','svg']}
(E/'affected-render-manifest.json').write_text(json.dumps(affected,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for root,stems in [(M,['ACT-01-learner-onboarding','ACT-03-lesson-learning','ACT-06-srs-review','SEQ-06-lesson-exercise-submission','SEQ-08-srs-review','DOM-01-core-domain-model','DATA-03-target-logical-erd']),(R,['VIEW-RUC-02-learning-context','VIEW-RUC-03-lesson-practice','VIEW-RUC-04-srs-review'])]:
    m=json.loads((root/'render-manifest.json').read_text(encoding='utf-8'))
    for row in m['records']:
        if Path(row['source']).stem in stems:
            row['source_sha256']=sha(root/row['source'])
            row['output_sha256']={fmt:sha(root/n) for fmt,n in row['outputs'].items()}
    (root/'render-manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Focused final source/render records refreshed; visual row update occurs after opening final images')
