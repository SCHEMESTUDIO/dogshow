#!/usr/bin/env python3
"""
gmail_create_drafts.py — create Gmail DRAFTS from .ci/outreach-drafts.json.

Cloud replacement for the Cowork Gmail MCP create_draft calls in the
breed-outreach task. DRAFTS ONLY — this script contains no send path at all.

Input: .ci/outreach-drafts.json = [{"to","subject","body","htmlBody"}, ...]
Env:   GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
       (OAuth client + one-time-consent refresh token, scope gmail.compose)

Output: .ci/gmail-results.txt (one OK/FAIL line per draft; workflow reports it)
Exit:   0 if all drafts created (or none to create), 1 if any failed.

Stdlib only — no pip installs.
"""
import base64
import json
import os
import sys
import urllib.parse
import urllib.request
from email.message import EmailMessage

DRAFTS_PATH = ".ci/outreach-drafts.json"
RESULTS_PATH = ".ci/gmail-results.txt"


def get_access_token() -> str:
    data = urllib.parse.urlencode({
        "client_id": os.environ["GMAIL_CLIENT_ID"],
        "client_secret": os.environ["GMAIL_CLIENT_SECRET"],
        "refresh_token": os.environ["GMAIL_REFRESH_TOKEN"],
        "grant_type": "refresh_token",
    }).encode()
    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token", data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)["access_token"]


def create_draft(token: str, to: str, subject: str, body: str, html: str) -> None:
    msg = EmailMessage()
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    if html:
        msg.add_alternative(html, subtype="html")
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    payload = json.dumps({"message": {"raw": raw}}).encode()
    req = urllib.request.Request(
        "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
        data=payload,
        headers={"Authorization": f"Bearer {token}",
                 "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        resp = json.load(r)
    if not resp.get("id"):
        raise RuntimeError(f"no draft id in response: {resp}")


def main() -> int:
    os.makedirs(".ci", exist_ok=True)
    if not os.path.exists(DRAFTS_PATH):
        with open(RESULTS_PATH, "w") as f:
            f.write("No drafts file — research step staged 0 emails this run.\n")
        print("No drafts to create.")
        return 0

    with open(DRAFTS_PATH) as f:
        drafts = json.load(f)
    if not drafts:
        with open(RESULTS_PATH, "w") as f:
            f.write("Drafts file empty — 0 emails staged this run.\n")
        return 0

    if len(drafts) > 20:
        print(f"GUARD: {len(drafts)} drafts exceeds hard cap of 20 — refusing all. "
              "The research step is supposed to cap at ~15.")
        with open(RESULTS_PATH, "w") as f:
            f.write(f"REFUSED: {len(drafts)} drafts exceeds hard cap 20 — none created.\n")
        return 1

    token = get_access_token()
    failed = 0
    lines = []
    for d in drafts:
        to = d.get("to", "").strip()
        try:
            if "@" not in to or " " in to:
                raise ValueError(f"invalid address: {to!r}")
            create_draft(token, to, d["subject"], d["body"], d.get("htmlBody", ""))
            lines.append(f"OK   draft -> {to} ({d['subject'][:60]})")
        except Exception as e:  # noqa: BLE001
            failed += 1
            lines.append(f"FAIL draft -> {to}: {e}")
    with open(RESULTS_PATH, "w") as f:
        f.write("\n".join(lines) + "\n")
    print("\n".join(lines))
    print(f"\n{len(drafts) - failed}/{len(drafts)} drafts created.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
