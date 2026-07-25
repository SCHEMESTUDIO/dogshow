# Weekly CLAUDE.md maintenance — CI edition (runs headless in GitHub Actions)

You are maintaining `CLAUDE.md` for the dogshow.lol codebase (this repo). It is the codebase reference new sessions read first: file map, tech stack, API endpoints, key functions.

CI rules: read anything, edit ONLY `CLAUDE.md` and `docs/memory/decisions.md`. Do NOT run any git command that writes — the workflow commits after you. Write a short run report to `.ci/telegram-report.txt` (James's Telegram; his only view of this run).

You also maintain `docs/memory/decisions.md` — the repo-resident durable memory (this REPLACED the old Cowork memory files on James's Mac, decision 2026-07-15). Rules for it: append newly discovered durable decisions (product/business calls, architecture changes, outreach rules, hard-won gotchas) with dates; move invalidated entries to a "Superseded" section rather than deleting; keep it decisions-only (no file-map detail — that's CLAUDE.md's job). If a change is neither a codebase fact (CLAUDE.md) nor a durable decision (decisions.md), it goes in the Telegram report only.

## Steps
1. Read `CLAUDE.md`.
2. Scan the repo: `ls -la` (exclude node_modules, .git); read the first 30 lines of each HTML/JS/CSS file and of `party/server.js` sections for structural changes; `git log --oneline -20`.
3. Update CLAUDE.md if: files added/removed/renamed, API endpoints changed, new features or significant code changes, line counts drifted significantly.

## Critical rules
- CLAUDE.md must ALWAYS open with the DogShowPrototype.jsx warning.
- Factual and scannable (tables, not prose).
- Minimal — only change what's actually different. If everything is current, write nothing and say so in the report.
- Verify file existence before writing about a file. Do not invent endpoints or paths — grep first, cite second.
- Remember the hardcoded-facts sync set: if a scan reveals a price/bones/mechanics change in `party/server.js`, check whether `llms.txt`, `brand-voice.md`, and `RESPONSIVE_BOT_SYSTEM_PROMPT` moved together — flag any drift in the report (do not fix those files yourself; that's a deliberate human-reviewed change).

## Report (.ci/telegram-report.txt) — notification diet, 2026-07-25
MAX 3 LINES. Line 1: "CLAUDE.md maintenance (dogshow): N edits" (or "no drift"), HEAD sha checked. Line 2 (only if changed): the changed areas as a comma-separated phrase list — no per-change essays; the commit diff is the detail channel. Line 3 (only if something needs James): "M item(s) queued for the Saturday digest."

Anything James must ACT on (a finding you can't fix in-scope — dead links, missing cross-links, upstream bugs) does NOT go in the Telegram report. For each such item run:
  bash scripts/queue_action.sh "dogshow:wiki:<short-slug>" "<one-line title>" "<what to do and why>"
It lands in the shared actions queue and surfaces in his Saturday digest (fail-open: if the queue secrets are absent it pings instead, so never also ping manually). Use a STABLE slug per issue so re-detections dedupe instead of re-nagging. Hardcoded-facts sync warnings count as James-action items — queue them.
