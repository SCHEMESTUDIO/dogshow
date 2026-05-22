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
:root{--bg:#1a1035;--bg-card:#241a45;--accent:#FF8C42;--text:#e0d8f0;--dim:rgba(255,255,255,0.4);--gold:#FFD700;}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;}
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
<script async src="https://www.googletagmanager.com/gtag/js?id=G-V830P7PPHQ"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-V830P7PPHQ');</script>
<script src="/analytics.js" defer></script>
<style>${STYLES}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
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
<meta property="og:image" content="${esc(img)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="The Dog Show">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(name)} — The Dog Show">
<meta name="twitter:description" content="${esc(metaDesc)}">
<meta name="twitter:image" content="${esc(img)}">
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
<a class="cert-cta-btn" href="${SITE}">Watch The Dog Show Live</a>
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
