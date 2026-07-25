# Breed-page publishing queue

State file for the `breed-pages.yml` GitHub Action (daily, 2 pages/run).
The CI prompt (`prompts/breed-pages.md`) takes the next PENDING entries top-to-bottom,
writes the pages, and moves them to the Processed log below with a date.

Ordering: Phase A = remaining lowfruits P2 targets (see `seo-breed-hub-plan.md` §6),
by score. Phase B = expansion hubs beyond the researched list — mainstream high-volume
breeds + "parent" breeds of live variant pages (cluster linking). Phase C is BLOCKED
until sibling-page routing exists in `api/breed.js` / `vercel.json`.

## Phase A — lowfruits P2 hubs (PENDING)

| # | Slug | Display name | Head keywords | Vol (lowfruits) | In breeds.js? | Notes |
|---|------|--------------|---------------|-----------------|---------------|-------|
| 1 | belgian-malinois | Belgian Malinois | belgian malinois (for sale) | 40,500 | No — add | Working group; K9/military angle is the famous-section gift |
| 2 | maltese | Maltese | maltese puppies | 22,200 | Yes | |
| 3 | bernese-mountain-dog | Bernese Mountain Dog | bernese mountain dog for sale | 14,800 | Yes | Parent of live bernedoodle + golden-mountain-dog — cross-link both ways |
| 4 | vizsla | Vizsla | vizsla puppies | 14,800 | Yes | |
| 5 | chocolate-lab | Chocolate Lab | chocolate lab puppies | 12,100 | No — add | Color variant of Labrador; frame as variety, cross-link labradoodle |
| 6 | mini-french-bulldog | Mini French Bulldog | mini french bulldog | 12,100 | No — add | Variant of live french-bulldog — distinct H1/schema, "different variety" framing (plan §9.3) |
| 7 | giant-schnauzer | Giant Schnauzer | giant schnauzer | 12,100 | No — add | |
| 8 | newfoundland | Newfoundland | newfoundland puppies | 9,900 | Yes | |
| 9 | american-bully | American Bully | american bully for sale | 8,100 | No — add | Owner-fit section must handle temperament/BSL topic honestly, in voice |
| 10 | agouti-husky | Agouti Husky | agouti husky | 6,600 | Do NOT add | Coat-color variant — owners tag "Siberian Husky"; page fine, no dropdown entry |

**SKIPPED — do not write:** `mini-australian-shepherd` (22.2K) — same breed as the live
`/breeds/mini-aussie` page; a second page would cannibalize (plan §6 flagged this).
Fold the keyword into mini-aussie's title/meta instead if desired.

## Phase B — expansion hubs (PENDING, after Phase A)

Cluster parents first (they inherit internal links from live variant pages), then mainstream volume.

| # | Slug | Display name | Rationale | In breeds.js? |
|---|------|--------------|-----------|---------------|
| 11 | poodle | Poodle | Parent of teacup-poodle + every doodle — strongest cluster node | Yes |
| 12 | australian-shepherd | Australian Shepherd | Parent of mini-aussie + toy-aussie | Yes |
| 13 | golden-retriever | Golden Retriever | Parent of goldendoodle, mini-golden-retriever, golden-mountain-dog | Yes |
| 14 | labrador-retriever | Labrador Retriever | Parent of labradoodle, chocolate-lab | Yes |
| 15 | siberian-husky | Siberian Husky | Parent of pomsky, agouti-husky | Yes |
| 16 | dachshund | Dachshund | Parent of live mini-dachshund | Yes |
| 17 | aussiedoodle | Aussiedoodle | Doodle-cluster fit, designer-mix demo skews to our audience | No — add |
| 18 | sheepadoodle | Sheepadoodle | Already a "Soon" related-chip on live doodle pages | No — add |
| 19 | corgi | Pembroke Welsh Corgi | High volume, strong pop-culture famous section | Yes (check exact label) |
| 20 | shih-tzu | Shih Tzu | High volume, companion group | Yes |
| 21 | yorkie | Yorkshire Terrier | High volume | Yes (check label) |
| 22 | pomeranian | Pomeranian | Parent of pomsky | Yes |
| 23 | beagle | Beagle | High volume | Yes |
| 24 | french-bulldog → done | — | (live already — listed to prevent accidental re-add) | — |
| 25 | border-collie | Border Collie | High volume, working group | Yes |
| 26 | chihuahua | Chihuahua | High volume | Yes |
| 27 | boxer | Boxer | | Yes |
| 28 | great-dane | Great Dane | | Yes |
| 29 | rottweiler | Rottweiler | | Yes |
| 30 | cavalier-king-charles-spaniel | Cavalier King Charles Spaniel | Parent of cavapoo | Yes (check label) |

When Phase B nears exhaustion, the run report should say so and recommend either
building Phase C (sibling pages — needs routing work) or fresh keyword research.

## Phase C — sibling/cluster sub-pages (BLOCKED — infra not built)

Planned in `seo-breed-hub-plan.md` §6 (bernedoodle-vs-goldendoodle, pomsky health,
mini-golden size, etc.). Requires new routing + template in `api/breed.js` /
`vercel.json`. Do NOT attempt from CI until this section is unblocked by James.

## Processed log

(CI appends: date · slug · notes)
