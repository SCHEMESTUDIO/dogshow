# The Dog Show — Redesign Handoff

Implementation guide for the approved redesign (see `Dog Show Redesign.dc.html`, options 2a + 3a–3e, and the working prototype `Dog Show Prototype.dc.html`). Maps every change to the live files in the codebase.

## 1. Design tokens (replace `:root` in `style.css`)

```css
:root {
  /* Paper & surfaces */
  --bg: #f7f2e9;            /* warm cream page (was #f3eefb lavender) */
  --bg-card: #fffdf8;       /* card surface (was #ffffff) */
  --border: rgba(42,33,80,.12);

  /* Ink */
  --text-bright: #2a2150;   /* unchanged */
  --text-dim: #4a4070;
  --text-mid: #6d628f;
  --text-faint: #7a6f9b;    /* meets 4.5:1 on --bg for 12px+ */

  /* Stage / chat chrome (dark) */
  --curtain-dark: #1e0f45;  /* chat dock + stage overlays + footer */
  --curtain: #2d1560;

  /* Accents — STRICT ROLES */
  --bone: #e8721c;          /* ONLY: Give a bone, Send, landing "Watch the Show" hero CTA. Nothing else. */
  --brass: #b98a2f;         /* rank #1, section eyebrows, active-nav underline, ticket */
  --brass-dark: #7a5a14;    /* text on brass ticket */
  --link: #5b46d6;          /* links, LIVE dot, ALL "Enter your dog" actions (nav CTA, DOM-card footer row) */
  --gold-text: #e9c87e;     /* small caps on dark chrome ("THE MAIN STAGE") */
  --lavender-on-dark: #b7a9e8; /* usernames/labels on dark chrome */
}
```

Delete: `--bg-warm`, `--accent-dark`, `--curtain-light`, `--live-dot`, `--white`. Social-brand button colors (Facebook blue, WhatsApp green, etc.) go entirely — share buttons become quiet ink-outline chips.

## 2. Type system

- **Display**: `YangBagus` — brand wordmark, dog names, page titles, section titles. Never body copy.
- **Body/UI**: system stack (existing `--font-system`) for all UI text, labels, buttons.
- **Numerals/serif accents**: Georgia (existing `--font-serif`) for rank numerals, bone counts, prices, and the italic fact strip.
- Mobile minimums: 16px body, 12px captions, 44px+ hit targets (48px+ for primary).

## 3. The three-layer rule (show page)

The old page stacked 9 modules. The new page has 3 layers + 1 slot:

1. **Stage** — photo, "THE MAIN STAGE" plaque, lower-third nameplate (name + breed + owner overlaid on a `--curtain-dark` gradient).
2. **Act** — fact strip → Give a bone (only `--bone` element) + dog's bone tally → brass ticket "Get more bones · 250 for $1.99" → "N bones in your pouch".
3. **Compete** — one "Dog of the Month" card: ranked rows (counts labelled "bones"), solid purple "Enter your dog — free →" footer row (the entry CTA on the show page — prominent but never orange, so it can't compete with Give a bone / Get more bones).
4. **Chat dock** — dark (`--curtain-dark`), always visible, pinned at bottom on mobile (pull-up sheet), permanent 340px right rail on desktop ≥1024px.

Consolidated/removed from `show.html`: `#voteHowto` (delete — no "bone = vote" education line), `#houseRotator`, `#breedFact` (fact moves to the stage fact-strip, keyed to the current dog via the breeds data in `breeds.js`), `#showShareRail` (fold into the dog's certificate page / native share), `.total-fans` banner (stat moves to landing), duplicate footers (keep one).

## 4. Per-page mapping

| Screen | Mock | Live files touched |
|---|---|---|
| Show page (mobile) | 2a + prototype | `show.html`, `style.css` (.show-*, .dock-*, .race-bar → new DOM card), `app.js` (fact strip: reuse `breedFact` data path; remove HOUSE_ROTATOR render) |
| Show page (desktop) | 3a | same; two-column grid `1fr 340px` at ≥1024px, `.chat-panel` becomes right rail |
| Landing | 3b | `index.html` (.lp-*): hero has ONE primary CTA — orange "Watch the Show — Free" — with "Have a dog? Enter them free →" as a purple link beneath; race card, stats band, numbered how-it-works (drop emoji icons), pricing (orange button on Free tier only, others ink-outline), FAQ, dark footer |
| Leaderboard | 3c | `leaderboard.html`: two-column Hall of Bones, brass #1 highlight, past-months card, brass "Want your dog up here?" panel |
| All Dogs | 3d | `dogs.html`: filter chips, 4-col (2-col mobile) photo cards, dashed "Your dog here" cell |
| Breeds | 3e | `breeds.html`: field-guide rows (thumb + name + one-line note + "Field notes →"), brass section eyebrows |
| Nav | all | `nav.js`: cream bar, brass active underline, orange CTA unchanged in role |

## 5. Component specs (reference values)

- **Give a bone**: `--bone` bg, white text, 12px radius, 52px tall, bone SVG glyph (no emoji), `box-shadow 0 2px 6px rgba(232,114,28,.35)`.
- **Bones tally pill**: card bg, count in Georgia 18px + "BONES" 9px letterspaced.
- **Brass ticket (Get more bones)**: gradient `#fdf6e6→#f6e8c8`, `#cfa64a` border, punched semicircles at both ends, price after a dashed divider. Money copy stays plain per brand voice §6.
- **DOM/leaderboard row**: rank (Georgia, brass for #1, `#8b81ad` otherwise) · 36–46px round thumb · name (600) + "Breed · by owner" caption · count + "bones" label.
- **Chat**: dark dock; usernames `--lavender-on-dark`, bot `sir_barks_alot` in `--gold-text` italic, bone events in `#ffb27d` with bone glyph; input pill 44px; Send is `--bone`.
- **Modals** (register/top-up/entry): single style — `--bg-card`, 16px radius, YangBagus title, plain-language money copy, orange confirm, borderless "No thanks".

## 6. Voice notes (from brand-voice.md — already applied in mocks)

- No emoji in UI. Bone glyph is an SVG icon.
- "A bone is a vote" phrasing lives inside the top-up modal and DOM card subtitle, not as a standalone education strip.
- Conversion surfaces stay plain: "Get more bones · 250 for $1.99", "Enter Your Dog — Free".

## 7. Suggested build order

1. Token swap in `style.css` (`:root`) + nav.js colors — instant sitewide calm-down.
2. Show page restructure (mobile first), delete retired modules from `show.html`/`app.js`.
3. Desktop rail at ≥1024px.
4. Landing, leaderboard, dogs, breeds — mostly CSS + section reshuffles, content unchanged.
