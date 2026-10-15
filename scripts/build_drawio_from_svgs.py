#!/usr/bin/env python3
"""Build a multi-page draw.io file from Lingora canonical rendered SVG diagrams.

Usage:
    py -3.13 scripts/build_drawio_from_svgs.py
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT_FILE = ROOT / "docs" / "modeling" / "current-target" / "lingora-all-diagrams-svg.drawio"

# Group display order
GROUP_ORDER = [
    "SYS",   # 1. System
    "UC",    # 2. Use Case
    "ACT",   # 3. Activity
    "STA",   # 4. State
    "DOM",   # 5. Domain
    "DATA",  # 6. Data / ERD
    "SEQ",   # 7. Sequence
    "SEC",   # 8. Security
    "DEP",   # 9. Deployment
]

# Canonical friendly naming mapping (ID -> friendly title)
ID_MAP = {
    # System
    "SYS-01": "Hệ thống - Tổng quan hệ thống hiện tại",
    "SYS-02": "Hệ thống - Tổng quan hệ thống mục tiêu",
    "SYS-03": "Hệ thống - Components hiện tại",
    "SYS-04": "Hệ thống - Components mục tiêu",

    # Use Case
    "UC-01": "Use Case - Tổng quan Lingora",
    "UC-02": "Use Case - Học viên",
    "UC-03": "Use Case - Giáo viên",
    "UC-04": "Use Case - Quản trị viên",

    # Activity
    "ACT-01": "Activity - Onboarding học viên",
    "ACT-02": "Activity - Placement Assessment",
    "ACT-03": "Activity - Học bài và luyện tập",
    "ACT-04": "Activity - Level-up Assessment",
    "ACT-05": "Activity - Reassessment - Deferred",
    "ACT-06": "Activity - Ôn tập SRS",
    "ACT-07": "Activity - Provision và quản lý Teacher",
    "ACT-08": "Activity - Content Governance",
    "ACT-09": "Activity - Revision Replacement",

    # State
    "STA-01": "State - Trạng thái tài khoản",
    "STA-02": "State - Vòng đời Assignment",
    "STA-03": "State - Vòng đời Content Revision",

    # Domain
    "DOM-01": "Domain - Mô hình miền Lingora",

    # Data / ERD
    "DATA-01": "Data - Migration ERD hiện tại",
    "DATA-02": "Data - Prisma Model hiện tại",
    "DATA-03": "Data - Logical ERD mục tiêu",

    # Sequence
    "SEQ-01": "Sequence - Đăng nhập và kiểm tra tài khoản",
    "SEQ-02": "Sequence - Provision Teacher",
    "SEQ-03": "Sequence - Teacher soạn và submit nội dung",
    "SEQ-04": "Sequence - Review approve và publish",
    "SEQ-05": "Sequence - Thay thế revision",
    "SEQ-06": "Sequence - Học bài và xử lý exercise",
    "SEQ-07": "Sequence - Placement và Level-up",
    "SEQ-08": "Sequence - Ôn tập SRS",
    "SEQ-09": "Sequence - Hỗ trợ và disable tài khoản",

    # Security
    "SEC-01": "Security - Trust Boundary DFD",

    # Deployment
    "DEP-01": "Deployment - Hệ thống hiện tại",
    "DEP-02": "Deployment - Kiến trúc triển khai mục tiêu",
}


def extract_svg_dimensions(svg_path: Path) -> tuple[float, float]:
    """Parse width and height from SVG root attributes or viewBox."""
    try:
        tree = ET.parse(svg_path)
        root = tree.getroot()
        w_str = root.attrib.get("width", "")
        h_str = root.attrib.get("height", "")
        vb = root.attrib.get("viewBox", "")

        w, h = 0.0, 0.0
        if w_str and h_str:
            w_match = re.search(r"[\d.]+", w_str)
            h_match = re.search(r"[\d.]+", h_str)
            if w_match and h_match:
                w = float(w_match.group(0))
                h = float(h_match.group(0))

        if (w == 0.0 or h == 0.0) and vb:
            parts = vb.strip().split()
            if len(parts) >= 4:
                w = float(parts[2])
                h = float(parts[3])

        if w > 0.0 and h > 0.0:
            return w, h
    except Exception as e:
        print(f"Warning: Failed to parse dimensions for {svg_path.name}: {e}", file=sys.stderr)

    return 1000.0, 800.0


def sort_key(item: tuple[str, Path]) -> tuple[int, int, str]:
    """Sort diagrams by group index then numeric ID."""
    id_code, _ = item
    m = re.match(r"^([A-Z]+)-(\d+)", id_code)
    if not m:
        return (999, 999, id_code)
    prefix, num = m.groups()
    group_idx = GROUP_ORDER.index(prefix) if prefix in GROUP_ORDER else 99
    return (group_idx, int(num), id_code)


def build_drawio(
    svg_dir: Path,
    output_file: Path,
    margin: int = 40,
) -> tuple[int, int, list[str], list[str]]:
    """Build multi-page draw.io XML file embedding all SVG diagrams."""
    svg_files = sorted(svg_dir.glob("*.svg"))
    input_count = len(svg_files)

    # Extract ID from filename
    items: list[tuple[str, Path]] = []
    duplicate_ids: list[str] = []
    seen_ids: set[str] = set()

    for svg_path in svg_files:
        m = re.match(r"^([A-Z]+-\d+)", svg_path.name)
        if not m:
            print(f"Warning: SVG filename does not match ID pattern: {svg_path.name}", file=sys.stderr)
            continue
        id_code = m.group(1)
        if id_code in seen_ids:
            duplicate_ids.append(id_code)
        seen_ids.add(id_code)
        items.append((id_code, svg_path))

    # Check for missing mappings
    missing_mappings = [id_code for id_code, _ in items if id_code not in ID_MAP]

    # Sort diagrams by canonical group order and numeric ID
    items.sort(key=sort_key)

    # Construct XML document
    root = ET.Element(
        "mxfile",
        attrib={
            "host": "Electron",
            "modified": datetime.now(timezone.utc).isoformat(),
            "agent": "Lingora Draw.io Build Script",
            "version": "24.7.17",
            "type": "device",
        },
    )

    page_names: list[str] = []

    for idx, (id_code, svg_path) in enumerate(items, start=1):
        friendly_title = ID_MAP.get(id_code, id_code)
        page_name = f"{idx:02d} - {friendly_title} ({id_code})"
        page_names.append(page_name)

        w, h = extract_svg_dimensions(svg_path)
        int_w = int(round(w))
        int_h = int(round(h))
        page_w = int_w + margin * 2
        page_h = int_h + margin * 2

        raw_bytes = svg_path.read_bytes()
        # Encode SVG into percent-escaped data URI (clean, no semicolons to disrupt style parser)
        escaped_svg = urllib.parse.quote_from_bytes(raw_bytes, safe="")
        data_uri = f"data:image/svg+xml,{escaped_svg}"

        # Build diagram node
        diagram = ET.SubElement(
            root,
            "diagram",
            attrib={
                "id": f"page-{id_code}",
                "name": page_name,
            },
        )

        model = ET.SubElement(
            diagram,
            "mxGraphModel",
            attrib={
                "dx": "0",
                "dy": "0",
                "grid": "1",
                "gridSize": "10",
                "guides": "1",
                "tooltips": "1",
                "connect": "1",
                "arrows": "1",
                "fold": "1",
                "page": "1",
                "pageScale": "1",
                "pageWidth": str(page_w),
                "pageHeight": str(page_h),
                "math": "0",
                "shadow": "0",
            },
        )

        model_root = ET.SubElement(model, "root")
        ET.SubElement(model_root, "mxCell", attrib={"id": "0"})
        ET.SubElement(model_root, "mxCell", attrib={"id": "1", "parent": "0"})

        style = (
            "shape=image;verticalLabelPosition=bottom;labelBackgroundColor=default;"
            "verticalAlign=top;aspect=fixed;imageAspect=0;strokeColor=none;fillColor=none;"
            f"image={data_uri};"
        )

        cell = ET.SubElement(
            model_root,
            "mxCell",
            attrib={
                "id": "2",
                "value": "",
                "style": style,
                "vertex": "1",
                "parent": "1",
            },
        )

        ET.SubElement(
            cell,
            "mxGeometry",
            attrib={
                "x": str(margin),
                "y": str(margin),
                "width": str(int_w),
                "height": str(int_h),
                "as": "geometry",
            },
        )

    # Indent and serialize XML
    ET.indent(root, space="  ", level=0)
    xml_bytes = ET.tostring(root, encoding="utf-8", xml_declaration=True)

    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_bytes(xml_bytes)

    return input_count, len(items), missing_mappings, duplicate_ids


def validate_drawio(file_path: Path) -> dict[str, any]:
    """Validate that the generated draw.io file meets all requirements."""
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    file_size = file_path.stat().st_size
    if file_size == 0:
        raise ValueError(f"File is empty: {file_path}")

    tree = ET.parse(file_path)
    root = tree.getroot()

    if root.tag != "mxfile":
        raise ValueError(f"Root tag must be 'mxfile', got '{root.tag}'")

    diagrams = root.findall("diagram")
    page_count = len(diagrams)

    page_names = [d.attrib.get("name", "") for d in diagrams]
    page_ids = [d.attrib.get("id", "") for d in diagrams]

    # Check duplicates
    duplicate_names = [name for name in set(page_names) if page_names.count(name) > 1]
    duplicate_ids = [pid for pid in set(page_ids) if page_ids.count(pid) > 1]

    # Verify each page has embedded SVG and no external paths
    pages_with_embedded_svg = 0
    external_image_refs = []
    bad_page_naming = []

    # Page name pattern check: NN - Loại - Tên dễ hiểu (ID)
    name_pattern = re.compile(r"^\d{2}\s*-\s*.+\s*\([A-Z]+-\d+\)$")

    for d in diagrams:
        pname = d.attrib.get("name", "")
        if not name_pattern.match(pname):
            bad_page_naming.append(pname)

        model = d.find("mxGraphModel")
        if model is None:
            continue
        cells = model.findall(".//mxCell")
        for cell in cells:
            style = cell.attrib.get("style", "")
            if "shape=image" in style:
                if "image=data:image/svg+xml," in style:
                    pages_with_embedded_svg += 1
                if "http://" in style or "https://" in style or "file://" in style:
                    external_image_refs.append((pname, style))

    # Verify key pages presence
    key_checks = {
        "UC Overview": any("(UC-01)" in n for n in page_names),
        "Learner Use Case": any("(UC-02)" in n for n in page_names),
        "Lesson Activity": any("(ACT-03)" in n for n in page_names),
        "SRS Activity": any("(ACT-06)" in n for n in page_names),
        "Domain Model": any("(DOM-01)" in n for n in page_names),
        "Logical ERD": any("(DATA-03)" in n for n in page_names),
        "Sequence Sample": any("(SEQ-01)" in n for n in page_names),
        "Security DFD": any("(SEC-01)" in n for n in page_names),
        "Deployment Target": any("(DEP-02)" in n for n in page_names),
    }

    return {
        "file_size_kb": file_size / 1024.0,
        "page_count": page_count,
        "duplicate_names": duplicate_names,
        "duplicate_ids": duplicate_ids,
        "pages_with_embedded_svg": pages_with_embedded_svg,
        "external_image_refs": external_image_refs,
        "bad_page_naming": bad_page_naming,
        "key_checks": key_checks,
        "sample_page_names": page_names[:8],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--svg-dir",
        type=Path,
        default=Path("docs/modeling/current-target/rendered"),
        help="Directory containing canonical rendered SVG files",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_FILE,
        help="Path for output .drawio file",
    )
    parser.add_argument(
        "--margin",
        type=int,
        default=40,
        help="Canvas margin in pixels around diagram",
    )
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Only validate existing .drawio file without rebuilding",
    )

    args = parser.parse_args()

    if not args.validate_only:
        print(f"Building draw.io file from: {args.svg_dir}")
        input_count, page_count, missing_mappings, duplicate_ids = build_drawio(
            args.svg_dir,
            args.output,
            margin=args.margin,
        )
        print(f"Generated: {args.output}")
        print(f"  - SVG input count: {input_count}")
        print(f"  - Output pages: {page_count}")
        print(f"  - Missing mappings: {len(missing_mappings)} {missing_mappings if missing_mappings else ''}")
        print(f"  - Duplicate IDs: {len(duplicate_ids)} {duplicate_ids if duplicate_ids else ''}")

    print("\nValidating output file...")
    results = validate_drawio(args.output)
    print(f"  - File size: {results['file_size_kb']:.1f} KB")
    print(f"  - Page count: {results['page_count']}")
    print(f"  - Pages with embedded SVG: {results['pages_with_embedded_svg']}")
    print(f"  - Duplicate page names: {len(results['duplicate_names'])}")
    print(f"  - Duplicate page IDs: {len(results['duplicate_ids'])}")
    print(f"  - External image references: {len(results['external_image_refs'])}")
    print(f"  - Malformed page names: {len(results['bad_page_naming'])}")

    print("\nKey pages verification:")
    all_keys_pass = True
    for key, passed in results["key_checks"].items():
        status = "PASS" if passed else "FAIL"
        if not passed:
            all_keys_pass = False
        print(f"  - [{status}] {key}")

    print("\nSample page names:")
    for name in results["sample_page_names"]:
        print(f"  * {name}")

    if (
        results["page_count"] == 36
        and results["pages_with_embedded_svg"] == 36
        and len(results["duplicate_names"]) == 0
        and len(results["duplicate_ids"]) == 0
        and len(results["external_image_refs"]) == 0
        and len(results["bad_page_naming"]) == 0
        and all_keys_pass
    ):
        print("\n=== VALIDATION PASSED: DRAWIO PACKAGE READY ===")
        return 0
    else:
        print("\n=== VALIDATION FAILED: NEEDS CORRECTION ===", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
