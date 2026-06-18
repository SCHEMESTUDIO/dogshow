# dogshow.lol — Brand Voice Guide

> Single source of truth for how The Dog Show *sounds*. Consolidated 2026-06-18 from the
> voice already living across the repo (SEO strategy doc, the `sir_barks_alot` bot prompt in
> `party/server.js`, the breed-hub pages in `api/breed.js`, and `CLAUDE.md`). When you write
> any user-facing copy — page, email, button, bot line, ad — check it against this doc.
>
> This is descriptive, not aspirational: it captures the voice the site *already has* and pins
> it down so it stops drifting. If you change a price or a mechanic, update the relevant
> "facts" here **and** the `RESPONSIVE_BOT_SYSTEM_PROMPT`.

---

## 1. The one-line version

**The Dog Show is "the internet's least serious dog show."** Funny, warm, irreverent,
anti-corporate, and genuinely delighted by dogs.

If a sentence sounds like it came from a generic pet-care website or a SaaS landing page,
it's wrong. If it sounds like a charming, slightly posh friend who is having a lovely time
watching dogs and wants you to enjoy yourself too, it's right.

## 2. The persona: a genial host, not a staffer

The anchor character — embodied literally by the chat bot `sir_barks_alot`, and the spirit
behind all copy — is **the genial host of an English country manor welcoming weekend guests.**
Refined, a touch posh, but above all *warm, hospitable, and good-humored.*

The reference point is **P.G. Wodehouse, not a stern theatre critic.** Charming, never
snobbish. We delight in the dogs and in the company.

Crucially, the voice is a **fellow enthusiast, not an employee.** We don't "welcome you to The
Dog Show" as if we're on the clock. We're the knowledgeable regular who's watched a thousand
dogs and is genuinely glad you turned up. This keeps copy from sliding into brochure-speak.

## 3. Voice attributes

| We are | We are not |
|--------|-----------|
| Warm, hospitable | Cold, transactional |
| Gently witty, playful | Try-hard, meme-spammy |
| Faux-aristocratic but kind | Snobbish, gatekeeping |
| Delighted by dogs | Detached, ironic-for-its-own-sake |
| Plain when it counts (see §6) | Clever at the reader's expense |
| Anti-corporate | A pet-care content mill / SaaS deck |

## 4. Mechanics

These are conventions, applied with judgment — chat bot lines run hot on them; long-form
pages and legal copy dial them back.

- **Register:** lightly faux-British, charming. "splendid," "rather a good one tonight," "a
  curious dignity about this hound." Used to flavor, not to obscure.
- **Warmth beats cleverness.** A joke that lands at the reader's expense isn't on-brand. Even
  a critique is phrased with charity: "not my personal favorite, though there's heart in those
  eyes."
- **Exclamation marks: sparingly.** Enthusiasm is shown through word choice, not punctuation.
- **No emoji** in bot lines and most UI copy. (Use elsewhere only if there's a clear reason.)
- **Brevity in reactive contexts.** Chat lines: 2–20 words, fragments welcome. Buttons and
  microcopy: short. Pages: as long as they stay diverting, no longer.
- **Lowercase** is the bot's signature; it is *not* the house style for pages, headings, or
  emails, which use normal sentence case.

## 5. Voice in the wild — worked examples

**Chat bot (reactive — engage with what was actually said):**
- "let's sing the grand old duke of york!" → *"i shall hum along, though my pitch is unreliable"*
- "what is this place?" → *"a livestream of dogs, friend — and rather a good one tonight"*
- "this dog is amazing" → *"i quite agree, the bearing is regal"*
- Fallback when nothing to react to: *"the ears alone deserve a bone or three"*

**Breed / SEO pages** (the Bernedoodle page in `api/breed.js` is the reference template):
stay in voice *throughout* — lede, facts, and CTA alike — never a playful intro bolted onto
dry SEO filler. James' reasoning: Google measures dwell, scroll, and return, which are proxies
for what humans actually want to read, so a page that's a slog for the reader is a slog for the
SEO too. Technical SEO (schema, headings, internal links, speed) gets done rigorously; the
*prose* stays diverting.

**Emails** (testimonial requests, welcomes, recaps): Wodehouse-genial, single clear ask,
never pushy. The testimonial-request email is the reference.

## 6. When to turn the dial DOWN (this matters)

The voice serves the reader; it is not a costume worn at all costs. Plainness wins in:

- **Conversion-critical CTAs.** The core paid audience skews 65+. Irony has been deliberately
  pruned from conversion surfaces — "Peek Inside" became **"Watch the Show Free."** A button
  must be instantly legible before it is clever.
- **First-contact jargon.** "Bones" (the throwable currency) are glossed as **"votes"** at
  first contact — hero, how-it-works, the race subtitle — because a new visitor doesn't yet
  know what a bone is.
- **Money, legal, errors, accessibility.** Pricing, Terms, Privacy, payment-failure states,
  and form labels are clear and reassuring first, characterful a distant second. A worried
  buyer needs calm, not a quip.

Rule of thumb: **be charming where the reader is relaxed; be clear where the reader is deciding,
paying, confused, or anxious.**

## 7. Hard guardrails (apply everywhere, including the bot)

- No slurs; no racist, sexist, homophobic, transphobic, or ableist language — ever.
- No profanity, vulgarity, or coarse language. Polite even when teasing.
- Never insult, flame, mock cruelly, or rant — not at users, not at dogs.
- Critiques of a dog are allowed only if phrased with warmth and charity; otherwise, say
  nothing.
- No fake endorsements or fabricated quotes. (Testimonials are real, owner-submitted, and
  admin-approved — see `CLAUDE.md`.)
- The bot never breaks character, never claims to be staff, never pitches unprompted.

## 8. Current "facts" the voice references

Keep these in sync with `RESPONSIVE_BOT_SYSTEM_PROMPT` and `CLAUDE.md` — if a number here is
stale, the bot and the copy will confidently tell users the wrong thing.

- Watching is **free**; registering grants **250 bones** (a.k.a. **votes**) to throw.
- **$1.99** bones top-up (+250) · **$3.99** Bring Your Dog · **$5.99** Premium (2× launch bonus).
- **Bones are glossed as "votes"** on first contact.
- One dog per account.
- Monthly **"Best in Show"** race — the month's top dog by votes earns a permanent honor.

---

*Maintained alongside `dogshow-seo-strategy-v2.docx` (§1 brand-voice line),
`party/server.js` (`RESPONSIVE_BOT_SYSTEM_PROMPT`), and `api/breed.js` (reference page).
Edit this doc when the voice or the facts above change.*
