# Bing Ads — dogshow.lol campaign prep

**Status:** assets drafted, awaiting account creation + asset review.
**Budget:** £200 spend → £400 promo credit = £600 total (~$760 USD at 1.27).
**Pacing:** £7-10/day → ~3-4 weeks to hit £200 threshold and unlock credit.
**Targeting:** United States (English). Billed in GBP from UK account.
**Goals:** (1) email_captured, (2) purchase. UET pixel scaffolded — see `analytics.js`.

---

## 1. Honest expectations

At an estimated $1 average US CPC for dog-contest terms, $760 buys roughly **600-900 clicks total** across the whole trial. That is:

- **Enough** to learn which ad copy out-clicks which (CTR signal needs ~50 impressions per variant; we'll easily get that).
- **Enough** to learn which landing page out-converts which on email capture.
- **Not enough** to optimize purchase conversion algorithmically. Bing's smart bidding needs ~30 conversions/30 days; at a generous 3% purchase-conversion rate from 800 clicks that's 24 purchases over the full trial. Stay on manual CPC the entire time.

If after 2 weeks the data shows we're paying >$30 cost-per-purchase on a $3.99 product, we kill or radically restructure — not push more budget at it.

**Confidence: medium.** US dog-contest CPCs are an inference from general pet-vertical benchmarks. Actual auction prices could be $0.30 (cheap test) or $2.50 (everyone bids on these terms). First week's data will tell us; reset assumptions then.

---

## 2. Pre-launch friction to fix BEFORE spending money

These are conversion liabilities that will waste paid clicks if shipped as-is. Flagged in priority order.

**A. SEO landing-page CTAs bounce to homepage.** All four landing pages (`/dog-photo-contest`, `/cutest-dog-contest`, `/puppy-picture-contest`, `/dog-show-near-me`) have their "Enter Your Dog — $3.99" button wired to `window.location.href = '/#pricing'`. The user lands on the contest page, clicks the CTA, gets bounced to the homepage, has to find pricing again, click the right tier, then the email modal opens. **This is the single biggest conversion leak.** Fix: wire the landing-page CTA to open the email modal directly with tier=premium pre-selected (either by inlining the modal on the landing page, or by adding `?openModal=premium` param to `/` and having index.html auto-open).

**B. Currency mismatch caveat.** Site is USD-only. US targeting from UK account doesn't show £ to users — they see $ as expected. **No fix needed if targeting is US-only.** If we ever extend to UK/EU, this becomes a real problem.

**C. No cookie consent banner.** If we enable Clarity (session recording), US state privacy laws (CA, CO, CT, VA at minimum) require disclosure. UET alone is a conversion pixel; less risk but still worth a basic disclosure in privacy policy. **Decide before flipping Clarity on.**

**D. Free tier doesn't yield purchase signal.** Free registrations hit the email_captured goal but never the purchase goal. That's fine for goal 1 (lead) but means our purchase optimizer sees fewer conversions per click. If we want more purchase signal, consider a server-side conversion import from Stripe (Bing supports offline conversion imports) — but that's a v2 enhancement, not blocking.

---

## 3. Campaign structure

**Recommendation: one campaign, four ad groups, shared budget.**

Rationale: at <$15/day total spend, separate campaigns spread budget too thin to learn from any one cluster. A shared budget lets Bing flow money to whichever ad group is converting. Split into separate campaigns only after week 2 when one cluster clearly out-performs and deserves dedicated budget.

```
Campaign: "DogShow — US Search Trial"
├── Ad Group 1: Dog Photo Contest → /dog-photo-contest
├── Ad Group 2: Cutest Dog       → /cutest-dog-contest
├── Ad Group 3: Puppy Picture    → /puppy-picture-contest
└── Ad Group 4: Dog Show Near Me → /dog-show-near-me
```

Account-level negative keyword list applies to all four.

---

## 4. Keywords (by ad group)

**Match type convention:** `"phrase"` = phrase match, `[exact]` = exact match.
**Avoid broad match entirely on this budget** — it auctions on too many irrelevant queries.

### Ad Group 1: Dog Photo Contest
Final URL: `https://dogshow.lol/dog-photo-contest`

```
"dog photo contest"
"dog picture contest"
"online dog photo contest"
"photo contest for dogs"
"enter dog in photo contest"
"best dog photo contest"
"cute dog photo contest"
[dog photo contest]
[online dog photo contest]
[enter dog photo contest]
```

### Ad Group 2: Cutest Dog Contest
Final URL: `https://dogshow.lol/cutest-dog-contest`

```
"cutest dog contest"
"cutest puppy contest"
"cute dog contest"
"cutest dog competition"
"cutest dog in the world"
"cute dog of the year"
[cutest dog contest]
[cutest puppy contest]
[cute dog contest]
```

### Ad Group 3: Puppy Picture Contest
Final URL: `https://dogshow.lol/puppy-picture-contest`

```
"puppy picture contest"
"puppy photo contest"
"puppy contest online"
"online puppy contest"
"cute puppy contest"
"enter puppy contest"
[puppy picture contest]
[puppy photo contest]
```

### Ad Group 4: Dog Show Near Me
Final URL: `https://dogshow.lol/dog-show-near-me`

```
"dog show near me"
"dog show online"
"online dog show"
"virtual dog show"
"live dog show"
"dog show today"
"watch dog show online"
[dog show near me]
[online dog show]
[virtual dog show]
```

---

## 5. Account-level negative keywords

Add as a **shared negative keyword list** in Microsoft Advertising → Tools → Shared Library → Negative keyword lists. Apply to the campaign.

```
westminster
crufts
akc
american kennel club
breeder
breeders
for sale
puppies for sale
adoption
rescue
training
trainer
obedience
groomer
grooming
show dog
dog show schedule
dog show results
dog show entry fee
tv show
netflix
amazon prime
youtube
episode
free download
jobs
careers
biggest dog
largest dog
smallest dog
veterinarian
vet clinic
dog food
pet supplies
collar
leash
harness
costume
agility
diy
how to
```

Most of these will be added as **phrase negatives** (default behavior in Bing) so they block any query containing the term. Review after week 1 and add more from the search-terms report.

---

## 6. Ad copy — Responsive Search Ads

Each ad group gets one RSA. Bing lets you supply up to 15 headlines and 4 descriptions; it mixes-and-matches and reports which combinations perform.

**Character limits (hard, Bing will reject if over):**
- Headlines: max 30 chars each
- Descriptions: max 90 chars each
- Display URL paths: max 15 chars each

All copy below is pre-counted and verified within limits.

### Ad Group 1: Dog Photo Contest

**Headlines (15):**
1. Dog Photo Contest
2. Enter Your Dog's Photo
3. $3.99 — Your Dog On Stage
4. Live Online Dog Show
5. No Judges. No Voting.
6. Every Dog Gets a Stage
7. Permanent Dog Page
8. Watch the Show Free
9. Real Dogs. Real Stage.
10. One Photo, One Show
11. Your Dog On Stage Tonight
12. The Internet's Dog Show
13. Submit One Photo, $3.99
14. Bones Thrown By the Crowd
15. Includes Permanent Page

**Descriptions (4):**
1. Upload one photo. Your dog appears in the live online show with a permanent page. $3.99.
2. No judges, no voting, no AI dogs. Just yours, on stage, live tonight. Free to watch.
3. One payment, one photo, lifetime page. Watch the show free or enter your dog for $3.99.
4. The internet's least serious dog show. Every dog walks on stage. Crowd throws bones.

**Display URL:** `dogshow.lol/dog-photo-contest`
**Paths:** `dog-photo` / `contest`

### Ad Group 2: Cutest Dog Contest

**Headlines (13):**
1. Cutest Dog Contest
2. Every Dog Is the Cutest
3. No Judges, No Losing
4. Your Dog Wins. Always.
5. Live Cutest Dog Show
6. Enter Your Dog — $3.99
7. Permanent Dog Page
8. Watch Live Free
9. Skip the Pay-to-Vote
10. Real Live Dog Show
11. Cute Dog Photo Contest
12. From One Photo to Show
13. Bones, Not Trophies

**Descriptions (4):**
1. Cutest dog contest with no judges and no pay-to-vote. Every dog gets a stage. $3.99 once.
2. Upload a photo, your dog appears in the live online show with a permanent page. $3.99.
3. No subscriptions. No AI dogs. Just real dogs, live, on stage. Watch the show free.
4. Cutest puppy or oldest senior — every dog is the cutest here. Enter for $3.99.

**Display URL:** `dogshow.lol/cutest-dog-contest`
**Paths:** `cutest-dog` / `contest`

### Ad Group 3: Puppy Picture Contest

**Headlines (12):**
1. Puppy Picture Contest
2. Your Puppy On Stage
3. Live Puppy Show — $3.99
4. Cutest Puppy, Live
5. Enter Your Puppy
6. Permanent Puppy Page
7. No Sitting Still Required
8. Watch the Show Free
9. From One Photo to Stage
10. Real Puppies, Live Stage
11. Puppy Photo Contest
12. The Internet's Dog Show

**Descriptions (4):**
1. Upload one puppy photo. They appear in the live online show with a permanent page. $3.99.
2. No age limits, no sitting still required. Your puppy on stage, live tonight.
3. One photo, one $3.99 payment. Crowd throws bones. Everyone agrees they're perfect.
4. Live puppy show. No judges, no voting. Watch free or enter your puppy for $3.99.

**Display URL:** `dogshow.lol/puppy-picture-contest`
**Paths:** `puppy` / `contest`

### Ad Group 4: Dog Show Near Me

**Headlines (12):**
1. Online Dog Show, Live Now
2. Dog Show on Your Screen
3. Skip the Drive
4. Live Dog Show Today
5. Watch the Dog Show Free
6. Enter Your Dog — $3.99
7. No Entry Forms
8. No Standing in a Field
9. Dog Show Right Here
10. Real Dogs, Live Stage
11. From Your Phone
12. Live On Stage Tonight

**Descriptions (4):**
1. Looking for a dog show near you? It's already on your screen. Live, free to watch.
2. Skip the drive and the entry forms. Watch the live dog show now from anywhere.
3. Real dogs, real stage, real crowd throwing bones. Watch free or enter for $3.99.
4. The internet's live dog show. On now. Enter your own dog for $3.99 once.

**Display URL:** `dogshow.lol/dog-show-near-me`
**Paths:** `dog-show` / `online`

---

## 7. Ad extensions (apply at campaign level)

### Sitelinks (4-6 recommended)

| Text | URL | Description line 1 | Description line 2 |
|---|---|---|---|
| Watch Live Free | https://dogshow.lol/show.html | Watch the live show | No signup needed |
| All Dogs Gallery | https://dogshow.lol/dogs.html | Browse every dog | See their pages |
| Cutest Contest | https://dogshow.lol/cutest-dog-contest | Every dog is cutest | No judges, no voting |
| Puppy Contest | https://dogshow.lol/puppy-picture-contest | Live puppy show | No age limits |
| About | https://dogshow.lol/about.html | Our story | Contact us |

### Callouts (8-10, max 25 chars each)

```
$3.99 once
No subscriptions
Permanent page
Watch free
Real dogs only
No AI dogs
No judges
Live now
One photo entry
Shareable cert
```

### Structured snippets

Header: `Includes`
Values: `Live show appearance` · `Permanent page` · `Shareable certificate` · `Crowd bones` · `Breed facts`

---

## 8. Conversion goals (define in Bing UI)

### Goal 1: Email Captured (lead)
- Goal name: `Email Captured`
- Goal type: Event
- Category: Submit lead form
- Action: `email_captured`
- Count: Unique (one per click)
- Revenue value: $0 (this is a lead, not revenue)
- Attribution: Last click
- Attribution window: 30 days
- Include in "Conversions" column: Yes

### Goal 2: Purchase (revenue)
- Goal name: `Purchase`
- Goal type: Event
- Category: Purchase
- Action: `purchase`
- Count: All conversions
- Revenue value: **Use value from event** (set to "Variable" — Bing reads the `revenue_value` field from the pixel)
- Attribution: Last click
- Attribution window: 30 days
- Include in "Conversions" column: Yes

---

## 9. Bid strategy & settings

| Setting | Value | Rationale |
|---|---|---|
| Campaign type | Search | Display has no commercial intent for this audience |
| Networks | Bing only (off: Search partners, Audience) | Search partners can be added in week 3 if base is performing |
| Locations | United States | All states. Sub-state segmentation only after data |
| Languages | English | |
| Bid strategy | Manual CPC | Smart bidding needs 30+ conversions; we won't hit that during trial |
| Initial max CPC | $0.50 | Raise to $1.00 if impression share <20% after 3 days |
| Daily budget | £10 (~$12.70) shared | Allows ~12-15 clicks/day at $1 CPC |
| Ad rotation | Optimize | Let Bing surface best-performing |
| Schedule | All hours | Optimize dayparts only after 2 weeks of conversion data |
| Devices | All | Adjust bid -20% on tablet after week 1 (tablet usually weakest for impulse purchases) |
| Audience | None at launch | LinkedIn audience targeting and remarketing require UET pre-population |

---

## 10. Pre-launch QA checklist

Before turning campaigns on:

- [ ] `analytics.js` loaded on all 11 main pages (network tab in devtools — check for 200 on `analytics.js`)
- [ ] UET_TAG_ID pasted into `analytics.js` and deployed
- [ ] UET pixel firing on pageload (use **UET Tag Helper** Chrome extension)
- [ ] Email-capture event fires when modal submitted (network tab → look for POST to bat.bing.com with `evt=email_captured`)
- [ ] Purchase event fires on success.html (do a real $1.99 test purchase end-to-end with your own card; refund yourself in Stripe afterward)
- [ ] Both conversion goals defined in Bing and showing "Active" status
- [ ] All four landing pages render correctly on mobile (Chrome DevTools mobile preview)
- [ ] No `/#pricing` redirect friction on landing pages (or accept the leak and fix later)
- [ ] Stripe checkout works end-to-end in production
- [ ] Sitelinks all resolve to live pages (no 404s)
- [ ] Privacy policy mentions UET tracking (and Clarity if enabled)
- [ ] Daily budget set, not lifetime budget (lifetime is harder to course-correct)
- [ ] Account-level negative keyword list created and applied to campaign

---

## 11. What to watch in the first 7 days

**Day 1-2:** Are impressions happening at all? If <50 impressions/day per ad group, bids are too low or keywords too narrow. Bump max CPC by 50%.

**Day 3-4:** What's the CTR? <1% = ad copy is wrong, search-query mismatch, or bids are showing us in low positions. Check the search terms report — what queries are we actually showing on?

**Day 5-7:** Are email captures happening? Aim for 5-10% click-to-email-capture rate from landing pages. <2% = landing page is broken (likely the `/#pricing` bounce). >10% = working well, push more budget.

**Don't optimize for purchase until 14+ days in.** Conversion volume is too low to draw conclusions before then.

---

## 12. Kill criteria

Pre-commit to these so you don't sunk-cost into a losing trial:

- **CPA > $20** after 100 clicks per ad group → restructure or kill that ad group
- **CTR < 0.5%** after 2,000 impressions → ad copy needs full rewrite
- **0 conversions** after $50 spent in any ad group → kill that ad group
- **Overall CPA > $30** after 7 days at full spend → pause everything, reassess before resuming

These are floors not targets. A $3.99 product can sustain ~$1-2 CPA at best. Anything above $5 CPA is unprofitable even with strong repeat behavior (which this product doesn't really have — it's a one-time purchase).
