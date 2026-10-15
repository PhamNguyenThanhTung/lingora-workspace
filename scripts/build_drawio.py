#!/usr/bin/env python3
"""Build Lingora multi-page draw.io file with PlantUML integration.

Combines high-fidelity vector rendering (Graphviz layout) with native draw.io
PlantUML integration (plantUmlData + editIcon), allowing full in-app editing
via draw.io's built-in PlantUML editor while preserving pixel-perfect layouts.

Usage:
    py -3.13 scripts/build_drawio.py
"""

from __future__ import annotations

import json
import re
import sys
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUML_DIR = ROOT / "docs" / "modeling" / "current-target" / "src"
SVG_DIR = ROOT / "docs" / "modeling" / "current-target" / "rendered"
OUTPUT_FILE = ROOT / "docs" / "modeling" / "current-target" / "lingora-all-diagrams-svg-editable.drawio"

GROUP_ORDER = ["SYS", "UC", "ACT", "STA", "DOM", "DATA", "SEQ", "SEC", "DEP"]

ID_MAP = {
    "SYS-01": "Hệ thống - Tổng quan hệ thống hiện tại",
    "SYS-02": "Hệ thống - Tổng quan hệ thống mục tiêu",
    "SYS-03": "Hệ thống - Components hiện tại",
    "SYS-04": "Hệ thống - Components mục tiêu",
    "UC-01": "Use Case - Tổng quan Lingora",
    "UC-02": "Use Case - Học viên",
    "UC-03": "Use Case - Giáo viên",
    "UC-04": "Use Case - Quản trị viên",
    "ACT-01": "Activity - Onboarding học viên",
    "ACT-02": "Activity - Placement Assessment",
    "ACT-03": "Activity - Học bài và luyện tập",
    "ACT-04": "Activity - Level-up Assessment",
    "ACT-05": "Activity - Reassessment - Deferred",
    "ACT-06": "Activity - Ôn tập SRS",
    "ACT-07": "Activity - Provision và quản lý Teacher",
    "ACT-08": "Activity - Content Governance",
    "ACT-09": "Activity - Revision Replacement",
    "STA-01": "State - Trạng thái tài khoản",
    "STA-02": "State - Vòng đời Assignment",
    "STA-03": "State - Vòng đời Content Revision",
    "DOM-01": "Domain - Mô hình miền Lingora",
    "DATA-01": "Data - Migration ERD hiện tại",
    "DATA-02": "Data - Prisma Model hiện tại",
    "DATA-03": "Data - Logical ERD mục tiêu",
    "SEQ-01": "Sequence - Đăng nhập và kiểm tra tài khoản",
    "SEQ-02": "Sequence - Provision Teacher",
    "SEQ-03": "Sequence - Teacher soạn và submit nội dung",
    "SEQ-04": "Sequence - Review approve và publish",
    "SEQ-05": "Sequence - Thay thế revision",
    "SEQ-06": "Sequence - Học bài và xử lý exercise",
    "SEQ-07": "Sequence - Placement và Level-up",
    "SEQ-08": "Sequence - Ôn tập SRS",
    "SEQ-09": "Sequence - Hỗ trợ và disable tài khoản",
    "SEC-01": "Security - Trust Boundary DFD",
    "DEP-01": "Deployment - Hệ thống hiện tại",
    "DEP-02": "Deployment - Kiến trúc triển khai mục tiêu",
}

INCLUDE_PATTERN = re.compile(r"^\s*!include(?:url)?\b", re.IGNORECASE)


def expand_puml_source(puml_path: Path) -> str:
    """Make the edit payload self-contained using only the shared local style."""
    source_path = puml_path.resolve()
    if not source_path.is_file():
        raise ValueError(f"PlantUML source is missing: {puml_path}")

    raw_source = source_path.read_text(encoding="utf-8")
    directives = [line for line in raw_source.splitlines() if INCLUDE_PATTERN.match(line)]
    if not directives:
        return raw_source
    if len(directives) != 1 or directives[0].strip() != "!include ../style.puml":
        raise ValueError(f"Unsupported PlantUML include in {source_path.name}: {'; '.join(directives)}")

    source_root = source_path.parent
    style_path = (source_root.parent / "style.puml").resolve()
    requested_style = (source_root / "../style.puml").resolve()
    if requested_style != style_path or not style_path.is_file():
        raise ValueError(f"Shared style include is missing or outside the task directory: {source_path.name}")

    style_body = "\n".join(
        line
        for line in style_path.read_text(encoding="utf-8").splitlines()
        if not re.match(r"^\s*@(start|end)uml\b", line, re.IGNORECASE)
    ).strip("\n")
    return re.sub(
        r"^[ \t]*!include(?:url)?\b[^\r\n]*$",
        lambda _match: style_body,
        raw_source,
        count=1,
        flags=re.MULTILINE | re.IGNORECASE,
    )


def build() -> int:
    svg_files = sorted(SVG_DIR.glob("*.svg"))
    items = []
    for p in svg_files:
        m = re.match(r"^([A-Z]+-\d+)", p.name)
        if m:
            id_code = m.group(1)
            puml_candidates = list(PUML_DIR.glob(f"{id_code}*.puml"))
            puml_path = puml_candidates[0] if puml_candidates else None
            items.append((id_code, p, puml_path))

    def sort_key(item):
        id_code, _, _ = item
        prefix, num = id_code.split("-")
        grp_idx = GROUP_ORDER.index(prefix) if prefix in GROUP_ORDER else 99
        return (grp_idx, int(num))

    items.sort(key=sort_key)

    root = ET.Element("mxfile", attrib={
        "host": "Electron",
        "agent": "Lingora Diagrams Builder",
        "version": "24.7.17",
        "type": "device"
    })

    margin = 40
    for idx, (id_code, svg_path, puml_path) in enumerate(items, start=1):
        friendly = ID_MAP.get(id_code, id_code)
        page_name = f"{idx:02d} - {friendly} ({id_code})"

        svg_tree = ET.parse(svg_path)
        svg_root = svg_tree.getroot()
        w_str = svg_root.attrib.get("width", "")
        h_str = svg_root.attrib.get("height", "")
        vb = svg_root.attrib.get("viewBox", "")
        w, h = 0.0, 0.0
        if w_str and h_str:
            w = float(re.search(r"[\d.]+", w_str).group(0))
            h = float(re.search(r"[\d.]+", h_str).group(0))
        elif vb:
            parts = vb.split()
            w, h = float(parts[2]), float(parts[3])
        else:
            w, h = 800.0, 600.0

        int_w = int(round(w))
        int_h = int(round(h))
        page_w = int_w + margin * 2
        page_h = int_h + margin * 2

        raw_svg = svg_path.read_bytes()
        escaped_svg = urllib.parse.quote_from_bytes(raw_svg, safe="")
        data_uri = f"data:image/svg+xml,{escaped_svg}"

        puml_source = expand_puml_source(puml_path) if puml_path else ""
        puml_data_obj = {"data": puml_source, "config": None}
        puml_data_json = json.dumps(puml_data_obj)

        diagram = ET.SubElement(root, "diagram", attrib={
            "id": f"page-{id_code}",
            "name": page_name
        })

        model = ET.SubElement(diagram, "mxGraphModel", attrib={
            "dx": "0", "dy": "0", "grid": "1", "gridSize": "10", "guides": "1",
            "tooltips": "1", "connect": "1", "arrows": "1", "fold": "1", "page": "1",
            "pageScale": "1", "pageWidth": str(page_w), "pageHeight": str(page_h),
            "math": "0", "shadow": "0"
        })

        model_root = ET.SubElement(model, "root")
        ET.SubElement(model_root, "mxCell", attrib={"id": "0"})
        ET.SubElement(model_root, "mxCell", attrib={"id": "1", "parent": "0"})

        style = (
            f"shape=image;verticalLabelPosition=bottom;labelBackgroundColor=default;"
            f"verticalAlign=top;aspect=fixed;imageAspect=0;strokeColor=none;fillColor=none;"
            f"editIcon=1;image={data_uri};"
        )

        user_obj = ET.SubElement(model_root, "UserObject", attrib={
            "id": "2",
            "label": "",
            "plantUmlData": puml_data_json
        })

        cell = ET.SubElement(user_obj, "mxCell", attrib={
            "style": style,
            "vertex": "1",
            "parent": "1"
        })

        ET.SubElement(cell, "mxGeometry", attrib={
            "x": str(margin),
            "y": str(margin),
            "width": str(int_w),
            "height": str(int_h),
            "as": "geometry"
        })

    ET.indent(root, space="  ", level=0)
    xml_bytes = ET.tostring(root, encoding="utf-8", xml_declaration=True)
    OUTPUT_FILE.write_bytes(xml_bytes)
    print(f"Generated: {OUTPUT_FILE} ({len(items)} pages, {len(xml_bytes)/1024:.1f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(build())
