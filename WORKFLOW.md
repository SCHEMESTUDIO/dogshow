# Repo workflow — who writes what (adopted 2026-07-15)

This repo has two writers: **GitHub Actions** (scheduled) and **James/local sessions**.
Every conflict we've ever had came from breaking the ownership rule below.

## Ownership

**Cloud-owned — NEVER edit locally (read-only on the Mac):**
- `free-to-enter-tracking.csv` — free-to-enter-tracker workflow (daily)
- `outreach-staging-log.md` + `breed-outreach-list-and-template.md` —
  breed-outreach workflow (weekdays). The DUPLICATE WARNING block in the
  staging log (2026-07-15) lists addresses staged twice during migration —
  send at most one email per kennel.
- `CLAUDE.md` — wiki-update workflow maintains it (weekly)
- Ads report receipt stamps — ads-search1-report workflow

**Human-owned — edited locally, never by workflows:**
- All site code (`*.html`, `app.js`, `style.css`, `api/**`, `party/**`)
- `.github/workflows/**`, `prompts/**`, `scripts/**`

If you must correct a cloud-owned file: `git pull --rebase` first, edit, push
immediately, and expect the next scheduled run to have the final word.

## The two habits

1. **Bookend every local session:** `git pull --rebase` before starting;
   commit + push the same day. Never let local changes age (the 3-week
   uncommitted wave-2-to-10 outreach state caused the July migration mess).
2. **Rejected push ≠ conflict.** "Remote contains work you do not have" is
   normal (a bot committed since your pull): `git pull --rebase && git push`.
   An actual merge CONFLICT means the ownership rule was broken — stop and
   look at which file it is.

## Never again

- No local scheduled tasks (Cowork/launchd) may write to this repo. New
  recurring jobs become GitHub workflows.
- All `claude -p` workflow steps pin `--model` and `--max-turns` (cost guard).
- PartyKit deploys only from a clean, pushed HEAD (`npm run check-deploy`
  must show in-sync afterwards) — no more dirty deploys.
