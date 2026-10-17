"""Narrow DOM candidate update; reuse the preserved candidate's native IDs/layout."""
from pathlib import Path
import copy
import json
import re
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
BASE = HERE.parents[1]
PRIOR = BASE / 'evidence/2026-10-12-class-design-completion'


def parse_source(text):
    classifiers, relations, current = [], [], None
    for line in text.splitlines():
        line = line.strip()
        match = re.fullmatch(r'(class|enum) (\w+)(.*?)\s*\{', line)
        if match:
            current = dict(kind=match[1], name=match[2], stereotype=match[3].strip(), attributes=[])
            classifiers.append(current)
        elif line == '}':
            current = None
        elif current and line:
            current['attributes'].append(line)
        match = re.fullmatch(r'(\w+) "([^"]+)" (\*--|--) "([^"]+)" (\w+)(?: : (.*))?', line)
        if match:
            relations.append(dict(source=match[1], source_multiplicity=match[2],
                                  kind='composition' if match[3] == '*--' else 'association',
                                  target_multiplicity=match[4], target=match[5], label=match[6] or ''))
    return classifiers, relations


def main():
    source = (HERE / 'candidate-source.txt').read_text(encoding='utf-8')
    classifiers, relations = parse_source(source)
    assert len(classifiers) == 23 and len(relations) == 28
    old_model = json.loads((PRIOR / 'model.json').read_text(encoding='utf-8'))
    layout = json.loads((PRIOR / 'layout.json').read_text(encoding='utf-8'))
    ids = {c['name']: c['native_id'] for c in old_model['classifiers']}
    page = ET.parse(PRIOR / 'candidate-DOM-01.xml').getroot()
    assert page.tag == 'diagram' and page.get('id') == 'page-DOM-01'
    root = page.find('mxGraphModel/root')
    objects = {o.get('id'): o for o in root}
    old_boxes = layout['boxes']
    boxes = copy.deepcopy(old_boxes)
    for classifier in classifiers:
        name = classifier['name']
        box = boxes[name]
        box[3] = 56 + 32 * len(classifier['attributes'])
        obj = objects[ids[name]]
        cell = obj.find('mxCell')
        cell.set('style', re.sub(r'startSize=\d+;', 'startSize=40;', cell.get('style')))
        geom = obj.find('mxCell/mxGeometry')
        geom.set('height', str(box[3]))
        obj.set('label', name + (' <<derived>>' if classifier['stereotype'] else ''))
        for child in list(root):
            cell = child.find('mxCell')
            if cell is not None and cell.get('parent') == ids[name]:
                root.remove(child)
        for index, member in enumerate(classifier['attributes']):
            child = ET.SubElement(root, 'UserObject', id=f'{ids[name]}-member-{index}', label=member)
            cell = ET.SubElement(child, 'mxCell', parent=ids[name], vertex='1', style=(
                'text;html=0;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;'
                'fontSize=20;fontFamily=Arial;whiteSpace=nowrap;spacingLeft=12;'))
            ET.SubElement(cell, 'mxGeometry', x='0', y=str(44 + 32 * index),
                          width=str(box[2]), height='32', **{'as': 'geometry'})
    style = '\n'.join(l for l in (BASE / 'style.puml').read_text(encoding='utf-8').splitlines()
                      if not re.match(r'^\s*@(start|end)uml\b', l)).strip('\n')
    objects['plantuml-29'].set('plantUmlData', json.dumps({'data': source.replace('!include ../style.puml', style)}))
    labels = []

    def intersects(a, b):
        return a[0] < b[0]+b[2]+6 and a[0]+a[2]+6 > b[0] and a[1] < b[1]+b[3]+6 and a[1]+a[3]+6 > b[1]

    def label_object(identifier, value, rect):
        obj = objects[identifier]
        obj.set('label', value)
        geom = obj.find('mxCell/mxGeometry')
        for key, number in zip(('x', 'y', 'width', 'height'), rect):
            geom.set(key, str(number))
        labels.append(rect)

    def port(box, spec):
        x, y, w, h = box
        side, ratio = spec
        return {'T': (x+w*ratio, y), 'B': (x+w*ratio, y+h),
                'L': (x, y+h*ratio), 'R': (x+w, y+h*ratio)}[side]

    for relation, previous in zip(relations, layout['routes']):
        assert (relation['source'], relation['target']) == (previous['source'], previous['target'])
        identifier = previous['id']
        cell = objects[identifier].find('mxCell')
        path = copy.deepcopy(previous['path'])
        deltas = []
        for index, name, spec in [(0, relation['source'], previous['source_port']),
                                  (-1, relation['target'], previous['target_port'])]:
            before = port(old_boxes[name], spec)
            after = port(boxes[name], spec)
            delta = [after[0]-before[0], after[1]-before[1]]
            deltas.append(delta)
            adjacent = 1 if index == 0 else -2
            for axis in (0, 1):
                if len(path) > 2 and path[adjacent][axis] == path[index][axis]:
                    path[adjacent][axis] += delta[axis]
            path[index] = list(after)
        # These bends formerly crossed the expanded Context/Revision/Course boxes.
        if identifier in {'rel_68', 'rel_71'}:
            path[1][1] = path[2][1] = 1186 if identifier == 'rel_68' else 1198
        if identifier == 'rel_99':
            path[2][1] = path[3][1] = 1246
        if identifier == 'rel_102':
            path[2][1] = path[3][1] = 350
        if identifier == 'rel_110':
            # Independent version-to-item port avoids sharing the result's diamond/line.
            new_port = port(boxes[relation['source']], ('L', 0.8))
            deltas[0] = [new_port[0]-previous['path'][0][0], new_port[1]-previous['path'][0][1]]
            path = [list(new_port), [3070, new_port[1]], [3070, 2060], [3585, 2060], path[-1]]
            cell.set('style', re.sub(r'exitX=[^;]+;exitY=[^;]+;', 'exitX=0;exitY=0.8;', cell.get('style')))
        points = cell.find('mxGeometry/Array')
        points.clear()
        points.set('as', 'points')
        for x, y in path[1:-1]:
            ET.SubElement(points, 'mxPoint', x=str(x), y=str(y))
        for index, card in enumerate(previous['cards']):
            rect = list(card['box'])
            rect[0] += deltas[index][0]
            rect[1] += deltas[index][1]
            label_object(card['id'], relation['source_multiplicity' if index == 0 else 'target_multiplicity'], rect)
        if relation['label']:
            objects[identifier].set('label', '')
            label = ET.SubElement(root, 'UserObject', id=identifier+'-role', label='')
            label_cell = ET.SubElement(label, 'mxCell', parent='plantuml-29', vertex='1', style=(
                'text;html=0;strokeColor=none;fillColor=#FFFFFF;align=center;verticalAlign=middle;'
                'fontSize=16;fontFamily=Arial;whiteSpace=nowrap;'))
            ET.SubElement(label_cell, 'mxGeometry', **{'as': 'geometry'})
            objects[identifier+'-role'] = label
            rect = list(previous['role_box'])
            if identifier == 'rel_99':
                rect[0], rect[1] = 1940, 1258
            elif identifier == 'rel_102':
                rect[1] = 320
            elif identifier == 'rel_110':
                rect[0] = 2925
            elif identifier == 'rel_80':
                rect[0] = 1540
            elif identifier == 'design-rel-27':
                rect[0], rect[1] = 1360, 1518
            rect[2] = max(rect[2], len(relation['label']) * 10 + 16)
            label_object(identifier + '-role', relation['label'], rect)
    # Retain routes; shift labels within their neighboring whitespace when box growth requires it.
    for obj in root:
        identifier = obj.get('id', '')
        if not (identifier.endswith('-role') or identifier.endswith('-card')):
            continue
        geom = obj.find('mxCell/mxGeometry')
        rect = [float(geom.get(k)) for k in ('x', 'y', 'width', 'height')]
        if any(intersects(rect, b) for b in boxes.values()):
            original = list(rect)
            for distance in range(16, 240, 8):
                candidates = [[original[0]+dx, original[1]+dy, *original[2:]]
                              for dx, dy in [(0, distance), (0, -distance), (distance, 0), (-distance, 0)]]
                match = next((r for r in candidates if not any(intersects(r, b) for b in boxes.values())), None)
                if match:
                    for k, value in zip(('x', 'y', 'width', 'height'), match):
                        geom.set(k, str(value))
                    break
            else:
                raise AssertionError(f'No clear label position: {identifier}')
    dom = ET.tostring(page, encoding='utf-8')
    (HERE / 'candidate-DOM-01.xml').write_bytes(dom)
    primary = (BASE / 'lingora-all-diagrams.drawio').read_bytes()
    pattern = rb'<diagram\b[^>]*id="page-DOM-01"[^>]*>.*?</diagram>'
    assert len(re.findall(pattern, primary, re.S)) == 1
    (HERE / 'candidate.drawio').write_bytes(re.sub(pattern, lambda _: dom, primary, count=1, flags=re.S))
    (HERE / 'model.json').write_text(json.dumps({'classifiers': classifiers, 'relations': relations}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print('PASS: bounded DOM candidate built; canonical primary/source untouched.')


if __name__ == '__main__':
    main()
