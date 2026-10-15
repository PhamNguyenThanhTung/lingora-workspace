#!/usr/bin/env python3
"""Validate the native, editable Lingora multi-page draw.io document."""

from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
MODEL = ROOT / "docs" / "modeling" / "current-target"
PUML_DIR = MODEL / "src"
REPORT_PUML_DIR = MODEL.parent / "report-usecases"
DRAWIO_PATH = MODEL / "lingora-all-diagrams.drawio"
GROUP_ORDER = ["SYS", "UC", "VIEW-RUC", "ACT", "STA", "DOM", "DATA", "SEQ", "SEC", "DEP"]
OMITTED_PRIMARY_DRAWIO_IDS = {"ACT-05"}
REPORT_DIAGRAM_IDS = [
    "VIEW-RUC-01", "VIEW-RUC-02", "VIEW-RUC-03", "VIEW-RUC-04", "VIEW-RUC-05",
    "VIEW-RUC-06", "VIEW-RUC-07", "VIEW-RUC-08A", "VIEW-RUC-08B",
]
NAME_PATTERN = re.compile(r"^(\d{2})\s*-\s*.+\s*\(((?:VIEW-RUC-\d{2}[A-B]?)|(?:[A-Z]+-\d+))\)$")
ID_PATTERN = re.compile(r"^(VIEW-RUC-\d{2}[A-B]?|[A-Z]+-\d+)")
PAGE_ID_PATTERN = re.compile(r"page-((?:VIEW-RUC-\d{2}[A-B]?)|(?:[A-Z]+-\d+))")
INCLUDE_PATTERN = re.compile(r"^\s*!include(?:url)?\b", re.IGNORECASE)


def expand_source(source_path: Path, puml_dir: Path) -> str:
    """Expand only the exact shared style include into a standalone source."""
    source_root = puml_dir.resolve()
    resolved_source = source_path.resolve()
    relative = resolved_source.relative_to(source_root)
    if not relative.parts or relative.as_posix().startswith("../"):
        raise ValueError(f"Source is outside the canonical directory: {source_path}")
    raw_source = resolved_source.read_text(encoding="utf-8")
    directives = [line for line in raw_source.splitlines() if INCLUDE_PATTERN.match(line)]
    if not directives:
        return raw_source
    include_targets = {
        "!include ../style.puml": (source_root.parent / "style.puml").resolve(),
        "!include ../current-target/style.puml": (source_root.parent / "current-target" / "style.puml").resolve(),
    }
    directive = directives[0].strip() if directives else ""
    if len(directives) != 1 or directive not in include_targets:
        raise ValueError(f"Unsupported PlantUML include in {source_path.name}: {'; '.join(directives)}")
    style_path = include_targets[directive]
    requested_path = (source_root / directive.replace("!include ", "", 1)).resolve()
    if style_path != requested_path or not style_path.is_file():
        raise ValueError(f"Shared style include is missing or outside the task directory: {source_path.name}")
    style_body = "\n".join(
        line
        for line in style_path.read_text(encoding="utf-8").splitlines()
        if not re.match(r"^\s*@(start|end)uml\b", line, re.IGNORECASE)
    ).strip("\n")
    return re.sub(r"^\s*!include(?:url)?\b[^\r\n]*$", lambda _match: style_body, raw_source, count=1, flags=re.MULTILINE | re.IGNORECASE)


def _canonical_order(diagram_ids: list[str]) -> list[str]:
    def key(diagram_id: str) -> tuple[int, int, str]:
        if diagram_id.startswith("VIEW-RUC-"):
            group, number = "VIEW-RUC", re.search(r"VIEW-RUC-(\d+)", diagram_id).group(1)
        else:
            group, number = diagram_id.split("-", 1)
        group_index = GROUP_ORDER.index(group) if group in GROUP_ORDER else len(GROUP_ORDER)
        return group_index, int(number), diagram_id

    return sorted(diagram_ids, key=key)


def validate_document(root: ET.Element, canonical_sources: dict[str, str]) -> list[str]:
    """Return all identity, native-cell, asset, and editable-source errors."""
    errors: list[str] = []
    if root.tag != "mxfile":
        return [f"Root tag must be 'mxfile', got {root.tag!r}"]

    diagrams = root.findall("diagram")
    expected_ids = _canonical_order(
        [diagram_id for diagram_id in canonical_sources if diagram_id not in OMITTED_PRIMARY_DRAWIO_IDS]
    )
    if len(diagrams) != len(expected_ids):
        errors.append(f"Page count is {len(diagrams)}; expected {len(expected_ids)}")
    page_ids: list[str] = []
    page_names: list[str] = []
    for index, page in enumerate(diagrams, start=1):
        page_id = page.attrib.get("id", "")
        page_name = page.attrib.get("name", "")
        page_ids.append(page_id)
        page_names.append(page_name)
        name_match = NAME_PATTERN.match(page_name)
        page_match = PAGE_ID_PATTERN.fullmatch(page_id)
        if not name_match or not page_match:
            errors.append(f"Page {index} has malformed ID/name: {page_id!r} / {page_name!r}")
            continue
        diagram_id = name_match.group(2)
        if page_match.group(1) != diagram_id:
            errors.append(f"Page {index} ID and name disagree: {page_id!r} / {page_name!r}")
        if diagram_id in OMITTED_PRIMARY_DRAWIO_IDS:
            errors.append(f"Page {index} includes {diagram_id}, which is excluded from the active deliverable")
        if diagram_id not in canonical_sources:
            errors.append(f"Page {index} has unknown diagram ID {diagram_id}")
        if index <= len(expected_ids) and diagram_id != expected_ids[index - 1]:
            errors.append(f"Page {index} is {diagram_id}; expected {expected_ids[index - 1]}")
        if int(name_match.group(1)) != index:
            errors.append(f"Page {index} numbering is {name_match.group(1)}")

        model = page.find("mxGraphModel")
        if model is None:
            errors.append(f"{diagram_id} has no mxGraphModel")
            continue
        native_shapes = []
        for cell in model.findall(".//mxCell"):
            style = cell.attrib.get("style", "")
            cell_id = cell.attrib.get("id", "")
            if cell_id in {"0", "1"} or "shape=image" in style:
                continue
            if "image=http://" in style or "image=https://" in style or "image=file://" in style:
                errors.append(f"{diagram_id} contains an external image dependency")
            geometry = cell.find("mxGeometry")
            has_geometry = geometry is not None and (
                float(geometry.attrib.get("width", "0") or "0") > 0
                or float(geometry.attrib.get("height", "0") or "0") > 0
            )
            if cell.attrib.get("edge") == "1" or (cell.attrib.get("vertex") == "1" and has_geometry):
                native_shapes.append(cell)
        if not native_shapes:
            errors.append(f"{diagram_id} has no native editable cells")

        expected_source = canonical_sources.get(diagram_id)
        payloads: list[str] = []
        for user_object in page.findall(".//UserObject"):
            encoded = user_object.attrib.get("plantUmlData")
            if not encoded:
                continue
            try:
                payload = json.loads(encoded)
            except json.JSONDecodeError as error:
                errors.append(f"{diagram_id} has invalid PlantUML edit payload: {error}")
                continue
            data = payload.get("data") if isinstance(payload, dict) else None
            if isinstance(data, str):
                payloads.append(data)
        if expected_source is not None and expected_source not in payloads:
            errors.append(f"{diagram_id} PlantUML edit payload is missing or differs from canonical expanded source")

    if len(set(page_ids)) != len(page_ids):
        errors.append("Duplicate draw.io page IDs")
    if len(set(page_names)) != len(page_names):
        errors.append("Duplicate draw.io page names")
    return errors


def load_canonical_sources() -> dict[str, str]:
    sources: dict[str, str] = {}
    for source_path in sorted(PUML_DIR.glob("*.puml"), key=lambda item: item.name):
        match = ID_PATTERN.match(source_path.name)
        if not match:
            raise ValueError(f"Source filename has no canonical diagram ID: {source_path.name}")
        diagram_id = match.group(1)
        if diagram_id in sources:
            raise ValueError(f"Duplicate canonical diagram ID: {diagram_id}")
        sources[diagram_id] = expand_source(source_path, PUML_DIR)
    if len(sources) != 36:
        raise ValueError(f"Expected 36 canonical sources, found {len(sources)}")
    return sources


def load_report_usecase_sources() -> dict[str, str]:
    sources: dict[str, str] = {}
    for source_path in sorted(REPORT_PUML_DIR.glob("VIEW-RUC-*.puml"), key=lambda item: item.name):
        match = ID_PATTERN.match(source_path.name)
        if not match:
            raise ValueError(f"Report source filename has no VIEW-RUC diagram ID: {source_path.name}")
        diagram_id = match.group(1)
        if diagram_id in sources:
            raise ValueError(f"Duplicate report diagram ID: {diagram_id}")
        sources[diagram_id] = expand_source(source_path, REPORT_PUML_DIR)
    if list(_canonical_order(sources)) != REPORT_DIAGRAM_IDS or set(sources) != set(REPORT_DIAGRAM_IDS):
        raise ValueError(f"Expected the nine report Use Case views in README order, found {list(_canonical_order(sources))}")
    return sources


def load_all_sources() -> dict[str, str]:
    sources = load_canonical_sources()
    report_sources = load_report_usecase_sources()
    overlap = sources.keys() & report_sources.keys()
    if overlap:
        raise ValueError(f"Canonical and report diagram IDs overlap: {sorted(overlap)}")
    return {**sources, **report_sources}


def validate() -> int:
    if not DRAWIO_PATH.is_file():
        print(f"ERROR: File not found: {DRAWIO_PATH}", file=sys.stderr)
        return 1
    try:
        root = ET.parse(DRAWIO_PATH).getroot()
        errors = validate_document(root, load_all_sources())
    except (OSError, ET.ParseError, ValueError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        print(f"FAIL: native draw.io validation found {len(errors)} error(s)", file=sys.stderr)
        return 1
    print(f"PASS: {DRAWIO_PATH} contains 35 ordered active native pages with matching standalone PUML edit payloads")
    return 0


if __name__ == "__main__":
    raise SystemExit(validate())
