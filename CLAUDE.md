# dogshow.lol — Codebase Reference

## ⚠️ CRITICAL: DO NOT EDIT DogShowPrototype.jsx

DogShowPrototype.jsx is an OLD React prototype from early brainstorming. It is **NOT** the live site. The live site is **static HTML/CSS/JS** spread across multiple files listed below. If you need to make changes to the site, edit the HTML/CSS/JS files directly. Never treat DogShowPrototype.jsx as the codebase.

---

## Tech Stack

- **Frontend**: Multi-page static HTML/CSS/JS (no framework, no build step for the static pages; `api/og.tsx` is a TS/JSX Edge function compiled by Vercel via `tsconfig.json`)
- **Real-time**: PartyKit WebSocket — host: `dogshow.schemestudio.partykit.dev`, room: `dogshow-live`
- **Payments**: Stripe Checkout via PartyKit endpoint `/create-checkout`. Three SKUs (price IDs hard-coded in `party/server.js` `handleCreateCheckout`): `general` $1.99 bones top-up, `premium` $3.99 Enter Your Dog, `premium_plus` $5.99 Premium (2× bones launch bonus).
- **Hosting**: Vercel (migrated from GitHub Pages, 2026-05-22 — commits `a8ce1b0` + `c6185a6`). Repo `SCHEMESTUDIO/dogshow`, custom domain via CNAME. PartyKit hosts the real-time/API server; Vercel hosts the static files + the `api/dog.js` SSR function for `/d/{slug}` (audit #27) + the `api/og.tsx` Edge function for per-dog OG images. `vercel.json` defines `outputDirectory: "."` and rewrites: `/d/:slug` → `/api/dog?slug=:slug`, and `/:slug` → `/:slug.html` (clean URLs no longer require filename=URL since GH Pages no longer serves). `.vercelignore` excludes `party/`, `*.md`, `*.docx`, and `DogShowPrototype.jsx` so they don't ship to the public site. `package.json` declares a no-op `build` script so Vercel actually runs `npm install` (without one, install was sometimes skipped, leaving Edge functions unable to resolve `@vercel/og`).
- **Error tracking**: Sentry on both browser (loader injected by `analytics.js` on every page) and PartyKit server (DSN in `party/server.js`, `reportToSentry()` wraps the request dispatcher). Audit High-3. **Verify DNS / which host is actually live before asserting** — vercel.json is committed but the cutover to Vercel's edge network was not directly verified by this audit.
- **Chat LLM**: Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) powers the responsive `sir_barks_alot` chat bot. Requires `ANTHROPIC_API_KEY` in PartyKit env; feature is OFF if unset (bot falls back to canned messages like the others). See "Responsive Chat Bot" section below.
- **Analytics**: Google Analytics `G-V830P7PPHQ` + Faurya Analytics (website ID `cmosekmvz000xl204a7bhm4cm`)
- **Font**: Custom "Yang Bagus" (`YangBagus.ttf`)
- **Colors**: Dark purple bg (`#0f0a22` / `#1a1035`), orange accent (`#FF8C42`), purple accent (`#7B68EE`)
- **CSS vars**: Defined in `:root` in style.css (`--bg`, `--accent`, `--text-bright`, etc.)
- **Auth**: Magic-link via Resend (`POST /login` emails a one-time `loginUrl` carrying a 60-min `magic:` token; `login.html?token=...` exchanges it for a 30-day session token). localStorage stores `dogshow_token`, `dogshow_tier`, `dogshow_username`, `dogshow_fan_id`. **In-show signup** (added 2026-05-26): `show.html` has an inline `#registerOverlay` that takes name+email and registers instantly (no magic link round-trip) — used when an unregistered visitor tries to chat or send a bone.
- **Email compliance (CAN-SPAM)**: Every user-facing email goes through `unsubscribeFooter()` in `party/server.js` (~line 3236), which appends a one-click unsubscribe link (`GET /unsubscribe?u=<userId>&t=<token>`, token = first 16 hex of `SHA-256(userId + ':' + RESEND_API_KEY + ':unsub_v1')`) plus a physical mailing address (`222 Spaniel Dr, Morrisville, NC 27560, USA`, set in `ADDR_LINE`). `user.unsubscribed=true` is checked before sending marketing/recap mail. Footer added `543d478`; unsubscribe flow added `8651797`.

## Real Testimonials — Reply-by-Email + Admin Curation (added 2026-06-01)

The landing-page testimonial rail used to carry 3 fabricated quotes. Google policy forbids fake endorsements, so the rail is now driven by real, admin-approved testimonials sent in by owners after their dog airs.

**Flow:**
1. **Trigger** — when a community dog's `firstAppearedAt` flips from `null` to a timestamp (one of two spots in `advanceDog()` in `party/server.js`: the slot-fire path and the every-5th-dog rotation path), `maybeSendTestimonialRequest(dog)` fires as fire-and-forget. Guard key `testimonialRequest:<dogId>` is set in storage *before* the send so a transient failure can't cause a re-send the next time the dog airs. Already-aired dogs at deploy time are NOT backfilled — James asks the first 3-5 paid fans directly.
2. **Request email** — `sendTestimonialRequestEmail(email, dog)`, Wodehouse-genial tone, single ask. Subject embeds `[ref:TOK-xxxxxxxx]` where the token is `SHA-256(dogId + ':' + RESEND_API_KEY + ':testimonial_v1')` truncated to 12 hex (deterministic, unforgeable, no extra storage). `Reply-To` set to `INBOUND_REPLY_TO` env var (default `replies@dogshow.lol`). Respects `_isUnsubscribed`.
3. **Inbound webhook** — `POST /inbound-email?secret=<INBOUND_WEBHOOK_SECRET>`. Accepts a generic `{from, subject, text, html?}` JSON shape (works with Resend Inbound, Postmark, CloudMailin — anything that posts an inbound-email webhook). Fail-closed if env var is unset. `_resolveTestimonialDog()` matches the token in subject/body to a dog; `_stripQuotedReply()` removes quoted reply headers + `--` signatures + "Sent from my iPhone"; `_sanitizeTestimonialText()` strips HTML and caps at 280 chars. Stored as `status: 'pending'`. Triggers an admin alert to James.
4. **Admin moderation** — `admin.html` renders pending testimonials with an editable textarea + Approve/Reject buttons. Manual-add form lets James paste a testimonial directly for a specific dog (default status `approved`) — used both as fallback for parsing misses AND to seed the first 3-5 testimonials before inbound is wired.
5. **Public read** — `GET /testimonials` (5-min `Cache-Control`) returns approved entries; `index.html` fetches on load. **Both the top-of-page ticker AND the in-page testimonials section are gated behind ≥3 approved testimonials** (raised from 1 → 3 on 2026-06-02 in `50fbe34` — a single quote felt thinner than no quote). Until then both stay `display: none`. Cap rendered cards at 6 on the in-page rail.

**Storage:** single key `testimonials` = array of `{id, dogId, slug, dogName, username, email, text, receivedAt, status, moderatedAt?, source: 'reply'|'manual', original?, rawSubject?}`.

**Env vars required for full inbound flow:**
- `INBOUND_WEBHOOK_SECRET` — gates `/inbound-email` (fail-closed without it)
- `INBOUND_REPLY_TO` — Reply-To address shown to recipients (e.g., `replies@dogshow.lol`)
- A provider that routes inbound email at `replies@dogshow.lol` to a POST against `https://dogshow.schemestudio.partykit.dev/party/dogshow-live/inbound-email?secret=<INBOUND_WEBHOOK_SECRET>`. Resend Inbound is the natural pick since Resend already handles outbound — verify it's on the plan + set up MX records as Resend instructs. Postmark/CloudMailin work equivalently.

**Without inbound configured**: outbound request emails still fire after `firstAppearedAt`. Replies just land in whatever mailbox `replies@dogshow.lol` resolves to (or bounce). James can copy/paste into the admin manual-add form. The system is usable in this degraded mode — exactly how the first 3-5 testimonials will be seeded.

**Email redesign (2026-06-03, `9e0222b`)**: `sendTestimonialRequestEmail` was rebuilt CTA-first — a prominent orange "Reply with a review" button (`mailto:` link with URL-encoded subject preserving the `[ref:TOK-xxxxxxxx]` token) is now the visual focus, followed by the ask copy. The plain-reply path still works for anyone who ignores the button.

## Bones-as-Currency Model (added 2026-05-26, commit `395b1e3`)

The pricing model shifted on 2026-05-26 from "tier unlocks features forever" to "registered users get a finite bones balance; paid SKUs top it up." Constants live at the top of `party/server.js`:

- `BONES_ON_REGISTER = 250` — free signup grant
- `BONES_PER_TOPUP = 250` — $1.99 "general" SKU adds this many bones (no longer unlimited)
- `BONES_LEGACY_GRANDFATHER = 2500` — one-shot grant given to pre-cutover 'general' users when the migration runs
- `SLOT_DURATION_MULTIPLIER = 3` — booked $3.99 BYD dogs get 3× the normal 10s on-stage time when their slot fires

**Server-side enforcement:** the WebSocket `bone` handler (`party/server.js` ~line 386) reads the connection's authed user, refuses if `bones <= 0` (sends `{type:'needTopUp'}` to the sender), otherwise decrements and persists. Legacy `tier === 'general'` users are bypassed (unlimited) until `/admin-migrate-general` runs and downgrades them to `tier='free'` with `bones = max(current, 2500)` and `paidSku='general'` retained.

**Client-side:** `app.js` listens for `boneBalance` (sync) and `needTopUp` (out-of-bones) WebSocket messages and updates the on-screen bone pill. `/my-dog` and `/get-user` both return the authoritative `bones` field so the show page can render the balance immediately on load without waiting for the first WebSocket message.

## Slot Booking + Pre-Show Pages (added 2026-05-26, commit `395b1e3`)

Premium ($3.99) and Premium+ ($5.99) BYD buyers can now choose **"Show me right away"** or **"Schedule it for later"** during upload. A scheduled slot is persisted as `dog.slotAt` (ms timestamp). When a slot fires, the server interrupts the current rotation to put the booked dog on stage for `SLOT_DURATION_MULTIPLIER × baseDuration`. Slots that miss their grace window are skipped (the dog re-enters the normal rotation).

Per-dog certificate pages at `/d/{slug}` are now **state-aware** (rendered by `api/dog.js`):

- `firstAppearedAt === null` → **pre-show**: countdown + RSVP form. Fans drop an email and get a 1hr + 5min reminder before the slot fires. `POST /rsvp` registers them as `tier='free'` with 250 bones, records `{email, userId, rsvpAt, sent1h:false, sent5m:false}` on the dog, and re-arms the storage alarm.
- `firstAppearedAt !== null` → **post-show certificate** (the existing certificate flow — titles, stats, share buttons, more dogs).

The daily reconciliation alarm was generalized into `computeNextWakeupAt()` + `scheduleNextWakeup()` so the same alarm now drives both the 24h audit AND the per-RSVP T-60min / T-5min reminder emails (`processSlotReminders()`).

## Responsive Chat Bot (added 2026-05-27)

One bot in the chat room — `sir_barks_alot` — can react to real user messages via a **Claude Haiku 4.5** call (`claude-haiku-4-5-20251001`). The other 14 bots in `BOTS` (`party/server.js`) remain fully canned (fixed message pool, cycled by the existing scheduler). The responsive path only fires when a real user posts a chat message and a stack of gates passes; SKIP convention lets the model stay silent for off-topic / hostile / injection attempts.

**Feature gate:** OFF unless `ANTHROPIC_API_KEY` is set in PartyKit env (`npx partykit env add ANTHROPIC_API_KEY` from the `party/` dir). Without the key, sir_barks_alot behaves exactly like the other canned bots.

**Always-present seeding:** when LLM mode is on, `startBot()` force-seeds sir_barks_alot into `activeBots` before any other seeding runs, and the random join/leave randomizer filters him out of leave candidates. Without LLM mode, he obeys the same random join/leave as every other bot. Helper: `responsiveBotEnabled()`.

**Trigger conditions** (gates in order, cheapest first — all live at the top of `party/server.js`):
1. `ANTHROPIC_API_KEY` present (kill switch by absence)
2. No call in-flight for this room (`barksInflight` mutex)
3. UX cooldown — `RESPONSIVE_BOT_MIN_REPLY_GAP_MS` (6s) since his last reply
4. Probabilistic roll — `RESPONSIVE_BOT_REPLY_PROB` (40%)
5. Per-room hourly cap — `RESPONSIVE_BOT_MAX_CALLS_PER_HOUR` (60), sliding window on `barksApiCallTimestamps`
6. Recent context must contain ≥1 non-bot message (prevents bot-to-bot loops)

**API call:** last `RESPONSIVE_BOT_CONTEXT_WINDOW` (8) chat messages formatted as `user: text` lines, sent as the single user-turn payload with `RESPONSIVE_BOT_SYSTEM_PROMPT` as system. `max_tokens: 60` (sized for the 2–20 word reply range). Output is run through `this.sanitize()` and capped at 200 chars, same path as user chat. If the model outputs `SKIP` (any case, with trailing punctuation), nothing is broadcast.

**Persona prompt** locks the bot to a warm, charming English-country-manor-host voice (Wodehouse-genial, not snobbish-critic) at 2–20 word fragments, framed as a fellow power-user viewer rather than a staffer. Three rule blocks: (1) **content guardrails** — no slurs, no profanity, no insult/flame/rant; non-positive sentiment allowed only when phrased with warmth ("not my favorite, but charming") or else SKIP; (2) **character guardrails** — standard jailbreak resistance (ignore-prior-instructions, persona-change, model-reveal, recite-poem, switch-language, no-bot-disclosure all explicit), plus an "you are not a Dog Show employee" rule; (3) **product talk** — hard no on unprompted marketing/pitching/upgrade-talk, narrow permission to answer DIRECT product questions briefly in character using a small embedded **FACTS YOU KNOW AS A REGULAR** list (prices: $1.99/$3.99/$5.99; bones: 250 on register, 250 per top-up, ~500ms per bone capped at 15s bonus/dog; rotation: ~10s base, ~30s for scheduled slots; one dog per account). Anything outside that list, the bot is instructed to defer in character or SKIP rather than invent. Not defended in prompt: encoded payloads (base64/leetspeak) and indirect framing attacks; relies on Haiku's training there. Blast radius is small — only output channel is a chat message ≤200 chars.

> **⚠️ Maintenance burden:** the FACTS block in `RESPONSIVE_BOT_SYSTEM_PROMPT` hardcodes prices and mechanics. **Whenever you change a price, the bones-per-X math, the rotation duration, the slot multiplier, or the one-dog-per-account rule, you MUST also update this prompt.** The bot will otherwise tell users wrong numbers with full confidence. Premium-plus bones figure is intentionally left vague in the prompt because the implementation ("floor to 1000") doesn't match the marketing copy ("2× launch bonus") — fix the alignment before hardcoding a number.

**Cost ceiling:** worst case 60 calls/hour/room × ~$0.0005/call ≈ $0.03/hour/room. Realistic with the 30% trigger + 8s cooldown is closer to $0.003–0.01/hour/room.

**Failure handling:** API errors are caught in `maybeBarksReply`, logged, reported to Sentry via `reportToSentry()`, and the user's original chat is unaffected — the LLM call is fire-and-forget from the chat handler.

## File Map

### Pages (the actual live site)

| File | Lines | Purpose |
|------|-------|---------|
| `index.html` | ~2435 | Landing/sales page. Hero, pricing tiers (Free / $1.99 / $3.99 / $5.99), testimonials, FAQ, email modal, Stripe checkout flow, curtain animation. Inline `<style>` block with `.lp-*` classes. JS at bottom. Loads `breeds.js` for the pre-purchase breed dropdown (#48). **Upload modal now includes a "When should they go on stage?" picker** (now vs scheduled date/time) — selected `slotAt` is stashed in `localStorage` as `dogshow_pending_dog_slot` and forwarded to `/upload-dog` after Stripe success. Modal has `max-height: calc(100dvh - 48px)` + `overflow-y: auto` (2026-05-27 `3f0aa22`) so Continue/Cancel stay reachable on short viewports — on mobile, once a photo is loaded the dropzone shrinks from 3/2 → 16/9 to keep the slot picker + actions above the fold. The old bridge interstitial (confirmation card between upload modal and Stripe) was dropped 2026-05-26 (`b6dddd8`) as redundant. `pendingDogTier` defaults to `'premium'`; the Premium button overrides to `'premium_plus'`. **Top-of-page ticker (`#tickerWrap`) is fed from `/testimonials`** (commit `0a51bca`, 2026-06-01); both the ticker AND a new in-page testimonials section (`#lpTestimonialsSection`) are gated behind ≥3 approved testimonials (raised from 1+ on 2026-06-02 in `50fbe34`) and stay `display:none` until then. **Landing section order reshuffled 2026-06-02 (`50fbe34`)**: Hero → Ticker → How It Works → Product Preview → Certificate Preview → Testimonials → Why Enter → Pricing → FAQ → Footer. Hero bullet list removed in the same commit. Schema.org `publisher.url` and footer link to Scheme Studio updated to `https://www.schemestudio.lol` (`2e3613f`, 2026-06-01). |
| `show.html` | ~321 | Live show page. Stage → header row (nameplate + bones cluster) → paid-user row (upload/status) → breed fact → house rotator (real CTA + fake-door cards) → chat → share rail → leaderboard. Bottom dock dissolved 2026-05-18; bones cluster now lives next to nameplate. **BONE FRENZY badge** is back as a pure-visual text overlay (`.dock-frenzy-badge#boneFrenzy`, re-added 2026-05-28 `8651797`) — no multiplier text, just the "BONE FRENZY" label toggled by an `.active` class. **Inline registration modal** (`#registerOverlay`, added 2026-05-26) — unregistered users who try to chat or send bones get a name+email instant-signup (no magic link) → 250 bones → unlocked UI. Desktop: two-column Twitch-style layout (stage ~60% + chat 300px side-by-side) with two-column leaderboard. Includes interest-capture modal, dog details modal. Footer with Home/About/Privacy/Terms links added 2026-05-28 (committed in `9a0e8cd`, 2026-05-29). Loads `breeds.js` then `app.js`. |
| `app.js` | ~1966 | Show page JS (IIFE). PartyKit WebSocket, dog slideshow sync, live chat, bone reactions, community upload (canvas resize 600px JPEG 0.7) via shared `submitDogImage()` — also auto-submits a pre-purchase photo stashed in `localStorage` (incl. optional `dogshow_pending_dog_slot`) on show entry, breed facts DB, leaderboard, share rail. **Frenzy is pure-visual:** `updateStreak()` only toggles the `.active` class via a 3 bps → on / 1.5 bps → off hysteresis; `playFrenzyVoice()` plays `/sounds/bone-frenzy.m4a` on each trigger (browser speech synthesis fallback if the audio file fails). **Inline register modal** (`showRegisterModal(context)`, 2026-05-26) replaces the old upgrade modal for unregistered users — context `'bone'` vs `'chat'` swaps the title/subtitle. **Bones balance:** listens for `boneBalance` (sync) and `needTopUp` (out-of-bones) WebSocket messages and shows a top-up modal when empty. **House rotator** (multi-message, rotating; $3.99 entry CTA + $1.99 bones top-up card + fake doors including the "funny music video of your dog" card added 2026-05-28 `69c28e0`). Each card can carry `excludeForTiers` and `requiresRegistered` flags — bones-top-up card hidden for unregistered users. **Interest modal** captures fake-door emails via `/register` with `tier='interest_<feature>'`. Breed dropdown options come from `window.DOG_BREEDS` (breeds.js). |
| `style.css` | ~2648 | Shared stylesheet. CSS vars, font-face, all page styles, responsive breakpoints, upgrade modal CSS, slot picker (.lp-slot-*), bones pill. New mobile layout components (.stage-header-row, .bones-cluster, .paid-user-row, .house-rotator, .interest-modal) live near the bottom. |
| `analytics.js` | ~128 | Sitewide scaffold: injects the **Sentry browser loader** (audit High-3) on every page, then Bing UET (live since 2026-05-28 `1621f41`, tag id `97248525`, endpoint `bat.bing.net`) + Microsoft Clarity (still gated — `CLARITY_ID` is empty). Exports `window.trackEmailCapture` / `window.trackPurchase`. Loaded on all main pages. |
| `breeds.js` | ~133 | Shared dog-breed list (`window.DOG_BREEDS`) for the upload picker. Loaded by `show.html` (in-show upload) and `index.html` (pre-purchase upload). Audit #48 fix — owner picks the breed themselves, so the AI can never mislabel a dog. "Mixed Breed" pinned first, "Other / Not sure" last. **Extended 2026-05-29** with ~25 designer-mix + size-variant breeds (Bernedoodle, Goldendoodle, Cockapoo, Mini Aussie, Mini Golden Retriever, Saint Berdoodle, etc.) to give SEO breed-hub pages real user-upload coverage. See `seo-breed-hub-plan.md`. |
| `breeds.html` | ~149 | **Breed hub index** (added 2026-05-29). Lists `/breeds/{slug}` hub pages grouped by Doodles & designer mixes / Size variants / Working / Companions. **6 breeds Live** (Bernedoodle, Goldendoodle, Saint Berdoodle, Pomsky, Mini Golden Retriever, Mini Aussie); the rest are "Soon" placeholders until per-breed content is written. Brand voice (Wodehouse-genial host). Served by the existing `/:slug → /:slug.html` rewrite. |
| `success.html` | ~472 | Post-Stripe payment. Calls `/verify-checkout` (carrying the Stripe `session_id`) to provision the paid user, then celebration page with dog preview + share buttons (FB/X/WhatsApp/copy). No auto-redirect. |
| `dog.html` | ~892 | Individual dog certificate (client-rendered). Stats, SEO content, Schema.org structured data, share buttons, "More Dogs" section. Mobile-responsive. **Note**: under Vercel, `/d/{slug}` is handled by `api/dog.js` (SSR) instead; this file is now only used if someone hits `dog.html?id=…` directly. |
| `dogs.html` | ~472 | All Dogs gallery. Search, sort, dog cards, aggregate stats, founding-dogs CTA empty state. |
| `about.html` | ~243 | About page + contact (james@wearescheme.studio). Contact-method grid switched from fixed `1fr 1fr` + 480px breakpoint to `repeat(auto-fit, minmax(240px, 1fr))` (2026-06-02) so the long `james@wearescheme.studio` address no longer overflows in the 480–600px viewport band. |
| `login.html` | ~132 | Magic-link login page. Submits email → `POST /login` (PartyKit emails a magic link). When loaded with `?token=…`, exchanges the magic token for a 30-day session token via `POST /verify`. |
| `privacy.html` | ~358 | **Privacy policy** (added 2026-05-28, committed `9a0e8cd` on 2026-05-29). What we collect, who we share it with, how to request deletion. Clean URL `/privacy` via Vercel rewrite. |
| `terms.html` | ~403 | **Terms of Service** (added 2026-05-28, committed `9a0e8cd` on 2026-05-29). Rules for use, pricing, refunds, dog upload rights. Clean URL `/terms` via Vercel rewrite. |
| `admin.html` | ~743 | Password-gated admin CMS — audit-tier dashboard, community-dog moderation, testimonial moderation (added 2026-06-01, `e7ab7ed`), **and stuck-paid-user resolve flow** (added 2026-06-03, `9e0222b`). Calls `/admin-audit` (tier counts + active stuck premium users + resolved-follow-up history), `/admin-resolve-stuck` + `/admin-unresolve-stuck` (mark a row handled / undo), `/admin-delete-dog` (remove non-dog upload), `/admin-testimonials`, `/admin-testimonial-action`, `/admin-add-testimonial`. Resolved follow-ups render in a collapsed `<details>` pane beneath the active list — Zendesk-style ticket history kept forever in storage. Auth = `ADMIN_KEY` typed into the login box (not stored server-side beyond the env var). `meta robots = noindex,nofollow`; also Disallowed in `robots.txt`. |
| `d.html` | ~42 | **Legacy** slug router (`/d/slug-name` → `/dog.html?slug=slug-name`) — superseded by the Vercel rewrite to `api/dog.js` for true SSR. Kept for now as a fallback if Vercel rewrites are misconfigured or if a non-Vercel host is reintroduced. |
| `404.html` | ~31 | Custom 404 page. Pre-Vercel it also doubled as a SPA router for `/d/{slug}` (JS redirect on the 404 page). Under Vercel, `/d/{slug}` is now handled by `api/dog.js` and is server-rendered with real content, so dog pages ARE indexable — sitemap omission may now be unnecessary; re-evaluate before adding. |

### SEO landing pages (added 2026-05-07)

| File | Lines | Clean URL | Purpose |
|------|-------|-----------|---------|
| `dog-photo-contest.html` | ~1141 | `/dog-photo-contest` | "Dog photo contest" SEO landing, funnels to $3.99 BYD tier. Renamed from `contest.html` on 2026-05-14 — GH Pages doesn't honor `_redirects`, so filename must match the clean URL. |
| `puppy-picture-contest.html` | ~588 | `/puppy-picture-contest` | "Puppy picture contest" SEO landing |
| `dog-show-near-me.html` | ~646 | `/dog-show-near-me` | "Dog show near me" SEO landing, reframes to live online show |
| `cutest-dog-contest.html` | ~686 | `/cutest-dog-contest` | "Cutest dog contest" SEO landing (added 2026-05-14). Targets the cutest cluster (~990/mo). Positioning: no judges, every dog is the cutest. Pay-to-vote critique vs The Dog Show. |
| `generate-sitemap.html` | ~56 | (utility) | Local utility — fetches all-dogs from PartyKit, outputs sitemap.xml |

### Non-page files

| File | Purpose |
|------|---------|
| `DogShowPrototype.jsx` | ⚠️ OLD prototype. Do NOT edit. Not deployed (also `.vercelignore`d). |
| `dogshow-architecture.docx` | Early architecture planning doc |
| `dogshow-seo-strategy.docx`, `dogshow-seo-strategy-v2.docx` | SEO planning docs |
| `Claude Project Memory - Best Practices.md` | Notes on memory file conventions |
| `bing-campaign-prep.md` | Bing Ads prep doc — keywords, ad copy, negatives, bid strategy, kill criteria. Source-of-truth for the £200→£600 promo trial. |
| `bing-launch-checklist.md` | Step-by-step actions for James inside the Microsoft Ads UI. Companion to `bing-campaign-prep.md`. **UET tag was wired live 2026-05-28** (`1621f41`, tag `97248525`). |
| `seo-breed-hub-plan.md` | Planning doc (added 2026-05-28). `/breeds/{slug}` hub built off lowfruits export. Tier-1 scope of ~30 breed-info targets (~500K combined volume); requires expanding `breeds.js` to cover designer-mix breeds (Bernedoodle, Cavapoo, etc.) before the unique-value pitch holds. Not yet greenlit / no code shipped. |
| `sounds/` | Audio assets. `bone-frenzy.m4a` — voice clip played by `app.js` when frenzy triggers (added 2026-05-28 `8651797`). |
| `platform-audit.md` | Pre-paid-traffic reliability audit (generated 2026-05-19). 6 Critical / 7 High / 6 Medium / 3 Low findings — silent failure modes, 2 security gaps allowing free tier upgrades, near-zero observability. The 6 Critical fixes shipped 2026-05-21 (`535deb6`); subsequent commits cleared more findings: #37 pre-purchase photo (`3cbe942`), High-2 rate limiting + crypto tokens + magic-link UX + welcome email (`7ecf996`), #40 admin CMS (`3404ab7`), #38 AI classifier (`15e64ef`), #48 user-selected breed (`e26ca57`), High-3 Sentry (`08bd136`), #27 per-dog SSR via Vercel (`a8ce1b0` + `c6185a6`), and #37/Anonymous/cert-email/stale-image cleanup (`086b359`). Later commits (post-audit, 2026-05-25 → 2026-05-28): OG-image font + per-dog dynamic OG + bridge-interstitial removal (`b6dddd8`), Vercel install/output/tsconfig fixes (`dc89bc5`, `e0a3e52`, `ced94f6`), bones-as-currency + slot booking + pre-show cert pages (`395b1e3`), rotator card visibility for unregistered users (`f1957d5`), frenzy UI stripped to pure-visual (`b97ed01`), modal scrolls on short viewports + softened post-purchase email copy (`3f0aa22`), CAN-SPAM physical address in email footer (`543d478`), BONE FRENZY badge + bone-frenzy.m4a sound + unsubscribe footer (`8651797`), funny-video fake-door card (`69c28e0`), UET tag wired live (`1621f41`), Privacy + Terms pages + sitewide footer (`9a0e8cd`, closes CAN-SPAM / app-store legal-requirement gap), SEO breed hub P0 + Bernedoodle pilot (`47107b8`), 5 more breed pages — Goldendoodle, Mini Golden Retriever, Saint Berdoodle, Mini Aussie, Pomsky (`bebc51e`). 2026-06-01: real testimonials reply-by-email + admin curation (`e7ab7ed`), ticker driven by `/testimonials` with fake quotes removed (`0a51bca`), Scheme Studio links unified on `www.schemestudio.lol` across about/index/privacy/terms (`2e3613f`). 2026-06-02: landing-page section reorder + raise testimonial gate from 1 → 3 approved (`50fbe34`). 2026-06-03: testimonial-request email rebuilt CTA-first + stuck-paid-user resolve/unresolve flow with `stuckResolutions` storage + admin weekly summary throttle (`9e0222b`). |
| `CNAME` | Domain: `dogshow.lol` |
| `vercel.json` | Vercel rewrites: `/d/:slug` → `/api/dog?slug=:slug` (SSR), `/breeds/:slug` → `/api/breed?slug=:slug` (SSR, added 2026-05-29), and `/:slug` → `/:slug.html` (clean URLs — also serves `/breeds` → `breeds.html`). Order matters — specific routes before the catch-all. Also sets `outputDirectory: "."` so Vercel doesn't expect a `public/` build dir (`e0a3e52`). |
| `.vercelignore` | Excludes `party/`, `*.md`, `*.docx`, `DogShowPrototype.jsx` from the Vercel deployment (also closes the prior GH-Pages leak of internal docs). |
| `tsconfig.json` | TypeScript/JSX compiler options for `api/og.tsx` (added `ced94f6` so Vercel can compile the Edge function's JSX). `include: ["api/**/*"]`. |
| `_redirects` | Legacy Netlify/Vercel redirect file — superseded by `vercel.json`. Kept in repo but not the source of truth. |
| `robots.txt` | SEO crawl rules. Disallows `/admin` + `/admin.html`. Sitemap pointer included. |
| `sitemap.xml` | Static sitemap (regenerate via `generate-sitemap.html`). Includes main pages + 4 SEO landing pages + `/breeds` index + the 6 live `/breeds/{slug}` hub pages. |
| `YangBagus.ttf` | Custom font |
| `og-image.png` | Open Graph / Twitter Card share image (1200x630). Generated 2026-05-18 with Python+PIL via `make-og-image.py` — wordmark in Yang Bagus + theatre proscenium framing. Referenced by all main HTML pages. Swap with a designer version anytime — no code change required. |
| `make-og-image.py` | Python+PIL generator script for `og-image.png`. Run `python3 make-og-image.py` from repo root to regenerate. Only "The Dog Show" wordmark uses Yang Bagus; supporting text falls back to DejaVu Sans for portability. Per-dog share previews use `api/og.tsx` (Edge function) instead — same brand language, different generator. |
| `favicon.svg` + PNG variants | Favicons |
| `party/` | PartyKit server code — single `server.js` (~4328 lines, one class), has its own node_modules. NOT deployed to Vercel (`.vercelignore`). Growth since 2026-05-29 driven by the testimonial reply-by-email + admin curation flow (`e7ab7ed`) and the stuck-user resolve flow + weekly summary throttle (`9e0222b`). |
| `api/dog.js` | Vercel serverless function (~522 lines). Server-renders `/d/{slug}` with two states: **pre-show** (countdown + RSVP form for dogs with `firstAppearedAt === null`) and **post-show certificate** (existing flow with titles, stats, share, more dogs). Fetches dog data from PartyKit (`/dog-meta`, `/dog-stats`). Sitewide footer (Home/About/Privacy/Terms) added 2026-05-29 (`9a0e8cd`). Resolves audit #27. |
| `api/breed.js` | **Vercel serverless function** (added 2026-05-29, ~557 lines). Server-renders `/breeds/{slug}` breed hub pages. Template anatomy: lede → live-show widget → spotlight (show-ring lens) → facts dl → owner-fit → famous → bonus user-dogs section (hidden when N=0, fetched from PartyKit `/dogs-by-breed`) → CTA → related breeds → footer. Content embedded in the `BREEDS` object — **6 P1 breeds live** as of 2026-05-29 (`bebc51e`): bernedoodle, goldendoodle, mini-golden-retriever, saint-berdoodle, mini-aussie, pomsky (~1050 visible words each). Bernedoodle is the voice/structure template; clone for remaining ~13 P1 breeds. `renderRelatedHtml()` emits an `<a>` for related breeds whose slug exists in `BREEDS` and a muted "Soon" `<span>` chip otherwise — prevents internal 404s from inter-breed links. Schema.org `Article` + `BreadcrumbList`. Brand voice throughout — see [[feedback-seo-pages-brand-voice]]. Pages must work without user dogs of that breed — see [[feedback-breed-pages-no-user-dog-dependency]]. |
| `api/og.tsx` | Vercel Edge function (~203 lines). Generates a 1200x630 (1.91:1 — Facebook/Twitter/LinkedIn optimal) per-dog share image at `/api/og?slug={slug}`. Composites the dog's photo into a branded frame so share previews don't get cropped weirdly. `api/dog.js` sets `og:image` / `twitter:image` to point at this. Uses `@vercel/og` (declared in `package.json`). |
| `package.json` | Declares Vercel function dependencies (`@vercel/og`, `react`). Includes a no-op `build` script — needed because without one, Vercel sometimes skips `npm install`, which leaves the Edge function unable to resolve `@vercel/og` (`dc89bc5`). |

## API Endpoints (PartyKit)

Base: `dogshow.schemestudio.partykit.dev/party/dogshow-live` (PartyKit single-party default; app.js uses `/party/{room}`, not `/parties/{name}/{room}`)

> **Rate limiting (audit High-2):** Per-IP sliding-window limiter on the abuse-prone POST endpoints — `register` 5/min, `login` 5/min, `create-checkout` 5/min, `verify-checkout` 10/min, `upload-dog` 5/min. Excess returns HTTP 429. Defined inline at the top of the dispatcher in `party/server.js`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/landing-stats` | Stats for landing page (bones, fans, dogs, watching) |
| POST | `/register` | Register a free signup or interest-capture lead → returns token. **Rejects `general`/`premium` (403)** — paid tiers must go through `/verify-checkout`. Sends a welcome email via Resend on first signup (audit hardening, `7ecf996`). |
| POST | `/login` | **Magic-link request** (renamed in behavior). Takes `{email}`, generates a 60-min `magic:<token>` storage entry, emails the user a `login.html?token=…` link via Resend. Always returns a generic success message (does not leak whether the email is registered). |
| POST | `/verify` | Verify a session token OR consume a magic-link token. Magic tokens are single-use with a short 2-min grace window for double-clicks; on success it issues a 30-day session token. |
| POST | `/get-user` | Get user data by token |
| POST | `/my-dog` | Returns the caller's real (server-side) tier, their dog `{id,slug,dogName}` if any, and the authoritative `bones` balance. The show page calls this on entry so a returning premium user who already uploaded sees a "view your certificate" link, a refunded/free account doesn't see the upload UI, and the bones pill can render immediately. |
| POST | `/set-username` | Set username for current user |
| POST | `/create-checkout` | Create Stripe checkout session. `success_url` carries `{CHECKOUT_SESSION_ID}` + `metadata[tier]`. Three valid tiers: `general` ($1.99 bones top-up), `premium` ($3.99 Enter Your Dog), `premium_plus` ($5.99 Premium — 2× bones launch bonus). Price IDs are hard-coded in `priceMap`. |
| POST | `/verify-checkout` | Verify a completed Stripe Checkout Session server-side (payment_status=paid), then provision the paid user. **Only path that can grant general/premium/premium_plus.** tier+email read from Stripe, never the client. |
| POST | `/rsvp` | Phase 4 pre-show pages. Body: `{email, dogId, slug?}`. Validates the dog exists + is still pre-air, auto-registers the email as a free user (250 bones), records `{email, userId, rsvpAt, sent1h:false, sent5m:false}` on the dog, and re-arms the storage alarm. Returns the user's session token + bones so the client can transition into the show. Special return shapes: `alreadyAired: true` (dog has aired), `airingNow: true` (slot passed but within grace window). |
| POST | `/stripe-webhook` | Stripe webhook. HMAC-verified via `STRIPE_WEBHOOK_SECRET`. Handles `charge.refunded` (→ downgrade to free) + `charge.dispute.created` (→ flag user). |
| POST | `/upload-dog` | Upload community dog (premium only). Body now includes optional `slotAt` — server validates it's a future timestamp and stores it on the dog (the booked slot triggers precision interruption of the rotation when due, with 3× duration). Runs AI dog classification via the **Cloudflare AI REST API** (`@cf/microsoft/resnet-50`, fix `15e64ef` — replaced the previous Workers AI binding that wasn't bound in production): rejects non-dogs, else records confidence. **Fails open** — accepts as "Mystery Breed" if the AI errors or is unavailable. Breed comes from the uploader's dropdown pick (#48); `username` is passed so the dog is never created "Anonymous". **One dog per account** — a 2nd upload returns 409 `already_have_dog` with the existing dog's slug; bypassable by passing `adminKey` (=`ADMIN_KEY`). Sends the certificate email (dog photo + `/d/{slug}` link) on success. Error responses include a `code` field for client-side observability. |
| GET | `/community-image?id=X` | Fetch uploaded community dog image |
| GET | `/community-count` | Count of community-uploaded dogs |
| GET | `/dog-stats?id=X` | Individual dog stats |
| GET | `/dog-meta?slug=X` | Per-dog OG/meta tags for share crawlers |
| GET | `/show-meta` | OG/meta tags for show share rail |
| GET | `/resolve-slug?slug=X` | Resolve slug to dog ID |
| GET | `/all-dogs` | All dogs for gallery |
| GET | `/dogs-by-breed?breed=X[&limit=Y]` | **Added 2026-05-29.** Returns dogs whose `breed` matches (case-insensitive) and have aired (`firstAppearedAt` set), sorted by `totalBones` desc, capped at min(limit, 24), default 12. Consumed by `api/breed.js` for the bonus user-dogs section on `/breeds/{slug}` pages. Endpoint exists in `party/server.js` but **requires `npx partykit deploy` from `party/` to go live**; until then `api/breed.js` falls through to no user-dogs section. |
| GET | `/leaderboard` | Top dogs + recent arrivals |
| GET | `/admin-audit?key=X` | Admin audit — tier counts, **active** stuck premium users (paid but no dog entry, minus anything in `stuckResolutions`), `resolvedPremium` history, and orphaned `img:`/`slug:` storage keys. Requires `ADMIN_KEY`. Logic shared with the reconciliation alarm via `computeAudit()`. Consumed by `admin.html`. |
| POST | `/admin-resolve-stuck` | **Added 2026-06-03 (`9e0222b`).** Body `{key, userId, note?}`. Marks a stuck paid user as handled — drops them from the active worklist + future weekly summary emails. Resolution row is kept forever in `stuckResolutions` (Zendesk-style ticket close). Requires `ADMIN_KEY`. |
| POST | `/admin-unresolve-stuck` | **Added 2026-06-03 (`9e0222b`).** Body `{key, userId}`. Reverses a resolution — removes the row from `stuckResolutions` so the user reappears in the active list on next audit. Requires `ADMIN_KEY`. |
| GET | `/admin-delete-dog?key=X&id=Y` | Admin — remove a community dog (its `communityDogs` entry + `img:`/`slug:` keys). For pulling non-dog uploads. Requires `ADMIN_KEY`. Consumed by `admin.html`. |
| GET | `/admin-migrate-general?key=X&commit=1` | One-shot Phase 6 migration. Walks the user keyspace; for each `tier === 'general'` (legacy pre-2026-05-26 unlimited-bones purchaser): sets `tier='free'`, `bones = max(current, 2500)`, preserves `paidSku='general'`. **Dry-run by default**; pass `commit=1` to actually write. After this runs cleanly, the WebSocket bone handler's `tier === 'general'` bypass can be removed in a follow-up. Requires `ADMIN_KEY`. |
| GET | `/admin-ai-test?key=X` | Throwaway diagnostic — probes the Cloudflare AI REST endpoint and runs resnet-50 on a known dog image. Used to verify the classifier (audit #38). Safe to delete now that the classifier fix shipped (`15e64ef`). Requires `ADMIN_KEY`. |
| GET | `/admin-sentry-test?key=X` | Throwaway diagnostic — emits a test event through `reportToSentry()` to confirm server-side error reporting works end-to-end (audit High-3). Safe to delete after smoke-testing. Requires `ADMIN_KEY`. |
| GET | `/unsubscribe?u=X&t=Y` | One-click unsubscribe for marketing/recap emails (CAN-SPAM). Token = first 16 hex chars of `SHA-256(userId + ':' + RESEND_API_KEY + ':unsub_v1')` — unforgeable, deterministic, no extra storage. Sets `user.unsubscribed=true` (idempotent), returns a small HTML confirmation page. |
| GET | `/testimonials` | **Added 2026-06-01.** Public — approved testimonials for the landing-page rail. `Cache-Control: public, max-age=300`. Returns `{ok, testimonials: [{id, text, username, dogName, slug}]}`. |
| POST | `/inbound-email?secret=X` | **Added 2026-06-01.** Generic inbound-email webhook (Resend Inbound / Postmark / CloudMailin shape: `{from, subject, text, html?}`). Parses `[ref:TOK-xxxxxxxx]` token in subject/body to match a dog, strips quoted reply + signatures, sanitizes to ≤280 chars, stores as pending testimonial, alerts James. **Fail-closed**: 403 if `INBOUND_WEBHOOK_SECRET` unset. |
| GET | `/admin-testimonials?key=X` | **Added 2026-06-01.** Returns `{pending, approved, rejected}` arrays. Requires `ADMIN_KEY`. Consumed by `admin.html`. |
| POST | `/admin-testimonial-action` | **Added 2026-06-01.** Body `{key, id, action: 'approve'\|'reject'\|'delete', edited?}`. `edited` overrides text on approve (original preserved as `original` field). Requires `ADMIN_KEY`. |
| POST | `/admin-add-testimonial` | **Added 2026-06-01.** Manual paste — body `{key, dogId, text, status?}`. Defaults to `approved`. Used to seed the first 3-5 testimonials before inbound is wired, and as fallback for parsing misses. Requires `ADMIN_KEY`. |

> **Storage alarm (generalized 2026-05-26):** `server.js` arms a PartyKit storage alarm via `scheduleNextWakeup()`, which picks the soonest of (a) any pending RSVP reminder T-60min or T-5min, and (b) the daily-audit horizon (last audit + 24h). `onAlarm` calls `processSlotReminders()` first, then runs `computeAudit()` if 24h have elapsed, then re-arms. Audit Critical-6 + Phase 5 reminders. Old `scheduleAuditAlarm()` is kept as a back-compat shim. **Cadence split (2026-06-03, `9e0222b`):** the audit + per-user "you paid but haven't uploaded" nudge stay daily (still gated once-per-user by `nudged:<userId>`), but the **admin summary email** (`sendStuckUserAdminAlert`) now throttles to once per 7 days via `lastStuckSummaryAt` — and any user in `stuckResolutions` is filtered out upstream, so resolved rows never re-page James.

## WebSocket Message Types

**Server → client (handled in `app.js`):** `sync`, `newdog`, `chat`, `bone`, `viewers`, `intermission`, `communityCount`, `totalFans`, `boneBalance` (authoritative bones for the connection), `needTopUp` (rejected bone — out of balance)

**Client → server (handled in `party/server.js`):** `join` (now carries optional `token` to authenticate the connection — server resolves to a user and caches `{userId, bones, tier, username}` on the connection), `chat`, `bone` (server-enforced balance: legacy `tier === 'general'` bypassed until migration, everyone else decrements `bones`, refused with `needTopUp` if zero)

> **Note:** `intermission` is disabled as of 2026-05-19 — the server-side trigger is commented out in `party/server.js` ("endless dog rotation"). The `startIntermission()` / `endIntermission()` machinery is retained but dormant on both server and client (`app.js`).

## Key JS Functions (index.html)

- `openEmailModal(tier)` — Email capture before checkout
- `enterShow(tier, email)` — Stripe checkout (paid) or direct register (free)
- `playCurtainAndGo(tier)` — Curtain animation → redirect to show.html
- `animateCounter(id, target)` — Animated number counters
- `startDogEntry()` — Open the upload modal; called by all "Enter Your Dog" CTAs; `pendingDogTier` (module-level) determines whether the eventual checkout is `premium` ($3.99) or `premium_plus` ($5.99)
- `getChosenSlotAt()` — Returns the picker's chosen `slotAt` timestamp, or `null` for "show me now"
- `populateSlotDateSelect()` / `populateSlotTimeSelect()` — Build the date + time pickers from "now" forward

## Pricing Tiers (post-2026-05-26 bones model)

1. **Free Peek** — Watch only. Register grants 250 bones.
2. **Bones Top-Up ($1.99, SKU `general`)** — +250 bones. Was previously "unlimited bones forever" (pre-2026-05-26); legacy purchasers are grandfathered via `/admin-migrate-general` to free tier + 2500 bones.
3. **Bring Your Dog ($3.99, SKU `premium`)** — Upload your dog + pick a slot time (or "show me now"). Booked slots get 3× on-stage duration. Bones balance behaves like everyone else's. Primary conversion target.
4. **Premium ($5.99, SKU `premium_plus`)** — BYD + 2× bones launch bonus. Same upload + slot booking flow as `premium`.
