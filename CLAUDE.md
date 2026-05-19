# dogshow.lol — Codebase Reference

## ⚠️ CRITICAL: DO NOT EDIT DogShowPrototype.jsx

DogShowPrototype.jsx is an OLD React prototype from early brainstorming. It is **NOT** the live site. The live site is **static HTML/CSS/JS** spread across multiple files listed below. If you need to make changes to the site, edit the HTML/CSS/JS files directly. Never treat DogShowPrototype.jsx as the codebase.

---

## Tech Stack

- **Frontend**: Multi-page static HTML/CSS/JS (no framework, no build step)
- **Real-time**: PartyKit WebSocket — host: `dogshow.schemestudio.partykit.dev`, room: `dogshow-live`
- **Payments**: Stripe Checkout via PartyKit endpoint `/create-checkout`
- **Hosting**: GitHub Pages (static) — repo `SCHEMESTUDIO/dogshow`, custom domain via CNAME. PartyKit hosts the server. (Note: `_redirects` is in repo but ignored by GH Pages; clean URLs only work because filenames match.)
- **Analytics**: Google Analytics `G-V830P7PPHQ` + Faurya Analytics (website ID `cmosekmvz000xl204a7bhm4cm`)
- **Font**: Custom "Yang Bagus" (`YangBagus.ttf`)
- **Colors**: Dark purple bg (`#0f0a22` / `#1a1035`), orange accent (`#FF8C42`), purple accent (`#7B68EE`)
- **CSS vars**: Defined in `:root` in style.css (`--bg`, `--accent`, `--text-bright`, etc.)
- **Auth**: localStorage tokens (dogshow_token, dogshow_tier, dogshow_username, dogshow_fan_id)

## File Map

### Pages (the actual live site)

| File | Lines | Purpose |
|------|-------|---------|
| `index.html` | ~2128 | Landing/sales page. Hero, pricing tiers, testimonials, FAQ, email modal, Stripe checkout flow, curtain animation. Inline `<style>` block with `.lp-*` classes. JS at bottom. |
| `show.html` | ~261 | Live show page. Stage → header row (nameplate + bones cluster) → paid-user row (upload/status) → breed fact → house rotator (real CTA + 4 fake-door cards) → chat → share rail → leaderboard. Bottom dock dissolved 2026-05-18; bones cluster now lives next to nameplate. Includes username modal, upgrade modal, interest-capture modal. Loads `app.js`. |
| `app.js` | ~1400 | Show page JS (IIFE). PartyKit WebSocket, dog slideshow sync, live chat, bone reactions/streaks/frenzy, community upload (canvas resize 600px JPEG 0.7), breed facts DB, leaderboard, share rail, upgrade modals for free users. **House rotator** (5 messages, 15s rotation; $3.99 entry CTA + 4 fake doors). **Interest modal** captures fake-door emails via `/register` with `tier='interest_<feature>'`. |
| `style.css` | ~2273 | Shared stylesheet. CSS vars, font-face, all page styles, responsive breakpoints, upgrade modal CSS. New mobile layout components (.stage-header-row, .bones-cluster, .paid-user-row, .house-rotator, .interest-modal) live near the bottom. |
| `analytics.js` | ~117 | Sitewide Bing UET + Microsoft Clarity scaffold + helper functions `window.trackEmailCapture` / `window.trackPurchase`. Tags dormant until IDs filled in. Loaded on all 11 main pages. |
| `success.html` | ~449 | Post-Stripe payment. Registers user via `/register`, celebration page with dog preview + share buttons (FB/X/WhatsApp/copy). No auto-redirect. |
| `dog.html` | ~883 | Individual dog certificate. Stats, SEO content, Schema.org structured data, share buttons, "More Dogs" section. Mobile-responsive. |
| `dogs.html` | ~463 | All Dogs gallery. Search, sort, dog cards, aggregate stats, founding-dogs CTA empty state. |
| `about.html` | ~228 | About page + contact (james@wearescheme.studio). |
| `login.html` | ~123 | Returning user login. |
| `d.html` | ~42 | Slug router: `/d/slug-name` → `/dog.html?slug=slug-name`. Now also ships static OG/Twitter tags so social crawlers (which don't run JS) get a generic share-card preview. **Still HTTP 404 to Googlebot — pages aren't individually indexable; full fix requires SSR/Vercel migration.** |
| `404.html` | ~31 | Custom 404 page. Also doubles as a SPA router for `/d/{slug}` URLs (the redirect JS runs on the 404 page). **Note for SEO: `/d/{slug}` URLs are NOT in sitemap.xml on purpose — they return 404 to Googlebot regardless of the JS redirect. To make dog pages indexable, would need Vercel migration or pre-built static files.** |

### SEO landing pages (added 2026-05-07)

| File | Lines | Clean URL | Purpose |
|------|-------|-----------|---------|
| `dog-photo-contest.html` | ~1131 | `/dog-photo-contest` | "Dog photo contest" SEO landing, funnels to $3.99 BYD tier. Renamed from `contest.html` on 2026-05-14 — GH Pages doesn't honor `_redirects`, so filename must match the clean URL. |
| `puppy-picture-contest.html` | ~578 | `/puppy-picture-contest` | "Puppy picture contest" SEO landing |
| `dog-show-near-me.html` | ~636 | `/dog-show-near-me` | "Dog show near me" SEO landing, reframes to live online show |
| `cutest-dog-contest.html` | ~676 | `/cutest-dog-contest` | "Cutest dog contest" SEO landing (added 2026-05-14). Targets the cutest cluster (~990/mo). Positioning: no judges, every dog is the cutest. Pay-to-vote critique vs The Dog Show. |
| `generate-sitemap.html` | ~56 | (utility) | Local utility — fetches all-dogs from PartyKit, outputs sitemap.xml |

### Non-page files

| File | Purpose |
|------|---------|
| `DogShowPrototype.jsx` | ⚠️ OLD prototype. Do NOT edit. Not deployed. |
| `dogshow-architecture.docx` | Early architecture planning doc |
| `dogshow-seo-strategy.docx`, `dogshow-seo-strategy-v2.docx` | SEO planning docs |
| `Claude Project Memory - Best Practices.md` | Notes on memory file conventions |
| `bing-campaign-prep.md` | Bing Ads prep doc — keywords, ad copy, negatives, bid strategy, kill criteria. Source-of-truth for the £200→£600 promo trial. |
| `bing-launch-checklist.md` | Step-by-step actions for James inside the Microsoft Ads UI. Companion to `bing-campaign-prep.md`. |
| `CNAME` | Domain: `dogshow.lol` |
| `_redirects` | Netlify/Vercel redirect rules (`/d/:slug`, SEO clean URLs). **Ignored by GitHub Pages (current host)** — kept in repo for any future host migration. |
| `robots.txt` | SEO crawl rules |
| `sitemap.xml` | Static sitemap (regenerate via `generate-sitemap.html`) |
| `YangBagus.ttf` | Custom font |
| `og-image.png` | Open Graph / Twitter Card share image (1200x630). Generated 2026-05-18 with Python+PIL from a script — wordmark in Yang Bagus + theatre proscenium framing. Referenced by all 12 main HTML pages. Swap with a designer version anytime — no code change required. |
| `favicon.svg` + PNG variants | Favicons |
| `party/` | PartyKit server code — single `server.js` (~60KB), has its own node_modules |

## API Endpoints (PartyKit)

Base: `dogshow.schemestudio.partykit.dev/party/dogshow-live` (PartyKit single-party default; app.js uses `/party/{room}`, not `/parties/{name}/{room}`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/landing-stats` | Stats for landing page (bones, fans, dogs, watching) |
| POST | `/register` | Register new user → returns token |
| POST | `/login` | Login with token |
| POST | `/verify` | Verify token / session |
| POST | `/get-user` | Get user data by token |
| POST | `/set-username` | Set username for current user |
| POST | `/create-checkout` | Create Stripe checkout session |
| POST | `/upload-dog` | Upload community dog (premium only) |
| GET | `/community-image?id=X` | Fetch uploaded community dog image |
| GET | `/community-count` | Count of community-uploaded dogs |
| GET | `/dog-stats?id=X` | Individual dog stats |
| GET | `/dog-meta?slug=X` | Per-dog OG/meta tags for share crawlers |
| GET | `/show-meta` | OG/meta tags for show share rail |
| GET | `/resolve-slug?slug=X` | Resolve slug to dog ID |
| GET | `/all-dogs` | All dogs for gallery |
| GET | `/leaderboard` | Top dogs + recent arrivals |

## WebSocket Message Types (app.js)

`sync`, `newdog`, `chat`, `bone`, `viewers`, `intermission`, `communityCount`, `totalFans`

## Key JS Functions (index.html)

- `openEmailModal(tier)` — Email capture before checkout
- `enterShow(tier, email)` — Stripe checkout (paid) or direct register (free)
- `playCurtainAndGo(tier)` — Curtain animation → redirect to show.html
- `animateCounter(id, target)` — Animated number counters

## Three Pricing Tiers

1. **Free Peek** — Watch only. No chat, no bones, no upload.
2. **General Admission ($1.99)** — Watch + chat + bones. No upload.
3. **Bring Your Dog ($3.99)** — Everything + upload your dog. Primary conversion target.
