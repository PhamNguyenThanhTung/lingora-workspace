#!/usr/bin/env python3
"""Capture and verify the approved all-diagram native draw.io baseline."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path
from typing import Any

try:
    from validate_drawio import OMITTED_PRIMARY_DRAWIO_IDS
except ImportError:
    OMITTED_PRIMARY_DRAWIO_IDS = {"ACT-05"}


ROOT = Path(__file__).resolve().parent.parent
MODEL = ROOT / "docs" / "modeling" / "current-target"
SOURCE_DIR = MODEL / "src"
RENDER_DIR = MODEL / "rendered"
DRAWIO = MODEL / "lingora-all-diagrams.drawio"
MANIFEST = MODEL / "render-manifest.json"
GROUP_ORDER = ["SYS", "UC", "VIEW-RUC", "ACT", "STA", "DOM", "DATA", "SEQ", "SEC", "DEP"]
REPORT_VIEW_NAMES = {
    "VIEW-RUC-01": "Use Case - Đăng ký, đăng nhập và hồ sơ",
    "VIEW-RUC-02": "Use Case - Ngữ cảnh học tập",
    "VIEW-RUC-03": "Use Case - Học bài và luyện tập",
    "VIEW-RUC-04": "Use Case - Ôn tập SRS",
    "VIEW-RUC-05": "Use Case - Placement và Level-up",
    "VIEW-RUC-06": "Use Case - Tiến độ và lịch sử học tập",
    "VIEW-RUC-07": "Use Case - Giáo viên biên soạn nội dung",
    "VIEW-RUC-08A": "Use Case - Phân công, duyệt và xuất bản nội dung",
    "VIEW-RUC-08B": "Use Case - Quản lý tài khoản và hỗ trợ",
}
REPORT_VIEW_IDS = list(REPORT_VIEW_NAMES)
DIAGRAM_ID = re.compile(r"^(VIEW-RUC-\d{2}[A-B]?|[A-Z]+-\d+)")
PAGE_NAME = re.compile(r"^\d{2}\s*-\s*.+\s*\(((?:VIEW-RUC-\d{2}[A-B]?)|(?:[A-Z]+-\d+))\)$")
HIDDEN_LINK = re.compile(r"-\s*\[hidden\]\s*-(?:\.|-)?[<>]?")


def expected_active_pages(baseline_pages: list[dict[str, str]]) -> list[dict[str, str]]:
    """Drop approved deferred identities and renumber the remaining baseline pages."""
    active = [page for page in baseline_pages if page.get("id", "")[5:] not in OMITTED_PRIMARY_DRAWIO_IDS]
    result: list[dict[str, str]] = []
    for index, page in enumerate(active, start=1):
        name = re.sub(r"^\d{2}(?=\s*-)", f"{index:02d}", page["name"], count=1)
        result.append({"id": page["id"], "name": name})
    return result


def expected_primary_pages(canonical_pages: list[dict[str, str]]) -> list[dict[str, str]]:
    """Insert the nine report views after UC-04 and renumber the active package."""
    result: list[dict[str, str]] = []
    inserted = False
    for page in canonical_pages:
        index = len(result) + 1
        name = re.sub(r"^\d{2}(?=\s*-)", f"{index:02d}", page["name"], count=1)
        result.append({"id": page["id"], "name": name})
        if page.get("id", "")[5:] == "UC-04":
            for diagram_id, friendly_name in REPORT_VIEW_NAMES.items():
                report_index = len(result) + 1
                result.append(
                    {
                        "id": f"page-{diagram_id}",
                        "name": f"{report_index:02d} - {friendly_name} ({diagram_id})",
                    }
                )
            inserted = True
    if not inserted:
        raise ValueError("Baseline page list has no UC-04 insertion point")
    return result


def semantic_inventory(source: str) -> list[str]:
    """Keep ordered diagram declarations while omitting known presentation syntax."""
    kept: list[str] = []
    for raw_line in source.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("'"):
            continue
        if re.match(r"^@(start|end)uml\b", line, flags=re.IGNORECASE):
            continue
        if line == "!include ../style.puml":
            continue
        if re.match(
            r"^(skinparam\b|left to right direction$|top to bottom direction$|!pragma layout\b)",
            line,
            flags=re.IGNORECASE,
        ):
            continue
        if HIDDEN_LINK.search(line):
            continue
        kept.append(line)
    return kept


def _git(root: Path, *args: str) -> bytes:
    safe_dir = root.resolve().as_posix()
    result = subprocess.run(
        ["git", "-c", f"safe.directory={safe_dir}", "-c", "core.quotepath=false", *args],
        cwd=root,
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode:
        error = result.stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"git {' '.join(args)} failed ({result.returncode}): {error}")
    return result.stdout


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _sha256_file(path: Path) -> str:
    return _sha256_bytes(path.read_bytes())


def _git_path_state(root: Path, repo_path: str) -> dict[str, str | None]:
    path = root / Path(repo_path.replace("/", "\\"))
    if path.is_symlink():
        return {"kind": "symlink", "sha256": _sha256_bytes(str(path.readlink()).encode("utf-8"))}
    if path.is_file():
        return {"kind": "file", "sha256": _sha256_file(path)}
    if path.is_dir():
        return {"kind": "directory", "sha256": None}
    return {"kind": "missing", "sha256": None}


def _paths_from_status(lines: list[str]) -> set[str]:
    paths: set[str] = set()
    for line in lines:
        if len(line) < 4:
            continue
        status_path = line[3:]
        # Porcelain v1 uses "old -> new" for renames/copies when -z is not used.
        for repo_path in status_path.split(" -> "):
            repo_path = repo_path.strip().strip('"').replace("\\", "/")
            if repo_path:
                paths.add(repo_path)
    return paths


def _task_owned_path(repo_path: str) -> bool:
    path = repo_path.replace("\\", "/")
    exact = {
        "HANDOFF.md",
        "docs/QUICK-REF.md",
        "plans/current-task.md",
        "plans/approved/README.md",
        "plans/archive/README.md",
        "plans/archive/2026-10-11-drawio-native-render-parity-DONE.md",
        "docs/modeling/current-target/README.md",
        "docs/modeling/current-target/style.puml",
        "docs/modeling/current-target/render-manifest.json",
        "docs/modeling/current-target/lingora-all-diagrams.drawio",
        "docs/modeling/current-target/README.md",
        "docs/modeling/current-target/lingora-all-diagrams-svg.drawio",
        "docs/modeling/current-target/lingora-all-diagrams-svg-editable.drawio",
        "docs/modeling/current-target/evidence/native-render-review.md",
        "docs/modeling/current-target/evidence/native-export-test.svg",
        "scripts/build_drawio_from_puml.js",
        "scripts/build_drawio.py",
        "scripts/build_drawio_from_svgs.py",
        "scripts/validate_drawio.py",
        "scripts/layout_drawio_native.py",
        "scripts/verify_drawio_native_parity.py",
        "scripts/test_drawio_native_parity.py",
        "scripts/test_drawio_from_puml.js",
        "logs/test-log.md",
        "logs/development-log.md",
        "logs/decision-log.md",
        "plans/approved/2026-10-11-drawio-native-render-parity-BASELINE.json",
        "plans/approved/2026-10-11-drawio-native-render-parity-APPROVED.md",
        "plans/approved/2026-10-11-drawio-native-render-parity-REQUEST.txt",
        "plans/approved/2026-10-11-drawio-exclude-deferred-act05-APPROVED.md",
        "plans/approved/2026-10-11-drawio-exclude-deferred-act05-REQUEST.txt",
        "plans/approved/2026-10-12-add-report-usecases-to-native-drawio-APPROVED.md",
        "plans/approved/2026-10-12-add-report-usecases-to-native-drawio-BASELINE.json",
        "plans/archive/2026-10-12-add-report-usecases-to-native-drawio-DONE.md",
        "docs/superpowers/specs/2026-10-11-drawio-native-render-parity-design.md",
        "docs/superpowers/plans/2026-10-11-drawio-native-render-parity.md",
    }
    return (
        path in exact
        or path.startswith("docs/modeling/current-target/src/")
        or path.startswith("docs/modeling/current-target/rendered/")
        or path.startswith("docs/modeling/current-target/evidence/native-render-review/")
        or path.startswith("plans/approved/2026-10-11-drawio-native-render-parity-")
        or path.startswith("plans/approved/2026-10-11-drawio-native-cell-layout-")
        or path.startswith("plans/approved/2026-10-11-drawio-exclude-deferred-act05-")
        or path.startswith("docs/modeling/report-usecases/")
    )


def _require_file(path: Path, label: str) -> str:
    if not path.is_file():
        raise RuntimeError(f"Missing {label}: {path}")
    return _sha256_file(path)


def _page_identities(drawio_path: Path) -> list[dict[str, str]]:
    tree = ET.parse(drawio_path)
    root = tree.getroot()
    if root.tag != "mxfile":
        raise RuntimeError(f"Expected mxfile root, found {root.tag!r}")
    pages: list[dict[str, str]] = []
    for page in root.findall("diagram"):
        pages.append({"id": page.attrib.get("id", ""), "name": page.attrib.get("name", "")})
    return pages


def capture_baseline(root: Path) -> dict[str, Any]:
    root = root.resolve()
    model = root / "docs" / "modeling" / "current-target"
    source_dir = model / "src"
    render_dir = model / "rendered"
    sources = sorted(source_dir.glob("*.puml"), key=lambda p: p.name)
    if len(sources) != 36:
        raise RuntimeError(f"Expected 36 canonical PUML sources, found {len(sources)}")
    ids: dict[str, str] = {}
    source_records: dict[str, Any] = {}
    for source_path in sources:
        match = DIAGRAM_ID.match(source_path.name)
        if not match:
            raise RuntimeError(f"Source filename has no canonical diagram ID: {source_path.name}")
        diagram_id = match.group(1)
        if diagram_id in ids:
            raise RuntimeError(f"Duplicate canonical diagram ID {diagram_id}")
        ids[diagram_id] = source_path.name
        text = source_path.read_text(encoding="utf-8")
        source_records[source_path.name] = {
            "id": diagram_id,
            "sha256": _sha256_file(source_path),
            "semantic_inventory": semantic_inventory(text),
        }

    style_path = model / "style.puml"
    style_hash = _require_file(style_path, "shared PlantUML style")
    render_hashes: dict[str, str] = {}
    for fmt in ("svg", "png"):
        outputs = sorted(render_dir.glob(f"*.{fmt}"), key=lambda p: p.name)
        if len(outputs) != 36:
            raise RuntimeError(f"Expected 36 rendered {fmt.upper()} files, found {len(outputs)}")
        output_ids: set[str] = set()
        for path in outputs:
            match = DIAGRAM_ID.match(path.name)
            if not match:
                raise RuntimeError(f"Render filename has no canonical diagram ID: {path.name}")
            output_ids.add(match.group(1))
            render_hashes[path.relative_to(root).as_posix()] = _sha256_file(path)
        if output_ids != ids.keys():
            raise RuntimeError(f"Rendered {fmt.upper()} diagram identities differ from source identities")

    drawio_path = model / "lingora-all-diagrams.drawio"
    pages = _page_identities(drawio_path)
    expected_page_count = len(ids) - len(OMITTED_PRIMARY_DRAWIO_IDS) + len(REPORT_VIEW_IDS)
    if len(pages) != expected_page_count:
        raise RuntimeError(f"Expected {expected_page_count} active draw.io pages, found {len(pages)}")
    page_names: set[str] = set()
    page_ids: set[str] = set()
    for page in pages:
        page_id = page["id"]
        match = re.fullmatch(r"page-(VIEW-RUC-\d{2}[A-B]?|[A-Z]+-\d+)", page_id)
        name_match = PAGE_NAME.match(page["name"])
        if not match or not name_match or match.group(1) != name_match.group(1):
            raise RuntimeError(f"Invalid baseline page identity: {page!r}")
        page_ids.add(page_id)
        page_names.add(page["name"])
    if len(page_ids) != expected_page_count or len(page_names) != expected_page_count:
        raise RuntimeError("Baseline draw.io page IDs and names must be unique")
    page_diagram_ids = {page["id"][5:] for page in pages}
    expected_page_ids = (set(ids) - OMITTED_PRIMARY_DRAWIO_IDS) | set(REPORT_VIEW_IDS)
    if page_diagram_ids != expected_page_ids:
        raise RuntimeError("Draw.io page identities differ from the active canonical and report view identities")
    page_order_ids = [page["id"][5:] for page in pages]
    try:
        admin_index = page_order_ids.index("UC-04")
    except ValueError as error:
        raise RuntimeError("Draw.io bundle is missing the UC-04 insertion point") from error
    if page_order_ids[admin_index + 1 : admin_index + 1 + len(REPORT_VIEW_IDS)] != REPORT_VIEW_IDS:
        raise RuntimeError("Report Use Case pages are not in README order immediately after UC-04")

    status = _git(root, "status", "--short", "--untracked-files=all").decode("utf-8", errors="surrogateescape").splitlines()
    changed_paths = sorted(_paths_from_status(status))
    path_states = {path: _git_path_state(root, path) for path in changed_paths}
    index_entries = _git(root, "ls-files", "--stage", "-z")
    manifest_path = model / "render-manifest.json"
    return {
        "version": 1,
        "captured_date": date.today().isoformat(),
        "root": root.as_posix(),
        "git": {
            "head": _git(root, "rev-parse", "HEAD").decode().strip(),
            "index_entries_sha256": _sha256_bytes(index_entries),
            "preexisting_status": status,
            "preexisting_path_states": path_states,
        },
        "diagram_count": 36,
        "deliverable_page_count": len(pages),
        "style_sha256": style_hash,
        "render_manifest_sha256": _require_file(manifest_path, "render manifest"),
        "sources": source_records,
        "rendered_outputs_sha256": render_hashes,
        "drawio_pages": pages,
        "drawio_sha256": _require_file(drawio_path, "baseline draw.io deliverable"),
    }


def verify_baseline(root: Path, baseline_path: Path) -> list[str]:
    root = root.resolve()
    baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
    current = capture_baseline(root)
    errors: list[str] = []
    if current["git"]["head"] != baseline["git"]["head"]:
        errors.append("HEAD changed since approved baseline")
    if current["git"]["index_entries_sha256"] != baseline["git"]["index_entries_sha256"]:
        errors.append("Git index entries changed since approved baseline")
    if current["drawio_pages"] != expected_primary_pages(expected_active_pages(baseline["drawio_pages"])):
        errors.append("draw.io page IDs/names/order differ from the canonical baseline plus nine inserted report views")
    if set(current["sources"]) != set(baseline["sources"]):
        errors.append("Canonical PUML source filenames changed since baseline")
    for filename, baseline_record in baseline["sources"].items():
        current_record = current["sources"].get(filename)
        if current_record is None:
            continue
        if current_record["semantic_inventory"] != baseline_record["semantic_inventory"]:
            errors.append(f"Semantic inventory changed: {filename}")
    for output_path, digest in baseline["git"]["preexisting_path_states"].items():
        if _task_owned_path(output_path):
            continue
        if _git_path_state(root, output_path) != digest:
            errors.append(f"Pre-existing worktree path changed: {output_path}")
    baseline_status = [line for line in baseline["git"]["preexisting_status"] if not _status_line_is_task_owned(line)]
    current_status = [line for line in current["git"]["preexisting_status"] if not _status_line_is_task_owned(line)]
    if baseline_status != current_status:
        errors.append("Unrelated pre-existing Git status entries changed")
    return errors


def _status_line_is_task_owned(line: str) -> bool:
    return any(_task_owned_path(path) for path in _paths_from_status([line]))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--capture-baseline", type=Path)
    parser.add_argument("--verify-baseline", type=Path)
    args = parser.parse_args(argv)
    if bool(args.capture_baseline) == bool(args.verify_baseline):
        parser.error("select exactly one of --capture-baseline or --verify-baseline")
    try:
        if args.capture_baseline:
            output = args.capture_baseline.resolve()
            if not output.is_relative_to(ROOT.resolve()):
                raise RuntimeError("Baseline output must be inside the repository")
            if output.exists():
                raise RuntimeError(f"Refusing to overwrite existing baseline: {output}")
            baseline = capture_baseline(ROOT)
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(json.dumps(baseline, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
            print(f"PASS: captured {baseline['diagram_count']} diagrams, 72 render hashes, and {len(baseline['drawio_pages'])} page identities")
            print(f"HEAD: {baseline['git']['head']}")
            print(f"Index entries SHA-256: {baseline['git']['index_entries_sha256']}")
            print(f"Baseline: {output}")
            return 0
        errors = verify_baseline(ROOT, args.verify_baseline)
        if errors:
            for error in errors:
                print(f"FAIL: {error}", file=sys.stderr)
            return 1
        baseline = json.loads(args.verify_baseline.read_text(encoding="utf-8"))
        print(f"PASS: 36 semantic inventories match baseline; 44 active output pages include nine report views and omit only ACT-05; HEAD and index are unchanged")
        print(f"PASS: {len(baseline['git']['preexisting_path_states'])} pre-existing changed paths retained outside task scope")
        return 0
    except (OSError, ET.ParseError, RuntimeError, ValueError, json.JSONDecodeError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
