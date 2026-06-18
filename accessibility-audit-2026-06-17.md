# Accessibility Audit — dogshow.lol

**Date:** 2026-06-17
**Standard:** WCAG 2.2 Level AA + the `dogshow/accessibility` and `dogshow/frontend-patterns` skills
**Auditor:** automated pass against the live static site
**Audience note:** The core paid audience skews 65+, so keyboard focus visibility, target size, and contrast carry extra weight here.

---

## Scope

Audited the live static site (NOT `DogShowPrototype.jsx`, which is dead code):

- `index.html` (landing/sales page — read in full)
- `show.html` (live show page — read in full)
- `style.css` (shared stylesheet — focus/animation/contrast tokens)
- `app.js` (show-page JS — chat rendering, modal show/hide, no edits applied)
- `about.html`, `dogs.html`, `login.html` (read key regions)
- Skimmed: SEO landing pages, `api/dog.js`/`api/breed.js` SSR templates (not edited — server-rendered, lower-traffic, recommended for a follow-up pass)

The prior "boomer-demo" contrast pass (commit `12ee55a`, which lightened `--text-dim`/`--text-faint` to clear ~4.5:1) was left intact and built upon — the new focus ring and skip-link colors reuse the existing brand orange `#FF8C42` on the dark bg.

All edits were **additive and non-breaking**: no layout, copy meaning, business logic, payment, or WebSocket flow was changed.

---

## What I APPLIED (safe, additive fixes)

### `style.css` (one appended block at end of file)
- **`:focus-visible` ring** on `a`, `button`, `input`, `select`, `textarea`, `[tabindex]`, `[role="button"]` — 3px `#FF8C42` outline with 2px offset. Site previously had **no global keyboard-focus indicator** (only a handful of `:focus` border-color changes on specific inputs). *(WCAG 2.4.7 Focus Visible, 2.4.11 Focus Appearance)*
- **`.sr-only`** visually-hidden utility class — used by the new screen-reader-only `<label>`s.
- **`.skip-link`** styles — off-screen until focused, then pinned top-left. *(WCAG 2.4.1 Bypass Blocks)*
- **`@media (prefers-reduced-motion: reduce)`** — neutralizes animation/transition durations site-wide (the site has 49 `transition:`/`animation:` declarations + 8 `@keyframes` incl. `frenzyPulse`, `boneUp`, curtain animations, none of which previously respected the OS reduced-motion setting). *(WCAG 2.3.3 Animation from Interactions)*

### `index.html`
- Added **skip-to-content link** (`#mainContent` → hero, given `tabindex="-1"` so focus lands cleanly). *(2.4.1)*
- **Login email input** (`#loginEmail`): added `<label class="sr-only">` + `autocomplete="email"`. *(1.3.1, 4.1.2, 1.3.5)*
- **Email modal input** (`#emailModalInput`): added `sr-only` label. *(1.3.1, 4.1.2)*
- **Upload-modal inputs** (`#dogNameInput`, `#dogBreedInput`): added `sr-only` labels. These had only placeholders, which are not accessible names. *(1.3.1, 4.1.2)*
- **FAQ accordion**: added `aria-expanded="false"` to all 7 `.lp-faq-q` buttons and wired the click handler to toggle `aria-expanded` true/false. Marked the decorative `+` arrows `aria-hidden="true"`. *(4.1.2 Name/Role/Value)*
- **Modals** `#emailOverlay`, `#uploadOverlay`: added `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the title (gave the upload title an id). Decorative emoji icons marked `aria-hidden="true"`. *(4.1.2, 1.1.1)*

### `show.html`
- Added **skip-to-content link** (`#showMain` → main show region, id added). *(2.4.1)*
- **Live chat region** (`#chatMessages`): added `role="log"`, `aria-live="polite"`, `aria-label="Live chat messages"` so new messages are announced to screen-reader users. *(4.1.3 Status Messages)*
- **Chat input** (`#chatInput`): added `sr-only` label. *(1.3.1, 4.1.2)*
- **Inputs labeled** with `sr-only` labels: `#registerName`, `#registerEmail`, `#interestInput`, `#usernameInput`. *(1.3.1, 4.1.2)*
- **Modals** given `role="dialog"` + `aria-modal="true"` + `aria-labelledby`: `#registerOverlay`, `#interestOverlay`, `#usernameModal` (added title id), `#upgradeOverlay`, `#uploadModalOverlay` (added title id). Decorative emoji icons marked `aria-hidden="true"`. *(4.1.2, 1.1.1)*

### `dogs.html`
- **Search input** (`#searchInput`) and **sort select** (`#sortSelect`): added `aria-label`. *(1.3.1, 4.1.2)*

### `login.html`
- **Status message** (`#statusMessage`): added `role="status"` + `aria-live="polite"` so the "Verifying… / You're in / Invalid link" updates are announced. *(4.1.3)*

**Sanity check:** `node -c app.js` produced no syntax errors (app.js itself was not edited; only inline FAQ JS in `index.html` was touched, which preserves the existing handler logic). All ARIA/skip-link/sr-only markers grep back as present in every file.

---

## What I RECOMMEND but did NOT apply (needs review — risk of behavior change)

| # | Item | File / location | Why not auto-applied | Severity | Confidence | WCAG |
|---|------|-----------------|----------------------|----------|------------|------|
| R1 | **Modal focus trapping + Escape-to-close + focus restore.** The new `role="dialog"`/`aria-modal` markup *declares* a modal, but focus is not actually trapped inside any overlay, Escape does not close them, and focus is not moved into the modal on open or restored to the trigger on close. | `app.js` (show-page modals: register/interest/username/upgrade/upload), inline JS in `index.html` (email/upload overlays) | Requires new JS event handlers + focus management. Real behavior change with regression risk on the live payment/upload flow. The frontend-patterns skill's Focus Management pattern is the template. | **High** | High | 2.1.2 No Keyboard Trap (inverse), 2.4.3 Focus Order, 2.4.11 |
| R2 | **No `<h1>` on `about.html` and `dogs.html`.** Both use a `<div>` styled as the title (`.dir-title`, the about heading) and then jump to `<h2>`. Heading hierarchy starts at H2 with no H1. | `about.html` (~line 190 region), `dogs.html` (`.dir-title` ~line 261) | Changing a `<div>` to `<h1>` can shift visual styling (the div's CSS would need to carry over). Low risk but touches visible layout, so flagged for review rather than auto-applied. | Medium | High | 1.3.1, 2.4.6 |
| R3 | **Tap/target size for the 65+ audience.** Several controls (footer links at 11–12px, FAQ arrows, the small `.dock-link`, chat send) may be below the 24×24 CSS-px floor and are visually small for older users. Not measured numerically here. | `style.css` footer links, `show.html` footer, dock link | Enlarging targets changes layout/spacing. Needs design review to avoid breaking the dense show-page layout. | Medium | Medium | 2.5.8 Target Size (Minimum) |
| R4 | **Stage image alt text is generic/static.** `#dogImage` has `alt="A good dog"` but the dog changes every ~15s via JS; alt never updates with the actual dog's name/breed. Decorative-vs-informative is ambiguous. | `show.html` `#dogImage`, updated in `app.js` | Updating alt dynamically is a JS change in the slideshow sync path — wanted to avoid touching the live rotation logic. Recommend setting `alt` to the current dog's name when `app.js` swaps the `src`. | Medium | Medium | 1.1.1 |
| R5 | **Color contrast not numerically verified.** The prior pass lightened the muted tokens to a claimed ~4.5:1, but I did not re-measure. Several inline hard-coded colors remain (e.g. footer `#8a7cb8`, `#3d2d6b` copyright, the `#9d90c8` subtitle on `#0f0a22`). `#3d2d6b` on a dark bg is almost certainly **below 4.5:1**. | `index.html`/`show.html` inline footer styles, `.lp-section-subtitle` | Contrast tuning risks undoing the deliberate brand/contrast balance from `12ee55a`; needs a contrast-checker pass + sign-off. **I could not verify these ratios numerically in this environment.** | Medium | Low (unverified) | 1.4.3 |
| R6 | **SSR templates (`api/dog.js`, `api/breed.js`) not audited/fixed.** These server-render the `/d/{slug}` cert pages and `/breeds/{slug}` hubs with their own `<head>`, headings, forms (RSVP), and footer. | `api/dog.js`, `api/breed.js` | Out of the static-HTML scope and higher blast radius (they're functions, not pages). The same label/skip-link/focus-ring fixes should be applied in a follow-up; the `style.css` focus-ring + reduced-motion block already covers them since they load the shared stylesheet. | Medium | High | 1.3.1, 2.4.1, 4.1.2 |
| R7 | **Curtain / intermission overlays and the autoplay promo video.** The promo `<video autoplay muted loop>` in the index hero already has `aria-label`; reduced-motion users may still want it paused (the media query does not stop video playback). | `index.html` `.lp-promo-video-wrap`, curtain overlays | Pausing autoplay under reduced-motion needs JS. The video is muted/decorative so this is lower priority. | Low | Medium | 2.2.2 Pause/Stop/Hide |
| R8 | **FAQ answer panels not programmatically associated** with their buttons via `aria-controls`/`id`. Added `aria-expanded` but the `.lp-faq-a` divs have no ids to point `aria-controls` at. | `index.html` FAQ | Adding ids + `aria-controls` is safe but I kept the auto-fix to the higher-value `aria-expanded`; full disclosure-widget wiring is a small follow-up. | Low | High | 1.3.1 |
| R9 | **Error messages rely on a styled div, not associated with the input** via `aria-describedby` (e.g. `#emailModalError`, `#registerError`, `#uploadModalError`). Screen readers won't tie the error to the field. | `index.html`, `show.html` modals | Wiring `aria-describedby` dynamically (only when an error shows) is a JS change in the validation paths. | Low | High | 3.3.1 Error Identification |

---

## Severity legend
- **High** — blocks or significantly impairs assistive-tech / keyboard users.
- **Medium** — degrades the experience or fails AA but has partial workarounds.
- **Low** — polish / belt-and-suspenders.

## Confidence legend
- **High** — verified in the source.
- **Medium** — strongly indicated but not exhaustively measured.
- **Low** — suspected; not numerically verified in this environment (notably contrast, R5).

---

## Suggested next steps (in priority order)
1. **R1 — modal focus management** (High). This is the single biggest remaining gap; the new `aria-modal` markup is honest only once focus is actually trapped + Escape closes + focus is restored.
2. **R6 — apply the same label/skip/focus fixes to `api/dog.js` + `api/breed.js`** (the focus-ring + reduced-motion CSS already reaches them via the shared stylesheet; they still need the per-control labels + skip links).
3. **R5 — run a real contrast checker** over the remaining inline hard-coded colors, especially `#3d2d6b` and footer link colors.
4. **R2 — add proper `<h1>`s** to about/dogs.
5. **R4 — dynamic alt text** for the rotating stage image.
