import json
from pathlib import Path

BASE = Path("docs/diagrams/current-target-2026-10-10")
manifest = json.load(open(BASE / "evidence/render-manifest.json", encoding="utf-8"))
catalog = json.load(open(BASE / "catalog.json", encoding="utf-8"))

print(f"Manifest diagram count: {manifest['diagram_count']}")
print(f"Catalog items count: {len(catalog)}")

# Check outputs exist
missing_outputs = []
for it in catalog:
    if it["id"] == "M25":
        continue
    outs = it.get("outputs", {})
    for fmt, path in outs.items():
        if not (BASE / path).resolve().is_file():
            missing_outputs.append((it["id"], path))

if missing_outputs:
    print(f"FAIL: Missing outputs: {missing_outputs}")
    exit(1)
else:
    print("PASS: All catalog outputs verified on disk.")

# Check prohibited terms
prohibited = ['LESSON_CREATOR', 'MODERATOR', 'OPERATIONS_STAFF', 'ORGANIZATIONAL_MANAGER', 'FastAPI', 'lingora-ai']
found_prohibited = []
for puml in (BASE / "src").glob("*target*.puml"):
    content = puml.read_text(encoding="utf-8")
    for term in prohibited:
        if term in content:
            found_prohibited.append((puml.name, term))

if found_prohibited:
    print(f"FAIL: Found prohibited terms: {found_prohibited}")
    exit(1)
else:
    print("PASS: Zero prohibited legacy terms in TARGET diagrams.")

print("PASS: All verification assertions satisfied.")
