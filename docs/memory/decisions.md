# Dog Show — durable decisions log

Repo-resident project memory. Read by local sessions AND cloud workflows —
this file (not any machine-local memory) is the shared source of truth for
*why* things are the way they are. Maintained by the weekly wiki-update
workflow: append new durable decisions, mark superseded ones, never silently
delete. Keep entries short; link evidence.

## Product / business

- **2026-06-23 — Free-to-enter pivot.** Entry is free; money only buys bones
  ($1.99 Entry Pro / $5.99 Top Dog; $3.99 tier retired). `BONES_ON_REGISTER`
  250→50. totalBones is NOT revenue (sum of balances dominated by signup
  grants) — revenue truth lives in Stripe / `/admin-audit`.
- **2026-07-08 — Email cadence: exactly one onboarding email** then a 7-day
  quiet window (`EMAIL_QUIET_MS`); transactional mail exempt. Built to kill
  over-mailing/spam-complaint risk (`2d6451b`).
- **2026-07-08 — Pale theme + contrast rule.** Orange text must never sit
  directly on the lilac page bg. 2026-07-15 contrast sweep (`c593cdd`)
  verified all changed colors ≥4.5:1.

## Outreach (breed communities)

- **Drafts only, James sends** (decision 2026-07-03) — deliverability and
  cold-email reputation stay human-gated. ~15–25 sends/day max per mailbox.
- Hard rules: never invent emails; on-page-verified addresses only; soften
  guest-post line for no-blog prospects; respect memorial/scam-warning
  sensitivity flags in the staging log.
- **2026-07-15 — DUPLICATE WARNING:** during migration the cloud re-ran
  breeds 1–18 from a stale queue; seven addresses were staged on both rails
  (list in outreach-staging-log.md). Send at most one email per kennel.
  Root cause: outreach state sat uncommitted locally for 3 weeks — never
  hoard local state again.

## Architecture

- **2026-07-14/15 — Cloud migration (complete).** Four workflows (tracker,
  wiki-update, breed-outreach, ads-search1-report) in GitHub Actions; local
  Cowork twins disabled 2026-07-15. Telegram rail → James's DM (1425135907).
  Gmail drafts via OAuth **web-application** client (`gmail-playground`) +
  refresh token minted in OAuth Playground as james.lamon@gmail.com, scope
  gmail.compose, consent screen published to production (Testing-mode tokens
  die in 7 days). NOTE: Desktop-type OAuth clients do NOT work with OAuth
  Playground (redirect_uri_mismatch) — use the web client pattern.
- **2026-07-15 — Model pinning:** all `claude -p` steps pin Sonnet 5 (Haiku
  for ads report) + `--max-turns`. Never ship an unpinned model call.
- **2026-07-15 — File ownership (see WORKFLOW.md).** Cloud owns the tracking
  CSV, both outreach files, CLAUDE.md. Enforced by `.githooks/pre-commit`.
  Sandboxed sessions: no git writes over the mount; reads with
  `GIT_OPTIONAL_LOCKS=0`; verify remote via `git ls-remote`.
- **PartyKit deploys only from clean, pushed HEAD** — `npm run check-deploy`
  must show in-sync after every deploy (dirty-deploy drift was UX-audit H1/H2
  root cause; recurred 2026-07-08).

- **2026-07-16 → 2026-07-19 — New external content pipeline: "postwerks".**
  14 SEO listicle/explainer pages landed directly on `main` via commits
  `Publish: postwerks m2 — {slug}` (+ companion `(sitemap)` commits), authored
  `SCHEMESTUDIO <james@wearescheme.studio>`. No trace of "postwerks" anywhere
  in this repo's `.github/workflows/`, `scripts/`, or `prompts/` — it's an
  outside tool/service pushing finished HTML, not a repo-owned automation.
  Pages clone the existing `nm-*` GEO-page chrome (own nav, no sitewide
  `nav.js`/footer) and land in `sitemap.xml` already. See CLAUDE.md
  "Postwerks-published SEO pages" for the file list. Treat these paths as
  externally-owned like the outreach/tracker files in WORKFLOW.md, even
  though they aren't (yet) added to `.githooks/pre-commit`'s guard list.

## One-time prod actions still open (as of 2026-07-15)

- `/admin-backfill-slugs?commit=1` never run — Skeeterino has `slug: null`
  (no cert page / OG image / voting page).
- `/admin-grant-goodwill` (legacy $3.99 buyers) — unverified.
- **2026-07-20 — Dead link on 3 postwerks pages.** `american-dog-breeds.html`,
  `calm-dog-breeds.html`, and `america-s-favorite-pet-contestants-2026-list.html`
  link to `/guides`, which doesn't exist (no `guides.html`/rewrite) — the hub
  is `/resources`. Found during weekly CLAUDE.md maintenance scan; not fixed
  (content is postwerks-owned, out of scope for this workflow) — needs a
  human or the postwerks pipeline to correct.
