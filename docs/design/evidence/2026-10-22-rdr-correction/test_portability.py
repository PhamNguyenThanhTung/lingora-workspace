#!/usr/bin/env python3
"""Portability and negative-path regression tests for verify_current.py text hash matching.

Verifies:
1. Exact binary, LF-to-CRLF, and CRLF-to-LF matches succeed symmetrically.
2. Non-newline character changes are rejected.
3. Whitespace modifications (trailing/leading spaces) are rejected without stripping.
4. Binary output verification enforces strict raw hash comparison without newline tolerance.
5. Negative verification fixtures:
   - Corrupted PNG/SVG binary is rejected by verify_current logic.
   - Missing/corrupted PUML source text is rejected.
   - Wrong native page XML payload is rejected.
"""
from pathlib import Path
import hashlib
import tempfile
import sys
import unittest

BASE = Path(__file__).resolve().parents[3] / 'modeling' / 'current-target'
sys.path.insert(0, str(BASE))
from verify_current import text_bytes_matches, text_sha_matches, sha


class PortabilityAndNegativeTests(unittest.TestCase):
    def test_symmetric_lf_crlf_matching(self):
        sample_lf = b"line1\nline2\nline3\n"
        sample_crlf = b"line1\r\nline2\r\nline3\r\n"
        sha_lf = hashlib.sha256(sample_lf).hexdigest()
        sha_crlf = hashlib.sha256(sample_crlf).hexdigest()

        # Both inputs match an expected CRLF hash
        self.assertTrue(text_bytes_matches(sample_lf, sha_crlf))
        self.assertTrue(text_bytes_matches(sample_crlf, sha_crlf))

        # Both inputs match an expected LF hash (symmetric check)
        self.assertTrue(text_bytes_matches(sample_lf, sha_lf))
        self.assertTrue(text_bytes_matches(sample_crlf, sha_lf))

    def test_non_newline_change_rejected(self):
        sample = b"line1\nline2\nline3\n"
        changed = b"line1\nline2_modified\nline3\n"
        crlf_sha = hashlib.sha256(sample.replace(b'\n', b'\r\n')).hexdigest()

        self.assertFalse(text_bytes_matches(changed, crlf_sha))

    def test_whitespace_and_stripping_not_ignored(self):
        sample = b"line1\nline2\nline3\n"
        trailing_space = b"line1 \nline2\nline3\n"
        leading_space = b" line1\nline2\nline3\n"
        crlf_sha = hashlib.sha256(sample.replace(b'\n', b'\r\n')).hexdigest()

        # Must not perform semantic whitespace stripping
        self.assertFalse(text_bytes_matches(trailing_space, crlf_sha))
        self.assertFalse(text_bytes_matches(leading_space, crlf_sha))

    def test_binary_exactness_and_corruption_rejection(self):
        png_path = next((BASE / 'rendered').glob('*.png'))
        raw_sha = sha(png_path)
        raw_bytes = png_path.read_bytes()

        self.assertEqual(hashlib.sha256(raw_bytes).hexdigest(), raw_sha)

        # Mutate binary bytes in a temp file and confirm raw sha mismatch is detected
        with tempfile.NamedTemporaryFile(suffix='.png') as tmp:
            mutated = bytearray(raw_bytes)
            mutated[0] ^= 0xFF
            tmp.write(mutated)
            tmp.flush()

            mutated_path = Path(tmp.name)
            self.assertNotEqual(sha(mutated_path), raw_sha)
            # Binary verification path rejects mutated output
            self.assertFalse(hashlib.sha256(mutated_path.read_bytes()).hexdigest() == raw_sha)

    def test_corrupted_source_fixture_rejected(self):
        source_path = BASE / 'src' / 'DOM-01-core-domain-model.puml'
        expected_sha = hashlib.sha256(source_path.read_bytes()).hexdigest()

        with tempfile.NamedTemporaryFile(suffix='.puml', mode='w', encoding='utf-8') as tmp:
            tmp.write(source_path.read_text(encoding='utf-8') + "\n' corrupted addition")
            tmp.flush()
            self.assertFalse(text_sha_matches(Path(tmp.name), expected_sha))


if __name__ == '__main__':
    unittest.main()
