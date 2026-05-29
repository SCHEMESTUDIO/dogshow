# SEO Breed-Hub Plan — dogshow.lol

**Status:** Approved 2026-05-29 with two corrections (§1a, §1b). P0 build in progress.

**Source data:** lowfruits export `dog_1779974338.xlsx` — 274 keywords / 2,249 SERP rows, dated 2026-05-28.

---

## 1a. Correction (2026-05-29): pages must work without user submissions

Original plan leaned on a live grid of user-uploaded dogs of each breed as the differentiator vs AKC/dogtime. James pushed back: at 100+ breeds and the current user volume, the empty-state would be the norm, not the exception. The SEO project's purpose is **discovery → eventual conversion**, not depending on uploads we don't yet have.

**Architectural consequence:** the user-dog grid demotes from centerpiece to bonus section. Pages must be valuable and indexable from day 0 without any dogs of that breed having aired. The "noindex until N≥3 dogs" rule (former §9 risk #2) is dropped.

**New differentiator stack:**
1. **Brand voice** — Wodehouse-genial host, consistent with sir_barks_alot persona. Distinctive vs AKC's bureaucratic tone and dogtime's generic copy.
2. **Show-ring lens** — every page reads breed traits through "would they make a star on stage?" framing. No competitor takes this angle.
3. **Live show widget** — always-populated "right now on stage" pulls breed-page readers into the show product, regardless of whether their breed has aired.
4. **Entertainment angles** — "famous [breed]s in pop culture", "celebrity [breed] owners", "[breed] names from movies" — AKC won't touch this territory because it's not "authoritative." That's the gap.
5. **User dogs when present** — bonus content, surfaced as "[N] [Breed]s have graced our stage" with grid. Empty when 0, no harm done.

**Doorway-content risk gets harder, not easier.** Without the user-dog grid, the unique-value bar has to be carried by the body copy. Mitigation: each breed page needs hand-written lede + spotlight + famous + owner-fit sections. AI-drafted is fine; templated parameter-fills are not.

## 1b. Correction (2026-05-29): SEO pages are for users first, Google second

Stay in brand voice throughout, not just lede + CTA. Google measures dwell, scroll, return — what real humans actually want to read. A breed page that's a slog for the reader is a slog for the SEO too. Technical SEO (schema, headings, internal links, page speed) gets done well; the writing stays diverting.

---

## 1. TL;DR

The fit-aligned subset of the lowfruits list is ~30 breed-info targets totaling ~500K monthly volume (rough; see §6). The play is a `/breeds/{slug}` hub built from (a) genuine breed info, (b) live grid of user-uploaded dogs of that breed, (c) "Enter your {breed}" CTA into BYD. The differentiator vs AKC/Wikipedia is the live user dog grid — which depends on `breeds.js` being expanded to include designer-mix breeds it currently doesn't (§4). Without that precondition, the unique-value pitch collapses and we're just another thin breed-info site.

**Honest framing:** lowfruits Weak Spot count is a fine tiebreaker within a fit-aligned subset. It is **not** predictive of ranking when search intent doesn't match the page type. Most of the 274-keyword set fails the intent test, which is why it gets dropped here.

---

## 2. The data, honestly

| Bucket | Keywords | Volume | Fit | Recommendation |
|---|---|---|---|---|
| Local services ("X near me") | 13 | ~870K | None — geo intent | **Drop.** |
| Vet / health questions | 86 | ~60K | None — YMYL, Google favors AKC/PetMD | **Drop.** |
| Puppies "for sale" (transactional) | ~50 head-terms | ~810K | Weak — Google has tightened transactional intent matching against informational pages | **Drop the head, target informational siblings** (§6) |
| Breed info + designer-mix | ~30 hub-targets | ~500K | **Strong** — informational intent, page can be uniquely valuable via live user dogs | **Primary play.** |
| Other (toys, treadmills, daycare) | ~30 | ~150K | None | **Drop.** |

**Confidence:**
- High: local + vet-question buckets are intent-mismatched. No amount of weak-spot scoring overcomes that.
- High: breed-info bucket is the fit and inner-links cleanly to user uploads.
- Medium: the volume figures from lowfruits are themselves estimates and tend to be optimistic. I'd plan against ~30-50% of stated volume as realistic ceiling once intent-matched CTR is factored in.

---

## 3. Architecture

**URL structure (decided):** `/breeds/{slug}` — e.g. `/breeds/bernedoodle`, `/breeds/mini-golden-retriever`. Plus a `/breeds` index page.

**Routing:** Add to `vercel.json`:
```json
{ "source": "/breeds/:slug", "destination": "/api/breed?slug=:slug" },
{ "source": "/breeds",       "destination": "/breeds.html" }
```
The catch-all `/:slug → /:slug.html` already in `vercel.json` does NOT conflict with `/breeds/...` (different depth), but I need to verify rewrite ordering during the P0 implementation pass.

**Render path:** New Vercel serverless function `api/breed.js`, mirroring the SSR shape of `api/dog.js`. Fetches breed metadata + dogs-for-breed from PartyKit, returns SSR'd HTML so share crawlers and Google get real content on first byte (same rationale as audit #27 for `/d/{slug}`).

**Data dependency on PartyKit:** Needs a new endpoint `GET /dogs-by-breed?breed=X[&limit=Y]` returning the dogs that have aired and were tagged with that breed. Current `/all-dogs` returns the full list — fine for small sets, but should add a breed-indexed shortcut server-side once we have >500 dogs. Server cost: trivial.

**OG images:** Reuse `api/og.tsx`'s frame template, parameterized for breed (`/api/og?breed={slug}` — top dog of that breed if any, else generic breed silhouette + wordmark). Defers OG image polish to P1.

---

## 4. Critical precondition: `breeds.js` mismatch

This is the finding that most changes the project. Of the high-volume breed targets in the lowfruits set:

**Already in `breeds.js` (uploaders can already tag):** German Shepherd, French Bulldog, Dalmatian, Cane Corso, Bernese Mountain Dog, Poodle, Newfoundland, Vizsla, Bichon Frise, Maltese, Jack Russell Terrier, Italian Greyhound, Cocker Spaniel, Whippet, Dachshund. (~15 targets, ~250K combined volume.)

**NOT in `breeds.js` — uploaders can't pick them:** Bernedoodle (49K vol), Mini Golden Retriever (40K), Australian Labradoodle (40K), Cockapoo (22K), Cavapoo (22K), Goldendoodle (27K), Mini Australian Shepherd / Mini Aussie / Toy Aussie (12-22K each), Saint Berdoodle (15K), Golden Mountain Dog (12K), Pomsky (8K), Maltipoo (18K), Labradoodle (18K), Mini French Bulldog (12K), Mini Dachshund (40K), Teacup Poodle (49K), Teacup Yorkie, XL Bully, American Bully, Pocket Bully, Toy Cavoodle, Agouti Husky, Chocolate Lab, Giant Schnauzer. (~25 targets, ~450K combined volume.)

**Why this matters:** the differentiated value of `/breeds/bernedoodle` over AKC's bernedoodle page is "see real Bernedoodles on stage from real owners." If no user can tag their upload as "Bernedoodle" because the dropdown doesn't include it, the live grid is always empty and the page is identical to every other AI-generated breed page on the web. Google's helpful content classifier eats those.

**Fix (precondition for P1):**
1. Extend `breeds.js` to add the designer/size-variant breeds in the not-in-dropdown list above. ~25 additions. Keep alphabetical convention; "Mixed Breed" stays first, "Other / Not sure" stays last.
2. Decide on a size-variant convention: do we represent "Mini Golden Retriever" as a separate dropdown entry, or as "Golden Retriever" with an optional size tag? **Recommendation:** separate entries for designer mixes and well-known size variants (Mini Aussie, Toy Aussie, Mini Golden Retriever). Avoids inventing a new tagging dimension and matches how owners describe their dogs.
3. Server-side: nothing changes — the breed string is already free-text on the dog record. No migration needed.

**Confidence:** High that this is the right precondition. Medium on whether the size-variant convention will hold up — if a "Mini Aussie" owner clicks "Australian Shepherd" instead, the breed page misses them. Mitigation in P2: a server-side breed-alias map (`'mini-aussie' includes ['Mini Australian Shepherd', 'Mini Aussie', 'Toy Aussie']`).

---

## 5. Page template (`/breeds/{slug}`)

Anatomy, top to bottom. Designed to be both SEO-deep and BYD-converting; tradeoffs called out where they pinch.

Updated for §1a (no user-dog dependency) and §1b (brand voice throughout).

1. **H1 + lede** (60-80 words). Brand voice, head keyword natural. Hand-written per breed — no template parameters.
2. **"Spotlight" section** (150-250 words). "Why the {Breed} on stage" — show-ring lens, entertainment angle. The most distinctive section. Hand-written per breed. Replaces the live-user-dog grid as the centerpiece.
3. **Live show widget** — small, always-populated. "Right now on stage: [current dog name + thumbnail + watch CTA]." Pulls from existing PartyKit data. Reuses the show.html slideshow logic, scoped to 1 frame.
4. **Breed facts** (structured but in voice). Size, temperament, life expectancy, group, AKC recognition, common colors. Schema.org: `Article` + `PropertyValue` set for the structured attributes.
5. **"Is a {Breed} right for you?"** (200-400 words). Owner-fit, health, grooming, exercise. In voice — honest without being dry.
6. **"Famous {Breed}s"** (100-200 words). Pop-culture / history / notable dogs. The angle AKC won't touch. Hand-written.
7. **Comparison strip** — "{Breed} vs {related breed}" links (3-5). Builds the comparison-page cluster — broken links blocked from sitemap until pages exist.
8. **"{Breed}s in our show"** — bonus section, hidden when N=0. "[N] {Breed}s have taken our stage" + grid of up to 8 user dogs of that breed when present. Links to `/dogs.html?breed={slug}`.
9. **Primary CTA** — "Put your {Breed} in the show" — routes to `startDogEntry()` with breed pre-selected via URL param or localStorage. Sticky-on-mobile, but ≤15% viewport height to dodge Google's intrusive-interstitial penalty.
10. **Inner-link footer** — "More breeds" → /breeds; "Cutest contest" → /cutest-dog-contest; "Live show" → /show.

**Word count target:** 600-900 visible words. Below ~500 trips Google's thin-content signal; above ~1200 dilutes the breed-fact section the SERPs reward.

**Image cost:** 1 hero illustration per breed minimum. Cheapest path: generate via existing OG image pipeline with a breed silhouette and the wordmark frame. Realistically AI-illustrate later.

---

## 6. Tier-1 keyword roadmap

Filtered for breed-info fit, ranked by `volume × (weak_spots + 1)` with a 0.4× discount on purely-transactional keywords (`for sale`, `puppies`). The bottom of the table is the cutoff — anything below score ~25K I'd defer to P2 unless it inner-links from a higher-tier breed.

| Target URL | Head kws | Vol | Avg WS | In breeds.js? | P-tier |
|---|---|---|---|---|---|
| `/breeds/mini-golden-retriever` | mini/miniature golden retriever | 40,500 | 5.5 | **No — add** | P1 |
| `/breeds/australian-labradoodle` | australian labradoodle | 40,500 | 5.0 | **No — add** | P1 |
| `/breeds/bernedoodle` | bernedoodle, bernedoodle puppies | 49,500 | 6.0 | **No — add** | P1 |
| `/breeds/teacup-poodle` | teacup poodle | 49,500 | 2.0 | **No — add** | P1 (high vol but competitive) |
| `/breeds/mini-dachshund` | mini/miniature dachshund | 40,500 | 3.0 | **No — add** | P1 |
| `/breeds/german-shepherd` | german shepherd puppies | 60,500 | 4.0 | Yes | P1 |
| `/breeds/saint-berdoodle` | saint berdoodle | 14,800 | 6.0 | **No — add** | P1 (highest WS density) |
| `/breeds/golden-mountain-dog` | golden mountain dog | 12,100 | 6.0 | **No — add** | P1 |
| `/breeds/toy-aussie` | toy aussie | 12,100 | 6.0 | **No — add** | P1 |
| `/breeds/french-bulldog` | french bulldog puppies, rescue | 49,500 | 3.0 | Yes | P1 |
| `/breeds/cockapoo` | cockapoo (puppies) | 22,200 | 3.5 | **No — add** | P1 |
| `/breeds/goldendoodle` | goldendoodle puppies | 27,100 | 4.0 | **No — add** | P1 |
| `/breeds/pomsky` | pomsky (for sale, puppies) | 8,100 | 6.0 | **No — add** | P1 (high WS) |
| `/breeds/mini-aussie` | mini aussie puppies | 12,100 | 7.0 | **No — add** | P1 (highest WS) |
| `/breeds/labradoodle` | labradoodle puppies | 18,100 | 5.0 | **No — add** | P1 |
| `/breeds/maltipoo` | maltipoo for sale | 18,100 | 4.0 | **No — add** | P1 |
| `/breeds/cavapoo` | cavapoo puppies | 22,200 | 3.0 | **No — add** | P1 |
| `/breeds/cane-corso` | cane corso for sale | 27,100 | 2.0 | Yes | P1 |
| `/breeds/dalmatian` | dalmatian puppies | 27,100 | 2.0 | Yes | P1 |
| `/breeds/belgian-malinois` | belgian malinois for sale | 40,500 | 3.0 | (not in breeds.js — **add**) | P2 |
| `/breeds/mini-french-bulldog` | mini french bulldog | 12,100 | 3.0 | **No — add** | P2 |
| `/breeds/mini-australian-shepherd` | mini australian shepherd | 22,200 | 4.0 | **No — add** | P2 (canonicalize with toy-aussie?) |
| `/breeds/bernese-mountain-dog` | bernese mountain dog for sale | 14,800 | 4.0 | Yes | P2 |
| `/breeds/chocolate-lab` | chocolate lab puppies | 12,100 | 5.0 | (variant of Labrador — **add**) | P2 |
| `/breeds/giant-schnauzer` | giant schnauzer | 12,100 | 5.0 | (variant — **add**) | P2 |
| `/breeds/maltese` | maltese puppies | 22,200 | 2.0 | Yes | P2 |
| `/breeds/newfoundland` | newfoundland puppies | 9,900 | 5.0 | Yes | P2 |
| `/breeds/vizsla` | vizsla puppies | 14,800 | 3.0 | Yes | P2 |
| `/breeds/american-bully` | american bully for sale | 8,100 | 5.0 | **No — add** | P2 |
| `/breeds/agouti-husky` | agouti husky | 6,600 | 4.0 | (color variant of Siberian Husky) | P3 (low priority) |

**Sum of P1 head-term volume: ~520K/mo (lowfruits-stated).** Realistic ceiling if everything ranks top-5: ~5-15% CTR on long-tail variants, much lower on the head terms where intent skew remains. I'd plan against 20-50K incremental monthly sessions at P1 maturity. **Confidence: Low-Medium** — too many unknowns (Google's intent classifier, your domain's eventual authority, the quality of each page's user dog grid).

**Tactical "informational siblings" feeder pages (the few James OK'd):** 5-10 of these at P2 maturity, all inner-linked from their parent breed page:
- "Are Bernedoodles Good With Kids?" → /breeds/bernedoodle/family
- "Bernedoodle vs Goldendoodle" → /breeds/bernedoodle-vs-goldendoodle
- "How Big Do Mini Golden Retrievers Get?" → /breeds/mini-golden-retriever/size
- "Pomsky Lifespan & Health" → /breeds/pomsky/health
- "How Much Is a Bernese Mountain Dog?" → /breeds/bernese-mountain-dog/cost (the lowfruits row has 6 weak spots @ 1.9K vol — easy)

These are sub-pages, not separate hubs. Builds the topical cluster around each P1 breed page rather than spamming the root.

---

## 7. Inner-linking graph

The graph James wanted between user uploads and search opportunities:

1. **Every `/d/{slug}` (per-dog cert page)** gets a "More {Breed} dogs" link to `/breeds/{their-breed}`. This is the user→hub direction and gives the breed page link equity from every dog of that breed. Implementation: small change in `api/dog.js`.
2. **Every `/breeds/{slug}` page** links out to: (a) 3-5 related breeds (e.g. Bernedoodle → Goldendoodle, Saint Berdoodle, Bernese Mountain Dog, Sheepadoodle), (b) `/cutest-dog-contest`, (c) `/show`, (d) `/breeds` index. This is hub→hub + hub→funnel.
3. **`show.html`** gets a "Browse by breed" link in the share/leaderboard rail. Funnel→hub.
4. **`dogs.html` gallery** gets breed-filter chips that read `?breed=X` and link to `/breeds/{slug}`. Requires a small filter add to dogs.html — gallery→hub.
5. **`/breeds` index** lists all breed hubs grouped (Doodles & Mixes / Size variants / Working / Toy / etc.). Hub→hub mesh.
6. **`index.html` landing** gets a "Popular breeds" strip (top 6-8) below the testimonials section. Landing→hub.

This is a deliberately dense inner-link mesh because the breed hubs need link equity to compete on terms where AKC has DA 85+.

---

## 8. Phased rollout

**P0 — Foundation (1-2 days work).** Greenlight required before I start.
- Extend `breeds.js` with the ~25 new breeds + variants (§4).
- Add `vercel.json` rewrites for `/breeds/:slug` and `/breeds`.
- Build `api/breed.js` SSR function (template, pulls from PartyKit).
- Build `/breeds` index page (static HTML, lists hubs grouped).
- Add `GET /dogs-by-breed` PartyKit endpoint.
- Update `api/dog.js` to inner-link to `/breeds/{their-breed}`.
- Update `dogs.html` to accept `?breed=X` filter.
- Update `show.html` + `index.html` with the inner-link touchpoints.
- Sitemap: include `/breeds` and `/breeds/{slug}` for breeds with ≥1 aired dog OR P1 status.

**P1 — Tier-1 pages (1-2 weeks).** ~20 breed hubs from the P1 column in §6. Each: hand-tuned lede + AI-drafted body + reviewed by James. Hero image via OG pipeline. Internal links live before publish.

**P2 — Tier-2 expansion + sibling pages (3-4 weeks).** ~10 more breed hubs + 5-10 informational sibling pages. By this point we have analytics data from P1 — re-prioritize based on what's actually ranking, not what lowfruits predicted.

**P3 — Optimization (ongoing).** Server-side breed-alias map to consolidate variant tagging. Hand-written depth additions to the breeds actually ranking. Cull or noindex the breeds that didn't get traction.

---

## 9. Risks I'm watching

1. **Doorway content classification** at 30+ pages — now the #1 risk after §1a. The live-user-dog grid is no longer the unique-value carrier. Each page's lede + spotlight + famous + owner-fit must be hand-written per breed, not parameter-filled. If we ship 30 pages where the only differences are the breed name and a stat block, Google will flag the lot. **Hard rule: every breed page has ≥600 hand-written words in voice, no two leads start the same way, no two spotlights share more than ~30% phrasing.** Each draft gets editorial review before publish.
2. ~~Empty-state problem.~~ Resolved by §1a — pages stand alone without user dogs; the user-dog section is hidden when N=0.
3. **Cannibalization between size-variant pages and their parent breed.** "Mini Golden Retriever" page may steal "Golden Retriever" queries or vice versa, especially because Google's QDF can blur. Mitigation: distinct H1, distinct schema, internal-link the variant page from the parent page's "varieties" section with a clear "different breed" framing.
4. **The transactional discount in my scoring may be too lenient.** Some "for sale" SERPs are 100% marketplace/breeder pages and an informational page literally cannot break the top 10. I'll know after the first 5 P1 pages are live for 60 days. If none rank, drop the transactional-leaning targets from P2.
5. **Volume figures from lowfruits are estimates.** I'd discount stated volume ~50% when budgeting against forecasts. If P1 needs to justify itself by a session number, anchor the floor at lowfruits-stated-volume × 0.05 (a realistic top-5 CTR on long-tail variants only), not the head-term volume.
6. **vercel.json rewrite ordering** — order in the `rewrites` array matters; need to put `/breeds/:slug` BEFORE the catch-all `/:slug → /:slug.html`. Will verify during P0.
7. **AI dog-classifier ON adding new breeds.** The Cloudflare resnet-50 classifier (`15e64ef`) classifies "is this a dog at all?" — not breed. Adding new options to breeds.js doesn't affect it. **Confirmed safe.**

---

## 10. Decisions I need from you before P0

1. **Greenlight the tier-1 list in §6.** Add, remove, or reorder. The 20 P1 breeds are my picks based on the lowfruits data + my own judgment about which are likely to convert; you may have product instincts I don't (e.g. some breeds may already be over-represented among your existing user dogs, which would change the priority).
2. **Empty-state policy.** Pick (a) noindex until N≥3, (b) seed example dogs, or (c) launch thin. I recommend (a).
3. **Size-variant convention in breeds.js.** Separate entries (e.g. "Mini Aussie" + "Australian Shepherd" both present) vs single-entry with a size tag dimension. I recommend separate entries.
4. **Page voice.** Should breed page copy stay in dogshow.lol's playful brand voice (Wodehouse-genial host vibe consistent with sir_barks_alot), or shift to neutral informational for SEO purposes? Tradeoff: brand voice = better differentiation + lower share/dwell from Google searchers; neutral = better SERP alignment but feels off-brand. I'd default to brand voice in the lede + CTA copy and neutral in the breed-fact section, but flagging it as a conscious choice.
5. **Bing/Microsoft Ads interaction.** The Bing Ads US trial (`project_bing_ads.md`) is already in flight. If breed pages start ranking organically on Bing, do you want to suppress ads on those terms to avoid paying for clicks you'd get free? Out of scope for P0 but worth noting now.

---

## What I'm not doing without your sign-off

- Editing `breeds.js` (would change user-facing dropdown).
- Editing `vercel.json` (rewrites are infra-level).
- Adding any `/api/*` files.
- Creating `/breeds/...` files.

When you've reviewed and replied with edits or a greenlight, I'll start P0.
