"""Current artifact integrity, independent of historical task-only snapshots."""
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
from PIL import Image

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
from validate_drawio import load_all_sources, validate_document


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def text_bytes_matches(raw_bytes, expected_sha):
    """Check text bytes hash compatibility symmetrically across LF and CRLF newlines.

    Accepts raw exact binary match, normalized CRLF binary match, or normalized LF binary match.
    Strictly forbids whitespace stripping, character replacement, or semantic normalization.
    """
    if hashlib.sha256(raw_bytes).hexdigest() == expected_sha:
        return True
    crlf_bytes = raw_bytes.replace(b'\r\n', b'\n').replace(b'\n', b'\r\n')
    if hashlib.sha256(crlf_bytes).hexdigest() == expected_sha:
        return True
    lf_bytes = raw_bytes.replace(b'\r\n', b'\n')
    return hashlib.sha256(lf_bytes).hexdigest() == expected_sha


def text_sha_matches(path, expected_sha):
    return text_bytes_matches(path.read_bytes(), expected_sha)


def visible(text):
    # PlantUML 1.2026.8 normalizes en dashes in titles in both output and metadata.
    return '\n'.join(line.replace('\u2013', '-') if line.startswith('title ') else line for line in text.strip().splitlines()
                     if not line.lstrip().startswith("'"))


def main():
    manifest = json.loads((BASE / 'render-manifest.json').read_text(encoding='utf-8'))
    rows = manifest['records']
    assert len(rows) == manifest['diagram_count'] == 36
    assert len({row['id'] for row in rows}) == 36
    assert Counter(row['classification'] for row in rows) == {'CURRENT': 5, 'TARGET': 30, 'DEFERRED — NOT MVP': 1}
    assert {row['source'] for row in rows} == {p.relative_to(BASE).as_posix() for p in (BASE/'src').glob('*.puml')}
    assert text_sha_matches(BASE/'style.puml', manifest['style_sha256']), 'stale style'
    outputs = set()
    primary = BASE/'lingora-all-diagrams.drawio'
    fragments = re.findall(rb'<diagram\b.*?</diagram>', primary.read_bytes(), re.S)
    pages = {ET.fromstring(fragment).get('id'): fragment for fragment in fragments}
    assert len(fragments) == len(pages) == 44
    for row in rows:
        source = BASE/row['source']
        text = source.read_text(encoding='utf-8')
        assert text_sha_matches(source, row['source_sha256']), 'stale source '+row['id']
        assert re.search(r"^' diagram-id: (.+)$", text, re.M)[1].strip() == row['id']
        assert re.search(r"^' classification: (.+)$", text, re.M)[1].strip() == row['classification']
        assert set(row['outputs']) == {'svg', 'png'}
        for fmt, name in row['outputs'].items():
            path = BASE/name
            outputs.add(path.resolve())
            assert sha(path) == row['output_sha256'][fmt], 'stale output '+name
            if fmt == 'png':
                with Image.open(path) as image:
                    embedded = image.info['plantuml'].split('@enduml', 1)[0]+'@enduml'
                    assert visible(embedded) == visible(text), 'render/source text drift '+row['id']
                    image.verify()
            else:
                tree = ET.parse(path).getroot()
                assert not re.search(r'Syntax Error|An error has occurred', ' '.join(tree.itertext()))
        if 'native_page_sha256' in row:
            assert text_bytes_matches(pages['page-'+row['id']], row['native_page_sha256']), 'native page drift '+row['id']
            for fmt, name in row['native_outputs'].items():
                assert sha(BASE/name) == row['native_output_sha256'][fmt], 'native export drift '+row['id']
        print('PASS: source/render integrity '+row['id'])
    assert outputs == {p.resolve() for p in (BASE/'rendered').iterdir() if p.suffix in {'.png', '.svg'}}
    errors = validate_document(ET.parse(primary).getroot(), load_all_sources())
    assert not errors, errors
    print('PASS: 36 source/PNG/SVG records, visible source parity, 44 native pages/payloads and native export provenance.')
    print('Artifact integrity only; no downstream design or implementation approval.')


if __name__ == '__main__':
    main()
