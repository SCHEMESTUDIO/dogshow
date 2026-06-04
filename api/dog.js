// ─────────────────────────────────────────────────────────────────────────
// api/dog.js — Vercel serverless function. Server-renders the per-dog
// certificate page at /d/{slug} so search engines and social crawlers see
// real content + per-dog meta tags (audit #27 — the point of the Vercel
// migration). vercel.json rewrites /d/:slug → /api/dog?slug=:slug.
// ─────────────────────────────────────────────────────────────────────────
const PARTY = 'https://dogshow.schemestudio.partykit.dev/party/dogshow-live';
const SITE = 'https://dogshow.lol';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fmtTime(ms) {
  if (!ms || ms <= 0) return '0s';
  const secs = Math.round(ms / 1000);
  if (secs < 60) return secs + 's';
  return Math.floor(secs / 60) + 'm ' + (secs % 60) + 's';
}

function fmtDate(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) { return ''; }
}

function titlesFor(stats, breed) {
  const s = stats || {};
  const t = [];
  if ((s.totalBones || 0) >= 100) t.push('Bone Collector');
  else if ((s.totalBones || 0) >= 50) t.push('Fan Favorite');
  else if ((s.totalBones || 0) >= 10) t.push('Crowd Pleaser');
  if ((s.peakViewers || 0) >= 20) t.push('Audience Darling');
  if ((s.totalAppearances || 0) >= 3) t.push('Returning Star');
  if (breed && breed !== 'Mystery Breed') t.push('Certified ' + breed);
  if (t.length === 0) t.push('Good Dog');
  t.push('Dog Show Alumni');
  return t;
}

const STYLES = `
@font-face{font-family:'Yang Bagus';src:url('/YangBagus.ttf') format('truetype');font-display:swap;}
*{margin:0;padding:0;box-sizing:border-box;}
:root{--bg:#1a1035;--bg-card:#241a45;--accent:#FF8C42;--purple:#7B68EE;--text:#e0d8f0;--dim:rgba(255,255,255,0.4);--gold:#FFD700;}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;}
/* Pre-show (Phase 4) — countdown + RSVP */
.preshow{max-width:520px;margin:0 auto;padding:32px 20px 48px;text-align:center;}
.preshow-eyebrow{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--purple);margin-bottom:8px;}
.preshow-header{font-family:'Yang Bagus',serif;color:var(--accent);font-size:36px;margin-bottom:24px;}
.preshow-frame{position:relative;border:3px solid var(--purple);border-radius:12px;padding:6px;background:rgba(123,104,238,0.08);margin-bottom:20px;}
.preshow-frame img{width:100%;border-radius:8px;display:block;}
.preshow-dog-name{font-family:'Yang Bagus',serif;font-size:30px;margin-bottom:4px;}
.preshow-dog-meta{font-size:14px;color:var(--dim);margin-bottom:24px;}
.preshow-when{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:rgba(123,104,238,0.85);margin-bottom:6px;}
.preshow-time{font-family:'Yang Bagus',serif;font-size:22px;color:var(--text);margin-bottom:14px;}
.preshow-countdown{display:flex;justify-content:center;gap:10px;margin-bottom:24px;}
.preshow-count-cell{background:var(--bg-card);border:1px solid rgba(123,104,238,0.3);border-radius:10px;padding:14px 12px;min-width:64px;}
.preshow-count-num{font-size:28px;font-weight:700;color:var(--purple);line-height:1;}
.preshow-count-label{font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1.5px;margin-top:4px;}
.preshow-rsvp{background:var(--bg-card);border:1px solid rgba(123,104,238,0.2);border-radius:12px;padding:22px 18px;margin-bottom:20px;}
.preshow-rsvp-title{font-family:'Yang Bagus',serif;font-size:22px;color:var(--purple);margin-bottom:6px;}
.preshow-rsvp-sub{font-size:13px;color:rgba(224,216,240,0.7);margin-bottom:14px;}
.preshow-rsvp-form{display:flex;flex-direction:column;gap:8px;}
.preshow-rsvp-input{padding:12px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#f0e8ff;font-size:14px;font-family:inherit;}
.preshow-rsvp-input:focus{outline:none;border-color:var(--purple);}
.preshow-rsvp-btn{padding:12px 18px;background:var(--purple);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;}
.preshow-rsvp-btn:hover{background:#9384f0;}
.preshow-rsvp-btn:disabled{opacity:0.5;cursor:not-allowed;}
.preshow-rsvp-msg{font-size:12px;color:rgba(224,216,240,0.7);min-height:16px;}
.preshow-rsvp-msg.ok{color:#7B68EE;}
.preshow-rsvp-msg.err{color:#dc5050;}
.preshow-airingnow{background:linear-gradient(135deg,rgba(255,140,66,0.18),rgba(123,104,238,0.18));border:1px solid var(--accent);border-radius:12px;padding:18px;margin-bottom:18px;}
.preshow-airingnow-title{font-family:'Yang Bagus',serif;font-size:24px;color:var(--accent);}
.preshow-airingnow-sub{font-size:13px;color:rgba(224,216,240,0.85);margin:4px 0 12px;}
.preshow-watch-btn{display:inline-block;background:var(--accent);color:#1a1035;font-weight:700;font-size:15px;padding:12px 24px;border-radius:10px;text-decoration:none;}
@media(max-width:768px){.preshow{padding:20px 14px 32px;}.preshow-header{font-size:28px;}.preshow-count-cell{padding:10px 8px;min-width:54px;}.preshow-count-num{font-size:22px;}}
.certificate{max-width:600px;margin:0 auto;padding:24px 20px 40px;text-align:center;}
.cert-header{font-family:'Yang Bagus',serif;color:var(--accent);font-size:36px;margin-bottom:4px;}
.cert-subtitle{font-size:12px;color:var(--dim);letter-spacing:3px;text-transform:uppercase;margin-bottom:28px;}
.cert-frame{position:relative;border:3px solid var(--accent);border-radius:12px;padding:6px;background:rgba(255,140,66,0.05);margin-bottom:24px;}
.cert-frame img{width:100%;border-radius:8px;display:block;object-fit:cover;background:var(--bg-card);}
.cert-breed-badge{position:absolute;bottom:14px;left:14px;background:rgba(0,0,0,0.75);padding:6px 14px;border-radius:20px;font-size:12px;color:var(--accent);border:1px solid rgba(255,140,66,0.3);}
.cert-dog-name{font-family:'Yang Bagus',serif;font-size:28px;color:var(--text);margin-bottom:4px;}
.cert-owner{font-size:14px;color:var(--dim);margin-bottom:24px;}
.cert-owner strong{color:var(--accent);}
.cert-titles{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:24px;}
.cert-title-badge{background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);color:var(--gold);padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;}
.cert-stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;}
.cert-stat{background:var(--bg-card);border-radius:10px;padding:16px 12px;border:1px solid rgba(255,255,255,0.06);}
.cert-stat-value{font-size:26px;font-weight:700;color:var(--accent);line-height:1;margin-bottom:4px;}
.cert-stat-label{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;}
.cert-stat.full{grid-column:1/-1;}
.cert-date{font-size:13px;color:var(--dim);margin-bottom:28px;font-style:italic;}
.share{margin-bottom:28px;}
.share-label{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;}
.share-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
.share-btn{display:inline-block;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;color:#fff;border:none;cursor:pointer;font-family:inherit;}
.share-btn.fb{background:#1877F2;}.share-btn.x{background:#000;}.share-btn.wa{background:#25D366;}
.share-btn.copy{background:rgba(255,255,255,0.12);color:var(--text);}
.cert-cta-btn{display:inline-block;background:var(--accent);color:#1a1035;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;}
.cert-cta-sub{font-size:12px;color:var(--dim);margin-top:8px;}
.seo{max-width:700px;margin:0 auto;padding:40px 20px 60px;border-top:1px solid rgba(255,255,255,0.06);}
.seo h2{font-family:'Yang Bagus',serif;color:var(--accent);font-size:22px;margin-bottom:12px;}
.seo h3{font-size:16px;color:var(--text);margin:20px 0 8px;}
.seo p{font-size:14px;color:rgba(255,255,255,0.62);line-height:1.7;margin-bottom:12px;}
.seo a{color:var(--accent);text-decoration:none;}
.more-dogs{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin:16px 0 24px;}
.more-dog{background:var(--bg-card);border-radius:8px;padding:14px;text-align:center;text-decoration:none;border:1px solid rgba(255,255,255,0.06);}
.more-dog-name{font-size:13px;color:var(--text);font-weight:600;margin-bottom:4px;}
.more-dog-breed{font-size:11px;color:var(--dim);}
@media(max-width:768px){.certificate{padding:16px 14px 32px;}.cert-header{font-size:28px;}.cert-dog-name{font-size:24px;}.cert-stat-value{font-size:22px;}}
`;

function shell(headHtml, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${headHtml}
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<script src="/consent.js" defer></script>
<script src="/analytics.js" defer></script>
<style>${STYLES}</style>
</head>
<body>
${bodyHtml}
<footer style="text-align:center;padding:24px 16px;border-top:1px solid rgba(255,255,255,0.06);background:#0a0617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:flex;justify-content:center;gap:18px;flex-wrap:wrap;margin-bottom:8px;">
    <a href="/about" style="font-size:12px;color:#5a4d80;text-decoration:none;">About</a>
    <a href="/about#contact" style="font-size:12px;color:#5a4d80;text-decoration:none;">Contact</a>
    <a href="/dogs" style="font-size:12px;color:#5a4d80;text-decoration:none;">All Dogs</a>
    <a href="/privacy" style="font-size:12px;color:#5a4d80;text-decoration:none;">Privacy</a>
    <a href="#" data-cookie-settings style="font-size:12px;color:#5a4d80;text-decoration:none;">Cookie settings</a>
    <a href="/terms" style="font-size:12px;color:#5a4d80;text-decoration:none;">Terms</a>
    <a href="/dog-photo-contest" style="font-size:12px;color:#5a4d80;text-decoration:none;">Dog Photo Contest</a>
    <a href="/cutest-dog-contest" style="font-size:12px;color:#5a4d80;text-decoration:none;">Cutest Dog Contest</a>
    <a href="/puppy-picture-contest" style="font-size:12px;color:#5a4d80;text-decoration:none;">Puppy Picture Contest</a>
    <a href="/dog-show-near-me" style="font-size:12px;color:#5a4d80;text-decoration:none;">Dog Show Near Me</a>
  </div>
  <div style="font-size:11px;color:#3d2d6b;">The Dog Show &copy; 2026. All dogs are good dogs.</div>
</footer>
</body>
</html>`;
}

function renderPreShow(res, ctx) {
  const { dog, name, breed, owner, img, slug } = ctx;
  const url = `${SITE}/d/${encodeURIComponent(slug)}`;
  const shareImg = `${SITE}/api/og?slug=${encodeURIComponent(slug)}`;
  const slotAt = dog.slotAt || null;
  const hasSlot = !!slotAt;
  const slotIso = hasSlot ? new Date(slotAt).toISOString() : '';
  const knownBreed = breed && breed !== 'Mystery Breed';

  const metaDesc = hasSlot
    ? `${name} takes the stage on The Dog Show. Set a reminder so you don't miss it.`
    : `${name} is about to appear on The Dog Show. Watch live.`;

  // Server-rendered countdown placeholder values get filled by the inline
  // script on the client. The eyebrow + headline tell the story even before
  // JS runs (and for users with JS disabled — they still see who and when).
  const slotLabel = hasSlot
    ? new Date(slotAt).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
      })
    : 'Coming up next';

  const shareText = encodeURIComponent(
    hasSlot
      ? `${name} is on The Dog Show — tune in!`
      : `${name} just entered The Dog Show!`
  );
  const shareUrl = encodeURIComponent(url);

  const head = `<title>${esc(name)} on The Dog Show</title>
<meta name="description" content="${esc(metaDesc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(name)} — live on The Dog Show">
<meta property="og:description" content="${esc(metaDesc)}">
<meta property="og:image" content="${esc(shareImg)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="The Dog Show">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(name)} — live on The Dog Show">
<meta name="twitter:description" content="${esc(metaDesc)}">
<meta name="twitter:image" content="${esc(shareImg)}">`;

  // The countdown + RSVP form. RSVP posts to /rsvp with dogId; on success the
  // form swaps to a thank-you state. The script is intentionally vanilla and
  // small — no external deps.
  const body = `<div class="preshow">
<div class="preshow-eyebrow">${hasSlot ? 'Booked appearance' : 'Just entered'}</div>
<div class="preshow-header">The Dog Show</div>
<div class="preshow-frame"><img src="${esc(img)}" alt="${esc(name)}" width="500" height="500"></div>
<h1 class="preshow-dog-name">${esc(name)}</h1>
<div class="preshow-dog-meta">${esc(knownBreed ? breed : 'A good dog')} &middot; submitted by ${esc(owner)}</div>

${hasSlot ? `
<div class="preshow-when">On stage</div>
<div class="preshow-time" data-slot-iso="${esc(slotIso)}">${esc(slotLabel)}</div>
<div class="preshow-countdown" id="psCountdown" aria-live="polite">
  <div class="preshow-count-cell"><div class="preshow-count-num" id="psDays">—</div><div class="preshow-count-label">days</div></div>
  <div class="preshow-count-cell"><div class="preshow-count-num" id="psHours">—</div><div class="preshow-count-label">hrs</div></div>
  <div class="preshow-count-cell"><div class="preshow-count-num" id="psMins">—</div><div class="preshow-count-label">min</div></div>
  <div class="preshow-count-cell"><div class="preshow-count-num" id="psSecs">—</div><div class="preshow-count-label">sec</div></div>
</div>
<div class="preshow-airingnow" id="psLiveNow" hidden>
  <div class="preshow-airingnow-title">${esc(name)} is on stage now</div>
  <div class="preshow-airingnow-sub">Drop in before they're done.</div>
  <a class="preshow-watch-btn" href="${SITE}/show.html">Watch live &rarr;</a>
</div>
` : `
<div class="preshow-airingnow">
  <div class="preshow-airingnow-title">${esc(name)} is about to appear</div>
  <div class="preshow-airingnow-sub">No booked slot &mdash; they'll show up in the rotation any moment.</div>
  <a class="preshow-watch-btn" href="${SITE}/show.html">Watch live &rarr;</a>
</div>
`}

<div class="preshow-rsvp" id="psRsvp">
  <div class="preshow-rsvp-title">${hasSlot ? 'Set a reminder' : 'Get notified next time'}</div>
  <div class="preshow-rsvp-sub">${hasSlot
    ? "We'll email you an hour and 5 minutes before " + esc(name) + " takes the stage."
    : "Drop your email — we'll let you know when " + esc(name) + " appears."}</div>
  <form class="preshow-rsvp-form" id="psForm">
    <input class="preshow-rsvp-input" type="email" name="email" id="psEmail" placeholder="you@email.com" autocomplete="email" required>
    <button class="preshow-rsvp-btn" type="submit" id="psSubmit">Remind me</button>
    <div class="preshow-rsvp-msg" id="psMsg"></div>
  </form>
</div>

<div class="share">
<div class="share-label">Bring friends</div>
<div class="share-row">
<a class="share-btn fb" href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener">Facebook</a>
<a class="share-btn x" href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" target="_blank" rel="noopener">X</a>
<a class="share-btn wa" href="https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}" target="_blank" rel="noopener">WhatsApp</a>
<button class="share-btn copy" type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText('${url}');this.textContent='Copied!';">Copy Link</button>
</div>
</div>
</div>

<script>
(function(){
  var slotIso = ${JSON.stringify(slotIso)};
  var dogId = ${JSON.stringify(dog.id)};
  var partyBase = ${JSON.stringify('https://dogshow.schemestudio.partykit.dev/party/dogshow-live')};
  var siteUrl = ${JSON.stringify(SITE)};

  // ─── Countdown ─────────────────────────────────
  function tick(){
    if (!slotIso) return;
    var target = new Date(slotIso).getTime();
    var now = Date.now();
    var diff = target - now;
    var live = document.getElementById('psLiveNow');
    var cd = document.getElementById('psCountdown');
    if (diff <= 0) {
      if (cd) cd.style.display = 'none';
      if (live) live.hidden = false;
      return;
    }
    if (live) live.hidden = true;
    if (cd) cd.style.display = '';
    var s = Math.floor(diff / 1000);
    var d = Math.floor(s / 86400); s -= d * 86400;
    var h = Math.floor(s / 3600);  s -= h * 3600;
    var m = Math.floor(s / 60);    s -= m * 60;
    var el;
    if ((el = document.getElementById('psDays')))  el.textContent = d;
    if ((el = document.getElementById('psHours'))) el.textContent = String(h).padStart(2,'0');
    if ((el = document.getElementById('psMins')))  el.textContent = String(m).padStart(2,'0');
    if ((el = document.getElementById('psSecs')))  el.textContent = String(s).padStart(2,'0');
  }
  if (slotIso) { tick(); setInterval(tick, 1000); }

  // ─── RSVP form ─────────────────────────────────
  var form = document.getElementById('psForm');
  var msg  = document.getElementById('psMsg');
  var btn  = document.getElementById('psSubmit');
  var emailInput = document.getElementById('psEmail');
  if (form) {
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var email = (emailInput.value || '').trim();
      if (!email || email.indexOf('@') === -1) {
        msg.className = 'preshow-rsvp-msg err';
        msg.textContent = "That email doesn't look right.";
        return;
      }
      btn.disabled = true; btn.textContent = 'Setting…';
      msg.className = 'preshow-rsvp-msg';
      msg.textContent = '';
      fetch(partyBase + '/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, dogId: dogId })
      })
        .then(function(r){ return r.json().then(function(j){ return { ok: r.ok, body: j }; }); })
        .then(function(res){
          if (!res.ok || !res.body || !res.body.ok) {
            msg.className = 'preshow-rsvp-msg err';
            msg.textContent = (res.body && res.body.error) || 'Something went wrong.';
            btn.disabled = false; btn.textContent = 'Remind me';
            return;
          }
          // Persist credentials so when a NEW (logged-out) fan lands on the show
          // they're already authenticated with 250 bones. Never overwrite an
          // existing session: a logged-in owner who RSVPs to a dog must stay on
          // their own account (audit: RSVP session clobber).
          try {
            if (res.body.token && !localStorage.getItem('dogshow_token')) {
              localStorage.setItem('dogshow_token', res.body.token);
              localStorage.setItem('dogshow_email', email);
            }
          } catch (e) {}
          msg.className = 'preshow-rsvp-msg ok';
          if (res.body.airingNow) {
            msg.textContent = "They're on stage right now — heading to the show…";
            setTimeout(function(){ window.location.href = siteUrl + '/show.html'; }, 1200);
          } else if (res.body.alreadyAired) {
            msg.textContent = "They've already aired. You'll get a heads-up next time we run an event.";
          } else {
            msg.textContent = "You're on the list. We'll email you an hour and 5 minutes before.";
          }
          btn.textContent = "You're in!";
        })
        .catch(function(){
          msg.className = 'preshow-rsvp-msg err';
          msg.textContent = 'Network error. Try again.';
          btn.disabled = false; btn.textContent = 'Remind me';
        });
    });
  }
})();
</script>`;

  res.status(200);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Short cache: pre-show pages flip to post-show on first airing, so we
  // don't want stale countdowns sitting in CDN cache for long.
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60');
  res.send(shell(head, body));
}

function sendNotFound(res, code, msg) {
  const head = `<title>Dog not found — The Dog Show</title><meta name="robots" content="noindex">`;
  const body = `<div class="certificate"><div class="cert-header">The Dog Show</div>
<p style="color:rgba(255,255,255,0.45);margin:48px 0;">${esc(msg)}</p>
<a class="cert-cta-btn" href="${SITE}">Visit The Dog Show &rarr;</a></div>`;
  res.status(code);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(shell(head, body));
}

module.exports = async function handler(req, res) {
  const slug = (req.query && req.query.slug) ? String(req.query.slug) : '';
  if (!slug) return sendNotFound(res, 404, 'No dog specified.');

  let dog;
  let otherDogs = [];
  try {
    const rr = await fetch(`${PARTY}/resolve-slug?slug=${encodeURIComponent(slug)}`);
    const rd = await rr.json();
    if (!rd || !rd.ok || !rd.id) {
      return sendNotFound(res, 404, 'This dog could not be found — they may have left the show.');
    }
    const sr = await fetch(`${PARTY}/dog-stats?id=${encodeURIComponent(rd.id)}`);
    const sd = await sr.json();
    if (!sd || !sd.ok || !sd.dog) {
      return sendNotFound(res, 404, 'This dog could not be found — they may have left the show.');
    }
    dog = sd.dog;
    otherDogs = sd.otherDogs || [];
  } catch (e) {
    return sendNotFound(res, 502, 'We could not load this dog right now. Please try again shortly.');
  }

  const stats = dog.stats || {};
  const name = dog.dogName || 'A Good Dog';
  const breed = dog.breed || 'Mystery Breed';
  const owner = dog.username || 'Anonymous';
  const img = dog.imageUrl || (SITE + '/og-image.png');

  // Phase 4: state-aware rendering.
  //   firstAppearedAt === null → pre-show (countdown + RSVP)
  //   firstAppearedAt !== null → post-show (existing certificate)
  // Dogs without a slot but uploaded seconds ago are technically in pre-show
  // state for a brief window — that's fine, the page transitions on next page
  // load once they air. We treat the no-slot pre-show as "coming up next."
  const isPreShow = !dog.firstAppearedAt;
  if (isPreShow) {
    return renderPreShow(res, { dog, name, breed, owner, img, slug });
  }
  // Dedicated 1200x630 share image (Facebook / Twitter / LinkedIn optimal
  // ratio). api/og.tsx composites the dog photo into a branded frame so the
  // preview doesn't get cropped weirdly. Schema.org image stays as the raw
  // photo since structured-data consumers want the content image.
  const shareImg = `${SITE}/api/og?slug=${encodeURIComponent(slug)}`;
  const url = `${SITE}/d/${encodeURIComponent(slug)}`;
  const bones = stats.totalBones || 0;
  const appearances = stats.totalAppearances || 0;
  const peak = stats.peakViewers || 0;
  const avgViewers = appearances ? Math.round((stats.totalViewers || 0) / appearances) : 0;
  const knownBreed = breed && breed !== 'Mystery Breed';

  const metaDesc = `${name} appeared on The Dog Show` +
    (knownBreed ? ` — a ${breed}` : '') +
    `. ${bones} bone${bones !== 1 ? 's' : ''} received across ${appearances} appearance${appearances !== 1 ? 's' : ''}. ` +
    `View their certificate and watch the live online dog show.`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${name} — The Dog Show Certificate`,
    description: metaDesc,
    image: img,
    author: { '@type': 'Person', name: owner },
    publisher: { '@type': 'Organization', name: 'The Dog Show', url: SITE },
    datePublished: dog.uploadedAt ? new Date(dog.uploadedAt).toISOString() : undefined,
    mainEntityOfPage: url,
  };

  const head = `<title>${esc(name)} — The Dog Show Certificate</title>
<meta name="description" content="${esc(metaDesc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(name)} — The Dog Show">
<meta property="og:description" content="${esc(metaDesc)}">
<meta property="og:image" content="${esc(shareImg)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="The Dog Show">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(name)} — The Dog Show">
<meta name="twitter:description" content="${esc(metaDesc)}">
<meta name="twitter:image" content="${esc(shareImg)}">
<script type="application/ld+json">${JSON.stringify(schema)}</script>`;

  const titlesHtml = titlesFor(stats, breed)
    .map(t => `<span class="cert-title-badge">${esc(t)}</span>`).join('');

  const statsHtml = [
    [`🦴 ${bones}`, 'Bones Received'],
    [`🎬 ${appearances}`, 'Show Appearances'],
    [`👀 ${peak}`, 'Peak Viewers'],
    [`📊 ${avgViewers}`, 'Avg. Viewers'],
  ].map(s => `<div class="cert-stat"><div class="cert-stat-value">${esc(s[0])}</div><div class="cert-stat-label">${esc(s[1])}</div></div>`).join('')
    + `<div class="cert-stat full"><div class="cert-stat-value">⏱️ ${esc(fmtTime(stats.totalScreenTime || 0))}</div><div class="cert-stat-label">Total Screen Time</div></div>`;

  const dateLine = stats.firstAppearance
    ? `First appeared ${fmtDate(stats.firstAppearance)}`
    : `Uploaded ${fmtDate(dog.uploadedAt)} — awaiting first appearance`;

  const shareText = encodeURIComponent(`Check out ${name} on The Dog Show! 🐕`);
  const shareUrl = encodeURIComponent(url);

  const moreDogsHtml = (otherDogs || []).slice(0, 12).map(d => {
    const href = d.slug ? `/d/${encodeURIComponent(d.slug)}` : `/dog.html?id=${encodeURIComponent(d.id)}`;
    return `<a class="more-dog" href="${href}"><div class="more-dog-name">${esc(d.dogName || 'A dog')}</div><div class="more-dog-breed">${esc(d.breed || 'Mystery Breed')}</div></a>`;
  }).join('');

  const aboutDog = `${esc(name)} is ${knownBreed ? 'a ' + esc(breed) : 'a dog'} who appeared on ` +
    `<a href="${SITE}">The Dog Show</a>, the live online dog show. ` +
    (bones > 0 ? `${esc(name)} has received ${bones} bone${bones !== 1 ? 's' : ''} from the audience` +
      (appearances > 1 ? ` across ${appearances} appearances` : '') + '. ' : '') +
    (peak > 0 ? `At peak, ${peak} viewers were watching ${esc(name)} live. ` : '') +
    `Submitted by ${esc(owner)}.`;

  const breedBlock = knownBreed
    ? `<h3>${esc(breed)} at The Dog Show</h3><p>${esc(breed)} dogs bring their own charm to The Dog Show. ` +
      `Every breed is welcome on the live stage, where viewers worldwide show their appreciation with bones. ` +
      `See more dogs and breeds on <a href="${SITE}">The Dog Show</a>.</p>`
    : '';

  const body = `<div class="certificate">
<div class="cert-header">The Dog Show</div>
<div class="cert-subtitle">Certificate of Appearance</div>
<div class="cert-frame">
<img src="${esc(img)}" alt="${esc(name)} — ${esc(breed)} on The Dog Show" width="560" height="560">
<div class="cert-breed-badge">${esc(breed)}</div>
</div>
<h1 class="cert-dog-name">${esc(name)}</h1>
<div class="cert-owner">submitted by <strong>${esc(owner)}</strong></div>
<div class="cert-titles">${titlesHtml}</div>
<div class="cert-stats">${statsHtml}</div>
<div class="cert-date">${esc(dateLine)}</div>
<div class="share">
<div class="share-label">Share this good dog</div>
<div class="share-row">
<a class="share-btn fb" href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener">Facebook</a>
<a class="share-btn x" href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" target="_blank" rel="noopener">X</a>
<a class="share-btn wa" href="https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}" target="_blank" rel="noopener">WhatsApp</a>
<button class="share-btn copy" type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText('${url}');this.textContent='Copied!';">Copy Link</button>
</div>
</div>
<div>
<a class="cert-cta-btn" href="${SITE}/show.html">Watch The Dog Show Live</a>
<div class="cert-cta-sub">Premium members can enter their own dog</div>
</div>
</div>
<div class="seo">
<h2>About ${esc(name)}</h2>
<p>${aboutDog}</p>
${breedBlock}
<h3>${esc(name)}'s Show Stats</h3>
<p>${esc(name)} has appeared in the live dog show ${appearances} time${appearances !== 1 ? 's' : ''}, ` +
  `spending ${esc(fmtTime(stats.totalScreenTime || 0))} on screen, and has received ${bones} bone${bones !== 1 ? 's' : ''} from the community. ` +
  `Every dog that appears on The Dog Show gets a permanent certificate page like this one.</p>
<h2 style="margin-top:32px;">More Dogs in The Show</h2>
<div class="more-dogs">${moreDogsHtml}</div>
<p style="text-align:center;"><a href="/dogs.html">Browse all dogs in The Dog Show &rarr;</a></p>
<p style="text-align:center;"><a href="/dog-photo-contest">Enter your dog in the Dog Photo Contest &rarr;</a></p>
<h3>About The Dog Show</h3>
<p>The Dog Show is a live, online dog-viewing experience where viewers watch dogs appear one at a time in a shared, real-time slideshow. Premium members upload their own dogs to appear in the show, earning bones from the community. Each dog gets a permanent certificate page documenting their moment in the spotlight.</p>
</div>`;

  res.status(200);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=600, stale-while-revalidate=86400');
  res.send(shell(head, body));
};
