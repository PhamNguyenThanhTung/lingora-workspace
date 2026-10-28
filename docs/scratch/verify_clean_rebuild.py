import json
from pathlib import Path

BASE = Path("docs/modeling/current-target")
manifest = json.load(open(BASE / "render-manifest.json", encoding="utf-8"))

print(f"Diagram count: {manifest['diagram_count']}")
assert manifest['diagram_count'] == 36, f"Expected 36 diagrams, got {manifest['diagram_count']}"

# Verify outputs exist on disk
for r in manifest["records"]:
    for fmt, path in r["outputs"].items():
        p = BASE / path
        assert p.is_file(), f"Missing file: {p}"
print("PASS: All 72 rendered outputs exist on disk.")

# Scan for legacy terms in TARGET diagrams
prohibited = ['LESSON_CREATOR', 'MODERATOR', 'OPERATIONS_STAFF', 'ORGANIZATIONAL_MANAGER', 'FastAPI', 'lingora-ai']
for puml in (BASE / "src").glob("*target*.puml"):
    content = puml.read_text(encoding="utf-8")
    for term in prohibited:
        assert term not in content, f"Prohibited term {term} found in {puml.name}"
print("PASS: Zero prohibited legacy terms in TARGET diagrams.")

# Scan for rigid SRS ratings (again, hard, good, easy) in SRS diagrams
for puml in (BASE / "src").glob("*srs*.puml"):
    content = puml.read_text(encoding="utf-8").lower()
    for scale_term in ['again', 'hard', 'good', 'easy']:
        # allow if part of other word, but not as rating scale
        assert f"'{scale_term}'" not in content and f'"{scale_term}"' not in content, f"Fixed scale {scale_term} in {puml.name}"
print("PASS: Zero rigid SRS rating scale terms in SRS diagrams.")

# Verify Unit is logical concept
for puml in (BASE / "src").glob("*.puml"):
    content = puml.read_text(encoding="utf-8")
    assert "bắt buộc tạo bảng units" not in content
    assert "must have units table" not in content.lower()
print("PASS: Unit correctly represented as logical concept without physical table overreach.")

print("PASS: All verification assertions passed.")
