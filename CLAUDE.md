# dogshow.lol — Codebase Reference

## ⚠️ CRITICAL: DO NOT EDIT DogShowPrototype.jsx

DogShowPrototype.jsx is an OLD React prototype from early brainstorming. It is **NOT** the live site. The live site is **static HTML/CSS/JS** spread across multiple files listed below. If you need to make changes to the site, edit the HTML/CSS/JS files directly. Never treat DogShowPrototype.jsx as the codebase.

---

## Tech Stack

- **Frontend**: Multi-page static HTML/CSS/JS (no framework, no build step)
- **Real-time**: PartyKit WebSocket — host: `dogshow.schemestudio.partykit.dev`, room: `dogshow-live`
- **Payments**: Stripe Checkout via PartyKit endpoint `/create-checkout`
- **Hosting**: Vercel (migrated from GitHub Pages, 2026-05-22 — commits `a8ce1b0` + `c6185a6`). Repo `SCHEMESTUDIO/dogshow`, custom domain via CNAME. PartyKit hosts the real-time/API server; Vercel hosts the static files + the `api/dog.js` SSR function for `/d/{slug}` (audit #27). `vercel.json` defines rewrites: `/d/:slug` → `/api/dog?slug=:slug`, and `/:slug` → `/:slug.html` (clean URLs no longer require filename=URL since GH Pages no longer serves). `.vercelignore` excludes `party/`, `*.md`, `*.docx`, and `DogShowPrototype.jsx` so they don't ship to the public site.
- **Error tracking**: Sentry on both browser (loader injected by `analytics.js` on every page) and PartyKit server (DSN in `party/server.js`, `reportToSentry()` wraps the request dispatcher). Audit High-3. **Verify DNS / which host is actually live before asserting** — vercel.json is committed but the cutover to Vercel's edge network was not directly verified by this audit.
- **Analytics**: Google Analytics `G-V830P7PPHQ` + Faurya Analytics (website ID `cmosekmvz000xl204a7bhm4cm`)
- **Font**: Custom "Yang Bagus" (`YangBagus.ttf`)
- **Colors**: Dark purple bg (`#0f0a22` / `#1a1035`), orange accent (`#FF8C42`), purple accent (`#7B68EE`)
- **CSS vars**: Defined in `:root` in style.css (`--bg`, `--accent`, `--text-bright`, etc.)
- **Auth**: Magic-link via Resend (`POST /login` emails a one-time `loginUrl` carrying a 60-min `magic:` token; `login.html?token=...` exchanges it for a 30-day session token). localStorage stores `dogshow_token`, `dogshow_tier`, `dogshow_username`, `dogshow_fan_id`.

## File Map

### Pages (the actual live site)

| File | Lines | Purpose |
|------|-------|---------|
| `index.html` | ~2146 | Landing/sales page. Hero, pricing tiers, testimonials, FAQ, email modal, Stripe checkout flow, curtain animation. Inline `<style>` block with `.lp-*` classes. JS at bottom. Now loads `breeds.js` for the pre-purchase breed dropdown (#48). |
| `show.html` | ~288 | Live show page. Stage → header row (nameplate + bones cluster) → paid-user row (upload/status) → breed fact → house rotator (real CTA + 4 fake-door cards) → chat → share rail → leaderboard. Bottom dock dissolved 2026-05-18; bones cluster now lives next to nameplate. Desktop: two-column Twitch-style layout (stage ~60% + chat 300px side-by-side) with two-column leaderboard (2026-05-19). Includes username modal, upgrade modal, interest-capture modal. Loads `breeds.js` then `app.js`. |
| `app.js` | ~1616 | Show page JS (IIFE). PartyKit WebSocket, dog slideshow sync, live chat, bone reactions/streaks/frenzy, community upload (canvas resize 600px JPEG 0.7) via shared `submitDogImage()` — also auto-submits a pre-purchase photo stashed in `localStorage` as `dogshow_pending_dog_image` on show entry (audit #37 fix), breed facts DB, leaderboard, share rail, upgrade modals for free users. **House rotator** (5 messages, 15s rotation; $3.99 entry CTA + 4 fake doors). **Interest modal** captures fake-door emails via `/register` with `tier='interest_<feature>'`. Breed dropdown options come from `window.DOG_BREEDS` (breeds.js). |
| `style.css` | ~2507 | Shared stylesheet. CSS vars, font-face, all page styles, responsive breakpoints, upgrade modal CSS. New mobile layout components (.stage-header-row, .bones-cluster, .paid-user-row, .house-rotator, .interest-modal) live near the bottom. |
| `analytics.js` | ~128 | Sitewide scaffold: injects the **Sentry browser loader** (audit High-3) on every page, then Bing UET + Microsoft Clarity (still gated behind `UET_TAG_ID` / `CLARITY_ID` constants — no pixel fires until pasted). Exports `window.trackEmailCapture` / `window.trackPurchase`. Loaded on all main pages. |
| `breeds.js` | ~108 | Shared dog-breed list (`window.DOG_BREEDS`) for the upload picker. Loaded by `show.html` (in-show upload) and `index.html` (pre-purchase upload). Audit #48 fix — owner picks the breed themselves, so the AI can never mislabel a dog. "Mixed Breed" pinned first, "Other / Not sure" last. |
| `success.html` | ~455 | Post-Stripe payment. Calls `/verify-checkout` (carrying the Stripe `session_id`) to provision the paid user, then celebration page with dog preview + share buttons (FB/X/WhatsApp/copy). No auto-redirect. |
| `dog.html` | ~883 | Individual dog certificate. Stats, SEO content, Schema.org structured data, share buttons, "More Dogs" section. Mobile-responsive. **Note**: under Vercel, crawlers hit `/api/dog?slug=…` (SSR) instead of this client-rendered page — see `api/dog.js`. |
| `dogs.html` | ~463 | All Dogs gallery. Search, sort, dog cards, aggregate stats, founding-dogs CTA empty state. |
| `about.html` | ~228 | About page + contact (james@wearescheme.studio). |
| `login.html` | ~123 | Magic-link login page. Submits email → `POST /login` (PartyKit emails a magic link). When loaded with `?token=…`, exchanges the magic token for a 30-day session token via `POST /verify`. |
| `admin.html` | ~317 | Password-gated admin CMS (audit-tier dashboard + community-dog moderation). Calls `/admin-audit` for tier counts + stuck premium users, and `/admin-delete-dog` to remove a non-dog upload. Auth = `ADMIN_KEY` typed into the login box (not stored server-side beyond the env var). `meta robots = noindex,nofollow`; also Disallowed in `robots.txt`. |
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
| `bing-launch-checklist.md` | Step-by-step actions for James inside the Microsoft Ads UI. Companion to `bing-campaign-prep.md`. |
| `platform-audit.md` | Pre-paid-traffic reliability audit (generated 2026-05-19). 6 Critical / 7 High / 6 Medium / 3 Low findings — silent failure modes, 2 security gaps allowing free tier upgrades, near-zero observability. The 6 Critical fixes shipped 2026-05-21 (`535deb6`); subsequent commits cleared more findings: #37 pre-purchase photo (`3cbe942`), High-2 rate limiting + crypto tokens + magic-link UX + welcome email (`7ecf996`), #40 admin CMS (`3404ab7`), #38 AI classifier (`15e64ef`), #48 user-selected breed (`e26ca57`), High-3 Sentry (`08bd136`), #27 per-dog SSR via Vercel (`a8ce1b0` + `c6185a6`), and #37/Anonymous/cert-email/stale-image cleanup (`086b359`). |
| `CNAME` | Domain: `dogshow.lol` |
| `vercel.json` | Vercel rewrites: `/d/:slug` → `/api/dog?slug=:slug` (SSR), and `/:slug` → `/:slug.html` (clean URLs). |
| `.vercelignore` | Excludes `party/`, `*.md`, `*.docx`, `DogShowPrototype.jsx` from the Vercel deployment (also closes the prior GH-Pages leak of internal docs). |
| `_redirects` | Legacy Netlify/Vercel redirect file — superseded by `vercel.json`. Kept in repo but not the source of truth. |
| `robots.txt` | SEO crawl rules. Disallows `/admin` + `/admin.html`. Sitemap pointer included. |
| `sitemap.xml` | Static sitemap (regenerate via `generate-sitemap.html`) |
| `YangBagus.ttf` | Custom font |
| `og-image.png` | Open Graph / Twitter Card share image (1200x630). Generated 2026-05-18 with Python+PIL from a script — wordmark in Yang Bagus + theatre proscenium framing. Referenced by all main HTML pages. Swap with a designer version anytime — no code change required. |
| `favicon.svg` + PNG variants | Favicons |
| `party/` | PartyKit server code — single `server.js` (~113KB, ~2600 lines, one class), has its own node_modules. NOT deployed to Vercel (`.vercelignore`). |
| `api/dog.js` | Vercel serverless function. Server-renders the per-dog certificate at `/d/{slug}` with real content + per-dog OG/Twitter tags. Fetches dog data from PartyKit (`/dog-meta`, `/dog-stats`). Resolves audit #27 (Googlebot now sees real pages, not a 404 → JS redirect). |
| `api/og.tsx` | Vercel Edge function. Generates a 1200x630 (1.91:1 — Facebook/Twitter/LinkedIn optimal) per-dog share image at `/api/og?slug={slug}`. Composites the dog's photo into a branded frame so share previews don't get cropped weirdly. `api/dog.js` sets `og:image` / `twitter:image` to point at this. Uses `@vercel/og` (declared in `package.json`). |
| `package.json` | Declares Vercel function dependencies (`@vercel/og`). No build script — static files still serve as-is, Vercel just runs `npm install` so the Edge function can resolve its imports. |

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
| POST | `/my-dog` | Returns the caller's real (server-side) tier + their dog `{id,slug,dogName}` if any. The show page calls this on entry so a returning premium user who already uploaded sees a "view your certificate" link, and a refunded/free account doesn't see the upload UI. |
| POST | `/set-username` | Set username for current user |
| POST | `/create-checkout` | Create Stripe checkout session. `success_url` now carries `{CHECKOUT_SESSION_ID}` + `metadata[tier]`. |
| POST | `/verify-checkout` | Verify a completed Stripe Checkout Session server-side (payment_status=paid), then provision the paid user. **Only path that can grant general/premium.** tier+email read from Stripe, never the client. |
| POST | `/stripe-webhook` | Stripe webhook. HMAC-verified via `STRIPE_WEBHOOK_SECRET`. Handles `charge.refunded` (→ downgrade to free) + `charge.dispute.created` (→ flag user). |
| POST | `/upload-dog` | Upload community dog (premium only). Runs AI dog classification via the **Cloudflare AI REST API** (`@cf/microsoft/resnet-50`, fix `15e64ef` — replaced the previous Workers AI binding that wasn't bound in production): rejects non-dogs, else records confidence. **Fails open** — accepts as "Mystery Breed" if the AI errors or is unavailable. Breed comes from the uploader's dropdown pick (#48); `username` is passed so the dog is never created "Anonymous". **One dog per account** — a 2nd upload returns 409 `already_have_dog` with the existing dog's slug; bypassable by passing `adminKey` (=`ADMIN_KEY`). Sends the certificate email (dog photo + `/d/{slug}` link) on success. Error responses include a `code` field for client-side observability. |
| GET | `/community-image?id=X` | Fetch uploaded community dog image |
| GET | `/community-count` | Count of community-uploaded dogs |
| GET | `/dog-stats?id=X` | Individual dog stats |
| GET | `/dog-meta?slug=X` | Per-dog OG/meta tags for share crawlers |
| GET | `/show-meta` | OG/meta tags for show share rail |
| GET | `/resolve-slug?slug=X` | Resolve slug to dog ID |
| GET | `/all-dogs` | All dogs for gallery |
| GET | `/leaderboard` | Top dogs + recent arrivals |
| GET | `/admin-audit?key=X` | Admin audit — tier counts, stuck premium users (paid but no dog entry), orphaned `img:`/`slug:` storage keys. Requires `ADMIN_KEY` env var. Logic shared with the daily reconciliation alarm via `computeAudit()`. Consumed by `admin.html`. |
| GET | `/admin-delete-dog?key=X&id=Y` | Admin — remove a community dog (its `communityDogs` entry + `img:`/`slug:` keys). For pulling non-dog uploads. Requires `ADMIN_KEY`. Consumed by `admin.html`. |
| GET | `/admin-ai-test?key=X` | Throwaway diagnostic — probes the Cloudflare AI REST endpoint and runs resnet-50 on a known dog image. Used to verify the classifier (audit #38). Safe to delete now that the classifier fix shipped (`15e64ef`). Requires `ADMIN_KEY`. |
| GET | `/admin-sentry-test?key=X` | Throwaway diagnostic — emits a test event through `reportToSentry()` to confirm server-side error reporting works end-to-end (audit High-3). Safe to delete after smoke-testing. Requires `ADMIN_KEY`. |

> **Daily reconciliation alarm:** `server.js` arms a PartyKit storage alarm (`onAlarm`, re-armed every 24h). It runs `computeAudit()`; if any premium users are stuck it emails James a summary and sends each stuck user a one-time upload nudge (`nudged:<userId>` guard). Audit Critical-6.

## WebSocket Message Types

**Server → client (handled in `app.js`):** `sync`, `newdog`, `chat`, `bone`, `viewers`, `intermission`, `communityCount`, `totalFans`

**Client → server (handled in `party/server.js`):** `join`, `chat`, `bone`

> **Note:** `intermission` is disabled as of 2026-05-19 — the server-side trigger is commented out in `party/server.js` ("endless dog rotation"). The `startIntermission()` / `endIntermission()` machinery is retained but dormant on both server and client (`app.js`).

## Key JS Functions (index.html)

- `openEmailModal(tier)` — Email capture before checkout
- `enterShow(tier, email)` — Stripe checkout (paid) or direct register (free)
- `playCurtainAndGo(tier)` — Curtain animation → redirect to show.html
- `animateCounter(id, target)` — Animated number counters

## Three Pricing Tiers

1. **Free Peek** — Watch only. No chat, no bones, no upload.
2. **General Admission ($1.99)** — Watch + chat + bones. No upload.
3. **Bring Your Dog ($3.99)** — Everything + upload your dog. Primary conversion target.
