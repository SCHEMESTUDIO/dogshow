# Dog Show (dogshow.lol) — facts, verified 2026-07-19 against repo + live site (live pages byte-identical to repo snapshot)
<!-- CANONICAL HOME since 2026-07-25: this file lives in the dogshow repo (constitution/facts.md) and is machine-mirrored into SCHEMESTUDIO/postwerks dogshow/ by the constitution-sync workflow. Rule: if a commit changes something this file states (pricing, mechanics, policies, page inventory), update this file IN THE SAME COMMIT. Never edit the Postwerks copy. Machine-checkable values are pinned in constitution/checks.json — change code + facts + checks together. Re-homed 2026-07-25 from postwerks/dogshow/facts.md, content unchanged; bones constants + priceMap spot-re-verified against party/server.js 2026-07-25. -->
<!-- CONTRADICTIONS (repo-side FIXED 2026-07-19, pending deploy — verify live): about.html "premium member" upload gate and privacy.html paid-'Enter Your Dog'-tier wording (both false since 2026-06-23; party/server.js /upload-dog is ungated) corrected to free-entry language; index.html "FREE FOR A LIMITED TIME" + struck $3.99 anchor replaced with plain "Free / No payment needed". Still open: _redirects claims GitHub Pages hosting; actual host is Vercel (live `server: Vercel` header). State entry as free NOW; never promise a deadline or "free forever". -->

## Other authors
- breed-pages.yml — daily 06:00 UTC cron — Claude writes AND PUBLISHES 2 new /breeds/{slug} pages to prod (api/breed.js, breeds.js, breeds.html, sitemap.xml, llms.txt, data/breed-page-queue.md) — **ACTIVE since 2026-07-26** (first publish commit `breeds: publish daily pages`; ran daily through 2026-08-15). Publishing PAUSED 2026-08-15 → 2026-08-22 because the Phase B queue ran dry at item #30, not because the workflow broke; Phase B2 was added to data/breed-page-queue.md on 2026-08-22 to refill it. M2 must never write breed content regardless (territory split, seo.json content_policy). <!-- src: git log api/breed.js; data/breed-page-queue.md, verified 2026-08-22 -->
- breed-outreach.yml — weekdays 07:00 UTC — researches backlink prospects, stages Gmail DRAFTS only (no send path; James sends); writes outreach-staging-log.md + breed-outreach-list-and-template.md — ACTIVE. <!-- src: .github/workflows/breed-outreach.yml + prompts/breed-outreach.md -->
- free-to-enter-tracker.yml — daily 08:00 UTC — no-LLM stats snapshot appended to free-to-enter-tracking.csv — ACTIVE. <!-- src: .github/workflows/free-to-enter-tracker.yml -->
- wiki-update.yml — Mondays 04:00 UTC — maintains CLAUDE.md + docs/memory/decisions.md (cloud-owned files; never edit locally) — ACTIVE. <!-- src: .github/workflows/wiki-update.yml + WORKFLOW.md -->
- ads-search1-report.yml — fires on repository_dispatch from a Google Ads Script; Monday 12:00 UTC cron is a watchdog only — writes receipt stamp + Telegram ads report — ACTIVE. <!-- src: .github/workflows/ads-search1-report.yml -->
- EXTERNAL: Postwerks (repo SCHEMESTUDIO/postwerks) — M2 SEO loop writes/publishes non-breed articles for this site (plans Sundays, executes Mon–Sat 09:00 UTC); M5 daily social batches DISABLED 2026-07-17 (daily-batch.yml off in Actions, M5 paused). <!-- src: Postwerks repo + Actions state 2026-07-19 -->

## Product mechanics
- 24/7 live shared stream: one owner-uploaded dog on stage at a time (~15s each); viewers chat and throw "bones" (glossed as "votes" at first contact). <!-- src: index.html hero+FAQ; brand-voice.md §6 -->
- Entering a dog is FREE (since 2026-06-23); money only buys bones. <!-- src: free-to-enter-migration-2026-06-23.md; party/server.js priceMap -->
- Tiers/SKUs: Dog Fan $0 (watch, no account) · Dog Entry $0 (register: chat, enter one dog, permanent certificate page, 50 bones) · Dog Entry Pro $1.99 (+250 bones, SKU `general`) · Top Dog $5.99 (+1,000 bones + book stage slot + 3× stage time, SKU `premium_plus`) · Bones Pack $1.99 (+250 bones, repeatable). <!-- src: party/server.js priceMap l.2350-52, BONES_* l.23-25; terms.html §5.1 -->
- Each bone extends the current dog's stage time ~0.5s; rapid bones trigger a visual "Bone Frenzy". <!-- src: index.html FAQ -->
- Monthly Best in Show: dog with most bones in the calendar month; standings reset on the 1st; permanent trophy on certificate page; needs ≥1 vote to win. <!-- src: party/server.js season rollover l.957-1093 -->
- Monthly Best in Breed (added 2026-07-15): top-voted dog per breed, only when ≥3 dogs of that breed are entered; permanent ribbon. <!-- src: party/server.js l.1037-1093 -->
- Awards are permanent titles/honors only — no cash or physical prizes; the site is "not a competition, a betting product, a contest with cash prizes, a regulated dog show, or affiliated with any kennel club". <!-- src: terms.html §2 -->
- One dog per account (2nd upload rejected); AI classifier (Cloudflare `resnet-50`) verifies uploads are dogs, fails open as "Mystery Breed". <!-- src: party/server.js /upload-dog -->
- Slot booking + 3× on-stage duration is Top Dog-only (legacy $3.99 buyers keep slot rights). <!-- src: party/server.js SLOT_DURATION_MULTIPLIER; CLAUDE.md -->
- Accounts: email magic-link, no passwords (60-min link, 30-day session); in-show instant name+email signup also exists. <!-- src: terms.html §4; CLAUDE.md show.html row -->
- Payments via Stripe Checkout server-side; bones non-refundable once credited; Top Dog slot service refundable within 7 days before first stage appearance. <!-- src: party/server.js /create-checkout, /verify-checkout; terms.html §6 -->

## URLs / stack
- Routes: / · /show · /dogs · /d/{slug} (dog certificate — **noindex,follow since 2026-08-22**: share surface, not a search surface; never treat these as rankable pages or link-building targets) · /breeds + /breeds/{slug} (48 live guides as of 2026-08-22, +2/day via CI when the queue is stocked) · /leaderboard · /resources · /about · /terms · /privacy · /llms.txt. <!-- src: api/breed.js BREEDS keys + sitemap.xml, both counted 2026-08-22; noindex per api/dog.js header note -->
- SEO landing pages: /how-to-enter-a-dog-show, /how-online-dog-shows-work, /dog-photo-contest, /cutest-dog-contest, /puppy-picture-contest, /dog-show-near-me. <!-- src: llms.txt -->
- Stack: Vercel (static + api/dog.js, api/breed.js SSR) + PartyKit/Cloudflare realtime backend + Stripe + Resend. <!-- src: vercel.json; party/partykit.json; privacy.html §3; live server header -->

## Audience & identity
- Core paid audience skews 65+; conversion copy is deliberately plain; sharing happens via family Facebook/WhatsApp. <!-- src: CLAUDE.md "Boomer-demo" pass 12ee55a; brand-voice.md §6 -->
- Operator: Scheme Studio, small UK creative studio (schemestudio.lol). Contact: james@wearescheme.studio. <!-- src: terms.html §1; about.html -->
- Positioning: "the internet's least serious dog show"; testimonials are real, owner-submitted, admin-approved. <!-- src: brand-voice.md; llms.txt -->

## Never say
- cost per generation
- payment processor cut
- profit margin
- breakeven CPA
- £19/day
- win cash
- guaranteed to win
- kennel club affiliated
- free forever
- limited time

## Banned claims
- $3.99
- 250 bones on signup
- weekly best in show
- premium member
- premium-only
- unlimited bones
