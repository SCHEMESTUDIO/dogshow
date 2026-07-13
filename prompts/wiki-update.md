# Weekly CLAUDE.md maintenance — CI edition (runs headless in GitHub Actions)

You are maintaining `CLAUDE.md` for the dogshow.lol codebase (this repo). It is the codebase reference new sessions read first: file map, tech stack, API endpoints, key functions.

CI rules: read anything, edit CLAUDE.md only. Do NOT run any git command that writes — the workflow commits after you. Write a short run report to `.ci/telegram-report.txt` (James's Telegram; his only view of this run).

NOTE: the old local version of this task also maintained Cowork memory files on James's Mac. Those are out of scope in CI. If you find context that belongs in persistent memory rather than CLAUDE.md, put it in your Telegram report under "for James's local memory".

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

## Report (.ci/telegram-report.txt)
If changed: file → one-line summary per change. If not: one line confirming scan done, HEAD checked, no drift. Plus any hardcoded-facts sync warnings.
