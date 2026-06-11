# 90-Day Growth Trial — Paid Search + SEO Breed Hub

**Owner:** James · **Drafted:** 2026-06-05 · **Window:** Day 0 = first paid click / first breed-hub batch indexed.

This plan governs two acquisition bets running in parallel: **paid search** (Microsoft/Bing + Google Ads) and the **`/breeds/{slug}` SEO hub**. They share a funnel and a North-Star metric but operate on completely different timescales, so each has its own go/no-go gates. Sources: `bing-campaign-prep.md`, `bing-launch-checklist.md`, `seo-breed-hub-plan.md`, `google-ads-keywords.csv`.

---

## 1. Thesis (read this before the numbers)

**Paid search is a learning lab, not a profit center — by structure, not by pessimism.** The core product is a **$3.99 one-time purchase with near-zero repeat behavior**. That fact caps what paid can ever return (see §2). Its honest job over 90 days is to (a) tell us which messages, keywords, and landing pages actually convert, (b) build the email list, and (c) seed a remarketing audience — *fast*, in days, where SEO takes months. Spend is hard-capped; we do not chase ROAS we cannot get.

**SEO is the structurally-aligned bet.** A cheap, high-volume, inherently-shareable product (every entered dog gets a public `/d/{slug}` cert page) wants a zero-marginal-cost, compounding channel. The breed hub is that channel. But **90 days is early for SEO** — a young domain ranking against AKC (DA 85+) will mostly show *leading* indicators (indexation, impressions, average position) by day 90, not revenue. We judge it on those, not on conversions.

**Confidence: High** that the two channels belong on different yardsticks. The single most common way this trial goes wrong is holding SEO to a paid-style CPA gate at day 90 and killing it right before it would have matured.

---

## 2. The unit economics that constrain everything

Independent calc, not anchored to the prep doc:

- Sale price: **$3.99** (primary BYD SKU). Stripe fee ≈ 2.9% + $0.30 ≈ **$0.42**. Net contribution ≈ **$3.57/sale** (per-user email/server cost is negligible).
- **Breakeven CPA on first purchase ≈ $3.57.** Any blended cost-per-purchase above that loses money *unless* downstream value (top-ups, repeat entries, referrals, or a free signup converting later) makes it up — and the product has little of that today.

What that implies for paid, by the math:

| CPC | Click→purchase rate | Resulting CPA | vs $3.57 breakeven |
|---|---|---|---|
| $0.30 | 5% | $6.00 | underwater |
| $0.50 | 5% | $10.00 | underwater |
| $0.30 | 8.4% | $3.57 | breakeven |
| $1.00 | 3% | $33.00 | deeply underwater |

To make paid ROI-positive *on the first purchase alone* you need roughly **sub-$0.40 CPC AND >8% click-to-purchase** simultaneously. That is optimistic for both variables at once. **Confidence: Medium-High** that paid will not be first-purchase profitable; the inputs (US dog-contest CPC, our conversion rate) are still estimates and week-1 data resets them.

**Consequence baked into the gates below:** paid is justified by *learning value + list growth + a credible path to LTV*, not by standalone ROAS. If none of those materialize, it gets cut — see kill criteria (§6).

---

## 3. What we measure

**North-Star metric:** **paid dog entries per week** (real $3.99+ uploads that reach the stage), split by source (paid / organic / direct). Everything else is a leading indicator of this or of future-this.

### Paid search — metrics

| Tier | Metric | Why |
|---|---|---|
| Leading | Impressions, impression share, CTR | Is the auction serving us, is copy landing |
| Leading | CPC, daily spend / pacing | Cost discipline; promo-credit pacing (Bing) |
| Mid | Click → email-capture rate | Landing-page health (target 5–10%; <2% = broken funnel) |
| Lagging | Click → purchase rate, CPA, ROAS | The economic verdict |
| Lagging | Cost per email lead | Value even when purchase doesn't fire |

### SEO breed hub — metrics

| Tier | Metric | Why | Realistic 90-day read |
|---|---|---|---|
| Leading | Pages indexed (Search Console coverage) | Can Google even see them | Should hit ~100% by day 30 |
| Leading | Impressions in Search Console | Are we entering the consideration set | Rising trend by day 45–60 |
| Leading | Average position (per breed) | Trajectory toward page 1 | Most P1 terms still pos. 15–50 at day 90 — **expected** |
| Mid | Organic clicks, organic sessions to `/breeds/*` | Real traffic | Small but non-zero by day 60–90 |
| Mid | Avg. dwell / scroll depth on breed pages | Doorway-content guardrail (plan §9 risk #1) | Stable from launch |
| Lagging | Organic → entry conversions | The economic verdict | Mostly post-90-day |

**Hard instrumentation prerequisite:** none of the above is trustworthy until §7 is green. Garbage tracking → garbage gates.

---

## 4. The 90-day timeline

### Days 0–7 — Launch + validate the plumbing
- **Paid:** Bing live first (promo credit, lower CPCs). Manual CPC $0.50, £10/day shared, 4 ad groups (`bing-campaign-prep.md` §3–9). Google Ads launches in parallel **only after** its conversion tracking is verified end-to-end. Watch: impressions firing at all (>50/day/ad group), CTR, search-terms report for junk queries → add negatives daily.
- **SEO:** All 19 P1 breed pages live (6 existing + 13 this batch). Submit updated `sitemap.xml`; request indexing in Search Console. Confirm `/dogs-by-breed` PartyKit endpoint is deployed (`npm run check-deploy`) so the bonus user-dog sections populate.
- **Gate:** plumbing works (events fire, pages index). No performance judgment yet.

### Days 8–30 — First signal
- **Paid:** Let each ad group accumulate ≥100 clicks before judging it. Kill/restructure individual ad groups that breach §6 floors. Identify the 1–2 best landing pages and best message angles. Begin seeding a remarketing list (do not spend on it yet).
- **SEO:** Watch indexation hit ~100%. First impressions should appear for long-tail breed variants. Add the deferred inner-link touchpoints (`api/dog.js` → `/breeds/{breed}`, `dogs.html` `?breed=` filter, `show.html` "browse by breed", `index.html` popular-breeds strip) to push internal link equity.
- **Day-30 gate:** see §5.

### Days 31–60 — Optimize what works, cut what doesn't
- **Paid:** Concentrate budget on the winning ad group(s)/landing page(s). Test 1–2 new message angles drawn from the day-1–30 winners. Decide on offline-conversion import from Stripe if purchase signal is too thin for the platforms to learn.
- **SEO:** Re-prioritize the *next* batch (P2 + sibling pages) based on which P1 breeds are actually gaining impressions — **not** on what lowfruits predicted (plan §8 P2). Begin 1–2 informational sibling pages for the best-trending breed.
- **Day-60 gate:** see §5.

### Days 61–90 — Decide the next quarter
- **Paid:** Final read on CPA / cost-per-lead and whether any LTV path is real. Prepare the keep / restructure / kill recommendation.
- **SEO:** Read the impression + position *trend* (slope matters more than absolute level). Project which breeds are on a page-1 trajectory.
- **Day-90 gate:** see §5 — this is the budget-allocation decision for the following quarter.

---

## 5. Go / No-Go gates

Gates are **pre-committed**. Don't soften them mid-trial (that's the sunk-cost trap). "Go" = continue/scale; "Iterate" = keep but fix a named problem; "No-Go" = stop spending on that channel.

### Day 30 — Paid
- **Go:** ≥1 ad group with CTR ≥ 2% **and** click→email-capture ≥ 5% **and** CPA tracking under ~$15 (above breakeven but learnable). At least one clear message/landing winner identified.
- **Iterate:** funnel leak found (email-capture <2% → landing page broken, likely the `/#pricing` bounce flagged in `bing-campaign-prep.md` §2A) — fix before judging economics.
- **No-Go:** every ad group breached a §6 kill floor.

### Day 30 — SEO
- **Go:** ≥90% of the 19 pages indexed; impressions trending up; dwell/scroll healthy (no doorway-content flag).
- **Iterate:** pages indexed but flat impressions → tighten titles/intent match, strengthen internal links.
- **No-Go (rare this early):** Google flags pages as thin/doorway (manual action or mass de-indexing) → pause the batch, revise voice/depth before writing more.

### Day 60 — Paid
- **Go:** blended cost-per-email-lead is acceptable **and** a credible LTV or remarketing path exists, OR CPA is within ~2× breakeven and improving.
- **No-Go:** CPA stuck > ~$20 with no improvement trend and no LTV path → wind down paid; reallocate to SEO/content.

### Day 60 — SEO
- **Go:** ≥3–5 P1 breeds in the top 30 for their head term, impressions compounding week-over-week.
- **Iterate:** indexed + impressions but stuck on page 4–5 → the domain-authority gap is biting; invest in internal links / a few quality backlinks rather than more pages.

### Day 90 — Allocation decision (both)
- **Scale paid** only if it is at least cost-per-lead-neutral with a real downstream-value path. Otherwise **cut paid to a minimal always-on remarketing budget** and **shift the freed budget into SEO/content** (the channel with the better structural economics).
- **Scale SEO** if ≥5 breeds show a clear page-1 trajectory and dwell is healthy → greenlight the P2 batch + sibling pages. If impressions are flat across the board after 90 days on a young domain, that's a signal the niche is too competitive organically, not necessarily that the pages are bad — reassess link-building before abandoning.

**Confidence: Medium** on the specific thresholds — they're reasoned defaults, not measured. Recalibrate the *levels* after week-1 actuals; keep the *structure* (per-channel, timescale-aware) fixed.

---

## 6. Kill criteria (pre-committed, per channel)

**Paid** (from `bing-campaign-prep.md` §12; applies to Google Ads equally):
- CPA > $20 after 100 clicks in an ad group → restructure or kill that ad group.
- CTR < 0.5% after 2,000 impressions → full ad-copy rewrite.
- 0 conversions after $50 spent in an ad group → kill that ad group.
- Overall CPA > $30 after 7 days at full spend → pause everything, reassess.
- **Spend cap (hard):** Bing trial = £200 of own spend (then £400 promo credit). Google Ads = **[DECISION NEEDED — propose a parallel cap, e.g. $200–300]**. Do not exceed without a fresh decision.

**SEO:**
- Google manual action / mass de-indexing of breed pages → stop the batch immediately, fix before resuming.
- Dwell time / scroll on breed pages materially below site average → doorway-content risk materializing; revise before adding pages.

---

## 7. Instrumentation — must be true before trusting any number

Adapted from `bing-campaign-prep.md` §10 + the SEO needs:

- [ ] UET tag (`97248525`) firing on pageload — live as of 2026-05-28 (`1621f41`); re-verify with UET Tag Helper.
- [ ] Google Ads conversion tag firing (purchase + email-capture) — **verify before Google launch.**
- [ ] `email_captured` fires on modal submit; `purchase` fires on `success.html` (run one real test purchase, refund in Stripe).
- [ ] Both conversion goals "Active" in each platform.
- [ ] Landing-page CTA does **not** bounce to `/#pricing` (the biggest known funnel leak — `bing-campaign-prep.md` §2A). Fix or accept consciously.
- [ ] Cookie consent live (shipped 2026-06-04) — note EU visitors are consent-gated, so EU paid traffic underreports conversions by design.
- [ ] Search Console verified; updated `sitemap.xml` submitted; all 19 breed pages requested for indexing.
- [ ] `/dogs-by-breed` deployed on PartyKit (`npm run check-deploy`) so breed-page user-dog sections populate.

**Known data caveat:** purchase events have no transaction-ID dedupe — a `success.html` reload double-counts. Acceptable at trial scale; don't trust purchase counts to the unit.

---

## 8. Risks & failure modes

1. **Paid can't clear breakeven** (§2). *Most likely outcome.* Mitigation: judge paid on learning + leads, cap spend, pivot budget to SEO at day 90.
2. **SEO judged too early.** A young domain may show only leading indicators by day 90. Mitigation: the gates above read *trend*, not absolute revenue, before day 90.
3. **Doorway-content classification** at 19+ near-template pages (plan §9 risk #1). Mitigation: every page ≥600 hand-written words, distinct ledes/spotlights; monitor dwell.
4. **Attribution blind spots:** EU consent-gating undercounts; the share loop (organic reach from `/d/{slug}` cert pages) is invisible to both ad platforms. True blended CAC is better than the dashboards show — don't kill paid purely on platform-reported CPA without sanity-checking total entries vs total spend.
5. **Channel cannibalization:** if breed pages rank on Bing/Google organically, we may pay for clicks we'd get free. Out of scope for launch; revisit at day 60 (plan §10 item 5) by excluding ranking terms from paid.
6. **PartyKit prod drift** (`feedback_partykit_deploy_drift`): a server-side fix can be live in repo but not in prod. Run `check-deploy` after any `party/` deploy before trusting it.

---

## 9. Decisions needed from James

1. **Google Ads budget cap** — no figure exists in the repo yet. Propose $200–300 parallel to the Bing trial.
2. **Launch sequencing** — Bing-first then Google (recommended: validate funnel on cheaper promo-credit traffic), or both at once?
3. **Offline conversion import from Stripe** — enable if purchase signal is too thin for the platforms (decision point ~day 30–45).
4. **Fix the `/#pricing` landing-page bounce before paid launch** — yes/no. It's the single biggest known conversion leak.
5. **SEO next-batch trigger** — confirm we re-prioritize P2 from *actual* day-30–60 impression data, not the original lowfruits ranking.

---

*Floors are not targets. A $3.99 one-time product sustains ~$1–2 CPA at best. The win in 90 days is a clear, evidence-based allocation decision for the next quarter — not a profit.*
