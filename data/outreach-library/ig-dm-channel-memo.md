# IG DM outreach — channel & automation memo (2026-07-15)

Decision input for the Best in Breed DM campaign. Bottom line: **no safe automation path exists for cold IG DMs; run it manually with the warm-first loop, prefer bio email when available.**

## 1. Official API: cold DMs are impossible
Meta's Instagram Messaging API only lets a professional account message a user **after that user messages first**, inside a 24-hour window that resets on each reply (narrow exceptions: human-agent tag, opt-in notifications). No API path initiates first contact — business or creator account alike. *(Source: Meta developer docs — high confidence.)*

## 2. Third-party tools — two camps
- **Official-API tools** (ManyChat, Inro, LinktoDM…): compliant, but structurally cannot cold-DM. They automate replies — comment-to-DM, story-mention triggers, keyword autoresponders.
- **Credential/browser-automation tools** (DMPro, AutoReacher, most "cold DM SaaS"): violate Meta ToS. A major enforcement wave hit these May–Aug 2025 (mass suspensions); Oct 2025 also cut API rate limits sharply. Using one on the brand account risks losing the account and the channel. *(Practitioner/SaaS blog sources — directionally consistent, self-interested.)*

## 3. Manual limits (folklore-grade — Meta publishes nothing)
- New account (<30–90 days): ~20–50 DMs/day reported safe; we cap at **15–20/day, ~5/hour**.
- Warmed account: ~50–100/day. Identical copy-paste text is itself a spam trigger — vary messages.
- First violation = 24–48h DM block; repeats escalate.
- **Deliverability is the real problem:** DMs to non-followers land in the Requests folder (~80% unread). A **story reply lands in the primary inbox**; prior follow + like/comment materially raises acceptance.

## 4. Legitimate alternatives (in priority order)
1. **Bio/linktree email** — most pet accounts >5K list one. No limits, fully compliant, feeds the existing Gmail-drafts pipeline. Check every profile for this FIRST.
2. **Story reply** — primary-inbox delivery, natural context.
3. **Cold DM** after day-1 follow/engage — the fallback.
4. **Creator Marketplace partnership messages** (Meta Business Suite) — official cold-contact channel, but only reaches creators who opted into the marketplace; patchy coverage of small pet accounts. Worth checking for the 100K+ accounts.

## Recommendation
Manual warm-first loop from the branded account (playbook lives in `dm-campaign-best-in-breed.xlsx`): Day 1 follow + genuine engagement, Day 2–3 story-reply or personalized DM, ≤20/day. Do not purchase any DM automation tool. Revisit only if Meta opens an official cold-outreach product beyond Creator Marketplace.
