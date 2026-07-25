# constitution/ — the canonical product-truth files

This directory is the **single home** for what is true about Dog Show: facts, voice,
and the manifest of which repo files are authoritative for which claim. Postwerks
(SCHEMESTUDIO/postwerks) generates all marketing from a **machine mirror** of this
directory — nothing here is ever edited on the Postwerks side.

**The one rule:** if a commit changes something these files state — a price, a
mechanic, a policy, the page inventory — update the matching file here **in the
same commit**. There is no second repo to remember, no same-day mirror step, no
verify-stamp ritual for anything a regex can pin. That replaced the manual
"M1 doc sync" protocol on 2026-07-25.

| File | Role |
|---|---|
| `facts.md` | Product facts + `## Never say` / `## Banned claims` (Postwerks `load_banned` contract: one bare `- phrase` per line) |
| `brand-voice.md` | Distilled voice card for module context (≤8k); distills the full guide at repo root |
| `sources.md` | Manifest: which repo file is authoritative for which claim, with verify stamps for regex-proof facts |
| `checks.json` | Machine-pinned values — code, facts.md, and this file must agree; enforced daily by the Postwerks `constitution-sync` workflow |

How it flows: push to `constitution/**` → `constitution-ping` workflow nudges
Postwerks (daily 07:45 UTC mirror as fallback) → Postwerks copies these files into
its `dogshow/` dir with a DO-NOT-EDIT banner → the drift checker verifies
`checks.json` against `party/server.js` / `terms.html` and scans every root
`*.html` + `llms.txt` for banned claims. A red run or ACTION ping names the exact
disagreement.

Postwerks-owned distribution config (`formats.md`, `community-map.md`, `style.md`,
the social "Judge" `compliance.md`, `seo.json`) stays in the Postwerks repo — that
is its territory, not this repo's.
