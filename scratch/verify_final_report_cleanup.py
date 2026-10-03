import re
import sys

file_path = "docs/report-draft-analysis-design.md"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

errors = []

# 1. Check "chuẩn tắc"
chuan_tac_matches = list(re.finditer(r"chuẩn tắc", content, re.IGNORECASE))
if chuan_tac_matches:
    errors.append(f"Found {len(chuan_tac_matches)} occurrences of 'chuẩn tắc'!")
else:
    print("PASS: 0 occurrences of 'chuẩn tắc'.")

# 2. Check tags
if "PROPOSED / PENDING VALIDATION" in content:
    errors.append("Found unstandardized 'PROPOSED / PENDING VALIDATION'!")
if "CONFIGURABLE / PENDING VALIDATION" in content:
    errors.append("Found unstandardized 'CONFIGURABLE / PENDING VALIDATION'!")

expected_tags = [
    "[ĐÃ CHỐT]",
    "[ĐỀ XUẤT]",
    "[MINH HỌA]",
    "[ĐỀ XUẤT — PENDING VALIDATION]",
    "[ĐỀ XUẤT — CẤU HÌNH MỞ / PENDING VALIDATION]",
    "[MINH HỌA — CHƯA KHÓA CỐ ĐỊNH]"
]
for tag in expected_tags:
    if tag in content:
        print(f"PASS: Found tag '{tag}'.")
    else:
        print(f"WARN: Expected tag '{tag}' not found.")

# 3. Check Learner Grouping
if "Nhóm / Ngữ cảnh người học" in content and "Người mới bắt đầu" in content and "Người đã có nền tảng" in content and "Người có quỹ thời gian hạn chế" in content:
    print("PASS: Learner grouping table present with 3 segments.")
else:
    errors.append("Learner grouping table missing or incomplete!")

# 4. Check Priority of P1-FR-003 and P1-FR-007
p1_fr_003_p = re.search(r"\|\s*\*\*P1-FR-003\*\*\s*\|.*?\|\s*(Must\s*/\s*P1)\s*\|", content)
p1_fr_007_p = re.search(r"\|\s*\*\*P1-FR-007\*\*\s*\|.*?\|\s*(Must\s*/\s*P1)\s*\|", content)
if p1_fr_003_p:
    print(f"PASS: P1-FR-003 priority is {p1_fr_003_p.group(1)}.")
else:
    errors.append("P1-FR-003 priority is NOT Must / P1!")

if p1_fr_007_p:
    print(f"PASS: P1-FR-007 priority is {p1_fr_007_p.group(1)}.")
else:
    errors.append("P1-FR-007 priority is NOT Must / P1!")

# 5. Check Exercise types CURRENT vs TARGET
if "schema CURRENT áp dụng 3 dạng" in content and "LISTENING thuộc thiết kế mở rộng TARGET" in content:
    print("PASS: Exercise types CURRENT vs TARGET clearly stated.")
else:
    errors.append("Exercise types CURRENT vs TARGET distinction missing!")

# 6. Check chat_scenarios framing
if "chat_scenarios" in content:
    print("PASS: chat_scenarios mentioned.")
if "legacy" in content.lower():
    errors.append("Found 'legacy' in content! Check if chat_scenarios is called legacy.")
else:
    print("PASS: No 'legacy' term found.")

# 7. Check disclaimer notes at 2.6, 2.9, 2.11
disclaimers = list(re.finditer(r"\*Lưu ý kiến trúc về hiện trạng triển khai:\*", content))
if len(disclaimers) >= 3:
    print(f"PASS: Found {len(disclaimers)} architectural implementation disclaimer notes.")
else:
    errors.append(f"Expected at least 3 disclaimer notes, found {len(disclaimers)}!")

print("\n--- SUMMARY ---")
if errors:
    print(f"FAIL with {len(errors)} errors:")
    for e in errors:
        print(" - " + e)
    sys.exit(1)
else:
    print("ALL VERIFICATION CHECKS PASSED PERFECTLY!")
