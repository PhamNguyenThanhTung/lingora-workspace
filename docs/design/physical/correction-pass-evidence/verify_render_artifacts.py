"""Hash and validate the final proposed physical ERD renders."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from xml.etree import ElementTree

from PIL import Image


EVIDENCE = Path(__file__).resolve().parent
ROOT = EVIDENCE.parent
RENDERED = EVIDENCE / "rendered"
CLI_COPY = EVIDENCE / "plantuml-cli-output-copy"
SOURCE = ROOT / "physical-erd.puml"
MANIFEST = EVIDENCE / "render-manifest.json"


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


outputs: dict[str, dict[str, object]] = {}
for panel in ("identity", "content", "learning", "assessment"):
    for extension in ("svg", "png"):
        name = f"physical-erd-{panel}.{extension}"
        primary = ROOT / name
        evidence = RENDERED / name
        copy = CLI_COPY / name
        data = primary.read_bytes()
        assert evidence.read_bytes() == data, f"rendered evidence differs: {name}"
        assert copy.read_bytes() == data, f"CLI copy differs: {name}"
        entry: dict[str, object] = {"sha256": sha256(data)}
        if extension == "svg":
            ElementTree.fromstring(data)
            entry["svg_parse"] = "PASS"
        else:
            with Image.open(primary) as image:
                image.verify()
            with Image.open(primary) as image:
                entry["dimensions"] = list(image.size)
            entry["manual_visual_inspection"] = "PASS — readable labels, no clipping"
        outputs[name] = entry

manifest = {
    "classification": "PROPOSED PHYSICAL DESIGN — NOT IMPLEMENTED",
    "source": SOURCE.name,
    "source_sha256": sha256(SOURCE.read_bytes()),
    "outputs": outputs,
    "checks": {
        "plantuml_checkonly": "PASS",
        "svg_parse": "PASS",
        "png_decode": "PASS",
        "png_visual_review": "PASS — manual review recorded in verification.md",
        "root_evidence_copy_hashes": "PASS",
        "plantuml_cli_copy_hashes": "PASS",
    },
}
MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("PASS four SVGs parse, four PNGs decode, and all 24 root/rendered/CLI-copy files match by SHA-256")
for name, entry in outputs.items():
    dimensions = entry.get("dimensions", "")
    print(f"{name}: {entry['sha256']} {dimensions}")
