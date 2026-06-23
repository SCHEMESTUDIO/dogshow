# Free-to-Enter Migration — Deploy & Prod-Action Checklist (2026-06-23)

Model change: **entering a dog is now free for everyone; money only buys bones.**
The $3.99 "Enter Your Dog" (`premium`) SKU is retired.

## New tier structure

| Tier | Price | SKU | What you get |
|------|-------|-----|--------------|
| Dog Fan | $0 | (none / anonymous) | Watch the show, no account |
| Dog Entry | $0 | `free` | Register, chat, **enter one dog**, certificate page, **50 bones** |
| Dog Entry Pro | $1.99 | `general` | Everything in Dog Entry **+ 250 bones** |
| Top Dog | $5.99 | `premium_plus` | Everything **+ 1,000 bones + slot booking + 3× stage time** |
| Bones Pack | $1.99 | `general` | +250 bones, repeatable, any account |

- Register grant: **50 bones** (was 250) — `BONES_ON_REGISTER` in `party/server.js`.
- Top Dog grants **+1000 bones** (`BONES_TOPDOG`), and is the **only** tier with slot booking / 3× duration (legacy $3.99 buyers keep their slot rights too).
- Best in Show is still decided by raw bones earned (per your call — lean into it). The cutest-dog-contest "anti-pay-to-vote" copy was rewritten to be honest about this.

## ⚠️ Deploy ORDER matters

1. **Run the legacy migration FIRST (prod), before the server deploy.**
   The `tier === 'general'` unlimited-bones bypass was removed in code. Any pre-2026-05-26 `general` account relies on that bypass until migrated. Run:
   `GET /admin-migrate-general?key=<ADMIN_KEY>&commit=1`
   (dry-run first without `&commit=1` to see the count). This converts them to `free` + 2500 bones so they don't hit zero when the bypass disappears.

2. **Archive the $3.99 Stripe price.** In the Stripe dashboard, archive `price_1TTMtiBOUqMOkBpQvxnJMu3e` (the `premium` $3.99 product) so it can't be hit. The code no longer references it. Confirm the $5.99 `premium_plus` price grants are what you expect (code now adds 1000 bones on that SKU).

3. **Deploy PartyKit** (server changes): from `party/`, `npm run deploy`, then `npm run check-deploy` to confirm prod matches HEAD.

4. **Deploy Vercel** (static + SSR `api/dog.js`, `api/breed.js`): push to the repo / trigger the Vercel deploy. Then eyeball the homepage pricing section and the show page (the new "➕ Get bones" button + low-balance pill weren't visually QC'd by me).

5. **Goodwill grant for legacy $3.99 buyers** (you approved emailing them more bones). New endpoint:
   `GET /admin-grant-goodwill?key=<ADMIN_KEY>&bones=1000&days=0` (dry-run) → add `&commit=1` to grant + email.
   - Grants `bones` (default 1000) once per legacy `paidSku === 'premium'` buyer (guarded by `goodwill:<userId>`).
   - Sends `sendBenefitsChangeEmail` — "we changed what each tier includes and you came out ahead, here are N bones." Their dog, certificate, and slot rights are preserved.
   - `days=0` = all legacy premium buyers; set e.g. `days=30` to limit to recent ones. Pick the bones number you want before committing.

## What changed in the repo (already done)

- **`party/server.js`**: `BONES_ON_REGISTER` 50; `BONES_TOPDOG` 1000; removed `general` unlimited bypass (2 spots); `/upload-dog` no longer premium-gated (any registered user, one dog); slot booking gated to Top Dog (`paidSku` premium_plus/legacy premium); `premium` removed from `priceMap` + verify-checkout + provisioning; admin tier labels; **bot FACTS prompt** updated; purchase-confirmation email now bones-centric; **new `/admin-grant-goodwill` endpoint + `sendBenefitsChangeEmail`**.
- **`index.html`**: pricing rebuilt to Dog Fan strip + 3 cards (Dog Entry free w/ struck $3.99, Dog Entry Pro $1.99, Top Dog $5.99); all "Enter Your Dog — $3.99" CTAs → Free; entry flow rewired from Stripe to free register; `?openModal=premium` now opens the free flow; slot picker shown only for Top Dog; FAQ + meta updated.
- **`show.html` + `app.js`**: upload UI ungated to any registered user; "➕ Get bones" button beside Give-a-bone; low-balance pill warning (≤10); rotator/upgrade-modal copy $3.99→free; register grant copy 250→50; slot only sent for Top Dog.
- **`success.html`, `terms.html`, `dogs.html`, `dog.html`, `login.html`, `api/dog.js`, `api/breed.js`**: copy/meta updated to free entry + 50-bone grant.
- **Sync set**: `llms.txt`, `brand-voice.md`, and the bot FACTS prompt all updated together.
- **7 SEO pages**: free-entry reframe; cutest-dog-contest anti-pay-to-vote rewrite.

## Known follow-ups / not done

- **"Limited time" framing**: the Dog Entry card shows struck `$3.99 → Free` with "Limited time." If free-to-enter is actually permanent, swap that copy so it isn't a standing fake-anchor (deceptive-pricing risk, esp. for the 65+ audience).
- **`CLAUDE.md`** "Pricing Tiers" + bones-model sections updated to the new model (done in this pass) — re-read if anything here drifts.
- **Stuck-paid-user audit** (`tier === 'premium'` filter, server ~line 3086) still flags Top Dog buyers who didn't upload. Upload is free now, so "paid but no dog" is less meaningful — consider retiring/retargeting that audit later. Low priority.
- **Visual QC**: the new show-page bone button + low-balance pill and the 3-card pricing grid weren't rendered/screenshotted — eyeball after the Vercel deploy.
