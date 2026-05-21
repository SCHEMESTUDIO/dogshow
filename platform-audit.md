# dogshow.lol — Platform Reliability Audit

**Generated:** 2026-05-19
**Scope:** Pre-paid-traffic reliability assessment. Identify every silent failure mode, security gap, and observability blind spot before scaling traffic via Bing Ads.
**Method:** Static analysis of repo + live endpoint probing. No load testing, no manual UI walk-through (that's step 5 of the 8-step audit plan — see §10).

---

## Executive Summary

**Headline:** the platform has multiple silent failure modes and effectively zero production observability. The Emily incident (paying customer stuck for 12 days, discovered only by chance) is a symptom, not an anomaly. There are also **two unambiguous security findings** that allow free tier upgrades and have nothing to do with the upload bug.

**Severity rollup:**

| Severity | Count | Examples |
|---|---|---|
| **Critical** | 6 | No payment verification on tier upgrade · Stripe session ID never passed · No webhook handler · Silent upload errors · No post-purchase email · No stuck-user monitoring |
| **High** | 7 | XSS via dog names + usernames · No rate limiting · No error tracking · AI classifier single point of failure · Email delivery failures invisible · Single-room PartyKit architecture · No structured logs |
| **Medium** | 6 | Token generation uses Math.random · Email hash collision possible · Image storage in DO has scaling limit · No backup of communityDogs · Console-only error logging · Magic link UX brittle |
| **Low** | 3 | No multi-region failover · No incident response process · No SLA targets |

**Do not launch paid ads before fixing Critical-1, Critical-2, Critical-3** (the payment-verification security gap). The remaining Criticals can be batched into the "step 3: ship critical fixes" phase (see §10).

---

## 1. Architecture Map

**Frontend** (static, hosted on GitHub Pages, custom domain `dogshow.lol`):
- HTML/CSS/JS in repo root (`index.html`, `show.html`, `dog.html`, etc.)
- Shared CSS (`style.css`, ~2300 lines)
- Show page logic (`app.js`, ~1400 lines)
- Analytics scaffold (`analytics.js`, UET + Clarity + helpers)

**Backend** (PartyKit, single-region, single-room):
- `party/server.js` (~1600 lines, single class)
- Stores everything in Cloudflare Durable Object storage (room.storage)
- Single room `dogshow-live` handles WebSocket + HTTP for ALL users

**External dependencies** (any of these going down = degraded or broken):

| Dependency | Use | Failure impact | Detection today |
|---|---|---|---|
| Stripe API | Payment | Checkout fails | Console.error only |
| Cloudflare Workers AI (resnet-50) | Dog detection | Upload silently rejected OR all dogs pass | None |
| dog.ceo API | Default dog images | Show eventually runs dry | None |
| Resend | Magic-link + admin emails | No login emails, no welcome | Console.error only |
| Google Analytics | Tracking | Analytics gap | Manual check |
| Bing UET / Microsoft Clarity | Paid traffic tracking | Conversion gap | Manual check (when configured) |
| Faurya Analytics | Attribution | Tracking gap | Manual check |
| PartyKit hosting | Everything backend | Site is dead | Manual / user complaints |
| GitHub Pages | Static site | Site is dead | Manual / user complaints |

**Where data lives** (CF Durable Object keys):
- `user:${userId}` — user records (email, tier, stripeCustomerId, etc.)
- `email:${normalizedEmail}` — reverse lookup userId
- `token:${token}` — session tokens (30-day expiry)
- `magic:${token}` — magic-link login tokens (15-min, single use)
- `img:${cdog_id}` — uploaded dog images (base64 data URLs, ~500KB each)
- `slug:${slug}` — slug → dog ID lookup
- `communityDogs` — full array of community dog records

---

## 2. User Flows Inventory

Every flow from entry point to outcome. Annotated with the code path.

**2.1 Free signup**
`index.html` → `openEmailModal('free')` → `submitEmail()` → `enterShow('free', email)` → POST `/register` with `tier='free'` → token stored in localStorage → redirect to `show.html`. No payment, no email confirmation.

**2.2 General signup ($1.99)**
`index.html` → email modal → `enterShow('general', email)` → POST `/create-checkout` → Stripe Checkout (hosted page) → `success.html?tier=general&email=X` → POST `/register` with `tier='general'` → token in localStorage → user can chat/bones but can't upload dog.

**2.3 Premium signup ($3.99)**
Same as 2.2 but `tier='premium'`. After register, user is "premium" and can upload a dog.

**2.4 Premium upload dog**
`show.html` → premium user sees upload button → file picker → image resized to 600px JPEG 0.7 → POST `/upload-dog` with `{ token, imageData, dogName }` → server validates session, premium tier, image size, runs AI classifier → if dog detected, stores image + slug + entry → broadcasts new community count.

**2.5 Watch the show**
`show.html` → WebSocket connects to PartyKit room → receives `sync`, `newdog`, `chat`, `bone`, `viewers`, `intermission`, `communityCount`, `totalFans` messages → renders dog rotation.

**2.6 Give bones / chat**
General+ tiers → button click → WebSocket send → server validates session → broadcasts to all.

**2.7 Share dog**
Buttons in share rail (`app.js:886`) → opens platform-specific share URL with `dogshow.lol/show.html` (just-fixed) or `dogshow.lol/d/{slug}` for dog certificate.

**2.8 View dog certificate**
`/d/{slug}` → `d.html` JS redirect → `dog.html?slug=X` → fetches `/resolve-slug?slug=X` → `/dog-stats?id=X` → renders certificate.

**2.9 Login (returning user)**
`login.html` → email entered → POST `/login` → server generates 15-min magic token → emails via Resend → user clicks link → `login.html?token=X` → POST `/verify` → 30-day session token issued.

**2.10 Fake-door interest capture**
Show page → house rotator → user clicks fake door → modal → email entered → POST `/register` with `tier='interest_<feature>'` → stored in user records.

---

## 3. Critical Findings

Each finding has a code citation, evidence, and concrete fix recommendation.

### Critical-1: Anyone can become a premium user without paying

**Code:** `success.html:277-280, 325-333` + `party/server.js:808-851`

**Evidence:**
- `success.html` reads `tier`, `email`, `session_id` from URL params. No verification.
- Calls `POST /register` with `{ email, tier, stripeCustomerId: sessionId }`.
- Server's `/register` handler trusts `tier` blindly: `tier: tier || 'general'`.
- There is NO server-side verification that a Stripe payment actually occurred for the claimed tier.

**Exploit:** visit `https://dogshow.lol/success.html?tier=premium&email=attacker@example.com`. Get a fully-provisioned premium account. Upload a dog. Free.

**Severity rationale:** revenue leak. Trivially discoverable by anyone who manipulates URLs. Probably not exploited yet because the URL is obscure — but as soon as anyone notices the success URL structure (e.g. by examining email confirmations or referrer URLs), this is wide open.

**Fix:** require Stripe session validation on the server side.
1. Change `success_url` template in `server.js:985` to include `&session_id={CHECKOUT_SESSION_ID}` (Stripe substitutes this).
2. Modify `success.html` to send the `session_id` to the server.
3. Add a new server endpoint `/verify-checkout` that calls Stripe API to confirm the session exists, is paid, and matches the claimed tier before registering.
4. Reject any `/register` call with `tier=general/premium` that doesn't come from a verified checkout flow (use a server-issued short-lived token).

**Effort:** ~4 hours. **Pre-launch blocker.**

---

### Critical-2: Stripe session_id is never passed to success.html

**Code:** `party/server.js:985`

```js
params.append('success_url', `${SITE_URL}/success.html?tier=${tier}&email=${encodedEmail}`);
```

**Evidence:** the Stripe success URL template does NOT include `{CHECKOUT_SESSION_ID}`. As a result, when Stripe redirects users to success.html, there's no session ID in the URL. `success.html:279` reads `params.get('session_id') || ''` → always empty string.

**Impact:** for every paying user since launch, `stripeCustomerId` has been `null` in the database. There is currently NO link between paid users in Stripe and registered users in the dogshow.lol DB. Reconciliation requires manual email matching.

**This is why Emily's stripeCustomerId was null.** It's null for everyone.

**Fix:** trivial — change `success_url` to include `&session_id={CHECKOUT_SESSION_ID}`. Stripe substitutes this token automatically. Combined with Critical-1's verification work, this gives full paid-user traceability.

**Effort:** ~30 minutes (one line + verification). **Pre-launch blocker.**

---

### Critical-3: No Stripe webhook handler

**Code:** searched all of `party/server.js` — no `/webhook` endpoint exists.

**Evidence:** the server doesn't process Stripe webhooks. Stripe sends webhooks for events like `charge.refunded`, `charge.dispute.created`, `payment_intent.payment_failed`, `customer.subscription.deleted`, etc. None of these reach the server.

**Impact:**
- User pays, gets premium tier. Stripe dispute. Stripe reverses the charge. User keeps premium tier indefinitely.
- User pays, premium tier provisioned. Some flow goes wrong, payment fails after success.html loads. User keeps premium tier.
- No automated revenue reconciliation.

**Fix:** add `POST /stripe-webhook` endpoint. Verify webhook signature using Stripe webhook secret. Handle `charge.refunded` → downgrade user tier. Handle `charge.dispute.created` → flag user for review. Configure webhook in Stripe dashboard pointing to dogshow.lol → PartyKit.

**Effort:** ~3 hours (endpoint + signature verification + Stripe dashboard config + testing in Stripe test mode). **Recommended pre-launch.**

---

### Critical-4: Silent upload errors via alert()

**Code:** `app.js:1103-1108`

```js
function showUploadStatus(msg, isError) {
  if (isError) {
    alert(msg);
  }
}
```

**Evidence:** every upload error path (1-per-member limit, AI rejection, image size, session invalid, network error) shows a native `alert()` dialog. Native alerts get dismissed quickly, blocked by some browsers, or missed entirely on mobile. The upload button does NOT show a persistent error state.

**Known impact:** Emily's upload almost certainly hit one of these alerts and she missed it. She's been stuck for 12 days.

**Fix:** replace `alert()` with a persistent inline error UI inside the dock area. Style as an error pill with the message and a "try again" button. Don't auto-dismiss; require user dismissal. Also: emit the specific error label (`upload_error_classifier_rejected`, `upload_error_image_too_large`, etc.) to UET + GA4 so we can monitor.

**Effort:** ~1.5 hours. **Pre-launch blocker.**

---

### Critical-5: No post-purchase confirmation email

**Code:** no code exists for this; `success.html` doesn't trigger any email.

**Evidence:** user pays → arrives at `success.html` → page renders celebratory content → user closes the tab → no email sent. If user pays and forgets to upload, there's no follow-up. The system silently keeps a premium user with no dog.

**Known impact:** Emily fits this pattern — paid, didn't complete the upload, no nudge.

**Fix:** trigger a Resend transactional email when `/register` succeeds with `tier='premium'` (and `tier='general'`). Include:
- Confirmation of purchase
- Direct link to show.html with prompt to upload
- Their dog's eventual URL (`dogshow.lol/d/<slug>` — once they upload)
- A second reminder 24h later if no upload received

The infrastructure exists — server already uses Resend for magic links (`sendMagicLinkEmail`). Reuse that pattern.

**Effort:** ~2 hours (first email + 24h reminder cron). **Pre-launch blocker.**

---

### Critical-6: No periodic stuck-user detection

**Status:** partially mitigated.

**Evidence:** `/admin-audit` endpoint now exists (built today). But nothing automatically runs it. Stuck users still go unnoticed unless a human queries the endpoint.

**Fix:** add a daily cron (could be a PartyKit alarm, a GitHub Action, or a Vercel scheduled function once migrated) that queries `/admin-audit` and emails James if `stuckPremiumCount > 0`. Include the user list in the email so action can be taken immediately.

**Effort:** ~1 hour. **Pre-launch blocker.**

---

## 4. High-Severity Findings

### High-1: XSS via dog names and submittedBy in nameplate

**Code:** `app.js:560, 588, 595`

```js
nameplate.innerHTML = '<div class="dog-nameplate-label">Now presenting</div><div class="dog-nameplate-name">' + data.currentDog.name + '</div><span class="community-badge">submitted by ' + data.currentDog.submittedBy + '</span>';
```

**Evidence:** dog name and username are interpolated directly into innerHTML on every dog rotation. If a user uploads a dog with `dogName = '<img src=x onerror=alert(1)>'` it would execute on every viewer's browser.

**Server sanitization** at `server.js:671-673`:
```js
sanitize(str) {
  return str.replace(/[<>&"']/g, '');
}
```

Dog names ARE sanitized via this function before storage (`server.js:1063`). That's solid — strips all HTML-significant chars.

**But: usernames are NOT sanitized through `sanitize()`.** Check `handleSetUsername` (`server.js:911+`) — usernames go to storage without passing through `sanitize`. A malicious user could set their username to `<script>...</script>` and it would render via innerHTML on every show page.

**Fix:** apply `sanitize()` to usernames in `handleSetUsername`. Audit all innerHTML sites in `app.js` and `dog.html`/`dogs.html` for similar issues. As a defense-in-depth measure, switch interpolation from innerHTML to textContent where possible.

**Effort:** ~2 hours.

---

### High-2: No rate limiting anywhere

**Evidence:** searched server.js for `rateLimit`, `throttle` — zero matches. No middleware. Every public endpoint (`/register`, `/login`, `/upload-dog`, `/create-checkout`, all read endpoints) accepts unlimited requests per IP.

**Abuse vectors:**
- Spam `/register` to create thousands of accounts (would also trigger admin emails via `sendAdminSignupNotification`)
- Spam `/login` to flood Resend with magic-link emails (eats your Resend quota)
- Spam `/create-checkout` to create Stripe sessions at our cost (Stripe rate-limits eventually but at our quota)
- Spam `/upload-dog` to flood the AI classifier and DO storage

**Fix:** add per-IP rate limiting at the room level. PartyKit doesn't have built-in middleware but easy to roll our own using DO storage with sliding-window counters per IP. Suggested limits:
- `/register`, `/login`: 5/minute per IP
- `/create-checkout`: 3/minute per IP
- `/upload-dog`: 2/minute per IP, 5/day per IP

**Effort:** ~3 hours.

---

### High-3: No error tracking / alerting

**Evidence:** all error handling uses `console.error`. PartyKit prints these to its log stream, which is only visible via `npx partykit tail` and is not retained long-term. No alerting on error spikes.

**Impact:** errors happen, we never know unless we're actively tailing logs.

**Fix:** add Sentry (free tier covers our scale). Sentry has both browser-side (catch JS errors in app.js, etc.) and server-side integrations. Configure alert rules: any new exception type → email; >10 errors/minute → page James.

**Effort:** ~2 hours (account setup + DSN + integration).

---

### High-4: AI classifier is a single point of failure

**Code:** `party/server.js:1394-1449`

**Evidence:** every paid upload runs through `classifyDogImage`. The classifier uses Cloudflare Workers AI (resnet-50). Two failure modes:

a) **Hard failure** (line 1445-1448): if `ai.run` throws, the code "fails open" and marks every image as a dog with `breed: 'Mystery Breed'`. This is the right safe behavior — doesn't lose customers — but masks the outage.

b) **Soft failure** (line 1430-1444): if AI returns results but no dog keyword scores >0.05, image is rejected. This threshold is permissive on the positive side but legitimate dog photos with unusual framing or lighting could still fail.

**Detection:** if AI is down, every image becomes "Mystery Breed" — observable in the data but you have to look. If AI is rejecting legitimate dogs, those users see "We can't tell if that's a picture of a dog" alert and disappear — invisible.

**Fix:**
- Log classifier outcome (`success`, `rejected_no_dog`, `failed_open`) as a structured event
- Track rejection rate over time; alert if it spikes
- Add a "retry / manual review" path: if classifier rejects, save the image to a review queue + email James for manual approval. Don't lose the user.

**Effort:** ~3 hours.

---

### High-5: Email delivery failures are silent

**Code:** `server.js:468, 535, 846, 1508, 1536, 1540, 1545, 1556`

**Evidence:** all email sending (magic link, admin signup notification, appearance email) checks `RESEND_API_KEY` and either skips with `console.error` or fails silently on send. No retry. No queue. No monitoring of delivery rate.

**Failure scenarios:**
- `RESEND_API_KEY` expired/revoked → ALL emails silently skipped. Users can't log in.
- Resend service outage → emails fail. No retry.
- Email lands in spam → user never receives.

**Fix:**
- Implement a simple retry queue: failed emails go to `failed_emails:${timestamp}` storage. Cron retries them every 5 minutes for up to 1 hour.
- Add a /admin-audit field for `failedEmailsCount` so we can see when it's growing.
- For magic links specifically, also display the link in the success response (only for the user themselves) so they can copy it as a backup.

**Effort:** ~3 hours.

---

### High-6: Single-room PartyKit architecture (single point of failure)

**Evidence:** all users connect to the same room `dogshow-live`. This includes all WebSocket connections, all storage, all HTTP requests. If the room hits a resource limit (CPU, memory, storage), the entire site degrades or goes offline.

**Impact:** at 100 concurrent users, probably fine. At 1000+, unknown. Cloudflare Durable Objects have soft limits we haven't tested against.

**Fix (defer until scale):** room sharding. Split users across multiple rooms by ID hash. Requires careful design of how cross-room state (leaderboard, etc.) is aggregated.

**Effort:** ~2 days (significant refactor). Not blocking pre-launch but worth scoping.

---

### High-7: No structured logging

**Evidence:** logs are `console.log` / `console.error` with prefix tags like `[Stripe]`, `[Email]`. Useful when tailing live but no search, no aggregation, no historical analysis. Hard to answer "how many upload failures in the past week."

**Fix:** at minimum, add structured JSON logging (one log line per significant event with fields `event`, `userId`, `tier`, `outcome`, `error`, etc.) so we can grep + parse the tail output. Better: ship logs to an aggregator (Logtail, Axiom, CloudWatch).

**Effort:** ~3 hours for structured logging refactor.

---

## 5. Medium-Severity Findings

### Medium-1: Token generation uses Math.random()

**Code:** `server.js:1463-1470`

```js
generateToken(prefix) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix + '_';
  for (let i = 0; i < 32; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
```

**Evidence:** `Math.random()` is not cryptographically secure. For session tokens (30-day expiry) and magic-link tokens (15-min, single use), this means tokens could theoretically be predicted by an attacker who has captured a few sample tokens.

**Practical risk at current scale:** very low. Brute-force token guessing would require ~10^48 attempts on average (36^32 keyspace). But the predictability of Math.random is a real concern at any scale.

**Fix:** use `crypto.getRandomValues` (available in Cloudflare Workers runtime).

```js
const bytes = new Uint8Array(32);
crypto.getRandomValues(bytes);
let result = prefix + '_';
for (const b of bytes) result += chars[b % chars.length];
```

**Effort:** ~15 minutes.

---

### Medium-2: Email-to-userId hash uses simple 32-bit hash

**Code:** `server.js:1496-1505`

**Evidence:** the userId is derived from a 32-bit hash of the email (base36-encoded). Two different emails could theoretically map to the same userId (hash collision).

**Practical risk:** birthday paradox says ~50% collision probability at sqrt(2^32) ≈ 65,000 users. So at 65k users we'd expect a collision. Unlikely to happen at small scale but inevitable at scale.

**Fix:** use SHA-256 truncated, or just use a UUID and store email→userId lookup separately (which we already do via `email:${normalizedEmail}` key). Strictly speaking, userIds don't need to derive from emails at all — UUID v4 would work and eliminate collisions entirely.

**Effort:** ~30 minutes + careful migration (changing userId scheme for new users only is safe; existing users keep their old IDs).

---

### Medium-3: Image storage in Durable Object has scaling limits

**Evidence:** every uploaded dog image is stored as base64 in CF Durable Object storage at `img:${id}`. CF DO has a 128KB per-key soft limit and overall storage limits per DO. Base64 of 500KB image = ~700KB string. Already over limit! Wait — let me re-check: CF DO key/value limit is 32MiB per VALUE but smaller per key for performance reasons.

**Practical risk:** at 1000+ dogs, performance reads from DO storage may degrade. At 10,000+, hitting limits is likely.

**Fix:** offload images to Cloudflare R2 (object storage) when count exceeds ~500. Store only the R2 URL in DO storage. R2 is cheap (~$0.015/GB/month) and has effectively unlimited per-object storage.

**Effort:** ~4 hours (R2 setup + upload-time migration + serve via R2 URLs).

---

### Medium-4: No backup of communityDogs

**Evidence:** all dog data lives in PartyKit DO storage. PartyKit is built on Cloudflare Durable Objects which are durable (replicated, persisted) — generally reliable. But:
- Config error / accidental deletion → data loss
- Account compromise → data loss
- PartyKit / CF account suspension → site dead AND data gone

**Fix:** periodic export of `communityDogs` to off-platform storage (S3, R2 in different account, or just an emailed JSON dump weekly). Add a `/admin-export` endpoint that returns the full state as JSON; cron downloads it weekly.

**Effort:** ~2 hours.

---

### Medium-5: Magic link UX is brittle

**Evidence:** magic link tokens are valid for 15 minutes and single-use. If email is delayed (some providers add 5-30 min delays during high volume), the link may expire before the user clicks. If user clicks twice (e.g., on phone then desktop), second click fails with "invalid or expired" — confusing.

**Fix:**
- Extend magic link expiry to 60 minutes
- Allow magic link to be reused once (still mark used after second click; prevents replay but tolerates double-click)
- Show clearer error: "This link has expired. [Request a new one]" with one-click resend

**Effort:** ~1 hour.

---

### Medium-6: Console-only error logs cannot survive a PartyKit restart

**Evidence:** PartyKit may restart the room periodically (deploys, resource cleanup). When the room restarts, in-memory log buffer is gone. Persistent log analysis requires `npx partykit tail` running 24/7, which nobody does.

**Fix:** see High-7 (structured logging to aggregator).

---

## 6. Observability Gaps

What we CAN see today (with effort):
- Total users registered
- User counts by tier (via /admin-audit now)
- Total community dogs
- Total bones thrown
- Stuck premium users (via /admin-audit now)
- Live chat (visible in WebSocket stream)

What we CANNOT see today:
- Upload attempt rate (success vs failure breakdown)
- AI classifier rejection rate
- Email delivery success rate (Resend has a dashboard but unmonitored)
- Stripe checkout abandonment (users who started checkout but didn't pay)
- Time from payment to upload (the Emily gap)
- Magic-link delivery success
- Error rate by endpoint
- Slow request rate
- WebSocket connection failure rate
- Conversion rate by traffic source (we have analytics but no link to upload outcome)

**Critical detection gaps (would not detect):**
- Stripe webhook event indicating refund/dispute
- AI classifier returning all-fails for an hour
- Resend API key expired
- DO storage hitting limits
- A user paying but never uploading

---

## 7. Recommended Fixes — Top 10 by ROI

In priority order:

1. **Critical-1 + Critical-2 combined**: Add Stripe session ID to success URL + verify server-side. Eliminates free-premium-account exploit + creates real Stripe↔user linkage. ~4.5 hours. **PRE-LAUNCH BLOCKER.**

2. **Critical-4**: Replace upload `alert()` with persistent inline error. Catches future Emily-style incidents at the UX layer. ~1.5 hours. **PRE-LAUNCH BLOCKER.**

3. **Critical-5**: Post-purchase confirmation email with upload prompt. Recovers users who pay-and-forget. ~2 hours. **PRE-LAUNCH BLOCKER.**

4. **Critical-6**: Daily stuck-user reconciliation cron. Backstop for any remaining silent failures. ~1 hour. **PRE-LAUNCH BLOCKER.**

5. **Critical-3**: Stripe webhook handler for refunds/disputes. Prevents stale premium tier after refund. ~3 hours. **Strongly recommended pre-launch.**

6. **High-3**: Sentry for error tracking. Critical for diagnosing whatever breaks during the trial. ~2 hours. **Pre-launch.**

7. **High-2**: Rate limiting on register/login/upload/checkout. Anti-abuse + cost control. ~3 hours. **Pre-launch if going beyond £50/day spend.**

8. **High-1**: Sanitize usernames + audit innerHTML interpolation for XSS. ~2 hours. **Pre-launch.**

9. **High-5**: Email retry queue + delivery monitoring. ~3 hours. **Within first month after launch.**

10. **Medium-1**: crypto.getRandomValues for token generation. ~15 minutes. **Quick win, any time.**

**Total pre-launch effort:** ~16-18 hours of focused work. Roughly 2-3 days of my time, ready for paid traffic with confidence.

---

## 8. Methodology Notes

This audit was performed via static analysis of the codebase + live endpoint probing. Specifically:
- Read every handler in `party/server.js`
- Read upload flow, share flow, modal flows in `app.js`, `index.html`, `success.html`, `show.html`, `dog.html`
- Probed `/all-dogs`, `/landing-stats`, `/community-count`, `/leaderboard`, `/admin-audit` for data shape
- Cross-referenced findings against the Emily incident as a ground-truth case

This audit did NOT include:
- Load testing under concurrent users
- Penetration testing of authentication / session flows
- Browser compatibility testing
- Performance / latency measurement
- Manual UX walk-through of every flow (that's step 5 — see §10)

These should be performed before scaling beyond £50/day ad spend or 1000 concurrent users.

---

## 9. Appendix: Confidence Levels

| Finding | Confidence |
|---|---|
| Critical-1 (no payment verification) | High — verified in code |
| Critical-2 (no session_id) | High — verified in code |
| Critical-3 (no webhook) | High — searched entire server.js |
| Critical-4 (silent alerts) | High — verified in code + Emily incident |
| Critical-5 (no post-purchase email) | High — verified by absence |
| Critical-6 (no stuck-user cron) | High — verified by absence |
| High-1 (XSS) | Medium — code path looks exploitable but not tested with real payload |
| High-2 (no rate limit) | High — verified by absence |
| High-3 (no error tracking) | High — verified by absence |
| High-4 (AI classifier SPOF) | High — verified in code |
| High-5 (silent email failures) | High — verified in code |
| High-6 (single-room arch) | Medium — works at current scale, unknown at 1000+ |
| High-7 (no structured logs) | High — verified |
| Medium-1 (Math.random) | High — verified |
| Medium-2 (hash collision) | High — verified, math is uncontroversial |
| Medium-3 (DO storage limits) | Medium — based on CF docs, not empirically tested |
| Medium-4 (no backup) | High — verified by absence |
| Medium-5 (magic link brittle) | Medium — UX intuition not validated by user complaints yet |
| Medium-6 (logs ephemeral) | High — CF Workers architecture |

---

## 10. Remediation Plan (8 steps — type safety + tests added 2026-05-21)

The audit references a "6-step plan" throughout but never enumerates it. This section fixes that and folds in two engineering-hardening steps (type safety, automated tests) added 2026-05-21. All steps are mine except step 5 (James — real-device testing).

1. **Write this audit.** ✅ Complete 2026-05-19.

2. **Type-check `party/server.js`.** Add a `// @ts-check` pragma + JSDoc annotations so `tsc`/VS Code type-check the file with zero build step and zero runtime change. PartyKit ships TypeScript types, so connection/room/storage shapes get checked. `server.js` is one self-contained ~1600-line file — a good candidate. Catches property typos, wrong-shape objects, null dereferences. ~3–4 hours. Run before step 3 so the critical fixes land on type-checked code.

3. **Ship the 6 Critical fixes** (Critical-1 → Critical-6; see §3, §7). The pre-launch blockers. ~16–18 hours. Was "step 2."

4. **Add an automated test layer.** Two narrow, high-value pieces: (a) `node:test` unit tests (built into Node — zero new dependencies) for the pure logic in `server.js`: slug generation, `sanitize()`, the splice queue-jump index math, tier gating; (b) one critical-path smoke test running register → Stripe test-mode checkout → webhook → dog-appears against PartyKit dev. The smoke test is the highest-value test here — it exercises exactly the path that failed Emily — and it depends on the webhook built in step 3. ~half a day.

5. **Manual end-to-end test pass (James).** Real devices, real browsers, every flow in §2. Was "step 3."

6. **Triage + fix remaining findings** (High + Medium). Was "step 4."

7. **Migrate to Vercel.** Per-dog dynamic OG + SEO indexability. Was "step 5." Note: the migration introduces a build step — once that cost is paid, frontend TypeScript becomes cheap, so defer any frontend type-safety decision until after this step.

8. **Re-spot-check post-migration.** Was "step 6."

**Scoping rationale for steps 2 and 4.** Neither type safety nor tests targets the bug class behind the actual incidents: Riley was a product-logic mismatch, Emily was a set of Stripe integration gaps — a type checker sees valid strings in both cases, and a unit test only catches the forged-tier exploit if someone first threat-models it (which is what this audit did, not TDD). The highest-leverage reliability work remains the Stripe webhook + stuck-user monitoring (Critical-3, Critical-6) — those catch failures in production with real users, where every incident so far has lived. Type safety and tests are a cheaper secondary layer that locks in fixes and prevents regressions. **Deliberately excluded:** a full TypeScript migration of the multi-page frontend (needs a build step the current architecture avoids — revisit after step 7) and dogmatic test-first TDD as a workflow (unrealistic for a solo founder shipping fast). Confidence: high that the scoped work is low-cost and correct; medium on how many latent bugs the type-check surfaces — unknown until run.

---

**End of audit document. Step 1 of the 8-step plan complete; step 2 (type-check) is next.**
