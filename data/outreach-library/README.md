# Outreach Prospect Library

Master index of breed-community outreach targets for dogshow.lol's backlink/quote campaign.
Built 2026-07-15 (tranche 1: 30 breeds, ~1,130 entries) via parallel web research.
This library FEEDS outreach processes (e.g. `breed-outreach.yml`); it is not itself a send list.

## Files

- `outreach-library-websites.csv` — sites with a contact route (email / contact form / none-found).
  Columns: breed_slug, name, type (club/rescue/blog/breeder/media/other), website_url,
  contact_method (email|form|none), contact_value, email_confidence, already_contacted,
  note, date_added, status.
- `outreach-library-social.csv` — Instagram + Facebook accounts/pages/groups.
  Columns: breed_slug, platform (IG|FB), account_name, profile_url, handle,
  followers_seen, note, date_added, status.

## Data-quality rules (how this was built — keep these for future tranches)

1. Every URL was actually seen in a search result or fetched page. Nothing constructed.
2. Emails recorded ONLY when literally seen: `email_confidence=high` = on a fetched page;
   `med` = search snippet only (re-verify before sending); never guessed or pattern-built.
3. `followers_seen` only when a number was visibly displayed — never estimated.
4. `already_contacted=yes` = the email or site domain matches `breed-outreach-list-and-template.md`
   / `outreach-staging-log.md` at build time. Kept in the library for completeness; skip for cold sends.
5. `status` lifecycle (edit as you go): new → drafted → sent → replied / declined / dead.

## Known caveats

- Social handles come from search results; expect some dead/renamed accounts (~5-10%).
- Contact-form-only prospects need the short message variant (see the outreach template doc).
- Some entries flagged in `note` need an activity check before outreach (e.g. 2019 roundup sources).
- FB groups can't be emailed — they're for James-as-member posts, not cold DMs.

## Coverage + replication plan

Tranche 1 (2026-07-15): the 29 live/queued breed-page breeds + dachshund partial.
Highest-yield pattern found: **AKC parent-club regional directories** (VCA vizsla table gave 32
clubs each with an email; FBDCA local clubs 15; BMDCA 28). For future tranches, mine the parent-club
directory FIRST for any AKC breed, then blogs/rescues/IG.
Follow-up sources logged but not yet mined: GSDCA dynamic club list, DCA secretaries PDF,
Dachshund Club of America Google-Sheet club list, AWMA's 44-club directory (emails obfuscated,
phones visible), Feedspot per-breed blog lists (emails masked — fetch each site directly).

Remaining: ~100 more breeds in breeds.js. At tranche-1 yield (~38/breed), a full sweep lands
~4,000–4,500 quality entries; the long tail past that trades quality for volume fast.
