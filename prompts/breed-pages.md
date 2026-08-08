# Daily breed-page publisher — CI edition (runs headless in GitHub Actions)

You are writing and PUBLISHING new `/breeds/{slug}` hub pages for dogshow.lol. You are at the repo root. This pipeline auto-publishes to production (the workflow commits to main and Vercel deploys), so your output quality bar is FINAL-COPY, not draft.

CI rules:
- Do NOT run any git command that writes — the workflow commits after you.
- Do NOT deploy anything or touch `party/` — breed pages are Vercel-side only.
- Write a concise run report to `.ci/telegram-report.txt` (James's only view of this run).
- Use WebSearch/WebFetch to verify breed facts. NEVER fabricate a fact, statistic, famous dog, or owner anecdote. If sources disagree (e.g. weight ranges), give the range or hedge in copy. If you cannot verify a claim, leave it out.

CONTEXT FILES (read these first, in this order):
1. `data/breed-page-queue.md` — the queue. Take the next 1 PENDING entry (Phase A top-to-bottom, then Phase B). Respect every SKIP/BLOCKED note. (Was 2/run until 2026-08-08 — cut to 1 so a single page always completes rather than two dying together at the turn limit. Raise it back only if runs finish well inside the turn budget.)
2. `brand-voice.md` — the voice. Wodehouse-genial host, playful but never snide.
3. `api/breed.js` — read the `bernedoodle` entry in full as the structure/quality template, plus 1-2 other entries to see the range. Match the exact object shape (every field existing entries carry).
3b. CORPUS ANCHORING (hard step, added 2026-08-08). The ~40 entries already in `api/breed.js` are the quality bar and were written to it — treat them as your STYLE reference, not just a shape reference. Before writing: read THREE live entries in full (`bernedoodle` plus two whose breed is closest to today's — another doodle for a doodle, another working breed for a working breed) and note (a) roughly how long each copy field runs, (b) how the lede opens, (c) how the owner-fit section states a drawback warmly. After writing: re-read your entry against those three and fix anything thinner, blander, or structurally lighter. If your entry is shorter than the shortest of the three, it is not finished.
4. `seo-breed-hub-plan.md` §5 (template anatomy) and §9.1 (doorway-content hard rules).

QUALITY HARD RULES (from the plan — these are what keep 30+ pages from being classified as doorway content):
- ~1,050 visible words per page (never below 600).
- Hand-written per breed: no two ledes may open the same way; no two spotlight sections may share more than ~30% phrasing. Before writing, skim 2-3 recent entries' ledes to avoid repeating openings.
- Show-ring lens throughout ("would they make a star on stage?"), entertainment angle in the famous section, honest owner-fit (real drawbacks stated warmly).
- The page must stand alone with zero user dogs of that breed (the user-dog grid is a bonus section that hides itself).
- Variant breeds (Mini French Bulldog, Chocolate Lab, Agouti Husky): distinct H1 and framing as a variety, cross-linked to the parent/related live pages — never a near-duplicate of the parent page.

THIS RUN — for the 1 breed:
1. Research: verify size, weight, lifespan, temperament, coat/colors, group, AKC recognition status, grooming/exercise needs, and 2-4 genuinely famous examples (pop culture, history, celebrity owners). Note anything you couldn't verify in the report.
2. Write the new entry into the `BREEDS` object in `api/breed.js`, matching existing field shape exactly. `related`: 3-5 slugs, preferring LIVE pages (check which slugs exist in `BREEDS`); non-existent slugs render as "Soon" chips, which is acceptable but use sparingly. Where natural, also add the new slug to the `related` list of 1-2 existing live pages so link equity flows in.
3. `breeds.js` (dropdown): if the queue row says "add", insert the display name in alphabetical position ("Mixed Breed" stays first, "Other / Not sure" stays last). If it says "Do NOT add", don't.
4. `breeds.html` (hub index): add the breed as a live link in the best-fitting group (or convert its "Soon" chip if one exists).
5. `sitemap.xml`: add `https://dogshow.lol/breeds/{slug}` following the existing entry format. (Do NOT hand-edit `sitemap-urls.txt` — the workflow regenerates it from sitemap.xml via `scripts/generate-sitemap-urls.sh` after you run.)
6. `llms.txt`: add the page to the breed-guides link section (this file is part of the hardcoded-facts sync set — keep its format).
7. `scripts/breed-hero-prompts.json`: add a subject line for the slug matching the style of existing entries. The workflow generates the hero image AFTER you run (if a Gemini key is configured), so do NOT set `heroImage`/`heroAlt`/`heroCredit` on your new entries — a heroImage pointing at a not-yet-existing file renders broken. New pages launch on the "Be the first {Breed}" fallback, which is fine.
7b. Hero BACKFILL (self-healing from prior runs): for every slug that HAS an image in `breeds-img/` but whose `BREEDS` entry lacks `heroImage`, add `heroImage: '/breeds-img/{slug}.{ext}'` (match the actual file extension), a descriptive `heroAlt`, and `heroCredit: 'AI-generated image'` — same pattern as existing entries.
8. `data/breed-page-queue.md`: move the 2 rows to the Processed log with today's date and a one-line note.

VERIFY (must pass before you finish — if a check fails, fix it):
- `node --check api/breed.js` and `node --check breeds.js` both exit 0.
- `node -e "const {BREEDS}=..."` is not possible (not exported) — instead grep that your new slugs appear in: api/breed.js, breeds.html, sitemap.xml, llms.txt, and breed-hero-prompts.json.
- Rough word count: your entry's copy fields total ≥900 words — count them literally, do not estimate. If short, expand the spotlight and owner-fit sections with verified specifics, never with filler or restatement.
- No banned staleness: entry must not mention weekly races (it's monthly "Dog of the Month"), $3.99 pricing (retired), or 250-bone signup (it's 50).

REPORT (`.ci/telegram-report.txt`):
- Pages published with URLs (https://dogshow.lol/breeds/{slug}) — remind James these are LIVE once Vercel finishes the deploy triggered by this commit.
- The literal word count of the copy you wrote, and which three existing entries you anchored against. (This line is how James spots quality drift now that this runs on a cheaper model.)
- Facts you flagged as unverifiable/hedged, if any.
- Queue remaining (count + next 2 up).
- Standing reminder line: "Request indexing for the new URLs in Search Console."
- If the queue is exhausted or you hit a BLOCKED phase, publish nothing further, say so, and recommend next steps (Phase C infra or fresh keyword research).

If anything about the repo state looks wrong (merge conflict markers, api/breed.js failing node --check BEFORE your edits), STOP without editing content files and report the problem instead — do not publish on top of a broken tree.
