# Dog Show — M1 sync manifest
<!-- CANONICAL HOME since 2026-07-25: lives in the dogshow repo (constitution/sources.md); machine-mirrored into SCHEMESTUDIO/postwerks. All paths below are relative to this repo's root. Facts a regex can pin (priceMap, bones constants, banned claims) are now enforced mechanically by constitution/checks.json via the Postwerks constitution-sync workflow; the "last verified" stamps remain the authority for everything a regex can't check. -->
repo: SCHEMESTUDIO/dogshow

- CNAME — authoritative for live domain (dogshow.lol) — last verified 2026-07-19
- llms.txt — authoritative for public fact summary + canonical page list (part of hardcoded-facts sync set) — last verified 2026-07-19
- party/server.js — AUTHORITATIVE for pricing SKUs (priceMap l.2350-52), bones constants (l.23-25), entry/upload gating, monthly Best in Show + Best in Breed mechanics, bot FACTS prompt — last verified 2026-07-19
- free-to-enter-migration-2026-06-23.md — authoritative for the free-entry pivot, retired $3.99 SKU, legacy-buyer handling — last verified 2026-07-19
- CLAUDE.md — fact sections: Payments, FREE-TO-ENTER pricing tiers, slot mechanics, file map (doc prose — cloud-maintained weekly; re-verify against server.js) — last verified 2026-07-19
- brand-voice.md — canonical voice guide + "current facts" block — last verified 2026-07-19
- terms.html — authoritative for contest framing, tiers table, refunds, upload license, eligibility ages — last verified 2026-07-19 (live == repo; "Last updated" stamp stale at 28 May 2026)
- privacy.html — authoritative for data/processors/cookies (one stale paid-entry phrase noted in facts.md) — last verified 2026-07-19
- middleware.ts — authoritative for EU/UK consent gating — last verified 2026-07-19
- .github/workflows/*.yml (5) + prompts/*.md (4) — authoritative for automated authors, cadences, territories — last verified 2026-07-19
- WORKFLOW.md + docs/memory/decisions.md — authoritative for file ownership, email-cadence decision, outreach rules — last verified 2026-07-19
- index.html / about.html — live copy reference (about.html "premium member" line is stale — do not source from it) — last verified 2026-07-19 (live byte-identical to repo)
- data/breed-page-queue.md — authoritative for upcoming breed-page pipeline — last verified 2026-07-19
- vercel.json + _redirects — routing (note: _redirects' GitHub Pages comment is stale; host is Vercel) — last verified 2026-07-19
