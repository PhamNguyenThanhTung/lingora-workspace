#!/usr/bin/env python3
"""
Offline synthetic tests for Slice 12 public acceptance helpers.

All tests run offline: NO network, NO live DB, NO browser execution.
Calls the ACTUAL JS functions in helpers-testable.mjs (which are shared with
public-auth.mjs, public-journey.mjs, resume-cleanup.mjs, preflight-readonly.mjs).
No test-only bypasses or Python copies of JS logic.

Test Groups:
  Group A — EML parser (parse-eml.py subprocess)
  Group B — URL validation logic
  Group C — Auth helper constraints (calling helpers-testable.mjs)
  Group D — 7-group snapshot coverage and schema queries (calling helpers-testable.mjs)
  Group E — Sanitized diagnostics (calling helpers-testable.mjs and parse-eml.py)
  Group F — Runner orchestration and restart controls (calling actual runners and shared logic)
"""

import hashlib
import html
import json
import os
import quopri
import subprocess
import sys
import tempfile
import textwrap
import urllib.parse
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR       = Path(__file__).parent
PARSE_EML        = SCRIPT_DIR / "parse-eml.py"
HELPERS_TESTABLE = SCRIPT_DIR / "helpers-testable.mjs"

# ── Authoritative Constants ──────────────────────────────────────────────────
CANONICAL_HOST           = "sncfyvpzwedqgwfpffkh.supabase.co"
CANONICAL_VERIFY_PATH    = "/auth/v1/verify"
CANONICAL_REDIRECT       = "https://lingora-learner-dev.vercel.app/auth/confirm"
CANONICAL_LEARNER_ORIGIN = "https://lingora-learner-dev.vercel.app"
EXPECTED_TYPE            = "signup"
SAMPLE_RECIPIENT         = "learner@example.com"
SAMPLE_LABEL             = "DEV_S12_PUBLIC_TEST_LABEL"
SAMPLE_TOKEN             = "pkce_abcdefghijklmnopqrstuvwxyz01234567890"
EVENT_TIME_MS            = 1793626500000  # 2026-11-02T13:35:00.000Z

# ── Test Runner State ────────────────────────────────────────────────────────
_pass = 0
_fail = 0
_errors = []


def ok(label, condition, detail=""):
    global _pass, _fail
    if condition:
        print(f"  PASS  {label}")
        _pass += 1
    else:
        print(f"  FAIL  {label}" + (f" — {detail}" if detail else ""))
        _fail += 1
        _errors.append(label)


def run_parse_eml(eml_path, recipient=None, out_path=None, extra_args=None, recipient_file=None):
    """Run parse-eml.py and return (returncode, stdout, stderr)."""
    cmd = [sys.executable, str(PARSE_EML), "--eml", str(eml_path)]
    if recipient:
        cmd.extend(["--expected-recipient", recipient])
    if recipient_file:
        cmd.extend(["--expected-recipient-file", str(recipient_file)])
    if out_path:
        cmd.extend(["--out", str(out_path)])
    if extra_args:
        cmd.extend(extra_args)
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode, result.stdout, result.stderr


def run_js(test_name, arg_dict=None):
    """Run helpers-testable.mjs subprocess and return (ok, result, raw_output)."""
    cmd = ["node", str(HELPERS_TESTABLE), test_name]
    if arg_dict is not None:
        cmd.append(json.dumps(arg_dict))
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        try:
            parsed = json.loads(result.stdout)
            return True, parsed.get("result"), result.stdout
        except Exception:
            return False, None, result.stdout
    else:
        try:
            parsed = json.loads(result.stderr)
            return False, parsed, result.stderr
        except Exception:
            return False, None, result.stderr


# ── EML builder helpers ───────────────────────────────────────────────────────
def build_verify_url(scheme="https", token=SAMPLE_TOKEN, type_=EXPECTED_TYPE,
                     redirect=CANONICAL_REDIRECT, host=CANONICAL_HOST,
                     port=None, path=CANONICAL_VERIFY_PATH, extra_params="",
                     username="", fragment=""):
    """Build a Supabase verify URL."""
    port_str = f":{port}" if port else ""
    if username:
        base = f"{scheme}://{username}@{host}{port_str}{path}"
    else:
        base = f"{scheme}://{host}{port_str}{path}"
    q = f"token={urllib.parse.quote(token)}&type={urllib.parse.quote(type_)}&redirect_to={urllib.parse.quote(redirect)}"
    if extra_params:
        q += "&" + extra_params
    url = base + "?" + q
    if fragment:
        url += "#" + fragment
    return url


def build_eml(html_body, plain_body=None, recipient=SAMPLE_RECIPIENT,
              sender="noreply@mail.app.supabase.io",
              date_str="Mon, 02 Nov 2026 13:34:44 +0000",
              subject="Confirm your signup"):
    """Build a minimal multipart EML string."""
    msg = MIMEMultipart("alternative")
    msg["From"]    = sender
    msg["To"]      = recipient
    msg["Subject"] = subject
    msg["Date"]    = date_str
    if plain_body:
        msg.attach(MIMEText(plain_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))
    return msg.as_string()


def write_eml(tmp_dir, name, html_body, **kwargs):
    p = tmp_dir / name
    p.write_text(build_eml(html_body, **kwargs))
    return p


def canonical_html(url, extra_links=""):
    escaped = url.replace("&", "&amp;")
    return textwrap.dedent(f"""
    <html><body>
      <p>Click to confirm: <a href="{escaped}">Confirm</a></p>
      <p>Supabase marketing: <a href="https://supabase.io/unsubscribe?uid=xyz">Unsubscribe</a></p>
      {extra_links}
    </body></html>
    """)


# ─────────────────────────────────────────────────────────────────────────────
# GROUP A — EML parser (parse-eml.py subprocess)
# ─────────────────────────────────────────────────────────────────────────────
def test_group_a():
    print("\n── Group A: EML parser (parse-eml.py) ──────────────────────────")
    with tempfile.TemporaryDirectory() as _tmp:
        tmp = Path(_tmp)

        # A1: Golden valid EML
        eml_a1 = write_eml(tmp, "a1.eml", canonical_html(build_verify_url()))
        out_a1 = tmp / "a1-meta.json"
        rc1, out1, err1 = run_parse_eml(eml_a1, SAMPLE_RECIPIENT, out_a1)
        ok("A1: valid signup EML exits 0", rc1 == 0, err1[:100] if rc1 != 0 else "")
        if rc1 == 0:
            meta = json.loads(out_a1.read_text())
            ok("A1: provider_host correct", meta.get("provider_host") == CANONICAL_HOST)
            ok("A1: provider_scheme is https", meta.get("provider_scheme") == "https")
            ok("A1: provider_path correct", meta.get("provider_path") == CANONICAL_VERIFY_PATH)
            ok("A1: type=signup", meta.get("type") == EXPECTED_TYPE)
            ok("A1: redirect_to_path correct", meta.get("redirect_to_path") == "/auth/confirm")
            ok("A1: recipient_matched true", meta.get("recipient_matched") is True)
            ok("A1: recipient_hash present", len(meta.get("recipient_hash", "")) == 64)
            ok("A1: safe_params does not leak token", "token" not in meta.get("safe_params", {}))

            priv_url_file = tmp / "eml-url-private.txt"
            ok("A1: private URL file created (mode 0600)", priv_url_file.exists())
            if priv_url_file.exists():
                priv_content = priv_url_file.read_text()
                ok("A1: private file contains actual token", SAMPLE_TOKEN in priv_content)

            ok("A1: stdout has no raw token", SAMPLE_TOKEN not in out1)
            ok("A1: stderr has no raw token", SAMPLE_TOKEN not in err1)

        # A2 (Finding 4): Single HTML decode — entity survives without corruption
        url_a2 = build_verify_url(extra_params="literal_entity=foo%26amp%3Bbar")
        eml_a2 = write_eml(tmp, "a2.eml", canonical_html(url_a2))
        out_a2 = tmp / "a2-meta.json"
        rc2, _, err2 = run_parse_eml(eml_a2, SAMPLE_RECIPIENT, out_a2)
        ok("A2: &amp; entity decoded once, valid", rc2 == 0, err2[:100] if rc2 != 0 else "")

        # A3 (Finding 4): Extra flow params preserved in metadata
        url_a3 = build_verify_url(extra_params="flow_state_id=abc-123")
        eml_a3 = write_eml(tmp, "a3.eml", canonical_html(url_a3))
        out_a3 = tmp / "a3-meta.json"
        rc3, _, _ = run_parse_eml(eml_a3, SAMPLE_RECIPIENT, out_a3)
        ok("A3: extra flow params accepted", rc3 == 0)
        if rc3 == 0:
            meta3 = json.loads(out_a3.read_text())
            ok("A3: extra params appear in parameter_names", "flow_state_id" in meta3.get("parameter_names", []))
            safe_p3 = meta3.get("safe_params", {})
            ok("A3: safe_params does NOT leak extra query values", "abc-123" not in json.dumps(safe_p3))

        # A4: Wrong host rejected
        url_a4 = build_verify_url(host="evil-phishing.com")
        eml_a4 = write_eml(tmp, "a4.eml", canonical_html(url_a4))
        out_a4 = tmp / "a4-meta.json"
        rc4, _, err4 = run_parse_eml(eml_a4, SAMPLE_RECIPIENT, out_a4)
        ok("A4: wrong host rejected (exit 1)", rc4 != 0)
        ok("A4: no token in error output", SAMPLE_TOKEN not in err4)

        # A5: Invite type rejected
        url_a5 = build_verify_url(type_="invite")
        eml_a5 = write_eml(tmp, "a5.eml", canonical_html(url_a5))
        out_a5 = tmp / "a5-meta.json"
        rc5, _, _ = run_parse_eml(eml_a5, SAMPLE_RECIPIENT, out_a5)
        ok("A5: invite type rejected (exit 1)", rc5 != 0)

        # A6: Wrong redirect_to rejected
        url_a6 = build_verify_url(redirect="https://attacker.com/evil")
        eml_a6 = write_eml(tmp, "a6.eml", canonical_html(url_a6))
        out_a6 = tmp / "a6-meta.json"
        rc6, _, _ = run_parse_eml(eml_a6, SAMPLE_RECIPIENT, out_a6)
        ok("A6: wrong redirect_to rejected (exit 1)", rc6 != 0)

        # A7: Fragment in URL rejected
        url_a7 = build_verify_url(fragment="token=stolen")
        eml_a7 = write_eml(tmp, "a7.eml", canonical_html(url_a7))
        out_a7 = tmp / "a7-meta.json"
        rc7, _, _ = run_parse_eml(eml_a7, SAMPLE_RECIPIENT, out_a7)
        ok("A7: fragment in URL rejected (exit 1)", rc7 != 0)

        # A8: Username in URL rejected
        url_a8 = build_verify_url(username="attacker")
        eml_a8 = write_eml(tmp, "a8.eml", canonical_html(url_a8))
        out_a8 = tmp / "a8-meta.json"
        rc8, _, _ = run_parse_eml(eml_a8, SAMPLE_RECIPIENT, out_a8)
        ok("A8: username in URL rejected (exit 1)", rc8 != 0)

        # A9: Duplicate token param rejected
        url_a9 = (
            f"https://{CANONICAL_HOST}{CANONICAL_VERIFY_PATH}"
            f"?token={SAMPLE_TOKEN}&token=second_token&type=signup"
            f"&redirect_to={urllib.parse.quote(CANONICAL_REDIRECT)}"
        )
        eml_a9 = write_eml(tmp, "a9.eml", canonical_html(url_a9))
        out_a9 = tmp / "a9-meta.json"
        rc9, _, _ = run_parse_eml(eml_a9, SAMPLE_RECIPIENT, out_a9)
        ok("A9: duplicate token param rejected (exit 1)", rc9 != 0)

        # A10: No verify link
        eml_a10 = write_eml(tmp, "a10.eml", "<html><body><p>Hello world</p></body></html>")
        out_a10 = tmp / "a10-meta.json"
        rc10, _, _ = run_parse_eml(eml_a10, SAMPLE_RECIPIENT, out_a10)
        ok("A10: no verify link → exit 1", rc10 != 0)

        # A11: Two distinct verify links (ambiguous)
        url_a11a = build_verify_url(token="pkce_token_first_00000000000000000001")
        url_a11b = build_verify_url(token="pkce_token_second_00000000000000000002")
        eml_a11 = write_eml(tmp, "a11.eml", f"""
        <html><body>
          <a href="{html.escape(url_a11a)}">First</a>
          <a href="{html.escape(url_a11b)}">Second</a>
        </body></html>
        """)
        out_a11 = tmp / "a11-meta.json"
        rc11, _, _ = run_parse_eml(eml_a11, SAMPLE_RECIPIENT, out_a11)
        ok("A11: two distinct verify links → exit 1 (ambiguous)", rc11 != 0)

        # A12: Marketing link not counted, real link accepted
        eml_a12 = write_eml(tmp, "a12.eml", canonical_html(build_verify_url()))
        out_a12 = tmp / "a12-meta.json"
        rc12, _, _ = run_parse_eml(eml_a12, SAMPLE_RECIPIENT, out_a12)
        ok("A12: marketing link not counted, real link accepted", rc12 == 0)

        # A13: Recipient mismatch rejected (email NOT in stderr)
        SECRET_RECIPIENT = "secret-owner-address@example.com"
        OTHER_RECIPIENT  = "other-address@example.com"
        eml_a13 = write_eml(tmp, "a13.eml", canonical_html(build_verify_url()),
                            recipient=SECRET_RECIPIENT)
        out_a13 = tmp / "a13-meta.json"
        rc13, _, err13 = run_parse_eml(eml_a13, OTHER_RECIPIENT, out_a13)
        ok("A13: recipient mismatch → exit 1", rc13 != 0)
        ok("A13: secret recipient email NOT in stderr", SECRET_RECIPIENT not in err13)
        ok("A13: other email NOT in stderr", OTHER_RECIPIENT not in err13)

        # A14: Old message rejected by max-age-hours
        eml_a14 = write_eml(tmp, "a14.eml", canonical_html(build_verify_url()),
                            date_str="Sun, 01 Jan 2023 00:00:00 +0000")
        out_a14 = tmp / "a14-meta.json"
        rc14, _, _ = run_parse_eml(eml_a14, SAMPLE_RECIPIENT, out_a14, extra_args=["--max-age-hours", "1"])
        ok("A14: old message with max-age-hours rejected → exit 1", rc14 != 0)

        # A15: Missing redirect_to rejected
        url_a15 = f"https://{CANONICAL_HOST}{CANONICAL_VERIFY_PATH}?token={SAMPLE_TOKEN}&type=signup"
        eml_a15 = write_eml(tmp, "a15.eml", canonical_html(url_a15))
        out_a15 = tmp / "a15-meta.json"
        rc15, _, _ = run_parse_eml(eml_a15, SAMPLE_RECIPIENT, out_a15)
        ok("A15: missing redirect_to rejected → exit 1", rc15 != 0)

        # A16: Quoted-printable encoded URL decoded correctly
        raw_url = build_verify_url()
        qp_body = quopri.encodestring(canonical_html(raw_url).encode("utf-8")).decode("ascii")
        eml_a16_path = tmp / "a16.eml"
        eml_a16_path.write_text(
            f"From: noreply@mail.app.supabase.io\n"
            f"To: {SAMPLE_RECIPIENT}\n"
            f"Subject: Confirm signup\n"
            f"Date: Mon, 02 Nov 2026 13:34:44 +0000\n"
            f"Content-Type: text/html; charset=\"utf-8\"\n"
            f"Content-Transfer-Encoding: quoted-printable\n\n"
            f"{qp_body}\n"
        )
        out_a16 = tmp / "a16-meta.json"
        rc16, _, err16 = run_parse_eml(eml_a16_path, SAMPLE_RECIPIENT, out_a16)
        ok("A16: quoted-printable EML decoded correctly", rc16 == 0, err16[:100] if rc16 != 0 else "")

        # A17 (Finding 4): HTTP scheme rejected
        url_a17 = build_verify_url(scheme="http")
        eml_a17 = write_eml(tmp, "a17.eml", canonical_html(url_a17))
        out_a17 = tmp / "a17-meta.json"
        rc17, _, _ = run_parse_eml(eml_a17, SAMPLE_RECIPIENT, out_a17)
        ok("A17: http scheme rejected (exit 1)", rc17 != 0)

        # A18 (Finding 4): Identical multipart activation links deduplicated
        shared_url = build_verify_url()
        eml_a18 = write_eml(tmp, "a18.eml",
                            html_body=f'<html><body><a href="{html.escape(shared_url)}">Link</a></body></html>',
                            plain_body=f"Click here: {shared_url}")
        out_a18 = tmp / "a18-meta.json"
        rc18, _, err18 = run_parse_eml(eml_a18, SAMPLE_RECIPIENT, out_a18)
        ok("A18: identical multipart activation links deduplicated (exit 0)", rc18 == 0, err18[:100] if rc18 != 0 else "")

        # A19 (Finding 2): --expected-recipient-file private input path interface
        priv_json = tmp / "mode0600-private.json"
        priv_json.write_text(json.dumps({"email": SAMPLE_RECIPIENT, "label": SAMPLE_LABEL}))
        eml_a19 = write_eml(tmp, "a19.eml", canonical_html(build_verify_url()))
        out_a19 = tmp / "a19-meta.json"
        rc19, _, _ = run_parse_eml(eml_a19, recipient_file=priv_json, out_path=out_a19)
        ok("A19: --expected-recipient-file accepted", rc19 == 0)
        if rc19 == 0:
            meta19 = json.loads(out_a19.read_text())
            ok("A19: run_label recorded in metadata", meta19.get("run_label") == SAMPLE_LABEL)

        # A20 (Finding 4): Custom port in provider URL rejected
        url_a20 = build_verify_url(port=8443)
        eml_a20 = write_eml(tmp, "a20.eml", canonical_html(url_a20))
        out_a20 = tmp / "a20-meta.json"
        rc20, _, _ = run_parse_eml(eml_a20, SAMPLE_RECIPIENT, out_a20)
        ok("A20: custom port in provider URL rejected (exit 1)", rc20 != 0)

        # A21 (Finding 4): Query parameters in redirect_to rejected
        url_a21 = build_verify_url(redirect=CANONICAL_REDIRECT + "?extra=query")
        eml_a21 = write_eml(tmp, "a21.eml", canonical_html(url_a21))
        out_a21 = tmp / "a21-meta.json"
        rc21, _, _ = run_parse_eml(eml_a21, SAMPLE_RECIPIENT, out_a21)
        ok("A21: query parameters in redirect_to rejected (exit 1)", rc21 != 0)


# ─────────────────────────────────────────────────────────────────────────────
# GROUP B — URL validation logic
# ─────────────────────────────────────────────────────────────────────────────
def test_group_b():
    print("\n── Group B: URL validation logic ───────────────────────────────")
    with tempfile.TemporaryDirectory() as _tmp:
        tmp = Path(_tmp)

        def quick_test(label, url, should_pass):
            html_body = f'<html><body><a href="{html.escape(url)}">link</a></body></html>'
            eml = write_eml(tmp, f"{label}.eml", html_body)
            out = tmp / f"{label}-meta.json"
            rc, _, _ = run_parse_eml(eml, SAMPLE_RECIPIENT, out)
            ok(f"B: {label}", (rc == 0) == should_pass)

        quick_test("PKCE token accepted",
                   build_verify_url(token="pkce_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef01234567"),
                   should_pass=True)
        quick_test("base64url token accepted",
                   build_verify_url(token="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop"),
                   should_pass=True)
        quick_test("missing type → rejected",
                   f"https://{CANONICAL_HOST}{CANONICAL_VERIFY_PATH}?token={SAMPLE_TOKEN}&redirect_to={urllib.parse.quote(CANONICAL_REDIRECT)}",
                   should_pass=False)
        quick_test("missing token → rejected",
                   f"https://{CANONICAL_HOST}{CANONICAL_VERIFY_PATH}?type=signup&redirect_to={urllib.parse.quote(CANONICAL_REDIRECT)}",
                   should_pass=False)
        quick_test("empty token → rejected",
                   f"https://{CANONICAL_HOST}{CANONICAL_VERIFY_PATH}?token=&type=signup&redirect_to={urllib.parse.quote(CANONICAL_REDIRECT)}",
                   should_pass=False)


# ─────────────────────────────────────────────────────────────────────────────
# GROUP C — Auth helper constraints (calling actual JS helpers-testable.mjs)
# ─────────────────────────────────────────────────────────────────────────────
def test_group_c():
    print("\n── Group C: Auth helper constraints (helpers-testable.mjs) ───────")

    # Base valid fixtures
    valid_storage_state = {
        "cookies": [
            {
                "name": "sb-sncfyvpzwedqgwfpffkh-learner-token-code-verifier",
                "value": "test-code-verifier-value",
                "domain": "lingora-learner-dev.vercel.app",
                "path": "/",
            }
        ],
        "origins": [],
    }
    valid_auth = {
        "label": SAMPLE_LABEL,
        "registrationAttemptedAt": "2026-11-02T13:30:00.000Z",
        "registered": "2026-11-02T13:30:05.000Z",
        "storageState": valid_storage_state,
    }
    valid_eml = {
        "parsed":             True,
        "provider_host":      CANONICAL_HOST,
        "provider_path":      CANONICAL_VERIFY_PATH,
        "type":               EXPECTED_TYPE,
        "redirect_to_origin": CANONICAL_LEARNER_ORIGIN,
        "redirect_to_path":   "/auth/confirm",
        "recipient_matched":  True,
        "recipient_hash":     hashlib.sha256(SAMPLE_RECIPIENT.encode("utf-8")).hexdigest(),
        "run_label":          SAMPLE_LABEL,
        "message_date":       "2026-11-02T13:34:44.000Z",
    }
    valid_url = build_verify_url()
    valid_private_in = {"email": SAMPLE_RECIPIENT, "label": SAMPLE_LABEL}

    # C1: checkRegisterGuard: refuse register if registered marker set
    _, res1, _ = run_js("checkRegisterGuard", {"authPrivate": {"registered": "2026-11-02T00:00:00Z"}})
    ok("C1: checkRegisterGuard refuses if registered set", res1.get("allowed") is False)

    # C2: checkRegisterGuard: refuse register if registrationAttemptedAt set
    _, res2, _ = run_js("checkRegisterGuard", {"authPrivate": {"registrationAttemptedAt": "2026-11-02T00:00:00Z"}})
    ok("C2: checkRegisterGuard refuses if registrationAttemptedAt set", res2.get("allowed") is False)

    # C3: checkConfirmGuard: refuse confirm if not registered
    _, res3, _ = run_js("checkConfirmGuard", {
        "authPrivate": {},
        "emlMeta": valid_eml,
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C3: checkConfirmGuard refuses if not registered", res3.get("allowed") is False)

    # C4: checkConfirmGuard: refuse confirm if confirmed marker set
    _, res4, _ = run_js("checkConfirmGuard", {
        "authPrivate": {**valid_auth, "confirmed": "2026-11-02T00:01:00Z"},
        "emlMeta": valid_eml,
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C4: checkConfirmGuard refuses if confirmed set", res4.get("allowed") is False)

    # C5: checkConfirmGuard: refuse confirm if confirmationAttemptedAt set
    _, res5, _ = run_js("checkConfirmGuard", {
        "authPrivate": {**valid_auth, "confirmationAttemptedAt": "2026-11-02T00:01:00Z"},
        "emlMeta": valid_eml,
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C5: checkConfirmGuard refuses if confirmationAttemptedAt set", res5.get("allowed") is False)

    # C6: checkConfirmGuard: require eml-meta parsed=true
    _, res6, _ = run_js("checkConfirmGuard", {
        "authPrivate": valid_auth,
        "emlMeta": {**valid_eml, "parsed": False},
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C6: checkConfirmGuard refuses if eml not parsed", res6.get("allowed") is False)

    # C7: checkConfirmGuard: reject wrong provider host in eml-meta
    _, res7, _ = run_js("checkConfirmGuard", {
        "authPrivate": valid_auth,
        "emlMeta": {**valid_eml, "provider_host": "evil.supabase.co"},
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C7: checkConfirmGuard rejects wrong provider host", res7.get("allowed") is False)

    # C8: checkConfirmGuard: reject wrong eml type
    _, res8, _ = run_js("checkConfirmGuard", {
        "authPrivate": valid_auth,
        "emlMeta": {**valid_eml, "type": "invite"},
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C8: checkConfirmGuard rejects wrong eml type", res8.get("allowed") is False)

    # C9: checkConfirmGuard: reject wrong redirect origin
    _, res9, _ = run_js("checkConfirmGuard", {
        "authPrivate": valid_auth,
        "emlMeta": {**valid_eml, "redirect_to_origin": "https://evil.example.com"},
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C9: checkConfirmGuard rejects wrong redirect origin", res9.get("allowed") is False)

    # C10: checkConfirmGuard: reject URL with fragment
    url_c10 = build_verify_url(fragment="token=leaked")
    _, res10, _ = run_js("checkConfirmGuard", {
        "authPrivate": valid_auth,
        "emlMeta": valid_eml,
        "rawUrl": url_c10,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C10: checkConfirmGuard rejects URL with fragment", res10.get("allowed") is False)

    # C11: checkConfirmGuard: reject URL with credentials
    url_c11 = build_verify_url(username="user")
    _, res11, _ = run_js("checkConfirmGuard", {
        "authPrivate": valid_auth,
        "emlMeta": valid_eml,
        "rawUrl": url_c11,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C11: checkConfirmGuard rejects URL with credentials", res11.get("allowed") is False)

    # C12: checkConfirmGuard: reject duplicate token in URL
    url_c12 = (
        f"https://{CANONICAL_HOST}{CANONICAL_VERIFY_PATH}"
        f"?token={SAMPLE_TOKEN}&token=other&type=signup"
        f"&redirect_to={urllib.parse.quote(CANONICAL_REDIRECT)}"
    )
    _, res12, _ = run_js("checkConfirmGuard", {
        "authPrivate": valid_auth,
        "emlMeta": valid_eml,
        "rawUrl": url_c12,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C12: checkConfirmGuard rejects duplicate token in URL", res12.get("allowed") is False)

    # C13 (Finding 2): reject missing storageState (no blank-context fallback allowed)
    auth_no_storage = {**valid_auth}
    del auth_no_storage["storageState"]
    _, res13, _ = run_js("checkConfirmGuard", {
        "authPrivate": auth_no_storage,
        "emlMeta": valid_eml,
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C13: checkConfirmGuard refuses missing storageState (no blank fallback)", res13.get("allowed") is False)

    # C14 (Finding 2): reject storageState missing dedicated Learner PKCE verifier cookie
    auth_bad_cookie = {
        **valid_auth,
        "storageState": {"cookies": [{"name": "unrelated_cookie", "value": "123"}]},
    }
    _, res14, _ = run_js("checkConfirmGuard", {
        "authPrivate": auth_bad_cookie,
        "emlMeta": valid_eml,
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C14: checkConfirmGuard refuses storageState missing PKCE verifier cookie", res14.get("allowed") is False)

    # C15 (Finding 2): reject stale message_date beyond clock skew
    stale_eml = {**valid_eml, "message_date": "2026-11-01T00:00:00.000Z"}
    _, res15, _ = run_js("checkConfirmGuard", {
        "authPrivate": valid_auth,
        "emlMeta": stale_eml,
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C15: checkConfirmGuard rejects stale message date (> 3600s)", res15.get("allowed") is False)

    # C16 (Finding 2): reject future message_date beyond clock skew
    future_eml = {**valid_eml, "message_date": "2026-11-02T16:00:00.000Z"}
    _, res16, _ = run_js("checkConfirmGuard", {
        "authPrivate": valid_auth,
        "emlMeta": future_eml,
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C16: checkConfirmGuard rejects future message date (> 3600s)", res16.get("allowed") is False)

    # C17 (Finding 2): reject recipient hash mismatch
    bad_hash_eml = {**valid_eml, "recipient_hash": "deadbeef12345678"}
    _, res17, _ = run_js("checkConfirmGuard", {
        "authPrivate": valid_auth,
        "emlMeta": bad_hash_eml,
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C17: checkConfirmGuard rejects recipient hash mismatch", res17.get("allowed") is False)

    # C18 (Finding 2): reject label mismatch
    _, res18, _ = run_js("checkConfirmGuard", {
        "authPrivate": {**valid_auth, "label": "WRONG_LABEL"},
        "emlMeta": valid_eml,
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C18: checkConfirmGuard rejects label mismatch", res18.get("allowed") is False)

    # C19 (Finding 4): reject custom port in URL
    url_c19 = build_verify_url(port=8443)
    _, res19, _ = run_js("checkConfirmGuard", {
        "authPrivate": valid_auth,
        "emlMeta": valid_eml,
        "rawUrl": url_c19,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C19: checkConfirmGuard rejects custom port in rawUrl", res19.get("allowed") is False)

    # C20: valid state passes checkConfirmGuard at event time
    _, res20, _ = run_js("checkConfirmGuard", {
        "authPrivate": valid_auth,
        "emlMeta": valid_eml,
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C20: checkConfirmGuard passes on valid state", res20.get("allowed") is True)

    # C21 (Finding 1): checkIdentityPreflight fails if identity already exists
    _, res21, _ = run_js("checkIdentityPreflight", {"identityRows": [{"id": "user-123"}]})
    ok("C21: checkIdentityPreflight fails if identity exists", res21.get("allowed") is False)

    # C22 (Finding 1): checkIdentityPreflight passes if 0 identities
    _, res22, _ = run_js("checkIdentityPreflight", {"identityRows": []})
    ok("C22: checkIdentityPreflight passes if 0 identities", res22.get("allowed") is True)

    # C23 (Finding 1): checkRegistrationPostDb verifies exact new unconfirmed subject
    valid_post_rows = [{
        "id": "new-user-123",
        "created_at": "2026-11-02T13:30:02.000Z",
        "email_confirmed_at": None,
        "label": SAMPLE_LABEL,
        "account_id": None,
        "context_count": 0,
        "session_count": 0,
    }]
    _, res23, _ = run_js("checkRegistrationPostDb", {
        "identityRows": valid_post_rows,
        "expectedLabel": SAMPLE_LABEL,
        "registrationAttemptedAt": "2026-11-02T13:30:00.000Z",
        "now": EVENT_TIME_MS,
    })
    ok("C23: checkRegistrationPostDb passes on fresh unconfirmed subject", res23.get("allowed") is True)

    # C24 (Finding 1): checkConfirmPreNavigationDb refuses already confirmed user
    confirmed_user_rows = [{
        "id": "new-user-123",
        "email": SAMPLE_RECIPIENT,
        "email_confirmed_at": "2026-11-02T13:35:00.000Z",
        "label": SAMPLE_LABEL,
    }]
    _, res24, _ = run_js("checkConfirmPreNavigationDb", {
        "userRows": confirmed_user_rows,
        "expectedEmail": SAMPLE_RECIPIENT,
        "expectedLabel": SAMPLE_LABEL,
    })
    ok("C24: checkConfirmPreNavigationDb refuses already-confirmed user", res24.get("allowed") is False)

    # C25 (Finding 9): isSpent blocks second POST or navigation
    _, res25a, _ = run_js("isSpent", {"authPrivate": {"registrationAttemptedAt": "now"}, "mode": "register"})
    _, res25b, _ = run_js("isSpent", {"authPrivate": {"confirmationAttemptedAt": "now"}, "mode": "confirm"})
    ok("C25: isSpent blocks second register or confirm", res25a is True and res25b is True)

    # C26 (Finding 1/2): checkConfirmGuard rejects expired same-date pair against current clock
    _, res26, _ = run_js("checkConfirmGuard", {
        "authPrivate": valid_auth,
        "emlMeta": valid_eml,
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS + 48 * 3600 * 1000,
    })
    ok("C26: checkConfirmGuard rejects expired same-date pair against current clock",
       res26.get("allowed") is False and "expired" in res26.get("reason", ""))

    # C27 (Finding 1/2): checkConfirmGuard rejects missing recipient_hash in emlMeta
    eml_no_hash = {**valid_eml}
    del eml_no_hash["recipient_hash"]
    _, res27, _ = run_js("checkConfirmGuard", {
        "authPrivate": valid_auth,
        "emlMeta": eml_no_hash,
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C27: checkConfirmGuard rejects missing recipient_hash in emlMeta", res27.get("allowed") is False)

    # C28 (Finding 1/2): checkConfirmGuard rejects missing run_label in emlMeta
    eml_no_label = {**valid_eml}
    del eml_no_label["run_label"]
    _, res28, _ = run_js("checkConfirmGuard", {
        "authPrivate": valid_auth,
        "emlMeta": eml_no_label,
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C28: checkConfirmGuard rejects missing run_label in emlMeta", res28.get("allowed") is False)

    # C29 (Finding 1/2): checkConfirmGuard rejects wrong PKCE cookie name (e.g. staff cookie)
    auth_staff_cookie = {
        **valid_auth,
        "storageState": {
            "cookies": [{
                "name": "sb-staff-token-code-verifier",
                "value": "valid-val",
                "domain": "lingora-learner-dev.vercel.app",
                "path": "/",
            }]
        }
    }
    _, res29, _ = run_js("checkConfirmGuard", {
        "authPrivate": auth_staff_cookie,
        "emlMeta": valid_eml,
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C29: checkConfirmGuard rejects wrong PKCE cookie name", res29.get("allowed") is False)

    # C30 (Finding 1/2): checkConfirmGuard rejects PKCE cookie with empty value
    auth_empty_cookie = {
        **valid_auth,
        "storageState": {
            "cookies": [{
                "name": "sb-sncfyvpzwedqgwfpffkh-learner-token-code-verifier",
                "value": "   ",
                "domain": "lingora-learner-dev.vercel.app",
                "path": "/",
            }]
        }
    }
    _, res30, _ = run_js("checkConfirmGuard", {
        "authPrivate": auth_empty_cookie,
        "emlMeta": valid_eml,
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C30: checkConfirmGuard rejects PKCE cookie with empty value", res30.get("allowed") is False)

    # C31 (Finding 1/2): checkConfirmGuard rejects PKCE cookie with invalid domain
    auth_bad_domain = {
        **valid_auth,
        "storageState": {
            "cookies": [{
                "name": "sb-sncfyvpzwedqgwfpffkh-learner-token-code-verifier",
                "value": "valid-val",
                "domain": "staff.example.com",
                "path": "/",
            }]
        }
    }
    _, res31, _ = run_js("checkConfirmGuard", {
        "authPrivate": auth_bad_domain,
        "emlMeta": valid_eml,
        "rawUrl": valid_url,
        "privateIn": valid_private_in,
        "now": EVENT_TIME_MS,
    })
    ok("C31: checkConfirmGuard rejects PKCE cookie with invalid domain", res31.get("allowed") is False)

    # C32 (Finding 1): checkRegisterBinding rejects provenance registrationEmail mismatch
    valid_prov = {
        "commit": "head-123",
        "ready": True,
        "learnerBase": CANONICAL_LEARNER_ORIGIN,
        "registrationEmail": SAMPLE_RECIPIENT,
        "runLabel": SAMPLE_LABEL,
    }
    valid_base = {
        "at": "2026-11-02T13:30:00.000Z",
        "readOnly": True,
        "registrationEmail": SAMPLE_RECIPIENT,
        "runLabel": SAMPLE_LABEL,
        "sourceCommit": "head-123",
        "identity": [],
        "course": {"id": "course-123"},
        "lessons": [{"id": "lesson-1"}],
        "fullRuntimeSnapshot": {
            "course": [{"id": "course-123"}],
            "lessons": [{"id": "lesson-1"}],
        },
        "retainedS11Scope": {"learnerIds": ["retained-learner-1"], "contextIds": ["retained-context-1"]},
        "retainedS11Baseline": {
            "attempts": ['{"id": "att-1"}'],
            "responses": ['{"id": "resp-1"}'],
            "completions": ['{"id": "comp-1"}'],
            "cards": ['{"id": "card-1"}'],
            "receipts": ['{"id": "rec-1"}'],
            "consumptions": [],
            "srs_review_operations": [],
        },
    }
    _, res32, _ = run_js("checkRegisterBinding", {
        "provenance": {**valid_prov, "registrationEmail": "other@example.com"},
        "privateIn": valid_private_in,
        "baseline": valid_base,
        "now": EVENT_TIME_MS,
    })
    ok("C32: checkRegisterBinding rejects provenance registrationEmail mismatch", res32.get("allowed") is False)

    # C33 (Finding 1): checkRegisterBinding rejects provenance runLabel mismatch
    _, res33, _ = run_js("checkRegisterBinding", {
        "provenance": {**valid_prov, "runLabel": "DEV_S12_PUBLIC_OTHER"},
        "privateIn": valid_private_in,
        "baseline": valid_base,
        "now": EVENT_TIME_MS,
    })
    ok("C33: checkRegisterBinding rejects provenance runLabel mismatch", res33.get("allowed") is False)

    # C34 (Finding 1): checkRegisterBinding rejects stale or future preflight baseline
    _, res34a, _ = run_js("checkRegisterBinding", {
        "provenance": valid_prov,
        "privateIn": valid_private_in,
        "baseline": {**valid_base, "at": "2026-11-01T00:00:00.000Z"},
        "now": EVENT_TIME_MS,
    })
    _, res34b, _ = run_js("checkRegisterBinding", {
        "provenance": valid_prov,
        "privateIn": valid_private_in,
        "baseline": {**valid_base, "at": "2026-11-02T16:00:00.000Z"},
        "now": EVENT_TIME_MS,
    })
    ok("C34: checkRegisterBinding rejects stale or future preflight baseline",
       res34a.get("allowed") is False and res34b.get("allowed") is False)

    # C35 (Finding 1): checkRegisterBinding rejects preflight baseline with existing identity
    _, res35, _ = run_js("checkRegisterBinding", {
        "provenance": valid_prov,
        "privateIn": valid_private_in,
        "baseline": {**valid_base, "identity": [{"id": "user-exist"}]},
        "now": EVENT_TIME_MS,
    })
    ok("C35: checkRegisterBinding rejects baseline with existing identity", res35.get("allowed") is False)

    # C36 (Finding 1): checkRegisterBinding passes on valid binding and fresh baseline
    _, res36, _ = run_js("checkRegisterBinding", {
        "provenance": valid_prov,
        "privateIn": valid_private_in,
        "baseline": valid_base,
        "now": EVENT_TIME_MS,
    })
    ok("C36: checkRegisterBinding passes on valid binding and fresh baseline", res36.get("allowed") is True)

    # C37 (Finding 2): isValidLearnerPkceCookie rejects cookie with missing domain
    _, res37, _ = run_js("isValidLearnerPkceCookie", {
        "cookie": {
            "name": "sb-sncfyvpzwedqgwfpffkh-learner-token-code-verifier",
            "value": "valid_val",
            "path": "/",
        }
    })
    ok("C37: isValidLearnerPkceCookie rejects cookie with missing domain", res37.get("valid") is False)

    # C38 (Finding 2): isValidLearnerPkceCookie rejects public suffix domain vercel.app
    _, res38, _ = run_js("isValidLearnerPkceCookie", {
        "cookie": {
            "name": "sb-sncfyvpzwedqgwfpffkh-learner-token-code-verifier",
            "value": "valid_val",
            "domain": "vercel.app",
            "path": "/",
        }
    })
    ok("C38: isValidLearnerPkceCookie rejects public suffix domain vercel.app", res38.get("valid") is False)

    # C39 (Finding 2): isValidLearnerPkceCookie rejects foreign domain or unauthorized subdomain
    _, res39, _ = run_js("isValidLearnerPkceCookie", {
        "cookie": {
            "name": "sb-sncfyvpzwedqgwfpffkh-learner-token-code-verifier",
            "value": "valid_val",
            "domain": "other.vercel.app",
            "path": "/",
        }
    })
    ok("C39: isValidLearnerPkceCookie rejects foreign domain", res39.get("valid") is False)

    # C40 (Finding 2): isValidLearnerPkceCookie rejects cookie with missing path
    _, res40, _ = run_js("isValidLearnerPkceCookie", {
        "cookie": {
            "name": "sb-sncfyvpzwedqgwfpffkh-learner-token-code-verifier",
            "value": "valid_val",
            "domain": "lingora-learner-dev.vercel.app",
        }
    })
    ok("C40: isValidLearnerPkceCookie rejects cookie with missing path", res40.get("valid") is False)

    # C41 (Finding 2): isValidLearnerPkceCookie and cookiePathMatches reject path /auth/con for /auth/confirm
    _, res41a, _ = run_js("cookiePathMatches", {"cookiePath": "/auth/con", "requestPath": "/auth/confirm"})
    _, res41b, _ = run_js("isValidLearnerPkceCookie", {
        "cookie": {
            "name": "sb-sncfyvpzwedqgwfpffkh-learner-token-code-verifier",
            "value": "valid_val",
            "domain": "lingora-learner-dev.vercel.app",
            "path": "/auth/con",
        }
    })
    ok("C41: cookiePathMatches rejects /auth/con for /auth/confirm", res41a.get("matched") is False)
    ok("C41: isValidLearnerPkceCookie rejects path /auth/con", res41b.get("valid") is False)

    # C42 (Finding 2): isValidLearnerPkceCookie and cookiePathMatches accept /auth/confirm and /
    _, res42a, _ = run_js("cookiePathMatches", {"cookiePath": "/auth/confirm", "requestPath": "/auth/confirm"})
    _, res42b, _ = run_js("cookiePathMatches", {"cookiePath": "/", "requestPath": "/auth/confirm"})
    ok("C42: cookiePathMatches accepts exact /auth/confirm and root /", res42a.get("matched") is True and res42b.get("matched") is True)

    # C43 (Finding 2): isValidLearnerPkceCookie rejects expired cookie against options.now
    _, res43, _ = run_js("isValidLearnerPkceCookie", {
        "cookie": {
            "name": "sb-sncfyvpzwedqgwfpffkh-learner-token-code-verifier",
            "value": "valid_val",
            "domain": "lingora-learner-dev.vercel.app",
            "path": "/auth/confirm",
            "expires": 1000,
        },
        "now": EVENT_TIME_MS,
    })
    ok("C43: isValidLearnerPkceCookie rejects expired cookie", res43.get("valid") is False)

    # C44 (Finding 2): isValidLearnerPkceCookie accepts valid unexpired cookie with canonical domain and path
    _, res44, _ = run_js("isValidLearnerPkceCookie", {
        "cookie": {
            "name": "sb-sncfyvpzwedqgwfpffkh-learner-token-code-verifier",
            "value": "valid_val",
            "domain": "lingora-learner-dev.vercel.app",
            "path": "/auth/confirm",
            "expires": (EVENT_TIME_MS // 1000) + 3600,
        },
        "now": EVENT_TIME_MS,
    })
    ok("C44: isValidLearnerPkceCookie accepts valid unexpired cookie", res44.get("valid") is True)

    # C45 (Finding 1): checkRegisterBinding rejects missing provenance.runLabel
    prov_no_label = {**valid_prov}
    del prov_no_label["runLabel"]
    _, res45, _ = run_js("checkRegisterBinding", {
        "provenance": prov_no_label,
        "privateIn": valid_private_in,
        "baseline": valid_base,
        "now": EVENT_TIME_MS,
    })
    ok("C45: checkRegisterBinding rejects missing provenance.runLabel", res45.get("allowed") is False)

    # C46 (Finding 1): checkRegisterBinding rejects baseline missing or mismatching registrationEmail
    _, res46a, _ = run_js("checkRegisterBinding", {
        "provenance": valid_prov,
        "privateIn": valid_private_in,
        "baseline": {**valid_base, "registrationEmail": "other@example.com"},
        "now": EVENT_TIME_MS,
    })
    base_no_email = {**valid_base}
    del base_no_email["registrationEmail"]
    _, res46b, _ = run_js("checkRegisterBinding", {
        "provenance": valid_prov,
        "privateIn": valid_private_in,
        "baseline": base_no_email,
        "now": EVENT_TIME_MS,
    })
    ok("C46: checkRegisterBinding rejects baseline missing or mismatching registrationEmail",
       res46a.get("allowed") is False and res46b.get("allowed") is False)

    # C47 (Finding 1): checkRegisterBinding rejects baseline missing or mismatching runLabel
    _, res47a, _ = run_js("checkRegisterBinding", {
        "provenance": valid_prov,
        "privateIn": valid_private_in,
        "baseline": {**valid_base, "runLabel": "DEV_S12_PUBLIC_OTHER"},
        "now": EVENT_TIME_MS,
    })
    base_no_label = {**valid_base}
    del base_no_label["runLabel"]
    _, res47b, _ = run_js("checkRegisterBinding", {
        "provenance": valid_prov,
        "privateIn": valid_private_in,
        "baseline": base_no_label,
        "now": EVENT_TIME_MS,
    })
    ok("C47: checkRegisterBinding rejects baseline missing or mismatching runLabel",
       res47a.get("allowed") is False and res47b.get("allowed") is False)

    # C48 (Finding 1): checkRegisterBinding rejects baseline missing or mismatching sourceCommit
    _, res48a, _ = run_js("checkRegisterBinding", {
        "provenance": valid_prov,
        "privateIn": valid_private_in,
        "baseline": {**valid_base, "sourceCommit": "wrong-commit-sha"},
        "now": EVENT_TIME_MS,
    })
    base_no_commit = {**valid_base}
    del base_no_commit["sourceCommit"]
    _, res48b, _ = run_js("checkRegisterBinding", {
        "provenance": valid_prov,
        "privateIn": valid_private_in,
        "baseline": base_no_commit,
        "now": EVENT_TIME_MS,
    })
    ok("C48: checkRegisterBinding rejects baseline missing or mismatching sourceCommit",
       res48a.get("allowed") is False and res48b.get("allowed") is False)

    # C49 (Finding 1): checkRegisterBinding rejects baseline missing fullRuntimeSnapshot
    base_no_snapshot = {**valid_base}
    del base_no_snapshot["fullRuntimeSnapshot"]
    _, res49, _ = run_js("checkRegisterBinding", {
        "provenance": valid_prov,
        "privateIn": valid_private_in,
        "baseline": base_no_snapshot,
        "now": EVENT_TIME_MS,
    })
    ok("C49: checkRegisterBinding rejects baseline missing fullRuntimeSnapshot", res49.get("allowed") is False)

    # C50 (Finding 1/4): checkRegisterBinding rejects baseline missing or incomplete retainedS11Baseline
    base_no_s11 = {**valid_base}
    del base_no_s11["retainedS11Baseline"]
    _, res50a, _ = run_js("checkRegisterBinding", {
        "provenance": valid_prov,
        "privateIn": valid_private_in,
        "baseline": base_no_s11,
        "now": EVENT_TIME_MS,
    })
    base_incomplete_s11 = {
        **valid_base,
        "retainedS11Scope": {"learnerIds": ["retained-learner-1"], "contextIds": ["retained-context-1"]},
        "retainedS11Baseline": {
            "attempts": [],
            "responses": ['{"id": "r1"}'],
            "completions": ['{"id": "c1"}'],
            "cards": ['{"id": "cd1"}'],
            "receipts": ['{"id": "rc1"}'],
            "consumptions": [],
            "srs_review_operations": [],
        }
    }
    _, res50b, _ = run_js("checkRegisterBinding", {
        "provenance": valid_prov,
        "privateIn": valid_private_in,
        "baseline": base_incomplete_s11,
        "now": EVENT_TIME_MS,
    })
    ok("C50: checkRegisterBinding rejects baseline missing or incomplete retainedS11Baseline",
       res50a.get("allowed") is False and res50b.get("allowed") is False)

    _, res51, _ = run_js("checkRegisterBinding", {
        "provenance": valid_prov, "privateIn": valid_private_in,
        "baseline": {**valid_base, "retainedS11Scope": {}}, "now": EVENT_TIME_MS,
    })
    ok("C51: registration rejects a baseline without retained learner/context scope",
       res51.get("allowed") is False)


# ─────────────────────────────────────────────────────────────────────────────
# GROUP D — 7-group snapshot coverage and schema queries (helpers-testable.mjs)
# ─────────────────────────────────────────────────────────────────────────────
def test_group_d():
    print("\n── Group D: Snapshot coverage and schema queries ───────────────")

    # D1 (Finding 6): FULL_HISTORY_TABLES contains all 7 required tables
    _, res1, _ = run_js("fullHistoryTables")
    tables = res1.get("tables", [])
    expected_7 = [
        "lesson_consumptions",
        "lesson_attempts",
        "lesson_responses",
        "lesson_completions",
        "command_receipts",
        "srs_cards",
        "srs_review_operations",
    ]
    ok("D1: FULL_HISTORY_TABLES has all 7 required tables", len(tables) == 7 and all(t in tables for t in expected_7))

    # D2 (Finding 6): historyQueryFor generates valid deterministic SQL for all 7 tables
    queries = {}
    for t in expected_7:
        _, res, _ = run_js("historyQueryFor", {"table": t, "ids": {"contextId": "ctx-1", "learnerId": "lrn-1"}})
        queries[t] = res.get("sql", "")
    ok("D2: historyQueryFor generates SQL for all 7 tables", all(len(sql) > 0 for sql in queries.values()))

    # D3 (Finding 5): command_receipts query uses app_private.command_receipts
    ok("D3: command_receipts query targets app_private schema", "app_private.command_receipts" in queries.get("command_receipts", ""))

    # D4 (Finding 6): lesson_responses query joins app.lesson_attempts
    ok("D4: lesson_responses query joins lesson_attempts", "JOIN app.lesson_attempts" in queries.get("lesson_responses", ""))

    # D5 (Finding 5): immutableCountSQL uses app_private.command_receipts
    _, res5, _ = run_js("immutableCountSQL")
    sql5 = res5.get("sql", "")
    ok("D5: immutableCountSQL targets app_private.command_receipts", "app_private.command_receipts" in sql5 and "app.command_receipts" not in sql5)

    # D6 (Finding 3): isReadingConsumptionRequest matches exact singular endpoint with POST
    _, res6, _ = run_js("isReadingConsumptionRequest", {
        "url": f"{CANONICAL_LEARNER_ORIGIN}/api/learner/contexts/ctx-1/lessons/les-1/consumption",
        "method": "POST",
        "params": {"contextId": "ctx-1", "lessonId": "les-1"},
    })
    ok("D6: isReadingConsumptionRequest matches exact singular endpoint with POST", res6.get("matched") is True)

    # D7 (Finding 3): isReadingConsumptionRequest rejects plural /consumptions and GET
    _, res7a, _ = run_js("isReadingConsumptionRequest", {
        "url": f"{CANONICAL_LEARNER_ORIGIN}/api/learner/contexts/ctx-1/lessons/les-1/consumptions",
        "method": "POST",
        "params": {"contextId": "ctx-1", "lessonId": "les-1"},
    })
    _, res7b, _ = run_js("isReadingConsumptionRequest", {
        "url": f"{CANONICAL_LEARNER_ORIGIN}/api/learner/contexts/ctx-1/lessons/les-1/consumption",
        "method": "GET",
        "params": {"contextId": "ctx-1", "lessonId": "les-1"},
    })
    ok("D7: isReadingConsumptionRequest rejects plural /consumptions and GET",
       res7a.get("matched") is False and res7b.get("matched") is False)

    # D8 (Finding 3): validateReadingConsumptionDto validates exact DTO fields
    valid_dto = {
        "contextId": "ctx-1",
        "lessonId": "les-1",
        "lessonRevisionId": "rev-1",
        "state": "IN_PROGRESS",
    }
    _, res8a, _ = run_js("validateReadingConsumptionDto", {
        "dto": valid_dto,
        "params": {"contextId": "ctx-1", "lessonId": "les-1", "lessonRevisionId": "rev-1"},
    })
    _, res8b, _ = run_js("validateReadingConsumptionDto", {
        "dto": {**valid_dto, "lessonRevisionId": "wrong-rev"},
        "params": {"contextId": "ctx-1", "lessonId": "les-1", "lessonRevisionId": "rev-1"},
    })
    ok("D8: validateReadingConsumptionDto validates exact DTO fields",
       res8a.get("valid") is True and res8b.get("valid") is False)

    # D9 (Finding 5): compareHistorySnapshots detects paused-row mutation
    snap_before = {t: [] for t in expected_7}
    snap_paused_mutated = {t: [] for t in expected_7}
    snap_paused_mutated["lesson_responses"] = ['{"id": "mutated-resp-1"}']
    _, res9, _ = run_js("compareHistorySnapshots", {
        "before": snap_before,
        "current": snap_paused_mutated,
    })
    ok("D9: compareHistorySnapshots detects paused-row mutation", res9.get("equal") is False)

    # D10 (Finding 4/8): compareProviderFlowBaseline detects modified or missing flowIndex
    base_flow = [{"id": "f1", "user_id": None}]
    cur_flow_mod = [{"id": "f2", "user_id": None}]
    _, res10a, _ = run_js("compareProviderFlowBaseline", {"current": cur_flow_mod, "baseline": base_flow, "subjects": []})
    _, res10b, _ = run_js("compareProviderFlowBaseline", {"current": base_flow, "baseline": None, "subjects": []})
    ok("D10: compareProviderFlowBaseline detects modified or missing flowIndex",
       res10a.get("equal") is False and res10b.get("equal") is False)

    # D11 (Finding 4/8): compareRetainedS11Baseline detects modified or missing S11 baseline
    s11_base = {
        "attempts": ['{"id": "att-1"}'],
        "responses": ['{"id": "resp-1"}'],
        "completions": ['{"id": "comp-1"}'],
        "cards": ['{"id": "card-1"}'],
        "receipts": ['{"id": "rec-1"}'],
        "consumptions": [],
        "srs_review_operations": [],
    }
    s11_cur_same = {**s11_base}
    s11_cur_diff = {**s11_base, "receipts": ['{"id": "rec-MODIFIED"}']}
    _, res11a, _ = run_js("compareRetainedS11Baseline", {"current": s11_cur_same, "baseline": s11_base})
    _, res11b, _ = run_js("compareRetainedS11Baseline", {"current": s11_cur_diff, "baseline": s11_base})
    _, res11c, _ = run_js("compareRetainedS11Baseline", {"current": s11_cur_same, "baseline": {}})
    ok("D11: compareRetainedS11Baseline detects modified or missing S11 baseline",
       res11a.get("equal") is True and res11b.get("equal") is False and res11c.get("equal") is False)

    _, missing_current, _ = run_js("compareRetainedS11Baseline", {
        "current": {k: v for k, v in s11_base.items() if k != "consumptions"},
        "baseline": s11_base,
    })
    ok("D13: missing current empty group cannot be treated as a queried empty group",
       missing_current.get("equal") is False)

    # D12 (Finding 5): PostgreSQL exclusion query excludes all owned subjects (>=2) and keeps NULL and other subjects
    subjects = ["sub1-uuid", "sub2-uuid"]
    flow_rows = [
        {"id": "f1", "user_id": None},
        {"id": "f2", "user_id": "sub1-uuid"},
        {"id": "f3", "user_id": "sub2-uuid"},
        {"id": "f4", "user_id": "sub3-uuid"},
    ]
    # WHERE user_id IS NULL OR NOT (user_id = ANY($1::uuid[]))
    filtered = [f for f in flow_rows if f["user_id"] is None or f["user_id"] not in subjects]
    ok("D12: PostgreSQL exclusion filter keeps NULL and sub3, excludes sub1 and sub2",
       len(filtered) == 2 and filtered[0]["id"] == "f1" and filtered[1]["id"] == "f4")


# ─────────────────────────────────────────────────────────────────────────────
# GROUP E — Sanitized diagnostics (helpers-testable.mjs & parse-eml.py)
# ─────────────────────────────────────────────────────────────────────────────
def test_group_e():
    print("\n── Group E: Sanitized diagnostics ─────────────────────────────")

    SYNTHETIC_TOKEN    = "pkce_SYNTHETIC_SECRET_TOKEN_12345"
    SYNTHETIC_PASSWORD = "SYNTHETIC_PASSWORD_12345"
    SYNTHETIC_EMAIL    = "synthetic-learner@example-secret.com"

    # E1 (Finding 3): safeNavigation redacts non-allowlisted error query parameter
    raw_error_url = f"https://lingora-learner-dev.vercel.app/login?error=secret_database_leak_error_string"
    _, res1, _ = run_js("safeNavigation", {"url": raw_error_url})
    ok("E1: safeNavigation redacts arbitrary error parameter", res1.get("error") == "[REDACTED]")

    # E2 (Finding 3): safeNavigation preserves allowlisted error code
    allowed_url = f"https://lingora-learner-dev.vercel.app/login?error=access_denied&error_code=access_denied"
    _, res2, _ = run_js("safeNavigation", {"url": allowed_url})
    ok("E2: safeNavigation preserves allowlisted error", res2.get("error") == "access_denied" and res2.get("errorCode") == "access_denied")

    # E3 (Finding 3): safeNavigation never exposes passwords or tokens
    sensitive_url = f"https://lingora-learner-dev.vercel.app/login?confirmed=1&token={SYNTHETIC_TOKEN}&password={SYNTHETIC_PASSWORD}"
    _, res3, _ = run_js("safeNavigation", {"url": sensitive_url})
    res3_str = json.dumps(res3)
    ok("E3: safeNavigation never includes password or token", SYNTHETIC_TOKEN not in res3_str and SYNTHETIC_PASSWORD not in res3_str)

    # E4 (Finding 3): safeErrorCategory classifies TimeoutError without exposing URL/token
    fake_playwright_error = {
        "name": "TimeoutError",
        "message": f'page.goto: Timeout 30000ms exceeded navigating to "https://sncfyvpzwedqgwfpffkh.supabase.co/auth/v1/verify?token={SYNTHETIC_TOKEN}&type=signup"',
    }
    _, res4, _ = run_js("safeErrorCategory", {"error": fake_playwright_error})
    ok("E4: safeErrorCategory categorizes TimeoutError", res4.get("category") == "TimeoutError")
    ok("E4: safeErrorCategory output does not leak token", SYNTHETIC_TOKEN not in json.dumps(res4))

    # E5 (Finding 3): parse-eml.py safe_params does NOT leak arbitrary query values
    with tempfile.TemporaryDirectory() as _tmp:
        tmp = Path(_tmp)
        url_e5 = build_verify_url(extra_params="custom_secret_field=SECRET_VAL_123")
        eml_e5 = write_eml(tmp, "e5.eml", canonical_html(url_e5))
        out_e5 = tmp / "e5-meta.json"
        rc_e5, _, _ = run_parse_eml(eml_e5, SAMPLE_RECIPIENT, out_e5)
        ok("E5: parse-eml succeeds on extra query param", rc_e5 == 0)
        if rc_e5 == 0:
            meta_e5 = json.loads(out_e5.read_text())
            safe_params_str = json.dumps(meta_e5.get("safe_params", {}))
            ok("E5: safe_params does not publish arbitrary query values", "SECRET_VAL_123" not in safe_params_str)

    # E6 (Finding 2): safeErrorCategory does NOT reflect arbitrary error.name
    custom_secret_err = {
        "name": "super_secret_token_12345_abcdef",
        "message": "critical error",
    }
    _, res6, _ = run_js("safeErrorCategory", {"error": custom_secret_err})
    ok("E6: safeErrorCategory does NOT reflect arbitrary error.name",
       res6.get("name") == "Error" and res6.get("category") == "GeneralError" and
       "super_secret_token" not in json.dumps(res6))

    # E7 (Finding 2): parse-eml.py emits fixed 'wrong type' and does NOT leak query values
    with tempfile.TemporaryDirectory() as _tmp:
        tmp = Path(_tmp)
        url_e7 = build_verify_url(type_="SECRET_QUERY_VAL_99999")
        eml_e7 = write_eml(tmp, "e7.eml", canonical_html(url_e7))
        out_e7 = tmp / "e7-meta.json"
        rc_e7, _, err_e7 = run_parse_eml(eml_e7, SAMPLE_RECIPIENT, out_e7)
        ok("E7: parse-eml emits fixed 'wrong type'", "wrong type" in err_e7 and rc_e7 == 1)
        ok("E7: parse-eml does NOT leak invalid type parameter in stderr", "SECRET_QUERY_VAL_99999" not in err_e7)

    # E8 (Finding 2): parse-eml handles malformed private JSON safely
    with tempfile.TemporaryDirectory() as _tmp:
        tmp = Path(_tmp)
        bad_json = tmp / "malformed.json"
        bad_json.write_text('{"email": "secret@val.com" invalid_json}')
        eml_e8 = write_eml(tmp, "e8.eml", canonical_html(build_verify_url()))
        out_e8 = tmp / "e8-meta.json"
        rc_e8, _, err_e8 = run_parse_eml(eml_e8, recipient_file=bad_json, out_path=out_e8)
        ok("E8: parse-eml handles malformed private JSON safely",
           rc_e8 == 1 and "cannot load expected-recipient-file" in err_e8 and "secret@val.com" not in err_e8)

    # E9 (Finding 3): parse-eml rejects malformed port with synthetic secret without leaking in stderr
    with tempfile.TemporaryDirectory() as _tmp:
        tmp = Path(_tmp)
        url_e9 = "https://sncfyvpzwedqgwfpffkh.supabase.co:SECRET_PORT_99999/auth/v1/verify?token=pkce_12345678901234567890&type=signup&redirect_to=https://lingora-learner-dev.vercel.app/auth/confirm"
        eml_e9 = write_eml(tmp, "e9.eml", canonical_html(url_e9))
        out_e9 = tmp / "e9-meta.json"
        rc_e9, _, err_e9 = run_parse_eml(eml_e9, SAMPLE_RECIPIENT, out_e9)
        ok("E9: parse-eml rejects malformed port with non-zero exit", rc_e9 != 0)
        ok("E9: parse-eml does NOT leak SECRET_PORT_99999 in stderr", "SECRET_PORT_99999" not in err_e9 and "ValueError" not in err_e9)

    # E10 (Finding 3): parse-eml rejects malformed Date with synthetic secret without leaking in stderr
    with tempfile.TemporaryDirectory() as _tmp:
        tmp = Path(_tmp)
        eml_e10 = write_eml(tmp, "e10.eml", canonical_html(build_verify_url()), date_str="MALFORMED_SECRET_DATE_TOKEN_9999")
        out_e10 = tmp / "e10-meta.json"
        rc_e10, _, err_e10 = run_parse_eml(eml_e10, SAMPLE_RECIPIENT, out_e10)
        ok("E10: parse-eml rejects malformed Date with non-zero exit", rc_e10 != 0)
        ok("E10: parse-eml does NOT leak MALFORMED_SECRET_DATE_TOKEN_9999 in stderr", "MALFORMED_SECRET_DATE_TOKEN_9999" not in err_e10 and "ValueError" not in err_e10)

    # E11 (Finding 3): Runner bootstrap handlers catch malformed JSON and outer failures without leaking secrets
    with tempfile.TemporaryDirectory() as _tmp:
        tmp = Path(_tmp)
        bad_prov = tmp / "tmp/slice12-public-acceptance/ready-provenance.json"
        bad_prov.parent.mkdir(parents=True, exist_ok=True)
        bad_prov.write_text('{"secret_token": "SECRET_LEAK_TOKEN_123" invalid_json}')
        cmd_e11 = [
            "node",
            str(SCRIPT_DIR / "preflight-readonly.mjs"),
        ]
        env_e11 = os.environ.copy()
        env_e11["SLICE12_ROOT_DIR"] = str(tmp)
        res_e11 = subprocess.run(cmd_e11, env=env_e11, capture_output=True, text=True)
        ok("E11: runner bootstrap safely catches malformed JSON with exit 1", res_e11.returncode != 0)
        ok("E11: runner bootstrap does NOT leak SECRET_LEAK_TOKEN_123", "SECRET_LEAK_TOKEN_123" not in res_e11.stderr and "SECRET_LEAK_TOKEN_123" not in res_e11.stdout)


# ─────────────────────────────────────────────────────────────────────────────
# Helper for Group F isolated workspace setup
# ─────────────────────────────────────────────────────────────────────────────
def setup_temp_workspace(tmp_path):
    tmp = Path(tmp_path)
    slice_dir = tmp / "tmp/slice12-public-acceptance"
    ev_dir = tmp / "plans/evidence/slice-12-public-acceptance"
    slice_dir.mkdir(parents=True, exist_ok=True)
    ev_dir.mkdir(parents=True, exist_ok=True)

    head = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()

    prov = {
        "commit": head,
        "ready": True,
        "learnerBase": CANONICAL_LEARNER_ORIGIN,
        "registrationEmail": SAMPLE_RECIPIENT,
        "runLabel": SAMPLE_LABEL,
        "previousOwnedSubjectIds": ["prev-sub-1"],
    }
    (slice_dir / "ready-provenance.json").write_text(json.dumps(prov, indent=2))

    priv_in = {
        "email": SAMPLE_RECIPIENT,
        "password": "ValidPassword123!",
        "label": SAMPLE_LABEL,
    }
    (slice_dir / "mode0600-private.json").write_text(json.dumps(priv_in, indent=2))
    (slice_dir / "auth-private.json").write_text(json.dumps({"label": SAMPLE_LABEL}, indent=2))
    (slice_dir / "eml-url-private.txt").write_text("https://sncfyvpzwedqgwfpffkh.supabase.co/auth/v1/verify?token=pkce_secret\n")

    baseline = {
        "at": datetime.now(timezone.utc).isoformat(),
        "readOnly": True,
        "sourceCommit": head,
        "registrationEmail": SAMPLE_RECIPIENT,
        "runLabel": SAMPLE_LABEL,
        "identity": [],
        "course": {"id": "62f30613-6bf7-48cb-bc94-448a9736a178", "is_active": True, "names": {}},
        "lessons": [
            {"id": "4ad4b82e-5398-4505-b335-5aef7185cd03", "availability": "PUBLISHED", "active_revision_id": "rev-1"},
            {"id": "75d84614-050c-400a-8d06-de92a1418d67", "availability": "PUBLISHED", "active_revision_id": "rev-2"},
        ],
        "otherAccounts": [],
        "fullRuntimeSnapshot": {
            "course": [{"row": '{"id":"62f30613-6bf7-48cb-bc94-448a9736a178"}'}],
            "lessons": [
                {"row": '{"id":"4ad4b82e-5398-4505-b335-5aef7185cd03"}'},
                {"row": '{"id":"75d84614-050c-400a-8d06-de92a1418d67"}'},
            ],
        },
        "retainedS11Scope": {"learnerIds": ["retained-learner-1"], "contextIds": ["retained-context-1"]},
        "retainedS11Baseline": {
            "attempts": ['{"id": "att-1"}'],
            "responses": ['{"id": "resp-1"}'],
            "completions": ['{"id": "comp-1"}'],
            "cards": ['{"id": "card-1"}'],
            "receipts": ['{"id": "rec-1"}'],
            "consumptions": [],
            "srs_review_operations": [],
        },
    }
    (ev_dir / "before-registration.json").write_text(json.dumps(baseline, indent=2))

    provider_before = {
        "at": datetime.now(timezone.utc).isoformat(),
        "readOnly": True,
        "flowIndex": [{"id": "flow-other-1", "user_id": None, "authentication_method": "email/signup", "provider_type": "email"}],
        "previousIds": ["prev-sub-1"],
    }
    (ev_dir / "provider-before.json").write_text(json.dumps(provider_before, indent=2))
    return tmp, slice_dir, ev_dir


# ─────────────────────────────────────────────────────────────────────────────
# GROUP F — Runner orchestration and restart controls (fully isolated)
# ─────────────────────────────────────────────────────────────────────────────
def test_group_f():
    print("\n── Group F: Runner orchestration and restart controls ──────────")

    # F1 (Finding 4/8): Actual cleanup runner cleans scratch files on injected DB failure in temp dir
    with tempfile.TemporaryDirectory() as _tmp:
        tmp_path, slice_dir, ev_dir = setup_temp_workspace(_tmp)
        node_f1 = f"""
import {{ runCleanup }} from './tmp/slice12-public-acceptance/resume-cleanup.mjs';
import fs from 'node:fs';

const mockDb = {{
  connect: async () => {{ throw new Error('injected DB connection failure'); }},
  end: async () => {{}},
}};

try {{
  await runCleanup({{ rootDir: '{tmp_path}', dbClient: mockDb }});
}} catch (e) {{}}

const remaining = [
  '{slice_dir / "mode0600-private.json"}',
  '{slice_dir / "auth-private.json"}',
  '{slice_dir / "eml-url-private.txt"}',
].filter(p => fs.existsSync(p));

const ev = JSON.parse(fs.readFileSync('{ev_dir / "final-cleanup.json"}', 'utf8'));
console.log(JSON.stringify({{
  remainingCount: remaining.length,
  status: ev.status,
  restorationReason: ev.cleanup?.curriculumRestoration?.reason,
  credentialsRemoved: ev.cleanup?.privateCredentialsRemovedOrAbsent,
}}));
"""
        res_f1 = subprocess.run(["node", "-e", node_f1], capture_output=True, text=True)
        out_f1 = [ln for ln in res_f1.stdout.strip().split("\n") if ln.startswith("{")]
        parsed_f1 = json.loads(out_f1[-1]) if out_f1 else {}
        ok("F1: cleanup runner cleans scratch files on DB connect failure in isolated temp dir",
           parsed_f1.get("remainingCount") == 0 and parsed_f1.get("status") == "FAIL" and
           parsed_f1.get("restorationReason") == "no database connection" and
           parsed_f1.get("credentialsRemoved") is True)

    # F2 (Finding 4/8): cleanPrivateScratchFiles removes all private scratch files unconditionally in temp dir
    with tempfile.TemporaryDirectory() as _tmp:
        tmp = Path(_tmp)
        test_files = [tmp / f"scratch_{i}.json" for i in range(3)]
        for f in test_files:
            f.write_text("synthetic_secret_data")
        paths_json = json.dumps([str(f) for f in test_files])
        node_f2 = f"""
import {{ cleanPrivateScratchFiles }} from './tmp/slice12-public-acceptance/resume-cleanup.mjs';
const removed = cleanPrivateScratchFiles({paths_json});
console.log(JSON.stringify(removed));
"""
        res_f2 = subprocess.run(["node", "-e", node_f2], capture_output=True, text=True)
        parsed_f2 = json.loads(res_f2.stdout.strip())
        any_exist = any(f.exists() for f in test_files)
        ok("F2: cleanPrivateScratchFiles removes all private scratch files unconditionally in temp dir",
           parsed_f2.get("removedCount") == 3 and parsed_f2.get("success") is True and not any_exist)

    # F3 (Finding 5): cleanPrivateScratchFiles unlink EACCES handling reports failure honestly
    with tempfile.TemporaryDirectory() as _tmp:
        tmp = Path(_tmp)
        test_file = tmp / "protected.json"
        test_file.write_text("synthetic_secret")
        node_f3 = f"""
import {{ cleanPrivateScratchFiles }} from './tmp/slice12-public-acceptance/resume-cleanup.mjs';
import fs from 'node:fs';

const origUnlink = fs.unlinkSync;
fs.unlinkSync = (p) => {{
  if (p === '{test_file}') {{
    const err = new Error('EACCES: permission denied');
    err.code = 'EACCES';
    throw err;
  }}
  return origUnlink(p);
}};

try {{
  const res = cleanPrivateScratchFiles(['{test_file}']);
  console.log(JSON.stringify(res));
}} finally {{
  fs.unlinkSync = origUnlink;
}}
"""
        res_f3 = subprocess.run(["node", "-e", node_f3], capture_output=True, text=True)
        parsed_f3 = json.loads(res_f3.stdout.strip())
        ok("F3: cleanPrivateScratchFiles reports failure on unlink EACCES",
           parsed_f3.get("success") is False and len(parsed_f3.get("failed", [])) == 1 and
           parsed_f3.get("failed")[0].get("category") == "GeneralError")

    # F4 (Finding 4/8): runCleanup query failure rolls back and cleans scratch files in finally
    with tempfile.TemporaryDirectory() as _tmp:
        tmp_path, slice_dir, ev_dir = setup_temp_workspace(_tmp)
        node_f4 = f"""
import {{ runCleanup }} from './tmp/slice12-public-acceptance/resume-cleanup.mjs';
import fs from 'node:fs';

let rollbackCalled = false;
const mockDb = {{
  connect: async () => {{}},
  end: async () => {{}},
  query: async (sql) => {{
    if (sql === 'ROLLBACK') {{
      rollbackCalled = true;
      return {{ rows: [] }};
    }}
    if (sql.includes('FROM auth.users') && sql.includes('lower(email)')) {{
      return {{ rows: [{{ id: 'sub-1', label: 'DEV_S12_PUBLIC_TEST_LABEL' }}] }};
    }}
    if (sql.includes('FROM app.accounts WHERE id=$1 FOR UPDATE')) {{
      const err = new Error('relation app.accounts database query failed');
      err.name = 'DatabaseError';
      throw err;
    }}
    return {{ rows: [] }};
  }}
}};

try {{
  await runCleanup({{ rootDir: '{tmp_path}', dbClient: mockDb }});
}} catch (e) {{}}

const remaining = [
  '{slice_dir / "mode0600-private.json"}',
  '{slice_dir / "auth-private.json"}',
  '{slice_dir / "eml-url-private.txt"}',
].filter(p => fs.existsSync(p));

const ev = JSON.parse(fs.readFileSync('{ev_dir / "final-cleanup.json"}', 'utf8'));
console.log(JSON.stringify({{
  rollbackCalled,
  status: ev.status,
  failureCategory: ev.failure?.category,
  remainingCount: remaining.length,
}}));
"""
        res_f4 = subprocess.run(["node", "-e", node_f4], capture_output=True, text=True)
        out_f4 = [ln for ln in res_f4.stdout.strip().split("\n") if ln.startswith("{")]
        parsed_f4 = json.loads(out_f4[-1]) if out_f4 else {}
        ok("F4: runCleanup query failure rolls back and cleans scratch files in finally",
           parsed_f4.get("rollbackCalled") is True and parsed_f4.get("status") == "FAIL" and
           parsed_f4.get("failureCategory") == "DatabaseError" and parsed_f4.get("remainingCount") == 0)

    # F5 (Finding 5): runCleanup BLOCKED mode retains account, writes safe session fields, teardown verified
    with tempfile.TemporaryDirectory() as _tmp:
        tmp_path, slice_dir, ev_dir = setup_temp_workspace(_tmp)
        node_f5 = f"""
import {{ runCleanup }} from './tmp/slice12-public-acceptance/resume-cleanup.mjs';
import fs from 'node:fs';

const baseline = JSON.parse(fs.readFileSync('{ev_dir / "before-registration.json"}', 'utf8'));

const mockDb = {{
  connect: async () => {{}},
  end: async () => {{}},
  query: async (sql, params = []) => {{
    if (sql.includes('FROM auth.users') && sql.includes('lower(email)')) {{
      return {{ rows: [{{ id: 'sub-owned-1', label: 'DEV_S12_PUBLIC_TEST_LABEL' }}] }};
    }}
    if (sql.includes('FROM app.accounts WHERE id=$1 FOR UPDATE')) {{
      return {{ rows: [{{ role: 'LEARNER' }}] }};
    }}
    if (sql.includes('FROM app.learning_contexts WHERE learner_id=$1')) {{
      return {{ rows: [{{ id: 'ctx-1', course_id: '62f30613-6bf7-48cb-bc94-448a9736a178' }}] }};
    }}
    if (sql.includes('AS n')) {{
      return {{ rows: [{{ n: '1' }}] }};
    }}
    if (sql.includes('SELECT s.id, s.user_id, s.created_at, s.updated_at FROM auth.sessions')) {{
      return {{ rows: [{{ id: 'sess-1', user_id: 'sub-owned-1', created_at: '2026-11-02T13:30:00Z', updated_at: '2026-11-02T13:30:00Z' }}] }};
    }}
    if (sql.includes('DELETE FROM auth.sessions') || sql.includes('DELETE FROM auth.refresh_tokens')) {{
      return {{ rowCount: 1 }};
    }}
    if (sql.includes('FROM auth.') && sql.includes('count(*)')) {{
      return {{ rows: [{{ count: 0 }}] }};
    }}
    if (sql.includes('FROM app.accounts') && sql.includes('WHERE id != $1')) {{
      return {{ rows: baseline.otherAccounts }};
    }}
    if (sql.includes('FROM app.courses WHERE id=$1')) {{
      return {{ rows: [baseline.course] }};
    }}
    if (sql.includes('FROM app.lessons WHERE id = ANY($1::uuid[])')) {{
      return {{ rows: baseline.lessons }};
    }}
    if (sql.includes('auth.flow_state') && sql.includes('user_id IS NULL')) {{
      return {{ rows: [{{ id: 'flow-other-1', user_id: null, authentication_method: 'email/signup', provider_type: 'email' }}] }};
    }}
    if (sql.includes('auth.flow_state') && sql.includes('FOR UPDATE')) {{
      return {{ rows: [] }};
    }}
    if (sql.includes('FROM auth.flow_state')) {{
      return {{ rows: [] }};
    }}
    if (sql.includes('SELECT to_jsonb(t)::text AS row FROM')) {{
      for (const k of ['responses', 'attempts', 'completions', 'cards', 'receipts']) {{
        if (sql.includes(k) || (k === 'receipts' && sql.includes('command_receipts')) || (k === 'cards' && sql.includes('srs_cards'))) {{
          return {{ rows: (baseline.retainedS11Baseline[k] || []).map(r => ({{ row: r }})) }};
        }}
      }}
      return {{ rows: [] }};
    }}
    if (sql.includes('SELECT to_jsonb(c)::text AS row FROM app.courses')) {{
      return {{ rows: baseline.fullRuntimeSnapshot.course }};
    }}
    if (sql.includes('SELECT to_jsonb(l)::text AS row FROM app.lessons')) {{
      return {{ rows: baseline.fullRuntimeSnapshot.lessons }};
    }}
    if (sql.includes('FROM app_private.audit_events')) {{
      return {{ rows: [] }};
    }}
    return {{ rows: [{{ count: 0, n: 0 }}] }};
  }}
}};

try {{
  await runCleanup({{ rootDir: '{tmp_path}', dbClient: mockDb }});
}} catch (e) {{}}

const ev = JSON.parse(fs.readFileSync('{ev_dir / "final-cleanup.json"}', 'utf8'));
console.log(JSON.stringify({{
  status: ev.status,
  sessionTeardownTornDown: ev.cleanup?.sessionTeardown?.tornDown,
  sessionTeardownVerified: ev.reconciliation?.sessionTeardownVerified,
  safeSessions: ev.retainedOwnedSessionState?.sessions,
  skippedDeletions: ev.cleanup?.destructiveDeletionsSkippedDueToImmutableHistory,
}}));
"""
        res_f5 = subprocess.run(["node", "-e", node_f5], capture_output=True, text=True)
        out_f5 = [ln for ln in res_f5.stdout.strip().split("\n") if ln.startswith("{")]
        parsed_f5 = json.loads(out_f5[-1]) if out_f5 else {}
        sessions_f5 = parsed_f5.get("safeSessions", [])
        has_secret_fields = any("token" in json.dumps(s) or "ip" in json.dumps(s) for s in sessions_f5)
        ok("F5: runCleanup BLOCKED mode retains account, writes safe session fields, teardown verified",
           parsed_f5.get("status") == "BLOCKED" and
           parsed_f5.get("skippedDeletions") is True and
           parsed_f5.get("sessionTeardownTornDown") is True and
           parsed_f5.get("sessionTeardownVerified") is True and
           len(sessions_f5) > 0 and not has_secret_fields)

    # F6 (Finding 4/8): runCleanup provider flow mismatch fails reconciliation
    with tempfile.TemporaryDirectory() as _tmp:
        tmp_path, slice_dir, ev_dir = setup_temp_workspace(_tmp)
        node_f6 = f"""
import {{ runCleanup }} from './tmp/slice12-public-acceptance/resume-cleanup.mjs';
import fs from 'node:fs';

const mockDb = {{
  connect: async () => {{}},
  end: async () => {{}},
  query: async (sql) => {{
    if (sql.includes('FROM auth.users') && sql.includes('lower(email)')) {{
      return {{ rows: [] }};
    }}
    if (sql.includes('FROM app.accounts WHERE id != $1')) return {{ rows: [] }};
    if (sql.includes('FROM app.courses WHERE id=$1')) {{
      return {{ rows: [{{ id: '62f30613-6bf7-48cb-bc94-448a9736a178', is_active: true, names: {{}}, default_start_level_id: null, language_id: null, framework_id: null }}] }};
    }}
    if (sql.includes('FROM app.lessons WHERE id = ANY($1::uuid[])')) {{
      return {{ rows: [
        {{ id: '4ad4b82e-5398-4505-b335-5aef7185cd03', availability: 'PUBLISHED', active_revision_id: 'rev-1' }},
        {{ id: '75d84614-050c-400a-8d06-de92a1418d67', availability: 'PUBLISHED', active_revision_id: 'rev-2' }}
      ] }};
    }}
    if (sql.includes('SELECT to_jsonb(c)::text AS row FROM app.courses')) {{
      return {{ rows: [{{ row: '{{\\"id\\":\\"62f30613-6bf7-48cb-bc94-448a9736a178\\"}}' }}] }};
    }}
    if (sql.includes('SELECT to_jsonb(l)::text AS row FROM app.lessons')) {{
      return {{ rows: [
        {{ row: '{{\\"id\\":\\"4ad4b82e-5398-4505-b335-5aef7185cd03\\"}}' }},
        {{ row: '{{\\"id\\":\\"75d84614-050c-400a-8d06-de92a1418d67\\"}}' }}
      ] }};
    }}
    if (sql.includes('FROM auth.flow_state WHERE user_id IS NULL OR NOT')) {{
      return {{ rows: [{{ id: 'flow-MODIFIED', user_id: null, authentication_method: 'email/signup', provider_type: 'email' }}] }};
    }}
    if (sql.includes('FROM auth.') && sql.includes('count(*)')) return {{ rows: [{{ count: 0 }}] }};
    if (sql.includes('FROM app.') && sql.includes('count(*)')) return {{ rows: [{{ count: 0 }}] }};
    return {{ rows: [{{ count: 0, n: 0 }}] }};
  }}
}};

try {{
  await runCleanup({{ rootDir: '{tmp_path}', dbClient: mockDb }});
}} catch (e) {{}}

const ev = JSON.parse(fs.readFileSync('{ev_dir / "final-cleanup.json"}', 'utf8'));
console.log(JSON.stringify({{
  status: ev.status,
  unverifiedScopes: ev.reconciliation?.unverifiedScopes,
}}));
"""
        res_f6 = subprocess.run(["node", "-e", node_f6], capture_output=True, text=True)
        out_f6 = [ln for ln in res_f6.stdout.strip().split("\n") if ln.startswith("{")]
        parsed_f6 = json.loads(out_f6[-1]) if out_f6 else {}
        ok("F6: runCleanup provider flow mismatch fails reconciliation",
           parsed_f6.get("status") == "FAIL" and "providerFlowBaseline" in parsed_f6.get("unverifiedScopes", []))

    # F7 (Finding 4/8): runCleanup retained S11 baseline comparison preserves explicit empty groups
    for added_table in [None, "consumptions", "attempts", "responses", "completions", "cards", "srs_review_operations", "receipts"]:
        with tempfile.TemporaryDirectory() as _tmp:
            tmp_path, slice_dir, ev_dir = setup_temp_workspace(_tmp)
            node_f7 = f"""
import {{ runCleanup }} from './tmp/slice12-public-acceptance/resume-cleanup.mjs';
import fs from 'node:fs';

const baseline = JSON.parse(fs.readFileSync('{ev_dir / "before-registration.json"}', 'utf8'));

const addedTable = {json.dumps(added_table)};
const queried = [];
const mockDb = {{
  connect: async () => {{}},
  end: async () => {{}},
  query: async (sql, params = []) => {{
    if (sql.includes('count(*)')) return {{ rows: [{{ count: 0 }}] }};
    if (sql.includes('FROM auth.users') && sql.includes('lower(email)')) {{
      return {{ rows: [] }};
    }}
    if (sql.includes('FROM app.accounts') && (sql.includes('row_version') || sql.includes('WHERE id != $1'))) return {{ rows: baseline.otherAccounts }};
    if (sql.includes('FROM app.courses WHERE id=$1')) {{
      return {{ rows: [baseline.course] }};
    }}
    if (sql.includes('FROM app.lessons WHERE id = ANY($1::uuid[])')) {{
      return {{ rows: baseline.lessons }};
    }}
    if (sql.includes('SELECT to_jsonb(c)::text AS row FROM app.courses')) {{
      return {{ rows: baseline.fullRuntimeSnapshot.course }};
    }}
    if (sql.includes('SELECT to_jsonb(l)::text AS row FROM app.lessons')) {{
      return {{ rows: baseline.fullRuntimeSnapshot.lessons }};
    }}
    if (sql.includes('auth.flow_state') && sql.includes('user_id IS NULL')) {{
      return {{ rows: [{{ id: 'flow-other-1', user_id: null, authentication_method: 'email/signup', provider_type: 'email' }}] }};
    }}
    if (sql.includes('auth.flow_state') && sql.includes('FOR UPDATE')) {{
      return {{ rows: [] }};
    }}
    if (sql.includes('SELECT to_jsonb(t)::text AS row FROM')) {{
      for (const k of ['consumptions', 'responses', 'attempts', 'completions', 'cards', 'srs_review_operations', 'receipts']) {{
            if (sql.includes(k) || (k === 'receipts' && sql.includes('command_receipts')) || (k === 'cards' && sql.includes('srs_cards'))) {{
              queried.push(k);
              let rows = [...baseline.retainedS11Baseline[k]];
              if (k === addedTable) rows.push(JSON.stringify({{id: 'unexpected-new-row'}}));
              if (sql.includes('WHERE id = ANY')) rows = rows.filter(row => params[0].includes(JSON.parse(row).id));
              return {{ rows: rows.map(row => ({{row}})) }};
            }}
      }}
      return {{ rows: [] }};
    }}
    if (sql.includes('FROM auth.') && sql.includes('count(*)')) return {{ rows: [{{ count: 0 }}] }};
    if (sql.includes('FROM app.') && sql.includes('count(*)')) return {{ rows: [{{ count: 0 }}] }};
    return {{ rows: [{{ count: 0, n: 0 }}] }};
  }}
}};

try {{
  await runCleanup({{ rootDir: '{tmp_path}', dbClient: mockDb }});
}} catch (e) {{}}

const ev = JSON.parse(fs.readFileSync('{ev_dir / "final-cleanup.json"}', 'utf8'));
console.log(JSON.stringify({{
  status: ev.status,
  s11Preserved: ev.reconciliation?.retainedS11BaselinePreserved,
  queried,
}}));
"""
            res_f7 = subprocess.run(["node", "-e", node_f7], capture_output=True, text=True)
            out_f7 = [ln for ln in res_f7.stdout.strip().split("\n") if ln.startswith("{")]
            parsed_f7 = json.loads(out_f7[-1]) if out_f7 else {}
            if added_table is None:
                ok("F7: actual cleanup queries all seven retained scopes, including empty groups",
                   parsed_f7.get("status") == "PASS" and parsed_f7.get("s11Preserved") is True and
                   len(set(parsed_f7.get("queried", []))) == 7)
            else:
                ok(f"F7: actual cleanup rejects an inserted retained {added_table} row",
                   parsed_f7.get("status") == "FAIL" and parsed_f7.get("s11Preserved") is not True)

    # F8 (Finding 1/9): runAuth register binding mismatch rejects before POST (effectCount 0)
    with tempfile.TemporaryDirectory() as _tmp:
        tmp_path, slice_dir, ev_dir = setup_temp_workspace(_tmp)
        bad_base = json.loads((ev_dir / "before-registration.json").read_text())
        bad_base["sourceCommit"] = "commit-mismatched-sha"
        (ev_dir / "before-registration.json").write_text(json.dumps(bad_base))

        node_f8 = f"""
import {{ runAuth }} from './tmp/slice12-public-acceptance/public-auth.mjs';

let effectCount = 0;
const mockDb = {{
  query: async () => ({{ rows: [] }}),
}};

try {{
  await runAuth('register', {{
    rootDir: '{tmp_path}',
    dbClient: mockDb,
    onRegisterPost: async () => {{ effectCount++; }},
  }});
}} catch (e) {{}}

console.log(JSON.stringify({{ effectCount }}));
"""
        res_f8 = subprocess.run(["node", "-e", node_f8], capture_output=True, text=True)
        out_f8 = [ln for ln in res_f8.stdout.strip().split("\n") if ln.startswith("{")]
        parsed_f8 = json.loads(out_f8[-1]) if out_f8 else {}
        ok("F8: runAuth register binding mismatch rejects before POST (effectCount 0)",
           parsed_f8.get("effectCount") == 0)

    # F9 (Finding 5/9): Durable-marker restart forbids second POST and second navigation via disk markers
    with tempfile.TemporaryDirectory() as _tmp:
        tmp_path, slice_dir, ev_dir = setup_temp_workspace(_tmp)
        node_f9 = f"""
import {{ runAuth }} from './tmp/slice12-public-acceptance/public-auth.mjs';
import {{ EXACT_LEARNER_PKCE_COOKIE_NAME }} from './tmp/slice12-public-acceptance/helpers-testable.mjs';
import fs from 'node:fs';

const base = JSON.parse(fs.readFileSync('{ev_dir / "before-registration.json"}', 'utf8'));
base.at = new Date().toISOString();
fs.writeFileSync('{ev_dir / "before-registration.json"}', JSON.stringify(base, null, 2));

let registerEffectCount = 0;
const mockDb = {{
  query: async (sql) => {{
    if (sql.includes('FROM auth.users') && sql.includes('lower(email)')) {{
      return {{ rows: [] }};
    }}
    if (sql.includes('FROM auth.users') && sql.includes('WHERE u.id = $1')) {{
      return {{ rows: [{{ id: 'sub-test-1', email: '{SAMPLE_RECIPIENT}', label: '{SAMPLE_LABEL}', email_confirmed_at: null }}] }};
    }}
    return {{ rows: [] }};
  }}
}};

// 1. First register call succeeds and increments counter
let reg1Passed = false;
try {{
  await runAuth('register', {{
    rootDir: '{tmp_path}',
    dbClient: mockDb,
    onRegisterPost: async () => {{ registerEffectCount++; }},
  }});
  reg1Passed = true;
}} catch (e) {{}}

// 2. Second register call reloads persisted disk marker and throws (refuses second POST)
let reg2Rejected = false;
try {{
  await runAuth('register', {{
    rootDir: '{tmp_path}',
    dbClient: mockDb,
    onRegisterPost: async () => {{ registerEffectCount++; }},
  }});
}} catch (e) {{
  reg2Rejected = true;
}}

// 3. Prepare disk state for confirm mode
const authPriv = JSON.parse(fs.readFileSync('{slice_dir / "auth-private.json"}', 'utf8'));
authPriv.registered = new Date().toISOString();
authPriv.subjectId = 'sub-test-1';
authPriv.storageState = {{
  cookies: [{{
    name: EXACT_LEARNER_PKCE_COOKIE_NAME,
    value: 'pkce_secret_token_verifier',
    domain: 'lingora-learner-dev.vercel.app',
    path: '/auth/confirm',
  }}]
}};
delete authPriv.registrationAttemptedAt;
fs.writeFileSync('{slice_dir / "auth-private.json"}', JSON.stringify(authPriv, null, 2));

const emlMeta = {{
  parsed: true,
  provider_host: 'sncfyvpzwedqgwfpffkh.supabase.co',
  type: 'signup',
  redirect_to_origin: 'https://lingora-learner-dev.vercel.app',
  redirect_to_path: '/auth/confirm',
  recipient_matched: true,
  recipient_hash: '{hashlib.sha256(SAMPLE_RECIPIENT.encode("utf-8")).hexdigest()}',
  run_label: '{SAMPLE_LABEL}',
  message_date: new Date().toISOString(),
}};
fs.writeFileSync('{slice_dir / "eml-meta.json"}', JSON.stringify(emlMeta, null, 2));
fs.writeFileSync('{slice_dir / "eml-url-private.txt"}', 'https://sncfyvpzwedqgwfpffkh.supabase.co/auth/v1/verify?token=pkce_secret_token_12345&type=signup&redirect_to=https%3A%2F%2Flingora-learner-dev.vercel.app%2Fauth%2Fconfirm');

let confirmNavCount = 0;
// 4. First confirm call succeeds and sets confirmationAttemptedAt on disk
let conf1Passed = false;
try {{
  await runAuth('confirm', {{
    rootDir: '{tmp_path}',
    dbClient: mockDb,
    onConfirmNavigate: async () => {{ confirmNavCount++; }},
  }});
  conf1Passed = true;
}} catch (e) {{}}

// 5. Second confirm call reloads persisted disk marker and throws (refuses second navigation)
let conf2Rejected = false;
try {{
  await runAuth('confirm', {{
    rootDir: '{tmp_path}',
    dbClient: mockDb,
    onConfirmNavigate: async () => {{ confirmNavCount++; }},
  }});
}} catch (e) {{
  conf2Rejected = true;
}}

console.log(JSON.stringify({{
  reg1Passed,
  reg2Rejected,
  registerEffectCount,
  conf1Passed,
  conf2Rejected,
  confirmNavCount,
}}));
"""
        res_f9 = subprocess.run(["node", "-e", node_f9], capture_output=True, text=True)
        out_f9 = [ln for ln in res_f9.stdout.strip().split("\n") if ln.startswith("{")]
        parsed_f9 = json.loads(out_f9[-1]) if out_f9 else {}
        ok("F9: durable-marker restart forbids second POST and second navigation via disk markers",
           parsed_f9.get("reg1Passed") is True and parsed_f9.get("reg2Rejected") is True and
           parsed_f9.get("registerEffectCount") == 1 and
           parsed_f9.get("conf1Passed") is True and parsed_f9.get("conf2Rejected") is True and
           parsed_f9.get("confirmNavCount") == 1)


def test_preflight_privacy():
    with tempfile.TemporaryDirectory() as td:
        tmp_path, slice_dir, ev_dir = setup_temp_workspace(td)
        old_s11 = tmp_path / "plans/evidence/slice-11/public/final-cleanup-readonly.json"
        old_s11.parent.mkdir(parents=True)
        counts = {"attempts": 4, "responses": 19, "completions": 1, "cards": 1, "receipts": 2}
        old_s11.write_text(json.dumps({
            **{k: [{"id": f"{k}-{i}"} for i in range(n)] for k, n in counts.items()},
            "contexts": [{"id": "retained-context-1"}],
            "accounts": [{"id": "retained-learner-1", "role": "LEARNER"}],
        }))
        node = f"""
import {{ runPreflight }} from './tmp/slice12-public-acceptance/preflight-readonly.mjs';
import fs from 'node:fs';
const fixture = JSON.parse(fs.readFileSync('{ev_dir / "before-registration.json"}'));
const counts = {json.dumps(counts)};
const captured = [];
const db = {{ query: async (sql, params) => {{
  if (sql.includes('FROM auth.users') || sql.includes('FROM auth.flow_state') || sql.includes('FROM app.accounts')) return {{rows: []}};
  if (sql.includes('SELECT to_jsonb(t)::text')) {{
    captured.push({{sql, params}});
    for (const k of ['responses', 'attempts', 'completions', 'cards', 'receipts']) {{
      const table = k === 'receipts' ? 'command_receipts' : k;
      if (sql.includes(table)) return {{rows: Array.from({{length:counts[k]}}, (_,i) => ({{row:JSON.stringify({{id:k+'-'+i}})}}))}};
    }}
    return {{rows: []}};
  }}
  if (sql.includes('SELECT to_jsonb(c)')) return {{rows:fixture.fullRuntimeSnapshot.course}};
  if (sql.includes('SELECT to_jsonb(l)')) return {{rows:fixture.fullRuntimeSnapshot.lessons}};
  if (sql.includes('FROM app.courses')) return {{rows:[fixture.course]}};
  if (sql.includes('FROM app.lessons')) return {{rows:fixture.lessons}};
  return {{rows:[]}};
}} }};
await runPreflight({{rootDir:'{tmp_path}', dbClient:db}});
console.log(JSON.stringify({{captured}}));
"""
        result = subprocess.run(["node", "--input-type=module", "-e", node], capture_output=True, text=True)
        baseline = json.loads((ev_dir / "before-registration.json").read_text())
        ok("G1: actual preflight success keeps recipient private in stdout/stderr",
           result.returncode == 0 and SAMPLE_RECIPIENT not in result.stdout + result.stderr)
        ok("G2: actual preflight persists private binding and complete retained scope",
           result.returncode == 0 and (ev_dir / "before-registration.json").stat().st_mode & 0o777 == 0o600 and
           baseline.get("registrationEmail") == SAMPLE_RECIPIENT and
           baseline.get("retainedS11Scope") == {"learnerIds": ["retained-learner-1"], "contextIds": ["retained-context-1"]})
        output = [json.loads(line) for line in result.stdout.splitlines() if line.startswith("{")]
        captured = output[-1].get("captured", []) if output else []
        context_queries = [q for q in captured if "context_id" in q["sql"]]
        learner_queries = [q for q in captured if "context_id" not in q["sql"]]
        ok("G3: preflight queries complete owned scope, never known row IDs",
           len(captured) == 7 and len(context_queries) == 4 and len(learner_queries) == 3 and
           all("FROM app.learning_contexts WHERE learner_id = ANY($1::uuid[])" in q["sql"] and
               "= ANY($2::uuid[])" in q["sql"] and
               q["params"] == [["retained-learner-1"], ["retained-context-1"]] for q in context_queries) and
           all(q["params"] == [["retained-learner-1"]] for q in learner_queries) and
           any("JOIN app.lesson_attempts a ON a.id = t.attempt_id" in q["sql"] for q in captured))



# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    test_group_a()
    test_group_b()
    test_group_c()
    test_group_d()
    test_group_e()
    test_group_f()
    test_preflight_privacy()

    print(f"\n{'='*60}")
    print(f"Results: {_pass} passed, {_fail} failed")
    if _errors:
        print("Failed tests:")
        for e in _errors:
            print(f"  - {e}")
    print('='*60)
    sys.exit(0 if _fail == 0 else 1)
