#!/usr/bin/env python3
"""
api/sitemap.py — serve /sitemap.xml through a serverless function.

WHY THIS EXISTS (2026-08-20): Google Search Console has said "Sitemap could
not be read" for every sitemap on this host since May, across three formats
(XML, XML?cache-bust, plain text), while parsing the same file fine on a
non-Vercel host and fetching regular pages on this host fine. Fixing
Content-Type/Content-Disposition on the static path did not help. Conclusion:
something about Vercel's *static file* response path breaks Google's sitemap
parser. This function serves the identical bytes from the serverless path
instead. vercel.json redirects /sitemap.xml here (redirects fire before the
filesystem check, so the static file — which stays in the repo for the
publishing automation — no longer answers).

Content source, in order:
  1. The sitemap.xml bundled into this function at build time
     (vercel.json → functions → includeFiles).
  2. Fallback: fetch the static file over HTTP with the X-Sitemap-Internal
     header set — the redirect in vercel.json is conditioned on that header
     being MISSING, so this fetch reaches the static file without looping.
"""

import os
import urllib.request
from http.server import BaseHTTPRequestHandler

SELF_URL = "https://dogshow.lol/sitemap.xml"
LOOP_GUARD_HEADER = "X-Sitemap-Internal"


def _load_local():
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(os.getcwd(), "sitemap.xml"),
        os.path.join(here, "..", "sitemap.xml"),
        os.path.join(here, "sitemap.xml"),
        "/var/task/sitemap.xml",
    ]
    for path in candidates:
        try:
            with open(path, "rb") as f:
                data = f.read()
            if data.lstrip().startswith(b"<?xml") or b"<urlset" in data[:500]:
                return data, "bundle:" + path
        except OSError:
            continue
    return None, None


def _load_http():
    req = urllib.request.Request(SELF_URL, headers={LOOP_GUARD_HEADER: "1"})

    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *args, **kwargs):
            return None  # a redirect here means the loop guard failed — abort

    opener = urllib.request.build_opener(NoRedirect)
    with opener.open(req, timeout=10) as resp:
        return resp.read(), "http"


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        data, source = _load_local()
        if data is None:
            try:
                data, source = _load_http()
            except Exception as exc:  # noqa: BLE001 — surface any failure as 503
                body = ("sitemap unavailable: %s" % exc).encode()
                self.send_response(503)
                self.send_header("Content-Type", "text/plain; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
        self.send_response(200)
        self.send_header("Content-Type", "application/xml; charset=utf-8")
        self.send_header("Cache-Control", "public, max-age=0, must-revalidate")
        self.send_header("X-Sitemap-Source", source)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_HEAD(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/xml; charset=utf-8")
        self.end_headers()
