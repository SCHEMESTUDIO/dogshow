// Cloudflare Pages Function — serves dynamic OG meta tags for /d/:slug
// Social crawlers (Facebook, Twitter, etc.) get server-rendered HTML with proper og:tags
// Regular users get the normal dog.html SPA

const PARTY_API = 'https://dogshow.schemestudio.partykit.dev/party/dogshow-live';
const SITE_URL = 'https://dogshow.lol';

const CRAWLER_UAS = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
  'WhatsApp', 'Slackbot', 'TelegramBot', 'Discordbot',
  'Pinterest', 'Googlebot', 'bingbot', 'Embedly',
];

function isCrawler(ua) {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return CRAWLER_UAS.some(c => lower.includes(c.toLowerCase()));
}

function generateTitles(stats, breed) {
  const titles = [];
  if (stats.totalBones >= 100) titles.push('Bone Collector');
  if (stats.totalBones >= 50) titles.push('Fan Favorite');
  else if (stats.totalBones >= 10) titles.push('Crowd Pleaser');
  if (stats.peakViewers >= 50) titles.push('Showstopper');
  else if (stats.peakViewers >= 20) titles.push('Audience Darling');
  if (stats.totalAppearances >= 10) titles.push('Show Veteran');
  else if (stats.totalAppearances >= 3) titles.push('Returning Star');
  if (titles.length === 0) titles.push('Good Dog');
  return titles;
}

export async function onRequest(context) {
  const { params, request } = context;
  const slug = params.slug;
  const ua = request.headers.get('user-agent') || '';

  // Only intercept for social crawlers — everyone else gets the normal SPA
  if (!isCrawler(ua)) {
    // Fetch dog.html static asset and serve it (Pages Functions have ASSETS binding)
    const assetUrl = new URL('/dog.html', request.url);
    const res = await context.env.ASSETS.fetch(assetUrl);
    // Return with original URL so client-side JS picks up slug from URL
    return new Response(res.body, {
      status: res.status,
      headers: res.headers,
    });
  }

  // For crawlers: fetch dog data from PartyKit and serve rich OG tags
  try {
    // Resolve slug to ID
    const slugRes = await fetch(`${PARTY_API}/resolve-slug?slug=${encodeURIComponent(slug)}`);
    const slugData = await slugRes.json();
    if (!slugData.ok || !slugData.id) {
      return serveFallbackOG(slug);
    }

    // Fetch dog stats
    const statsRes = await fetch(`${PARTY_API}/dog-stats?id=${encodeURIComponent(slugData.id)}`);
    const statsData = await statsRes.json();
    if (!statsData.ok || !statsData.dog) {
      return serveFallbackOG(slug);
    }

    const dog = statsData.dog;
    const titles = generateTitles(dog.stats || {}, dog.breed);
    const bones = (dog.stats && dog.stats.totalBones) || 0;
    const appearances = (dog.stats && dog.stats.totalAppearances) || 0;
    const peakViewers = (dog.stats && dog.stats.peakViewers) || 0;
    const pageUrl = `${SITE_URL}/d/${slug}`;

    // Build a rich description with stats and titles
    const titleBadges = titles.join(' · ');
    const ogTitle = `${dog.dogName} — 🦴 ${bones} bones · The Dog Show`;
    const ogDesc = `${dog.breed || 'Mystery Breed'} · ${titleBadges} · ${appearances} appearance${appearances !== 1 ? 's' : ''} · ${peakViewers} peak viewers · Submitted by ${dog.username}`;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${esc(dog.dogName)} — The Dog Show Certificate</title>
<meta name="description" content="${esc(ogDesc)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(ogTitle)}">
<meta property="og:description" content="${esc(ogDesc)}">
<meta property="og:image" content="${esc(dog.imageUrl)}">
<meta property="og:image:width" content="600">
<meta property="og:image:height" content="600">
<meta property="og:image:alt" content="${esc(dog.dogName)} - ${esc(dog.breed || 'a good dog')} on The Dog Show">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:site_name" content="The Dog Show">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(ogTitle)}">
<meta name="twitter:description" content="${esc(ogDesc)}">
<meta name="twitter:image" content="${esc(dog.imageUrl)}">
<link rel="canonical" href="${esc(pageUrl)}">
</head>
<body>
<h1>${esc(dog.dogName)}</h1>
<p>${esc(ogDesc)}</p>
<p><a href="${esc(pageUrl)}">View certificate</a></p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (e) {
    return serveFallbackOG(slug);
  }
}

function serveFallbackOG(slug) {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>The Dog Show — Certificate</title>
<meta property="og:title" content="The Dog Show — A Dog Appeared!">
<meta property="og:description" content="View this dog's certificate on The Dog Show — the live, real-time dog-viewing experience at dogshow.lol">
<meta property="og:url" content="${SITE_URL}/d/${esc(slug)}">
<meta property="og:site_name" content="The Dog Show">
<meta name="twitter:card" content="summary">
<meta http-equiv="refresh" content="0;url=${SITE_URL}/d/${esc(slug)}">
</head>
<body><p>Redirecting...</p></body>
</html>`;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
