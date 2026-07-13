# Launch Posts — 2026-07-08

## Hacker News (Show HN)

**Title:**
Show HN: The Dog Show – a 24/7 live stream where dogs take the stage 10 seconds at a time

**Body:**

Hey HN, I built The Dog Show (https://dogshow.lol) — one shared live stream where community-submitted dogs take the stage one at a time, ~10 seconds each, while everyone watches and chats in the same room.

I wanted to build something completely pointless but weirdly compelling. Dogs on a stage. Strangers throwing virtual bones at the ones they like. That's basically it.

Bones are votes: each one buys the dog a little more time on stage (capped, or one very good boy would never leave) and counts toward the monthly race — the winner is crowned Best in Show. Entering a dog is free, and every dog gets a permanent certificate page with their stats and honors. Money only buys more bones, which felt like the honest version of pay-to-vote.

Tech: no framework — static HTML/JS on Vercel, with PartyKit (Durable Objects) running the rotation, chat, and bone ledger. Magic-link auth, Stripe, and a resnet-50 classifier that checks uploads are actually dogs before they hit the stage (it fails open as "Mystery Breed," which has produced some delightful entries). One of the chat regulars is Claude Haiku playing a genial English manor host — he refuses to say anything unkind about any dog.

Would love your take, especially on the bone economy — paid votes that extend screen time has failure modes I'm still thinking through.

---

## Product Hunt

**Name:** The Dog Show

**Tagline** (≤60 chars):
A 24/7 live dog show — every dog gets 10 seconds of fame

**Description** (~250 chars):
One shared live stream where community dogs take the stage for ~10 seconds each. Watch, chat, and throw bones (votes) at your favorites. Entering your dog is free — they get a permanent certificate page and a shot at the monthly Best in Show crown.

**Suggested topics:** Pets, Social Media, Entertainment

**First comment (maker):**

Hi Product Hunt! 👋

I built The Dog Show because the internet has infinite dog photos but nowhere you can watch dogs *together*, live, with strangers cheering in real time. So I made a stage.

How it works:

🐕 Community dogs rotate on stage, ~10 seconds each, 24/7
🦴 Throw bones at the ones you love — bones are votes, and they buy the dog extra time in the spotlight
🏆 The month's top dog is crowned Best in Show (a permanent honor on their certificate page)
📜 Every dog gets a shareable certificate page with their stats — great for the family group chat

Entering your dog is 100% free. You can buy extra bones to back your favorites, but nobody pays to enter.

My favorite detail: one of the chat regulars is an AI in character as a genial English manor host. He's contractually incapable of saying anything unkind about your dog.

I'd love to see your dogs on the stage today — and I'm around all day for questions. What would make you keep a dog show tab open? 🐾

---

## Posting notes

- **PH timing:** Product Hunt's day resets at 12:01am PT. Posting midday burns half the ranking window — scheduling for 12:01am PT tomorrow is the standard play if you want a shot at top 5.
- **HN timing:** best windows are roughly 6–9am PT on weekdays. Reply to every comment in the first 2 hours.
- **Bring a gallery for PH:** 3–5 screenshots (stage + chat, a certificate page, the leaderboard) and ideally a short screen recording. The promo video (`dogshow-promo-video.mp4`) can be repurposed.
- **Traffic warning:** a front-page hit means load on PartyKit chat/rotation and a spike in free registrations. Worth eyeballing Sentry during the window.
