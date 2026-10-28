import subprocess
import hashlib
import os
import json

def get_hash(filepath):
    return hashlib.sha256(open(filepath, "rb").read()).hexdigest()

env_bin = "/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
os.environ["PATH"] = env_bin + ":" + os.environ.get("PATH", "")

sm_path = "lingora-admin/tests/database/env/stack-manager.mjs"
eg_path = "lingora-admin/tests/database/env/env-guard.mjs"

sm_orig_hash = get_hash(sm_path)
eg_orig_hash = get_hash(eg_path)

sm_orig_bytes = open(sm_path, "rb").read()
eg_orig_bytes = open(eg_path, "rb").read()

results = []

# --- Mutation 1: Pre-dispatch guard condition violation ---
target1 = b"if (!authority.bound && authority.phase !== 'BOUND' && authority.phase !== 'RESERVED') {"
mut1 = b"if (false) {"
assert target1 in sm_orig_bytes, "target1 not found in stack-manager.mjs"

mutated1 = sm_orig_bytes.replace(target1, mut1, 1)
open(sm_path, "wb").write(mutated1)
mut1_hash = get_hash(sm_path)

cmd1 = ["node", "--test", "--test-name-pattern=.*N01.*", "lingora-admin/tests/database/env/test-env-guard.mjs"]
res1 = subprocess.run(cmd1, capture_output=True, text=True)
open(sm_path, "wb").write(sm_orig_bytes)
restored1_hash = get_hash(sm_path)
assert restored1_hash == sm_orig_hash, "Failed to restore after mutation 1"

results.append({
    "mutation": "Mutation 1: Pre-dispatch guard (bypassing phase check in startStack)",
    "file": sm_path,
    "mutated_hash": mut1_hash,
    "restored_hash": restored1_hash,
    "exit_code": res1.returncode,
    "detected": res1.returncode != 0,
    "stdout": res1.stdout[:300].strip(),
    "stderr": res1.stderr[:300].strip(),
})

# --- Mutation 2: Post-destroy absence check violation ---
target2 = b"if (stillPresent) {"
mut2 = b"if (!stillPresent) {"
assert target2 in sm_orig_bytes, "target2 not found in stack-manager.mjs"

mutated2 = sm_orig_bytes.replace(target2, mut2, 1)
open(sm_path, "wb").write(mutated2)
mut2_hash = get_hash(sm_path)

cmd2 = ["node", "--test", "--test-name-pattern=.*P03.*", "lingora-admin/tests/database/env/test-env-guard.mjs"]
res2 = subprocess.run(cmd2, capture_output=True, text=True)
open(sm_path, "wb").write(sm_orig_bytes)
restored2_hash = get_hash(sm_path)
assert restored2_hash == sm_orig_hash, "Failed to restore after mutation 2"

results.append({
    "mutation": "Mutation 2: Post-destroy absence check inverted (stillPresent check inverted)",
    "file": sm_path,
    "mutated_hash": mut2_hash,
    "restored_hash": restored2_hash,
    "exit_code": res2.returncode,
    "detected": res2.returncode != 0,
    "stdout": res2.stdout[:300].strip(),
    "stderr": res2.stderr[:300].strip(),
})

# --- Mutation 3: Canary/password redaction boundary violation in sanitizeString ---
target3 = b".replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi, '$1[REDACTED_PASSWORD]$3')"
mut3 = b"/* disabled password regex */"
assert target3 in eg_orig_bytes, "target3 not found in env-guard.mjs"

mutated3 = eg_orig_bytes.replace(target3, mut3, 1)
open(eg_path, "wb").write(mutated3)
mut3_hash = get_hash(eg_path)

cmd3 = ["node", "--test", "--test-name-pattern=.*Canary secret.*", "lingora-admin/tests/database/env/test-env-guard.mjs"]
res3 = subprocess.run(cmd3, capture_output=True, text=True)
open(eg_path, "wb").write(eg_orig_bytes)
restored3_hash = get_hash(eg_path)
assert restored3_hash == eg_orig_hash, "Failed to restore after mutation 3"

results.append({
    "mutation": "Mutation 3: Password redaction boundary disabled in sanitizeString",
    "file": eg_path,
    "mutated_hash": mut3_hash,
    "restored_hash": restored3_hash,
    "exit_code": res3.returncode,
    "detected": res3.returncode != 0,
    "stdout": res3.stdout[:300].strip(),
    "stderr": res3.stderr[:300].strip(),
})

out_json = "docs/design/physical/evidence/2026-10-25-wp00-g0-d1-d2/worker/mutation-results.json"
open(out_json, "w").write(json.dumps(results, indent=2))
print("Mutation Results saved to", out_json)
for r in results:
    print(f"[{r['mutation']}] Exit Code: {r['exit_code']}, Detected: {r['detected']}, Restored: {r['restored_hash'] == (sm_orig_hash if 'stack-manager' in r['file'] else eg_orig_hash)}")
