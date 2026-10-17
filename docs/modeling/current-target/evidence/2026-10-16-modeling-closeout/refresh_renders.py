"""Reproduce apparent title differences and refresh stale source provenance.

Observed: PlantUML normalizes title en dashes; 20 of 21 rerendered pairs
were byte-identical. See closeout report; metadata differences alone were
not evidence of stale visible output.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
from PIL import Image

HERE = Path(__file__).resolve().parent
BASE = HERE.parents[1]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def visible(text):
    return '\n'.join(line for line in text.strip().splitlines()
                     if not line.lstrip().startswith("'"))


def main():
    java, jar = sys.argv[1:]
    manifest = json.loads((BASE / 'render-manifest.json').read_text(encoding='utf-8'))
    changes = []
    for row in manifest['records']:
        source = BASE / row['source']
        current = source.read_text(encoding='utf-8')
        with Image.open(BASE / row['outputs']['png']) as image:
            embedded = image.info['plantuml'].split('@enduml', 1)[0] + '@enduml'
        rendered_differs = visible(embedded) != visible(current)
        if rendered_differs:
            old = [line for line in visible(embedded).splitlines() if not line.startswith('title ')]
            new = [line for line in visible(current).splitlines() if not line.startswith('title ')]
            assert old == new, f'Unexpected non-title change: {row["id"]}'
            old_titles = [line.replace('\u2013', '-') for line in embedded.splitlines() if line.startswith('title ')]
            new_titles = [line.replace('\u2013', '-') for line in current.splitlines() if line.startswith('title ')]
            assert old_titles == new_titles, f'Unexpected title content change: {row["id"]}'
        stale = row['source_sha256'] != sha(source)
        if not stale and not rendered_differs:
            continue
        record = {'id': row['id'], 'old_source_sha256': row['source_sha256'],
                  'source_sha256': sha(source), 'old_output_sha256': row['output_sha256'].copy(),
                  'action': 'reproduce renderer-normalized title' if rendered_differs else 'line-ending/comment-only provenance refresh'}
        if rendered_differs:
            for fmt in ('svg', 'png'):
                command = [java, '-Djava.awt.headless=true', '-DPLANTUML_LIMIT_SIZE=16384',
                           '-jar', jar, '-charset', 'UTF-8', '--check-before-run',
                           '--no-error-image', '--format', fmt, '--output-dir',
                           str(BASE / 'rendered'), str(source)]
                result = subprocess.run(command, capture_output=True, text=True, encoding='utf-8')
                record[fmt] = {'command': command, 'exit': result.returncode,
                               'stdout': result.stdout, 'stderr': result.stderr}
                assert result.returncode == 0, record[fmt]
        row['source_sha256'] = sha(source)
        row['output_sha256'] = {fmt: sha(BASE / name) for fmt, name in row['outputs'].items()}
        record['output_sha256'] = row['output_sha256'].copy()
        changes.append(record)
        print(row['id'], record['action'], flush=True)
    (HERE / 'render-refresh.json').write_text(json.dumps(changes, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (BASE / 'render-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(f'PASS: {len(changes)} provenance records reconciled; source text unchanged.')


if __name__ == '__main__':
    main()
