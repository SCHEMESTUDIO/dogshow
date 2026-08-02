#!/usr/bin/env bash
# Regenerate sitemap-urls.txt (plain-text sitemap for GSC) from sitemap.xml.
# One absolute URL per line, UTF-8, nothing else. Run from repo root:
#   bash scripts/generate-sitemap-urls.sh
# Called by .github/workflows/breed-pages.yml after sitemap.xml is updated so
# the two files never drift. If anything else starts writing sitemap.xml
# (e.g. postwerks), it should run this too.
set -euo pipefail
cd "$(dirname "$0")/.."
grep -o '<loc>[^<]*</loc>' sitemap.xml | sed -e 's|<loc>||' -e 's|</loc>||' > sitemap-urls.txt
echo "sitemap-urls.txt: $(wc -l < sitemap-urls.txt | tr -d ' ') URLs"
