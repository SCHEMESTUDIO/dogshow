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
- **2026-08-20 — Sitemap served via serverless (api/sitemap.py)** (workaround).
  GSC reports "Sitemap could not be read" on EVERY sitemap on this Vercel domain
  across all formats (XML, XML + query, plain text) for 7+ weeks, while parsing
  the same file fine on a non-Vercel host + fetching regular pages fine here.
  Root cause: Vercel's *static file* response path breaks GSC's parser (unclear why,
  confirmed w/ multiple formats + Content-Type/Disposition tuning). Workaround:
  `api/sitemap.py` serverless function loads sitemap.xml locally at build time,
  falls back to HTTP fetch (w/ loop-guard header) if absent. vercel.json redirects
  `/sitemap.xml` → `/api/sitemap` (when loop-guard header missing). Static file
  stays in repo (for publishing automation) but no longer answers. Paired with
  cross-host sitemap copy in robots.txt (2026-08-24) as secondary signal to GSC.
- **2026-08-22 — `/d/{slug}` certificate pages: noindex,follow (deliberate).**
  Certificate pages are thin, near-identical, and exist to be SHARED, not ranked.
  GSC has zero recorded impressions for /d/ URLs across 7 weekly reports
  (2026-07-16 → 2026-08-16). noindex removes them from index; follow preserves
  link equity to /breeds/* and the show. Social sharing unaffected (og:/twitter: tags
  still read by crawlers) — sharing is the entire use case. Decision: not a bug,
  not a regression, a deliberate SEO posture (external audit flagged all 30 as
  thin content). Reverse is one line per state if calculus changes.

- **2026-07-16 → 2026-07-19 — New external content pipeline: "postwerks" (first wave: 14 pages).**
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
- **2026-08-12 → (ongoing) — Postwerks M2 wave: 13+ pages published so far**
  (animal-competitions, bluey-dog-breeds, dog-show-app, froplay-dog, how-long-is-the-dog-show,
  lewis-hamilton-dog, indy-the-dog, origami-dog, hound-dog-song, hound-dog-mha,
  is-cinnamoroll-a-dog, national-dog-show-finalists, where-to-stream-dog-show). Total
  postwerks inventory: 27+ pages. Two new pages (dog-show-app, how-long-is-the-dog-show)
  not in the original M2 list were also published. All pages in sitemap + committed to repo.

## Design / UX

- **2026-08-03 — Redesign: cream paper + strict accent roles** (`89b3d5f` + `beea99c`).
  Theme shifted from pale-lavender to warm cream (`--bg: #f7f2e9`, `--bg-card: #fffdf8`).
  **Strict accent roles (HANDOFF.md §1):** bone orange (`--bone: #e8721c`, ONLY Give-a-bone/Send/hero CTA),
  brass yellow (`--brass: #b98a2f`, rank #1 + eyebrows + nav + ticket), link purple (`--link: #5b46d6`,
  all Enter-your-dog + LIVE dot), gold-text (`#e9c87e`, dark-chrome labels), lavender-on-dark (`#b7a9e8`).
  Three-layer show-page rule: Stage → Act (fact strip + Give bone + bonus pill) → Compete (monthly race card + entry CTA).
  Type system: YangBagus display, Georgia numerals/serif accents, system stack for body/UI.
  Update check: HANDOFF.md maps all changes (§4 per-page, §5 component specs). See HANDOFF.md for full impl guide.

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

- **2026-07-31 — Google Ads relaunch under the £367 promo credit (plan mirror).**
  Two campaigns built in account 629-033-9684, both created PAUSED pending
  James's explicit go: (1) HWAB Search (campaignId 24094793005) £7.50/day,
  Maximise Clicks w/ ~£1.20 CPC cap, 3 ad groups (cheap/budget, AI generic,
  funny/novelty exact-only), day-one negatives free/"photographer near me"/
  jobs/course/"bird photography"; (2) DOGSHOW Demand Gen (campaignId
  24090073862) £10/day, Max Conversions (no tCPA until 30+ signups), goal
  scoped to dogshow_signup ONLY, Dog Lovers affinity + Dogs in-market with
  optimised targeting ON, final URL https://dogshow.lol/?ref=gads. Targeting
  both: worldwide English MINUS EEA+UK+CH+IS+LI+NO (32 exclusions — aligns
  with consent.js ROW auto-grant so paid traffic is never banner-gated).
  Tracking: Google tag AW-18212544394; dogshow_signup label
  KxqZCJvU09kcEIq_texD fires on register success (50-bones moment) via
  window.trackAdsSignup with hashed-email enhanced conversions; hwab_purchase
  label d6XuCLvDy9kcEIq_texD (value by tier USD, transaction_id=jobId).
  Success metric (dogshow): cost per signup + 7-day return rate of paid
  signups vs organic (quality guardrail). Cadence: prune search terms every
  2-3 days (HWAB), day-5 geo report, day-10 creative prune, day 20-22 final
  cost-to-convert readout. Credit: £372.50 earned, expires 23 Sept 2026.
