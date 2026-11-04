#!/usr/bin/env python3
"""
Offline EML parser for Supabase signup confirmation links.

Usage:
  python3 parse-eml.py --eml /path/to/email.eml \
      --expected-recipient user@example.com \
      --out /path/to/scratch/eml-meta.json
  OR
  python3 parse-eml.py --eml /path/to/email.eml \
      --expected-recipient-file /path/to/mode0600-private.json \
      --out /path/to/scratch/eml-meta.json

Rules (from spec):
- Parse multipart/HTML/quoted-printable offline. No network. No rendering.
- Capture raw href internally; never print token/URL to stdout/logs/evidence.
- Exactly ONE expected Supabase /auth/v1/verify link with type=signup.
- Exact HTTPS scheme on canonical provider origin; no HTTP, no custom port.
- Redirect must be the canonical Learner origin /auth/confirm path with no query/fragment/credentials.
- No username/password/fragment in URL; no ambiguous duplicate of token/type/redirect_to.
- Validate recipient and message date against expected values.
- Deduplicate identical activation hrefs across multipart plain/html while rejecting distinct candidates.
- Reject marketing/opt-out links as candidates.
- Write safe metadata (origin, path, parameter names, redirect, timestamp,
  recipient presence) to --out. URL/token go to a separate mode=0600 scratch file
  alongside --out, named eml-url-private.txt. Caller owns that file.

Exit 0 = exactly one valid link found and metadata written.
Exit 1 = validation failure (reason printed to stderr, no token/URL/recipient in output).
"""

import argparse
import email
import email.policy
import email.utils as _email_utils
import hashlib
import html
import json
import os
import re
import sys
import urllib.parse
from datetime import datetime, timezone
from email import message_from_binary_file
from html.parser import HTMLParser

CANONICAL_PROVIDER_HOST = "sncfyvpzwedqgwfpffkh.supabase.co"
CANONICAL_PROVIDER_VERIFY_PATH = "/auth/v1/verify"
CANONICAL_REDIRECT_ORIGIN = "https://lingora-learner-dev.vercel.app"
CANONICAL_REDIRECT_PATH = "/auth/confirm"
EXPECTED_TYPE = "signup"

# Supabase marketing / opt-out / unsubscribe patterns
MARKETING_PATH_PATTERNS = [
    re.compile(r"/unsubscribe", re.I),
    re.compile(r"/optout", re.I),
    re.compile(r"/track", re.I),
    re.compile(r"/click", re.I),
]


class HrefCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            for name, value in attrs:
                if name == "href" and value:
                    # HTMLParser already decodes HTML entities in attribute values
                    # (e.g. &amp; → &). Do NOT call html.unescape() again — doing so
                    # would double-decode any remaining entity-looking sequences and
                    # corrupt URLs whose parameter values contain literal entities.
                    self.hrefs.append(value)


def collect_hrefs(msg) -> list[str]:
    """Walk message parts, decode quoted-printable, collect all <a href> and plain URLs."""
    hrefs: list[str] = []
    for part in msg.walk():
        ct = part.get_content_type()
        if ct not in ("text/html", "text/plain"):
            continue
        charset = part.get_content_charset() or "utf-8"
        try:
            payload = part.get_payload(decode=True)
            if payload is None:
                continue
            text = payload.decode(charset, errors="replace")
        except Exception:
            continue
        if ct == "text/html":
            collector = HrefCollector()
            collector.feed(text)
            hrefs.extend(collector.hrefs)
        else:
            # Plain text: pick up bare URLs that look like verify links
            for m in re.finditer(r"https?://\S+", text):
                hrefs.append(m.group(0))
    return hrefs


def is_marketing(url_str: str) -> bool:
    parsed = urllib.parse.urlparse(url_str)
    for pat in MARKETING_PATH_PATTERNS:
        if pat.search(parsed.path):
            return True
    return False


def classify_candidate(url_str: str):
    """
    Return (parsed_url, error_str).
    error_str is None if this looks like a valid activation candidate.
    """
    try:
        u = urllib.parse.urlparse(url_str)
        # Port access can raise ValueError if port is non-numeric or malformed
        port = u.port
    except Exception:
        return None, "unparseable URL"

    # Strict HTTPS scheme required
    if u.scheme != "https":
        return u, "scheme must be https"
    if u.hostname != CANONICAL_PROVIDER_HOST:
        return u, "wrong host"
    if port not in (None, 443):
        return u, "custom port prohibited"
    if u.path != CANONICAL_PROVIDER_VERIFY_PATH:
        return u, "wrong path"
    if is_marketing(url_str):
        return u, "marketing/opt-out link"
    return u, None


def validate_candidate(u) -> str | None:
    """Additional validation on a confirmed /auth/v1/verify URL. Returns error or None."""
    # No credentials in URL
    if u.username or u.password:
        return "URL contains credentials"
    # No fragment
    if u.fragment:
        return "URL contains fragment"
    params = urllib.parse.parse_qs(u.query, keep_blank_values=True)

    # Required parameters
    for required in ("token", "type", "redirect_to"):
        if required not in params:
            return f"missing required parameter: {required}"
        if len(params[required]) > 1:
            return f"duplicate critical parameter: {required}"

    token_val = params["token"][0]
    type_val = params["type"][0]
    redirect_val = params["redirect_to"][0]

    if not token_val:
        return "token is empty"
    if type_val != EXPECTED_TYPE:
        return "wrong type"

    # Redirect must be exact canonical Learner origin + /auth/confirm
    # with no query, no fragment, no credentials.
    try:
        ru = urllib.parse.urlparse(redirect_val)
    except Exception:
        return "unparseable redirect_to"
    if ru.scheme != "https":
        return "redirect_to scheme must be https"
    if ru.port not in (None, 443):
        return "redirect_to custom port prohibited"
    expected_redirect = CANONICAL_REDIRECT_ORIGIN + CANONICAL_REDIRECT_PATH
    actual_redirect = f"{ru.scheme}://{ru.netloc}{ru.path}"
    if actual_redirect != expected_redirect:
        return "redirect_to does not point to canonical /auth/confirm"
    if ru.query:
        return "redirect_to URL contains query parameters"
    if ru.fragment:
        return "redirect_to URL contains fragment"
    if ru.username or ru.password:
        return "redirect_to URL contains credentials"

    # Token must look like PKCE (pkce_ prefix) or standard hex/base64url
    if not re.match(r"^[A-Za-z0-9_\-]{20,}$", token_val):
        return "token has unexpected characters"

    return None


def parse_recipient(msg) -> str | None:
    to_hdr = msg.get("To", "")
    addrs = re.findall(r"[\w.+%-]+@[\w.-]+\.[A-Za-z]{2,}", to_hdr)
    if not addrs:
        return None
    return addrs[0].lower()


def parse_date(msg) -> str | None:
    try:
        date_hdr = msg.get("Date", "")
        if not date_hdr:
            return None
        tt = _email_utils.parsedate_to_datetime(date_hdr)
        if tt is None:
            return None
        return tt.isoformat()
    except Exception:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--eml", required=True)
    ap.add_argument("--expected-recipient", default=None,
                    help="Recipient email or path to private JSON containing email")
    ap.add_argument("--expected-recipient-file", default=None,
                    help="Path to private JSON file containing recipient email and label")
    ap.add_argument("--out", required=True,
                    help="Path for safe metadata JSON output")
    ap.add_argument("--max-age-hours", type=float, default=None,
                    help="If given, reject messages older than this many hours from now")
    args = ap.parse_args()

    expected_recipient = None
    expected_label = None

    if args.expected_recipient_file:
        try:
            with open(args.expected_recipient_file, "r") as f:
                priv = json.load(f)
                expected_recipient = priv.get("email") or priv.get("registrationEmail")
                expected_label = priv.get("label")
        except Exception:
            print("ERROR: cannot load expected-recipient-file", file=sys.stderr)
            sys.exit(1)
    elif args.expected_recipient:
        if os.path.isfile(args.expected_recipient):
            try:
                with open(args.expected_recipient, "r") as f:
                    priv = json.load(f)
                    expected_recipient = priv.get("email") or priv.get("registrationEmail")
                    expected_label = priv.get("label")
            except Exception:
                pass
        if not expected_recipient:
            expected_recipient = args.expected_recipient
    else:
        print("ERROR: either --expected-recipient or --expected-recipient-file is required", file=sys.stderr)
        sys.exit(1)

    if not expected_recipient or not isinstance(expected_recipient, str):
        print("ERROR: expected recipient email is empty or invalid", file=sys.stderr)
        sys.exit(1)

    expected_recipient = expected_recipient.lower().strip()

    # Read EML
    try:
        with open(args.eml, "rb") as fh:
            msg = message_from_binary_file(fh, policy=email.policy.compat32)
    except Exception:
        print("ERROR: cannot read EML", file=sys.stderr)
        sys.exit(1)

    # Collect and classify hrefs
    hrefs = collect_hrefs(msg)
    raw_candidates = []
    rejected = []
    for href in hrefs:
        u, err = classify_candidate(href)
        if err is None:
            raw_candidates.append((href, u))
        else:
            rejected.append({"reason": err})

    # Deduplicate identical activation hrefs (e.g. identical link in text/plain and text/html)
    unique_candidates = {}
    for href, u in raw_candidates:
        if href not in unique_candidates:
            unique_candidates[href] = (href, u)
    candidates = list(unique_candidates.values())

    if len(candidates) == 0:
        print(
            f"ERROR: no valid Supabase signup verify link found "
            f"(scanned {len(hrefs)} hrefs, {len(rejected)} rejected)",
            file=sys.stderr,
        )
        sys.exit(1)
    if len(candidates) > 1:
        print(
            f"ERROR: ambiguous — {len(candidates)} distinct signup verify links found; expected exactly 1",
            file=sys.stderr,
        )
        sys.exit(1)

    raw_url, parsed_url = candidates[0]

    # Deeper validation
    val_err = validate_candidate(parsed_url)
    if val_err:
        print(f"ERROR: candidate URL failed validation: {val_err}", file=sys.stderr)
        sys.exit(1)

    # Recipient check (never print actual emails in output)
    actual_recipient = parse_recipient(msg)
    if actual_recipient is None:
        print("ERROR: cannot parse recipient from To: header", file=sys.stderr)
        sys.exit(1)
    if actual_recipient != expected_recipient:
        print("ERROR: recipient mismatch", file=sys.stderr)
        sys.exit(1)

    # Date check
    msg_date_str = parse_date(msg)
    if msg_date_str is None:
        print("ERROR: cannot parse Date header", file=sys.stderr)
        sys.exit(1)

    if args.max_age_hours is not None:
        try:
            msg_dt = _email_utils.parsedate_to_datetime(msg.get("Date", ""))
            if msg_dt is None:
                print("ERROR: cannot parse Date header", file=sys.stderr)
                sys.exit(1)
            now = datetime.now(timezone.utc)
            age_hours = (now - msg_dt.astimezone(timezone.utc)).total_seconds() / 3600
            if age_hours > args.max_age_hours:
                print("ERROR: message date is stale beyond max age", file=sys.stderr)
                sys.exit(1)
        except Exception:
            print("ERROR: cannot parse Date header", file=sys.stderr)
            sys.exit(1)

    # Collect safe metadata (no token value, no arbitrary query values, no full URL)
    params = urllib.parse.parse_qs(parsed_url.query, keep_blank_values=True)
    param_names = sorted(params.keys())
    safe_params = {
        "type": params["type"][0] if params.get("type") == [EXPECTED_TYPE] else "[REDACTED]",
        "has_token": "token" in params,
        "has_redirect_to": "redirect_to" in params,
    }

    metadata = {
        "parsed": True,
        "provider_host": parsed_url.hostname,
        "provider_path": parsed_url.path,
        "provider_scheme": parsed_url.scheme,
        "parameter_names": param_names,
        "safe_params": safe_params,
        "type": params["type"][0] if params.get("type") == [EXPECTED_TYPE] else "[REDACTED]",
        "redirect_to_origin": CANONICAL_REDIRECT_ORIGIN,
        "redirect_to_path": CANONICAL_REDIRECT_PATH,
        "recipient_matched": True,
        "recipient_domain": actual_recipient.split("@", 1)[1] if "@" in actual_recipient else "",
        "recipient_hash": hashlib.sha256(expected_recipient.encode("utf-8")).hexdigest(),
        "run_label": expected_label,
        "message_date": msg_date_str,
        "hrefs_scanned": len(hrefs),
        "candidates_found": len(candidates),
        "rejected_hrefs": len(rejected),
    }

    # Write safe metadata
    out_dir = os.path.dirname(os.path.abspath(args.out))
    os.makedirs(out_dir, exist_ok=True)
    with open(args.out, "w") as fh:
        json.dump(metadata, fh, indent=2)
        fh.write("\n")

    # Write raw URL to private scratch file (mode 0600)
    private_path = os.path.join(out_dir, "eml-url-private.txt")
    fd = os.open(private_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as fh:
        fh.write(raw_url + "\n")
    os.chmod(private_path, 0o600)

    # Print only safe confirmation to stdout (never print tokens, query values or recipient)
    print(json.dumps({
        "status": "OK",
        "provider": f"{parsed_url.scheme}://{parsed_url.hostname}{parsed_url.path}",
        "type": params["type"][0],
        "redirect_to_path": CANONICAL_REDIRECT_PATH,
        "parameter_names": param_names,
        "recipient_matched": True,
        "message_date": msg_date_str,
        "private_url_file": private_path,
    }))


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:
        print("ERROR: unhandled parser error", file=sys.stderr)
        sys.exit(1)
