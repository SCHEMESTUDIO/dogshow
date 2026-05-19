# Bing Ads — launch checklist

Step-by-step actions for James. Assumes the codebase work is complete (analytics.js scaffolded, events wired, all 11 pages loading analytics.js). Reference document for content: `bing-campaign-prep.md`.

Estimated time end-to-end: **2-3 hours of focused work** spread across 1-2 sessions (some of it has to wait for UET pixel to verify firing — typically a few minutes after deploying the tag ID).

---

## Phase 0: Decisions before you start

These shape what comes next. Pin them down first.

- [ ] **Clarity: yes or no?** If yes, you also need a one-line addition to your privacy policy disclosing session recording. If no, leave `CLARITY_ID` blank in `analytics.js`.
- [ ] **Fix landing-page CTA friction first?** The `/#pricing` bounce on landing pages is a real conversion leak. Either fix it before launch (1-2 hour edit per landing page) or accept the leak knowing it depresses conversion rate. **My recommendation: fix it.** Paying Bing for clicks that get bounced through three pages before checkout is wasteful.

---

## Phase 1: Microsoft Advertising account setup (30 min)

- [ ] Go to https://ads.microsoft.com → "Sign up free"
- [ ] Sign up with a fresh Microsoft account (or new business profile on existing one). **Important:** the £400 promo is for new customers — if your account has any prior Bing Ads history it likely won't qualify. Use a fresh email if unsure.
- [ ] Choose **United Kingdom** as billing country, **GBP** as currency
- [ ] Choose time zone matching where you'll be operating from (UK time)
- [ ] Add a payment method (required even with promo — they bill £200 first, credit applies after)
- [ ] **Verify the promo eligibility** before proceeding. Search "Microsoft Advertising £400 promo" or look in account → Billing → Promotions. If the promo isn't auto-applied, contact Microsoft Advertising support (chat from inside the account UI) to apply the code.

## Phase 2: UET tag install (15 min + 30 min wait for verification)

- [ ] In Microsoft Advertising → Tools → Conversion tracking → UET tag → Create UET tag
- [ ] Name it `dogshow-lol-uet`
- [ ] Copy the **Tag ID** (numeric, e.g. "123456789") — you don't need the full script, just the ID
- [ ] Open `analytics.js` in the repo, paste the ID into `UET_TAG_ID = '';` (between the quotes)
- [ ] If installing Clarity: go to https://clarity.microsoft.com → Create project → name it `dogshow-lol` → copy the Project ID → paste into `CLARITY_ID = '';`
- [ ] Commit and push to GitHub. Wait ~1 minute for GitHub Pages to deploy.
- [ ] Install the **UET Tag Helper** Chrome extension
- [ ] Visit https://dogshow.lol — the extension should show "UET tag detected, fired pageLoad event ✓"
- [ ] If not detected: check browser console for JS errors, verify the tag ID was pasted correctly (no extra spaces/quotes), hard-refresh (Ctrl+Shift+R)

## Phase 3: Conversion goals (20 min)

In Microsoft Advertising → Tools → Conversion tracking → Conversion goals → Create:

- [ ] **Goal 1: Email Captured**
  - Goal type: Event
  - Category: Submit lead form
  - Conversion action: `email_captured`
  - Revenue value: Don't assign a value (lead)
  - Count: Unique
  - Click-through window: 30 days
  - Include in "Conversions" column: Yes
- [ ] **Goal 2: Purchase**
  - Goal type: Event
  - Category: Purchase
  - Conversion action: `purchase`
  - Revenue value: Use the value provided by the event (variable)
  - Count: All
  - Click-through window: 30 days
  - Include in "Conversions" column: Yes

After saving, both goals will show status "Inactive" until the UET pixel fires the event at least once.

## Phase 4: Verify events fire end-to-end (15 min)

This is the most important verification step. **Do not skip.**

- [ ] On dogshow.lol, open Chrome DevTools → Network tab → filter for `bat.bing.com`
- [ ] Click "Watch Now" / "Get my pass" on the landing page to open the email modal
- [ ] Enter a test email and submit
- [ ] Verify a POST request to `bat.bing.com/action/0` appears with `evt_action=email_captured` in the payload
- [ ] Now do a **real $1.99 test purchase** with your own card (use the General tier):
  - [ ] Enter email → Stripe checkout → complete with real card
  - [ ] After redirect to success.html, verify a POST to `bat.bing.com/action/0` with `evt_action=purchase` and `revenue_value=1.99`
  - [ ] Refund yourself in Stripe afterward (you can also keep it as a real conversion — your call)
- [ ] In Microsoft Advertising → Conversion tracking → Conversion goals, both goals should switch from "Inactive" to "Recording conversions" within ~30 min

If either event isn't firing: check browser console, verify `window.trackEmailCapture` and `window.trackPurchase` exist (type them in console), verify UET_TAG_ID is set, verify the page actually loaded analytics.js.

## Phase 5: Shared negative keyword list (10 min)

- [ ] Microsoft Advertising → Tools → Shared library → Negative keyword lists → Create
- [ ] Name: `Account-wide negatives`
- [ ] Paste the negatives list from `bing-campaign-prep.md` § 5
- [ ] Save. You'll apply this to the campaign in Phase 6.

## Phase 6: Build the campaign (45 min)

In Microsoft Advertising → Campaigns → Create campaign:

- [ ] Goal: Visits to my website (you can change to Conversions later once you have data)
- [ ] Campaign type: Search
- [ ] Campaign name: `DogShow — US Search Trial`
- [ ] Budget: **Daily £10** (not lifetime). "Standard" delivery (not accelerated — at this budget, accelerated will spend the budget in 2 hours and stop).
- [ ] Bid strategy: **Manual CPC** with **Enhanced CPC OFF**
- [ ] Locations: United States. People in or searching for your targeted locations.
- [ ] Languages: English
- [ ] Ad rotation: Optimize for clicks
- [ ] Networks: **Bing & Yahoo only**. Turn OFF Search partners (can enable in week 3). Audience network OFF.
- [ ] Devices: All. No bid adjustments yet.
- [ ] Schedule: All hours, all days.

Then create the 4 ad groups (one per intent cluster). For each:

- [ ] Ad group name from § 3 of prep doc
- [ ] Default bid: **£0.40** (max CPC — adjust per ad group later)
- [ ] Add keywords from § 4 of prep doc (one ad group at a time)
- [ ] Create Responsive Search Ad using headlines + descriptions from § 6
- [ ] Final URL = the matching landing page
- [ ] Display URL = `dogshow.lol/[paths]` from § 6
- [ ] Apply the account-level negative keyword list

After all 4 ad groups are built:

- [ ] At campaign level → Ad extensions → Add Sitelink extensions (§ 7)
- [ ] At campaign level → Ad extensions → Add Callout extensions (§ 7)
- [ ] At campaign level → Ad extensions → Add Structured snippet extensions (§ 7)

## Phase 7: Review before launch (15 min)

- [ ] **Review tab:** Bing will flag any policy issues with ad copy. Fix or appeal.
- [ ] Verify all 4 ad groups have at least one Active ad
- [ ] Verify the campaign status is "Eligible" (not "Limited by budget" or "Removed")
- [ ] Double-check the daily budget. £10 not £100.
- [ ] Double-check geo targeting. US not UK.
- [ ] Double-check bid strategy. Manual CPC, not Enhanced.

## Phase 8: Launch + monitoring rhythm

- [ ] Set campaign status to **Active**
- [ ] **Day 1:** Check 4 hours after launch. Are impressions happening? If <20 impressions, bid is too low — bump max CPC by 50% across all keywords.
- [ ] **Day 2-3:** Check daily. Note CTR per ad group. Review search terms report for negative keyword additions.
- [ ] **Day 4-7:** Note which ad group has the best email-capture rate. Note any wildly underperforming headlines/descriptions (Bing will show per-asset performance in the RSA).
- [ ] **End of week 1:** Pause obviously broken ad groups. Add new negatives from search terms report. Consider raising budget on the strongest cluster.
- [ ] **Week 2-3:** Watch for the £200 spend threshold. Once hit, the £400 credit should auto-apply. **Verify this in account → Billing.** If credit doesn't apply, contact Microsoft support immediately.
- [ ] **Week 4+:** With credit unlocked, you have more budget to test variants. Consider splitting the best-performing ad group into its own campaign with its own budget.

---

## When something goes wrong

| Symptom | Most likely cause | Fix |
|---|---|---|
| Impressions = 0 after 24 hours | Bid too low OR keywords too narrow | Raise max CPC 50%; check keyword status (some may be "low search volume") |
| Impressions high, CTR <0.5% | Ad copy doesn't match search intent OR keyword match types too broad | Check search terms report. Add negatives. Consider tighter ad copy. |
| CTR good, conversions = 0 | Landing page is broken OR UET event not firing | Walk through funnel manually with DevTools open. Most likely: the /#pricing bounce. |
| "Conversion goal inactive" after launch | UET pixel not firing or wrong event name | Verify with UET Tag Helper. Check `analytics.js` event names match exactly. |
| Credit didn't apply after £200 spend | Promo terms not met or not applied to account | Contact Microsoft Advertising support via in-account chat |
| Stripe checkout fails after Bing click | Unrelated to ads — check Stripe dashboard | This breaks the funnel regardless of traffic source |

---

## What I left undone (worth doing later, not blocking)

- **Offline conversion import from Stripe.** Bing supports importing server-side conversions for higher accuracy than the client-side pixel. Worth setting up if/when the trial scales beyond £600.
- **Remarketing audience.** Once the UET pixel has been firing for 2+ weeks, you'll have an audience you can remarket to (people who visited but didn't convert). Add as a v2 campaign.
- **Cookie consent banner.** Required if you enable Clarity AND want to be compliant with US state privacy laws. Not strictly blocking but worth doing.
- **Landing-page CTA fix.** Direct-to-modal instead of `/#pricing` bounce. Easy win for conversion rate.
- **Server-side rendering for /d/{slug} URLs.** Doesn't affect this campaign (we're not driving traffic there) but it's a longstanding SEO debt.
