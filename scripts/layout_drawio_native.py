#!/usr/bin/env python3
"""Reposition existing native draw.io cells using PlantUML SVG geometry."""

from __future__ import annotations

import argparse
import html
import math
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable


PRIMARY_ACTIVE_PAGE_COUNT = 44


ROOT = Path(__file__).resolve().parent.parent
MODEL = ROOT / "docs" / "modeling" / "current-target"
DEFAULT_DRAWIO = MODEL / "lingora-all-diagrams.drawio"
DEFAULT_SVG_DIR = MODEL / "rendered"
DEFAULT_REPORT_SVG_DIR = MODEL.parent / "report-usecases" / "rendered"
SVG_NS = "http://www.w3.org/2000/svg"
SHAPE_TAGS = {"rect", "ellipse", "circle", "polygon", "polyline", "path", "line"}
GROUP_CLASSES = {"title", "entity", "cluster"}
NUMBER_RE = re.compile(r"[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?")
STATE_EDGE_LABEL_OFFSETS: dict[str, dict[str, tuple[float, float]]] = {
    # These are layout-only pixel offsets for labels that the bundled draw.io
    # renderer places directly over a state node or over a neighboring branch.
    "STA-02": {"t_4": (115, 0)},
    "STA-03": {"t_11": (0, 107), "t_12": (200, -28), "t_13": (120, 0), "t_15": (150, 0)},
}
STATE_EDGE_ROUTES: dict[str, dict[str, tuple[tuple[float, float], ...]]] = {
    # Bend the admin-return transition around the left of the revision states;
    # its default straight route overlaps the opposing teacher-resubmit arrow.
    "STA-03": {"t_11": ((8, 296), (8, 346))},
}
STATE_TITLE_GEOMETRY: dict[str, tuple[float, float]] = {
    # (x, width) gives the unchanged title room to stay on one line.
    "STA-01": (0, 330),
    "STA-02": (34, 500),
    "STA-03": (50, 400),
}


class LayoutMappingError(RuntimeError):
    """Raised when a native vertex cannot be mapped unambiguously."""


@dataclass(frozen=True)
class Box:
    x: float
    y: float
    width: float
    height: float

    @property
    def center(self) -> tuple[float, float]:
        return self.x + self.width / 2, self.y + self.height / 2

    @property
    def area(self) -> float:
        return max(0.0, self.width) * max(0.0, self.height)

    def shifted(self, amount: float) -> "Box":
        return Box(self.x + amount, self.y + amount, self.width, self.height)


@dataclass(frozen=True)
class SvgText:
    label: str
    box: Box
    element: ET.Element
    order: int


@dataclass(frozen=True)
class SvgGroup:
    kind: str
    labels: tuple[str, ...]
    box: Box | None
    element: ET.Element
    order: int

    @property
    def primary_label(self) -> str:
        return self.labels[0] if self.labels else ""


@dataclass(frozen=True)
class SvgRoute:
    entity1: str
    entity2: str
    points: tuple[tuple[float, float], ...]
    order: int


@dataclass
class LayoutResult:
    moved_cells: int = 0
    routed_edges: int = 0
    preserved_native_layout: bool = False
    mapped_cells: list[str] = field(default_factory=list)
    unmapped_cells: list[str] = field(default_factory=list)
    ambiguous: list[str] = field(default_factory=list)


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _norm(text: str | None) -> str:
    if not text:
        return ""
    value = html.unescape(text).replace("\xa0", " ")
    value = re.sub(r"<br\s*/?>", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"<[^>]+>", " ", value)
    return " ".join(unicodedata.normalize("NFC", value).split())


def _float(value: str | None, default: float = 0.0) -> float:
    try:
        return float(value) if value is not None else default
    except ValueError:
        return default


def _union(boxes: Iterable[Box]) -> Box | None:
    values = list(boxes)
    if not values:
        return None
    left = min(box.x for box in values)
    top = min(box.y for box in values)
    right = max(box.x + box.width for box in values)
    bottom = max(box.y + box.height for box in values)
    return Box(left, top, right - left, bottom - top)


def _shape_box(element: ET.Element) -> Box | None:
    tag = _local_name(element.tag)
    if tag == "rect":
        return Box(
            _float(element.get("x")),
            _float(element.get("y")),
            _float(element.get("width")),
            _float(element.get("height")),
        )
    if tag in {"ellipse", "circle"}:
        rx = _float(element.get("rx"), _float(element.get("r")))
        ry = _float(element.get("ry"), _float(element.get("r")))
        return Box(_float(element.get("cx")) - rx, _float(element.get("cy")) - ry, 2 * rx, 2 * ry)
    if tag in {"polygon", "polyline"}:
        numbers = [float(n) for n in NUMBER_RE.findall(element.get("points", ""))]
        return _pairs_box(numbers)
    if tag == "line":
        x1, y1 = _float(element.get("x1")), _float(element.get("y1"))
        x2, y2 = _float(element.get("x2")), _float(element.get("y2"))
        return Box(min(x1, x2), min(y1, y2), abs(x2 - x1), abs(y2 - y1))
    if tag == "path":
        # PlantUML's generated paths use absolute coordinates. Including Bezier
        # controls makes this a conservative box, which is safe for placement.
        numbers = [float(n) for n in NUMBER_RE.findall(element.get("d", ""))]
        return _pairs_box(numbers)
    return None


def _svg_path_points(path_data: str, *, curve_steps: int = 8) -> tuple[tuple[float, float], ...]:
    tokens = re.findall(NUMBER_RE.pattern + r"|[A-Za-z]", path_data)
    points: list[tuple[float, float]] = []
    index = 0
    command = ""
    current = (0.0, 0.0)
    start = current

    def number() -> float:
        nonlocal index
        value = float(tokens[index])
        index += 1
        return value

    def pair(relative: bool) -> tuple[float, float]:
        x, y = number(), number()
        if relative:
            x += current[0]
            y += current[1]
        return x, y

    while index < len(tokens):
        if tokens[index].isalpha():
            command = tokens[index]
            index += 1
        if not command:
            break
        upper = command.upper()
        relative = command.islower()
        if upper == "M":
            current = pair(relative)
            start = current
            points.append(current)
            command = "l" if relative else "L"
        elif upper == "L":
            current = pair(relative)
            points.append(current)
        elif upper == "H":
            x = number() + (current[0] if relative else 0)
            current = (x, current[1])
            points.append(current)
        elif upper == "V":
            y = number() + (current[1] if relative else 0)
            current = (current[0], y)
            points.append(current)
        elif upper == "C":
            c1x, c1y, c2x, c2y, ex, ey = (number() for _ in range(6))
            if relative:
                c1x += current[0]
                c1y += current[1]
                c2x += current[0]
                c2y += current[1]
                ex += current[0]
                ey += current[1]
            p0 = current
            for step in range(1, curve_steps + 1):
                t = step / curve_steps
                inverse = 1 - t
                x = inverse**3 * p0[0] + 3 * inverse**2 * t * c1x + 3 * inverse * t**2 * c2x + t**3 * ex
                y = inverse**3 * p0[1] + 3 * inverse**2 * t * c1y + 3 * inverse * t**2 * c2y + t**3 * ey
                points.append((x, y))
            current = (ex, ey)
        elif upper == "Z":
            current = start
            points.append(current)
            command = ""
        else:
            return ()
    return tuple(points)


def _svg_link_routes(svg_root: ET.Element) -> list[SvgRoute]:
    routes: list[SvgRoute] = []
    for order, element in enumerate(svg_root.iter()):
        if _local_name(element.tag) != "g" or element.get("class") != "link":
            continue
        path = next((child for child in list(element) if _local_name(child.tag) == "path"), None)
        if path is None:
            continue
        points = _svg_path_points(path.get("d", ""))
        if len(points) >= 2:
            routes.append(
                SvgRoute(
                    element.get("data-entity-1", ""),
                    element.get("data-entity-2", ""),
                    points,
                    order,
                )
            )
    return routes


def _pairs_box(numbers: list[float]) -> Box | None:
    if len(numbers) < 2:
        return None
    xs, ys = numbers[0::2], numbers[1::2]
    if not xs or not ys:
        return None
    return Box(min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys))


def _text_box(element: ET.Element) -> Box:
    x = _float(element.get("x"))
    baseline = _float(element.get("y"))
    font_size = _float(element.get("font-size"), 14.0)
    label = _norm("".join(element.itertext()))
    width = _float(element.get("textLength"), max(font_size * 0.55, len(label) * font_size * 0.55))
    return Box(x, baseline - font_size * 0.9, width, font_size * 1.2)


def _svg_inventory(svg_root: ET.Element) -> tuple[list[SvgGroup], list[SvgText], list[Box], float, float]:
    groups: list[SvgGroup] = []
    texts: list[SvgText] = []
    shapes: list[Box] = []
    order = 0
    for element in svg_root.iter():
        tag = _local_name(element.tag)
        if tag == "text":
            label = _norm("".join(element.itertext()))
            if label:
                texts.append(SvgText(label, _text_box(element), element, order))
                order += 1
        if tag in SHAPE_TAGS:
            box = _shape_box(element)
            if box is not None and box.area > 0:
                shapes.append(box)

    group_order = 0
    for element in svg_root.iter():
        if _local_name(element.tag) != "g":
            continue
        kind = element.get("class", "")
        if kind not in GROUP_CLASSES:
            continue
        labels = tuple(
            _norm("".join(child.itertext()))
            for child in element.iter()
            if _local_name(child.tag) == "text" and _norm("".join(child.itertext()))
        )
        direct_shapes = [
            box
            for child in list(element)
            if _local_name(child.tag) in SHAPE_TAGS
            if (box := _shape_box(child)) is not None and box.area > 0
        ]
        box = _union(direct_shapes)
        if box is None and kind == "title":
            title_texts = [t.box for t in texts if t.label in labels]
            box = _union(title_texts)
        groups.append(SvgGroup(kind, labels, box, element, group_order))
        group_order += 1

    width = _float(svg_root.get("width"))
    height = _float(svg_root.get("height"))
    if (width <= 0 or height <= 0) and svg_root.get("viewBox"):
        values = [float(n) for n in NUMBER_RE.findall(svg_root.get("viewBox", ""))]
        if len(values) == 4:
            width, height = values[2], values[3]
    return groups, texts, shapes, width, height


def _native_label(user: ET.Element) -> str:
    return _norm(user.get("plantUmlBaseValue") or user.get("label") or "")


def _native_id(user: ET.Element, cell: ET.Element) -> str:
    return cell.get("id") or user.get("id") or ""


def _geometry(cell: ET.Element) -> ET.Element | None:
    return next((child for child in list(cell) if _local_name(child.tag) == "mxGeometry"), None)


def apply_state_label_layout(page: ET.Element, diagram_id: str) -> int:
    """Position native state-transition labels around their unchanged graph cells."""
    model = page.find("mxGraphModel")
    graph_root = model.find("root") if model is not None else None
    if graph_root is None:
        raise LayoutMappingError(f"Page {page.get('id')} has no expanded mxGraphModel/root")

    users = {user.get("id", ""): user for user in graph_root.findall("UserObject")}
    changed = 0
    for cell_id, (dx, dy) in STATE_EDGE_LABEL_OFFSETS.get(diagram_id, {}).items():
        user = users.get(cell_id)
        cell = user.find("mxCell") if user is not None else None
        geom = _geometry(cell) if cell is not None else None
        if cell is None or cell.get("edge") != "1" or geom is None:
            raise LayoutMappingError(f"{diagram_id} is missing native transition edge {cell_id}")
        offset = geom.find("mxPoint[@as='offset']")
        if offset is None:
            offset = ET.SubElement(geom, "mxPoint", {"as": "offset"})
        previous = (offset.get("x"), offset.get("y"))
        offset.set("x", _format(dx))
        offset.set("y", _format(dy))
        if previous != (offset.get("x"), offset.get("y")):
            changed += 1

    for cell_id, waypoints in STATE_EDGE_ROUTES.get(diagram_id, {}).items():
        user = users.get(cell_id)
        cell = user.find("mxCell") if user is not None else None
        geom = _geometry(cell) if cell is not None else None
        if cell is None or cell.get("edge") != "1" or geom is None:
            raise LayoutMappingError(f"{diagram_id} is missing native transition edge {cell_id}")
        points = geom.find("Array[@as='points']")
        if points is None:
            points = ET.SubElement(geom, "Array", {"as": "points"})
        current = tuple((_float(point.get("x")), _float(point.get("y"))) for point in points.findall("mxPoint"))
        normalized = tuple((_format(x), _format(y)) for x, y in waypoints)
        expected = tuple((float(x), float(y)) for x, y in normalized)
        if current != expected:
            for point in list(points):
                if _local_name(point.tag) == "mxPoint":
                    points.remove(point)
            for x, y in normalized:
                ET.SubElement(points, "mxPoint", {"x": x, "y": y})
            changed += 1

    title_x_width = STATE_TITLE_GEOMETRY.get(diagram_id)
    if title_x_width is not None:
        user = users.get("title_0")
        title = user.find("mxCell") if user is not None else None
        geom = _geometry(title) if title is not None else None
        if title is None or geom is None:
            raise LayoutMappingError(f"{diagram_id} is missing its native title cell")
        x, width = title_x_width
        previous = (geom.get("x"), geom.get("width"))
        geom.set("x", _format(x))
        geom.set("width", _format(width))
        if previous != (geom.get("x"), geom.get("width")):
            changed += 1
    return changed


def _current_origins(cells: dict[str, ET.Element]) -> dict[str, tuple[float, float]]:
    memo: dict[str, tuple[float, float]] = {"0": (0.0, 0.0), "1": (0.0, 0.0)}
    visiting: set[str] = set()

    def origin(cell_id: str) -> tuple[float, float]:
        if cell_id in memo:
            return memo[cell_id]
        if cell_id in visiting:
            raise LayoutMappingError(f"Native parent cycle at cell {cell_id}")
        visiting.add(cell_id)
        cell = cells.get(cell_id)
        if cell is None:
            memo[cell_id] = (0.0, 0.0)
        else:
            geom = _geometry(cell)
            local_x = _float(geom.get("x")) if geom is not None else 0.0
            local_y = _float(geom.get("y")) if geom is not None else 0.0
            parent_x, parent_y = origin(cell.get("parent", "1"))
            memo[cell_id] = (parent_x + local_x, parent_y + local_y)
        visiting.remove(cell_id)
        return memo[cell_id]

    for cell_id in cells:
        origin(cell_id)
    return memo


def _text_candidate(label: str, texts: list[SvgText], old_center_y: float) -> SvgText | None:
    candidates = [text for text in texts if text.label == label]
    if not candidates:
        return None
    return min(candidates, key=lambda text: (abs(text.box.center[1] - old_center_y), text.order))


def _smallest_containing_shape(box: Box, shapes: list[Box]) -> Box | None:
    cx, cy = box.center
    candidates = [
        shape
        for shape in shapes
        if shape.x - 1 <= cx <= shape.x + shape.width + 1
        and shape.y - 1 <= cy <= shape.y + shape.height + 1
        and shape.area > 0
    ]
    return min(candidates, key=lambda shape: shape.area) if candidates else None


def _lane_reference_box(svg_root: ET.Element, label_box: Box, width: float, height: float) -> Box | None:
    """Find a lane's frame from the long boundary lines surrounding its label."""
    verticals: list[tuple[float, float, float]] = []
    horizontals: list[tuple[float, float, float]] = []
    for element in svg_root.iter():
        if _local_name(element.tag) != "line":
            continue
        x1, y1 = _float(element.get("x1")), _float(element.get("y1"))
        x2, y2 = _float(element.get("x2")), _float(element.get("y2"))
        if abs(x1 - x2) <= 1 and abs(y2 - y1) >= height * 0.65:
            verticals.append(((x1 + x2) / 2, min(y1, y2), max(y1, y2)))
        if abs(y1 - y2) <= 1 and abs(x2 - x1) >= width * 0.65:
            horizontals.append(((y1 + y2) / 2, min(x1, x2), max(x1, x2)))

    cx, cy = label_box.center
    if len(verticals) >= 2:
        xs = sorted({line[0] for line in verticals})
        intervals = [(left, right) for left, right in zip(xs, xs[1:]) if left <= cx <= right]
        if intervals:
            left, right = min(intervals, key=lambda item: item[1] - item[0])
            frame_lines = [line for line in verticals if line[0] in {left, right}]
            top = max(line[1] for line in frame_lines)
            bottom = min(line[2] for line in frame_lines)
            if bottom > top:
                return Box(left, top, right - left, bottom - top)

    if len(horizontals) >= 2:
        ys = sorted({line[0] for line in horizontals})
        intervals = [(top, bottom) for top, bottom in zip(ys, ys[1:]) if top <= cy <= bottom]
        if intervals:
            top, bottom = min(intervals, key=lambda item: item[1] - item[0])
            frame_lines = [line for line in horizontals if line[0] in {top, bottom}]
            left = max(line[1] for line in frame_lines)
            right = min(line[2] for line in frame_lines)
            if right > left:
                return Box(left, top, right - left, bottom - top)
    return None


def _endpoint_center(
    cell_id: str,
    cells: dict[str, ET.Element],
    old_origins: dict[str, tuple[float, float]],
    current_widths: dict[str, tuple[float, float]],
    target_boxes: dict[str, Box],
) -> tuple[float, float] | None:
    cell = cells.get(cell_id)
    old_origin = old_origins.get(cell_id)
    if cell is None or old_origin is None:
        return None
    width, height = current_widths.get(cell_id, (0.0, 0.0))
    old_center = (old_origin[0] + width / 2, old_origin[1] + height / 2)
    target = target_boxes.get(cell_id)
    return target.center if target is not None else old_center


def _adjust_edge_routes(
    graph_root: ET.Element,
    cells: dict[str, ET.Element],
    old_origins: dict[str, tuple[float, float]],
    current_widths: dict[str, tuple[float, float]],
    target_boxes: dict[str, Box],
) -> None:
    """Move existing route points with their endpoint cells, preserving topology."""
    for cell in graph_root.iter("mxCell"):
        if cell.get("edge") != "1":
            continue
        source_id, target_id = cell.get("source", ""), cell.get("target", "")
        source_old = _endpoint_center(source_id, cells, old_origins, current_widths, {})
        target_old = _endpoint_center(target_id, cells, old_origins, current_widths, {})
        source_new = _endpoint_center(source_id, cells, old_origins, current_widths, target_boxes)
        target_new = _endpoint_center(target_id, cells, old_origins, current_widths, target_boxes)
        if None in {source_old, target_old, source_new, target_new}:
            continue
        assert source_old is not None and target_old is not None
        assert source_new is not None and target_new is not None
        source_delta = (source_new[0] - source_old[0], source_new[1] - source_old[1])
        target_delta = (target_new[0] - target_old[0], target_new[1] - target_old[1])
        geom = _geometry(cell)
        if geom is None:
            continue
        parent_id = cell.get("parent", "1")
        old_parent = old_origins.get(parent_id, (0.0, 0.0))
        new_parent_box = target_boxes.get(parent_id)
        new_parent = (new_parent_box.x, new_parent_box.y) if new_parent_box else old_parent

        def move_point(point: ET.Element, weight: float) -> None:
            old_x, old_y = _float(point.get("x")), _float(point.get("y"))
            global_x, global_y = old_x + old_parent[0], old_y + old_parent[1]
            dx = source_delta[0] * (1 - weight) + target_delta[0] * weight
            dy = source_delta[1] * (1 - weight) + target_delta[1] * weight
            point.set("x", _format(global_x + dx - new_parent[0]))
            point.set("y", _format(global_y + dy - new_parent[1]))

        source_point = geom.find("mxPoint[@as='sourcePoint']")
        target_point = geom.find("mxPoint[@as='targetPoint']")
        if source_point is not None:
            move_point(source_point, 0.0)
        if target_point is not None:
            move_point(target_point, 1.0)
        array = geom.find("Array[@as='points']")
        points = list(array.findall("mxPoint")) if array is not None else []
        vx, vy = target_old[0] - source_old[0], target_old[1] - source_old[1]
        length_sq = vx * vx + vy * vy
        for index, point in enumerate(points):
            absolute_x = _float(point.get("x")) + old_parent[0]
            absolute_y = _float(point.get("y")) + old_parent[1]
            if length_sq > 1:
                weight = ((absolute_x - source_old[0]) * vx + (absolute_y - source_old[1]) * vy) / length_sq
                weight = min(1.0, max(0.0, weight))
            else:
                weight = (index + 1) / (len(points) + 1)
            move_point(point, weight)


def _transfer_reference_link_routes(
    svg_root: ET.Element,
    graph_root: ET.Element,
    svg_ids_by_native_id: dict[str, str],
    target_boxes: dict[str, Box],
    margin: float,
) -> int:
    """Replace matched mxGraph waypoints with read-only SVG relationship paths."""
    routes = _svg_link_routes(svg_root)
    consumed: set[int] = set()
    transferred = 0
    for cell in graph_root.iter("mxCell"):
        if cell.get("edge") != "1":
            continue
        source_svg_id = svg_ids_by_native_id.get(cell.get("source", ""), "")
        target_svg_id = svg_ids_by_native_id.get(cell.get("target", ""), "")
        if not source_svg_id or not target_svg_id:
            continue
        candidates: list[tuple[float, int, SvgRoute, bool]] = []
        source_box = next(
            (target_boxes[cell_id] for cell_id, svg_id in svg_ids_by_native_id.items() if svg_id == source_svg_id and cell_id in target_boxes),
            None,
        )
        target_box = next(
            (target_boxes[cell_id] for cell_id, svg_id in svg_ids_by_native_id.items() if svg_id == target_svg_id and cell_id in target_boxes),
            None,
        )
        for route in routes:
            if route.order in consumed:
                continue
            reversed_route = False
            if (route.entity1, route.entity2) == (source_svg_id, target_svg_id):
                pass
            elif (route.entity2, route.entity1) == (source_svg_id, target_svg_id):
                reversed_route = True
            else:
                continue
            oriented = tuple(reversed(route.points)) if reversed_route else route.points
            if source_box is not None and target_box is not None:
                start, end = oriented[0], oriented[-1]
                start_x, start_y = start[0] + margin, start[1] + margin
                end_x, end_y = end[0] + margin, end[1] + margin
                start_dx = max(source_box.x - start_x, 0, start_x - source_box.x - source_box.width)
                start_dy = max(source_box.y - start_y, 0, start_y - source_box.y - source_box.height)
                end_dx = max(target_box.x - end_x, 0, end_x - target_box.x - target_box.width)
                end_dy = max(target_box.y - end_y, 0, end_y - target_box.y - target_box.height)
                cost = math.hypot(start_dx, start_dy) + math.hypot(end_dx, end_dy)
            else:
                cost = float(route.order)
            candidates.append((cost, route.order, route, reversed_route))
        if not candidates:
            continue
        _, _, route, reversed_route = min(candidates, key=lambda item: (item[0], item[1]))
        oriented = tuple(reversed(route.points)) if reversed_route else route.points
        geom = _geometry(cell)
        if geom is None:
            continue
        array = geom.find("Array[@as='points']")
        if array is not None:
            geom.remove(array)
        waypoints = oriented[1:-1]
        if waypoints:
            array = ET.SubElement(geom, "Array", {"as": "points"})
            for x, y in waypoints:
                ET.SubElement(array, "mxPoint", {"x": _format(x + margin), "y": _format(y + margin)})
        consumed.add(route.order)
        transferred += 1
    return transferred


def _format(value: float) -> str:
    rounded = round(value, 3)
    return str(int(rounded)) if rounded.is_integer() else f"{rounded:.3f}".rstrip("0").rstrip(".")


def transfer_page_geometry(page: ET.Element, svg_root: ET.Element, *, margin: float = 40) -> LayoutResult:
    """Transfer reference positions to existing native vertices without changing graph meaning."""
    if _local_name(svg_root.tag) != "svg":
        raise ValueError("Reference document must be an SVG root")
    model = page.find("mxGraphModel")
    graph_root = model.find("root") if model is not None else None
    if model is None or graph_root is None:
        raise LayoutMappingError(f"Page {page.get('id')} has no expanded mxGraphModel/root")

    if any("image=data:image/svg+xml" in cell.get("style", "") for cell in graph_root.iter("mxCell")):
        raise LayoutMappingError(f"Page {page.get('id')} contains an SVG image cell")
    if svg_root.get("data-diagram-type") in {"ACTIVITY", "SEQUENCE", "STATE"}:
        # The native converter already preserves these control-flow, message,
        # and lifecycle routes closely. Keep their vertices and routes intact,
        # while separating the small set of state-edge labels that overlap.
        result = LayoutResult(preserved_native_layout=True)
        if svg_root.get("data-diagram-type") == "STATE":
            result.moved_cells = apply_state_label_layout(page, page.get("id", "").removeprefix("page-"))
        return result

    groups, texts, shapes, svg_width, svg_height = _svg_inventory(svg_root)
    if svg_width <= 0 or svg_height <= 0:
        raise LayoutMappingError(f"Reference SVG for {page.get('id')} has no positive dimensions")

    users = [
        user
        for user in graph_root.findall("UserObject")
        if (cell := user.find("mxCell")) is not None and cell.get("vertex") == "1"
    ]
    cells = {
        _native_id(user, cell): cell
        for user in graph_root.findall("UserObject")
        if (cell := user.find("mxCell")) is not None and _native_id(user, cell)
    }
    cells.update(
        {cell.get("id"): cell for cell in graph_root.findall("mxCell") if cell.get("id")}
    )
    old_origins = _current_origins(cells)

    # Build node-level group candidates by their visible primary line. This
    # preserves class/entity boxes instead of collapsing them to text anchors.
    cluster_groups: dict[str, list[SvgGroup]] = {}
    entity_groups: dict[str, list[SvgGroup]] = {}
    title_groups: dict[str, list[SvgGroup]] = {}
    for group in groups:
        if not group.primary_label:
            continue
        target = {"cluster": cluster_groups, "entity": entity_groups, "title": title_groups}[group.kind]
        target.setdefault(group.primary_label, []).append(group)

    native_group_counts: dict[tuple[str, str], int] = {}
    for user in users:
        label = _native_label(user)
        cell = user.find("mxCell")
        style = cell.get("style", "") if cell is not None else ""
        if not label or "shape=image" in style or "image=data:image/svg+xml" in style:
            continue
        category = "cluster" if (
            "shape=folder" in style
            or ("swimlane" in style and label in cluster_groups)
            or ("swimlane" in style and label not in entity_groups)
        ) else "entity"
        key = (category, label)
        native_group_counts[key] = native_group_counts.get(key, 0) + 1

    # Plan every geometry update before changing the XML, so ambiguity cannot
    # leave a partially laid out page.
    target_boxes: dict[str, Box] = {}
    svg_ids_by_native_id: dict[str, str] = {}
    result = LayoutResult()
    used_groups: set[int] = set()
    used_texts: set[int] = set()

    for user in users:
        cell = user.find("mxCell")
        if cell is None or cell.get("vertex") != "1":
            continue
        cell_id = _native_id(user, cell)
        label = _native_label(user)
        style = cell.get("style", "")
        geom = _geometry(cell)
        if not label or geom is None or cell_id not in old_origins:
            if label and cell_id:
                result.unmapped_cells.append(f"{cell_id}:{label}")
            continue

        old_x, old_y = old_origins[cell_id]
        old_center_y = old_y + _float(geom.get("height")) / 2
        is_text_cell = style.startswith("text;") or cell_id.startswith(("title_", "actorlbl_"))
        group_kind = "cluster" if (
            "shape=folder" in style
            or ("swimlane" in style and label in cluster_groups)
            or ("swimlane" in style and label not in entity_groups)
        ) else "entity"
        is_container = group_kind == "cluster"

        record_candidates: list[SvgGroup] = []
        if is_text_cell:
            record_candidates = title_groups.get(label, [])
            if not record_candidates:
                text = _text_candidate(label, texts, old_center_y)
                if text is not None:
                    desired = text.box.shifted(margin)
                    target_boxes[cell_id] = Box(
                        desired.x,
                        desired.y,
                        desired.width,
                        desired.height,
                    )
                    used_texts.add(id(text.element))
                    result.mapped_cells.append(cell_id)
                    continue
        else:
            record_candidates = {"cluster": cluster_groups, "entity": entity_groups}[group_kind].get(label, [])

        # A text cell can use the title group's full text bounds. Other group
        # matches use the native object's actual primitive shape bounds.
        if record_candidates:
            available = [candidate for candidate in record_candidates if id(candidate.element) not in used_groups]
            if len(available) > 1:
                expected_count = native_group_counts.get(("cluster" if is_container else "entity", label), 0)
                if expected_count != len(available):
                    result.ambiguous.append(
                        f"{cell_id}:{label} maps to {len(available)} SVG {available[0].kind} groups; matching native count is {expected_count}"
                    )
                    continue
                available.sort(key=lambda item: item.order)
            if available:
                candidate = min(available, key=lambda item: (abs((item.box.center[1] if item.box else old_center_y) - old_center_y), item.order))
                box = candidate.box
                if box is None and candidate.labels:
                    text = _text_candidate(candidate.primary_label, texts, old_center_y)
                    box = text.box if text is not None else None
                if box is not None:
                    target_boxes[cell_id] = box.shifted(margin)
                    if candidate.element.get("id"):
                        svg_ids_by_native_id[cell_id] = candidate.element.get("id", "")
                    used_groups.add(id(candidate.element))
                    result.mapped_cells.append(cell_id)
                    continue

        # Non-container boxes such as actions/sequence frames frequently have
        # no semantic SVG <g>. Their native label still identifies its SVG text.
        text = _text_candidate(label, texts, old_center_y)
        if text is not None:
            text_box = text.box
            shape = _smallest_containing_shape(text_box, shapes)
            reference_box = shape or text_box
            current_width = _float(geom.get("width"))
            current_height = _float(geom.get("height"))
            if is_container:
                reference_box = _lane_reference_box(svg_root, text_box, svg_width, svg_height)
                if reference_box is None:
                    center_x, center_y = text_box.center
                    reference_box = Box(
                        center_x - current_width / 2,
                        center_y - current_height / 2,
                        current_width,
                        current_height,
                    )
            elif shape is None or is_text_cell:
                center_x, center_y = text_box.center
                reference_box = Box(
                    center_x - current_width / 2,
                    center_y - current_height / 2,
                    current_width,
                    current_height,
                )
            target_boxes[cell_id] = reference_box.shifted(margin)
            used_texts.add(id(text.element))
            result.mapped_cells.append(cell_id)
        else:
            result.unmapped_cells.append(f"{cell_id}:{label}")

    if result.ambiguous:
        raise LayoutMappingError("Ambiguous SVG/native geometry mapping: " + "; ".join(result.ambiguous))

    # Actor glyphs are separate from their text cells in mxGraph. Pair them by
    # the converter's stable actor/actorlbl sequence and position the native glyph.
    by_object_id = {user.get("id", ""): user for user in graph_root.findall("UserObject")}
    for user in users:
        cell = user.find("mxCell")
        if cell is None or "shape=umlActor" not in cell.get("style", ""):
            continue
        object_id = user.get("id", "")
        match = re.fullmatch(r"actor_(\d+)", object_id)
        if not match:
            continue
        label_user = by_object_id.get(f"actorlbl_{int(match.group(1)) + 1}")
        label_text = _native_label(label_user) if label_user is not None else ""
        actor_group = next(
            (
                group
                for group in groups
                if group.kind == "entity" and label_text and label_text in group.labels
            ),
            None,
        )
        geom = _geometry(cell)
        cell_id = _native_id(user, cell)
        if actor_group is None or actor_group.box is None or geom is None:
            result.unmapped_cells.append(f"{cell_id}:actor glyph {label_text}")
            continue
        actor_shapes = [
            box
            for child in list(actor_group.element)
            if _local_name(child.tag) in SHAPE_TAGS
            if (box := _shape_box(child)) is not None and box.area > 0
        ]
        glyph_box = _union(actor_shapes)
        if glyph_box is None:
            glyph_box = actor_group.box
        width, height = _float(geom.get("width")), _float(geom.get("height"))
        cx, cy = glyph_box.center
        target_boxes[cell_id] = Box(cx - width / 2 + margin, cy - height / 2 + margin, width, height)
        actor_svg_id = actor_group.element.get("id")
        if actor_svg_id:
            svg_ids_by_native_id[cell_id] = actor_svg_id
        result.mapped_cells.append(cell_id)

    current_widths = {cell_id: (_float(_geometry(cell).get("width")), _float(_geometry(cell).get("height"))) for cell_id, cell in cells.items() if _geometry(cell) is not None}
    new_origins: dict[str, tuple[float, float]] = {}
    for cell_id, box in target_boxes.items():
        cell = cells.get(cell_id)
        geom = _geometry(cell) if cell is not None else None
        if geom is None:
            continue
        parent_id = cell.get("parent", "1")
        if parent_id in target_boxes:
            parent_x, parent_y = target_boxes[parent_id].x, target_boxes[parent_id].y
        else:
            parent_x, parent_y = old_origins.get(parent_id, (0.0, 0.0))
        geom.set("x", _format(box.x - parent_x))
        geom.set("y", _format(box.y - parent_y))
        if not (cell.get("style", "").startswith("text;") or cell_id.startswith("actorlbl_")):
            geom.set("width", _format(box.width))
            geom.set("height", _format(box.height))
        new_origins[cell_id] = (box.x, box.y)
        if current_widths.get(cell_id) != (box.width, box.height) or abs(box.x - old_origins.get(cell_id, (box.x, box.y))[0]) > 0.1 or abs(box.y - old_origins.get(cell_id, (box.x, box.y))[1]) > 0.1:
            result.moved_cells += 1

    _adjust_edge_routes(graph_root, cells, old_origins, current_widths, target_boxes)
    result.routed_edges = _transfer_reference_link_routes(svg_root, graph_root, svg_ids_by_native_id, target_boxes, margin)

    model.set("pageWidth", str(math.ceil(svg_width + margin * 2)))
    model.set("pageHeight", str(math.ceil(svg_height + margin * 2)))

    # Preserve the converter's supported edge forms, including flow endpoints
    # encoded as sourcePoint/targetPoint without a vertex terminal.
    if any("image=data:image/svg+xml" in cell.get("style", "") for cell in graph_root.iter("mxCell")):
        raise LayoutMappingError(f"Page {page.get('id')} contains an SVG image cell")
    return result


def layout_document(drawio_path: Path, svg_dir: Path) -> list[tuple[str, LayoutResult]]:
    tree = ET.parse(drawio_path)
    root = tree.getroot()
    if _local_name(root.tag) != "mxfile":
        raise LayoutMappingError("Native draw.io file must have an mxfile root")
    results: list[tuple[str, LayoutResult]] = []
    for page in root.findall("diagram"):
        page_id = page.get("id", "")
        diagram_id = page_id.removeprefix("page-")
        reference = _reference_svg(diagram_id, svg_dir)
        if reference is None:
            raise LayoutMappingError(f"No reference SVG found for {diagram_id}")
        svg_root = ET.parse(reference).getroot()
        results.append((diagram_id, transfer_page_geometry(page, svg_root)))
    if len(results) != PRIMARY_ACTIVE_PAGE_COUNT:
        raise LayoutMappingError(f"Expected {PRIMARY_ACTIVE_PAGE_COUNT} active pages to lay out; found {len(results)}")
    return results


def _reference_svg(diagram_id: str, svg_dir: Path, report_svg_dir: Path = DEFAULT_REPORT_SVG_DIR) -> Path | None:
    reference_dir = report_svg_dir if diagram_id.startswith("VIEW-RUC-") else svg_dir
    return next(iter(sorted(reference_dir.glob(f"{diagram_id}-*.svg"))), None)


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--drawio", type=Path, default=DEFAULT_DRAWIO)
    parser.add_argument("--svg-dir", type=Path, default=DEFAULT_SVG_DIR)
    args = parser.parse_args(argv)
    try:
        # Build the whole result in memory first; on any ambiguous page nothing
        # is written to disk.
        tree = ET.parse(args.drawio)
        root = tree.getroot()
        results: list[tuple[str, LayoutResult]] = []
        for page in root.findall("diagram"):
            diagram_id = page.get("id", "").removeprefix("page-")
            reference = _reference_svg(diagram_id, args.svg_dir)
            if reference is None:
                raise LayoutMappingError(f"No reference SVG found for {diagram_id}")
            results.append((diagram_id, transfer_page_geometry(page, ET.parse(reference).getroot())))
        if len(results) != PRIMARY_ACTIVE_PAGE_COUNT:
            raise LayoutMappingError(f"Expected {PRIMARY_ACTIVE_PAGE_COUNT} active pages to lay out; found {len(results)}")
        ET.indent(root, space="  ")
        tree.write(args.drawio, encoding="utf-8", xml_declaration=True)
        for diagram_id, result in results:
            print(
                f"{diagram_id}: moved={result.moved_cells}, routes={result.routed_edges}, mapped={len(result.mapped_cells)}, "
                f"unmapped={len(result.unmapped_cells)}, preserved={result.preserved_native_layout}"
            )
            for item in result.unmapped_cells[:8]:
                print(f"  UNMAPPED {item}")
            if len(result.unmapped_cells) > 8:
                print(f"  ... {len(result.unmapped_cells) - 8} additional unmapped cells")
        print(f"PASS: applied native-cell geometry to {len(results)} pages; SVGs were not embedded")
        return 0
    except (ET.ParseError, OSError, LayoutMappingError, ValueError) as error:
        print(f"FAIL: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
