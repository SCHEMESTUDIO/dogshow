# dogshow.lol — Codebase Reference

## ⚠️ CRITICAL: DO NOT EDIT DogShowPrototype.jsx

DogShowPrototype.jsx is an OLD React prototype from early brainstorming. It is **NOT** the live site. The live site is **static HTML/CSS/JS** spread across multiple files listed below. If you need to make changes to the site, edit the HTML/CSS/JS files directly. Never treat DogShowPrototype.jsx as the codebase.

---

## Tech Stack

- **Frontend**: Multi-page static HTML/CSS/JS (no framework, no build step)
- **Real-time**: PartyKit WebSocket — host: `dogshow.schemestudio.partykit.dev`, room: `dogshow-live`
- **Payments**: Stripe Checkout via PartyKit endpoint `/create-checkout`
- **Hosting**: Netlify (static), PartyKit (server)
- **Analytics**: Google Analytics `G-V830P7PPHQ` + Faurya Analytics (website ID `cmosekmvz000xl204a7bhm4cm`)
- **Font**: Custom "Yang Bagus" (`YangBagus.ttf`)
- **Colors**: Dark purple bg (`#0f0a22` / `#1a1035`), orange accent (`#FF8C42`), purple accent (`#7B68EE`)
- **CSS vars**: Defined in `:root` in style.css (`--bg`, `--accent`, `--text-bright`, etc.)
- **Auth**: localStorage tokens (dogshow_token, dogshow_tier, dogshow_username, dogshow_fan_id)

## File Map

### Pages (the actual live site)

| File | Lines | Purpose |
|------|-------|---------|
| `index.html` | ~1390 | Landing/sales page. Hero, pricing tiers, testimonials, FAQ, email modal, Stripe checkout flow, curtain animation. Inline `<style>` block with `.lp-*` classes. JS at bottom. |
| `show.html` | ~195 | Live show page. Dog frame, bottom dock (bones, upload), chat panel, leaderboard, share rail, username modal. Loads `app.js`. |
| `app.js` | ~1052 | Show page JS (IIFE). PartyKit WebSocket, dog slideshow sync, live chat, bone reactions/streaks/frenzy, community upload (canvas resize 600px JPEG 0.7), breed facts DB, leaderboard, share rail. |
| `style.css` | ~1529 | Shared stylesheet. CSS vars, font-face, all page styles, responsive breakpoints. |
| `success.html` | ~108 | Post-Stripe payment. Registers user via `/register`, curtain animation, redirect to show.html. |
| `dog.html` | ~816 | Individual dog certificate. Stats, SEO content, Schema.org structured data, share buttons, "More Dogs" section. |
| `dogs.html` | ~444 | All Dogs gallery. Search, sort, dog cards, aggregate stats. |
| `about.html` | ~208 | About page + contact (james@wearescheme.studio). |
| `login.html` | ~100 | Returning user login. |
| `d.html` | ~20 | Slug router: `/d/slug-name` → `/dog.html?slug=slug-name` |
| `404.html` | ~50 | Custom 404 page. |

### Non-page files

| File | Purpose |
|------|---------|
| `DogShowPrototype.jsx` | ⚠️ OLD prototype. Do NOT edit. Not deployed. |
| `dogshow-architecture.docx` | Early architecture planning doc |
| `CNAME` | Domain: `dogshow.lol` |
| `_redirects` | Netlify redirect rules |
| `robots.txt` | SEO crawl rules |
| `YangBagus.ttf` | Custom font |
| `favicon.svg` + PNG variants | Favicons |
| `party/` | PartyKit server code (has its own node_modules) |

## API Endpoints (PartyKit)

Base: `dogshow.schemestudio.partykit.dev/parties/main/dogshow-live`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/landing-stats` | Stats for landing page (bones, fans, dogs, watching) |
| POST | `/register` | Register new user → returns token |
| POST | `/create-checkout` | Create Stripe checkout session |
| POST | `/login` | Login with token |
| GET | `/get-user` | Get user data by token |
| POST | `/upload-dog` | Upload community dog (premium only) |
| GET | `/dog-stats?id=X` | Individual dog stats |
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
