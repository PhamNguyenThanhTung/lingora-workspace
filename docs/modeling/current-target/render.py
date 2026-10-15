"""
Local PlantUML renderer for canonical modeling baseline (docs/modeling/current-target/).
Renders all src/*.puml to rendered/*.svg and rendered/*.png.
"""
from pathlib import Path
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET

BASE = Path(__file__).resolve().parent

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    jar = Path(os.environ.get('PLANTUML_JAR', str(Path.home() / 'scoop/apps/plantuml/current/plantuml.jar')))
    if not jar.is_file():
        raise SystemExit(f'PlantUML jar not found at {jar}. Set PLANTUML_JAR.')
    
    command = [shutil.which('java') or 'java', '-Djava.awt.headless=true', '-DPLANTUML_LIMIT_SIZE=16384', '-jar', str(jar), '-charset', 'UTF-8']
    version = subprocess.run(command + ['--version'], capture_output=True, text=True, encoding='utf-8')
    if version.returncode:
        raise SystemExit(version.stderr)
    
    sources = sorted((BASE / 'src').glob('*.puml'))
    if not sources:
        raise SystemExit('No .puml sources found in src/')
    
    out_dir = BASE / 'rendered'
    out_dir.mkdir(parents=True, exist_ok=True)
    
    for fmt in ('svg', 'png'):
        args = command + ['--check-before-run', '--no-error-image', '--format', fmt, '--output-dir', str(out_dir), str(BASE / 'src')]
        run = subprocess.run(args, capture_output=True, text=True, encoding='utf-8', errors='replace')
        print(f'PlantUML {fmt}: exit={run.returncode}; sources={len(sources)}')
        if run.stdout.strip():
            print(run.stdout.strip())
        if run.stderr.strip():
            print(run.stderr.strip())
        if run.returncode:
            raise SystemExit(run.returncode)
    
    from PIL import Image
    records = []
    for source in sources:
        stem = source.stem
        source_text = source.read_text(encoding='utf-8')
        identity = re.search(r"^' diagram-id: (.+)$", source_text, re.M)
        classification = re.search(r"^' classification: (.+)$", source_text, re.M)
        if not identity or not classification:
            raise SystemExit(f'Missing identity/classification: {source.name}')
        row = {'id': identity[1].strip(), 'classification': classification[1].strip(), 'source': source.relative_to(BASE).as_posix(), 'source_sha256': sha(source), 'outputs': {}}
        for fmt in ('svg', 'png'):
            out_file = out_dir / f'{stem}.{fmt}'
            if not out_file.is_file():
                raise SystemExit(f'Missing rendered file: {out_file.name}')
            if fmt == 'svg':
                svg_tree = ET.parse(out_file).getroot()
                svg_text = ' '.join(svg_tree.itertext())
                if 'Syntax Error' in svg_text or 'An error has occurred' in svg_text:
                    raise SystemExit(f'PlantUML syntax error in {out_file.name}')
            else:
                with Image.open(out_file) as img:
                    img.verify()
            row['outputs'][fmt] = out_file.relative_to(BASE).as_posix()
        row['output_sha256'] = {fmt: sha(BASE / name) for fmt, name in row['outputs'].items()}
        records.append(row)
    
    if len({row['id'] for row in records}) != len(records):
        raise SystemExit('Duplicate canonical diagram identity')
    manifest = {
        'renderer': version.stdout.splitlines()[0],
        'style_sha256': sha(BASE / 'style.puml'),
        'diagram_count': len(records),
        'records': records
    }
    (BASE / 'render-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f'PASS: {len(records)} sources successfully rendered to {len(records) * 2} SVG/PNG files.')

if __name__ == '__main__':
    main()
