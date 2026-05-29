// ─────────────────────────────────────────────────────────────────────────
// api/breed.js — Vercel serverless function. Server-renders the per-breed
// hub page at /breeds/{slug}. vercel.json rewrites /breeds/:slug →
// /api/breed?slug=:slug.
//
// Architectural decision (see seo-breed-hub-plan.md §1a): pages MUST work
// without any user-uploaded dogs of this breed. The user-dog grid is a
// bonus section, hidden when N=0. Differentiator carried by hand-written
// voice (Wodehouse-genial host) + show-ring framing.
//
// Pilot content for 'bernedoodle' is embedded below. When we batch the
// remaining 19 P1 breeds, refactor BREEDS to file-based content/breeds/*.js
// so editorial diffs stay scoped to one breed at a time.
// ─────────────────────────────────────────────────────────────────────────
const PARTY = 'https://dogshow.schemestudio.partykit.dev/party/dogshow-live';
const SITE = 'https://dogshow.lol';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ─── Content store ─────────────────────────────────────────────────────
// Pilot — Bernedoodle. Voice + structure are the template; clone for the
// next 19 P1 breeds (see plan §6). Each section is hand-written; do NOT
// build a parameterized "[Breed] is a [size] dog known for [trait]" filler.
// Google's helpful-content classifier eats those. (Plan §9 risk #1.)
const BREEDS = {
  bernedoodle: {
    name: 'Bernedoodle',
    headKeyword: 'Bernedoodle',
    metaDescription: "The Bernedoodle: a Bernese Mountain Dog and a Poodle conspired, and the result is gentler than the sum of its parts. A field guide to the breed, with stage notes.",
    facts: {
      'Group': 'Designer mix (Bernese Mountain Dog × Poodle)',
      'Size': 'Tiny 10–24 lb · Mini 25–49 lb · Standard 70–90 lb',
      'Temperament': 'Goofy, gentle, low prey drive, affectionate',
      'Life expectancy': '12–18 years (smaller variants tend longer)',
      'Coat': 'Wavy to curly; shed level depends on generation',
      'Colors': 'Tri-color (black/white/rust), bi-color, sable, phantom',
      'AKC recognized': 'No — designer mix; recognized by some boutique clubs',
      'First bred': '2003, Sherry Rupke, Ontario',
    },
    lede: `The Bernedoodle is what happens when a Bernese Mountain Dog wanders into a literary salon and meets a Poodle who is, as Poodles invariably are, the most well-read creature in the room. The resulting offspring inherits the Berner's gentle <em>"I would carry your child up a mountain"</em> demeanour and the Poodle's slightly terrifying competence with logic puzzles. They also inherit, with the genetic precision of a coin flip, either a low-shedding coat or a coat that will redecorate your living room.`,
    spotlightHeading: 'Why we love the Bernedoodle on stage',
    spotlight: `<p>On the Dog Show stage, the Bernedoodle is a study in scale meets cuddle. Standards lumber in like a piece of furniture that has decided to participate in life and would like, please, a snack. Minis bounce — there is no other verb. Tiny Bernedoodles, who barely cross the threshold into existence at ten pounds, seem to defy several laws of zoology by being mostly eyes and floof.</p>
<p>What they share, top to tail, is an immunity to stage fright. The Bernedoodle does not perform. The Bernedoodle does not posture. The Bernedoodle, presented with a glowing screen full of strangers, simply sits down and assumes the strangers are there for a reason and that the reason is benign. This is correct, of course. The strangers are there to give it bones.</p>
<p>There is also, in nearly every Bernedoodle we have hosted, a particular look — head tilted, ears forward, one front paw lifted as if mid-thought. The Bernedoodle is not, in that moment, having a thought. The Bernedoodle is having an audience. They were born for this.</p>`,
    ownerFitHeading: 'Is a Bernedoodle right for you?',
    ownerFit: `<p>The honest answer is: only if you have the floor space, the patience for adolescence, and a relaxed view of what constitutes "a tidy living room."</p>
<p><strong>Shedding.</strong> Bernedoodles are, by reputation, low-shedding. By reality, this depends entirely on which genes won. A first-generation Bernedoodle (F1) is exactly half Berner and half Poodle, and roughly half of any given litter will shed. F1b crosses — the puppy bred back to a Poodle — shed less but cost more. If your allergy is mild, an F1b is usually fine. If your allergy is the kind that re-routes Christmas plans, get a Poodle.</p>
<p><strong>Energy.</strong> Moderate. They want one solid walk and a play session a day. They do not want a sport. They especially do not want, despite their build, to run alongside your bicycle — a Bernedoodle would rather be <em>in</em> the bicycle.</p>
<p><strong>Trainability.</strong> High, with caveats. Bernedoodles take instruction beautifully for about eight months, then enter adolescence and forget everything they ever learned. This phase ends around eighteen months. Do not panic.</p>
<p><strong>Grooming.</strong> A non-negotiable monthly cost. Their coat mats if not brushed, and a matted Bernedoodle is a sad Bernedoodle. Budget for a groomer or commit to learning the trade yourself.</p>
<p><strong>Health.</strong> Hip dysplasia is the inheritable concern; bloat is rarer but more serious. Choose a breeder who screens both parents.</p>
<p>If all of the above sounds workable, you will be rewarded with one of the warmest dogs in the modern designer-mix landscape.</p>`,
    famousHeading: 'Famous Bernedoodles',
    famous: `<p>The Bernedoodle has not yet produced a Lassie. The breed is too young — it was first deliberately crossed in 2003 by Sherry Rupke in Ontario, which makes the entire breed younger than several of our viewers' Volvos. As such, there are no Bernedoodle movies, no Bernedoodle prime ministers, and no Bernedoodle astronauts. Yet.</p>
<p>What there are: a great many Bernedoodle Instagram accounts with follower counts that would embarrass mid-tier sitcoms. Bear the Bernedoodle is essentially a brand. Maggie the Mini Bernedoodle has been quoted by lifestyle press. Whether this constitutes fame depends entirely on how you feel about the present moment.</p>
<p>We will, in time, see a Bernedoodle in a film. It will be marketed as a family drama. The Bernedoodle will steal the picture.</p>`,
    relatedBreeds: [
      { slug: 'goldendoodle', name: 'Goldendoodle' },
      { slug: 'saint-berdoodle', name: 'Saint Berdoodle' },
      { slug: 'bernese-mountain-dog', name: 'Bernese Mountain Dog' },
      { slug: 'labradoodle', name: 'Labradoodle' },
    ],
    // Breed name as it will appear in the user's breeds.js dropdown — used to
    // query /dogs-by-breed and to inner-link from /d/{slug} certificate pages.
    breedTagName: 'Bernedoodle',
  },
};

const STYLES = `
@font-face{font-family:'Yang Bagus';src:url('/YangBagus.ttf') format('truetype');font-display:swap;}
*{margin:0;padding:0;box-sizing:border-box;}
:root{--bg:#0f0a22;--bg-card:#1a1035;--bg-card-2:#241a45;--accent:#FF8C42;--purple:#7B68EE;--text:#e0d8f0;--dim:rgba(255,255,255,0.45);--gold:#FFD700;}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-height:100vh;line-height:1.6;}
a{color:var(--accent);}
.wrap{max-width:760px;margin:0 auto;padding:24px 20px 60px;}
.eyebrow{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--purple);margin-bottom:8px;}
.eyebrow a{color:var(--purple);text-decoration:none;}
h1.breed-h1{font-family:'Yang Bagus',serif;color:var(--accent);font-size:44px;line-height:1.05;margin-bottom:16px;}
.lede{font-size:17px;color:rgba(255,255,255,0.82);margin-bottom:36px;}
.lede em{color:var(--text);font-style:italic;}
.section{margin:36px 0;}
.section h2{font-family:'Yang Bagus',serif;color:var(--accent);font-size:26px;margin-bottom:14px;}
.section h3{font-size:16px;color:var(--text);margin:20px 0 8px;font-weight:600;}
.section p{font-size:15px;color:rgba(255,255,255,0.78);margin-bottom:12px;}
.section p strong{color:var(--text);}
/* Live show widget — always populated, no PartyKit dependency at render-time */
.live-widget{display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,rgba(255,140,66,0.10),rgba(123,104,238,0.10));border:1px solid rgba(255,140,66,0.25);border-radius:12px;padding:14px 16px;margin:28px 0;}
.live-pip{display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 0 rgba(255,140,66,0.7);animation:pulse 1.6s ease-out infinite;flex:0 0 auto;}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(255,140,66,0.7);}70%{box-shadow:0 0 0 12px rgba(255,140,66,0);}100%{box-shadow:0 0 0 0 rgba(255,140,66,0);}}
.live-text{flex:1;font-size:14px;color:rgba(255,255,255,0.85);}
.live-text strong{color:var(--accent);font-weight:700;letter-spacing:1px;font-size:11px;text-transform:uppercase;display:block;margin-bottom:2px;}
.live-btn{display:inline-block;background:var(--accent);color:#1a1035;font-weight:700;font-size:13px;padding:10px 18px;border-radius:8px;text-decoration:none;white-space:nowrap;}
/* Facts table */
.facts{background:var(--bg-card);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:18px;margin:28px 0;}
.facts dl{display:grid;grid-template-columns:max-content 1fr;gap:8px 18px;font-size:14px;}
.facts dt{color:var(--purple);font-weight:600;}
.facts dd{color:rgba(255,255,255,0.82);}
/* CTA */
.cta-block{text-align:center;background:linear-gradient(135deg,rgba(123,104,238,0.10),rgba(255,140,66,0.05));border:1px solid rgba(123,104,238,0.25);border-radius:12px;padding:28px 22px;margin:36px 0;}
.cta-block h2{font-family:'Yang Bagus',serif;color:var(--text);font-size:24px;margin-bottom:8px;}
.cta-block p{font-size:14px;color:rgba(255,255,255,0.7);margin-bottom:16px;}
.cta-btn{display:inline-block;background:var(--accent);color:#1a1035;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;}
.cta-btn-sub{font-size:12px;color:var(--dim);margin-top:10px;}
/* User dogs grid (bonus, hidden when N=0) */
.user-dogs{margin:36px 0;}
.user-dogs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:14px;}
.user-dog-card{background:var(--bg-card);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:0;text-decoration:none;color:var(--text);overflow:hidden;display:block;}
.user-dog-card img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;background:var(--bg-card-2);}
.user-dog-card-name{font-size:13px;font-weight:600;padding:8px 10px 4px;}
.user-dog-card-owner{font-size:11px;color:var(--dim);padding:0 10px 10px;}
/* Related breeds */
.related-breeds{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;}
.related-breed-chip{display:inline-block;background:var(--bg-card);border:1px solid rgba(123,104,238,0.3);border-radius:20px;padding:8px 16px;font-size:13px;text-decoration:none;color:var(--text);}
.related-breed-chip:hover{border-color:var(--purple);}
@media(max-width:768px){
  .wrap{padding:18px 14px 40px;}
  h1.breed-h1{font-size:34px;}
  .lede{font-size:16px;}
  .facts dl{grid-template-columns:1fr;gap:4px;}
  .facts dt{margin-top:8px;}
  .live-widget{flex-direction:column;align-items:flex-start;gap:10px;}
  .live-btn{align-self:stretch;text-align:center;}
}
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
<footer style="text-align:center;padding:24px 16px;border-top:1px solid rgba(255,255,255,0.06);background:#0a0617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:flex;justify-content:center;gap:18px;flex-wrap:wrap;margin-bottom:8px;">
    <a href="/" style="font-size:12px;color:#5a4d80;text-decoration:none;">Home</a>
    <a href="/show.html" style="font-size:12px;color:#5a4d80;text-decoration:none;">Live Show</a>
    <a href="/breeds" style="font-size:12px;color:#5a4d80;text-decoration:none;">Breeds</a>
    <a href="/about.html" style="font-size:12px;color:#5a4d80;text-decoration:none;">About</a>
    <a href="/privacy" style="font-size:12px;color:#5a4d80;text-decoration:none;">Privacy</a>
    <a href="/terms" style="font-size:12px;color:#5a4d80;text-decoration:none;">Terms</a>
  </div>
  <div style="font-size:11px;color:#3d2d6b;">The Dog Show &copy; 2026. All dogs are good dogs.</div>
</footer>
</body>
</html>`;
}

function sendNotFound(res, msg) {
  const head = `<title>Breed not found — The Dog Show</title><meta name="robots" content="noindex">`;
  const body = `<div class="wrap" style="text-align:center;">
<div class="eyebrow"><a href="/breeds">All breeds</a></div>
<h1 class="breed-h1">Breed not found</h1>
<p class="lede">${esc(msg)}</p>
<p style="margin-top:24px;"><a class="cta-btn" href="/breeds">Browse all breeds &rarr;</a></p>
</div>`;
  res.status(404);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(shell(head, body));
}

// Lightweight, no-throw fetch — used to optionally populate the bonus
// user-dogs section. If PartyKit is down or hasn't been deployed with the
// /dogs-by-breed endpoint yet, the section just stays hidden.
async function fetchUserDogs(breedTagName) {
  if (!breedTagName) return [];
  try {
    const url = `${PARTY}/dogs-by-breed?breed=${encodeURIComponent(breedTagName)}&limit=8`;
    const r = await fetch(url, { method: 'GET' });
    if (!r.ok) return [];
    const j = await r.json();
    if (!j || !j.ok || !Array.isArray(j.dogs)) return [];
    return j.dogs;
  } catch (e) {
    return [];
  }
}

function renderFactsHtml(facts) {
  return Object.entries(facts).map(
    ([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`
  ).join('');
}

function renderRelatedHtml(related) {
  return related.map(
    r => `<a class="related-breed-chip" href="/breeds/${esc(r.slug)}">${esc(r.name)}</a>`
  ).join('');
}

function renderUserDogsSection(dogs, breedName) {
  if (!dogs || dogs.length === 0) return '';
  const grid = dogs.map(d => {
    const href = d.slug ? `/d/${esc(d.slug)}` : '#';
    const img = d.imageUrl ? esc(d.imageUrl) : '/og-image.png';
    const name = esc(d.dogName || 'A good dog');
    const owner = esc(d.username || 'Anonymous');
    return `<a class="user-dog-card" href="${href}">
<img src="${img}" alt="${name} — ${esc(breedName)}" loading="lazy">
<div class="user-dog-card-name">${name}</div>
<div class="user-dog-card-owner">by ${owner}</div>
</a>`;
  }).join('');
  const heading = dogs.length === 1
    ? `One ${esc(breedName)} has taken our stage`
    : `${dogs.length} ${esc(breedName)}s have taken our stage`;
  return `<div class="section user-dogs">
<h2>${heading}</h2>
<p>Real dogs from real owners. Click any to see their certificate of appearance.</p>
<div class="user-dogs-grid">${grid}</div>
<p style="margin-top:14px;font-size:13px;"><a href="/dogs.html?breed=${esc(breedName)}">See all ${esc(breedName)}s in the gallery &rarr;</a></p>
</div>`;
}

function renderBreedPage(breed, userDogs) {
  const url = `${SITE}/breeds/${esc(breed.slug)}`;
  // Until the per-breed OG generator is parameterized, fall back to the
  // sitewide brand OG image. (Plan §3 — defer to P1 polish.)
  const ogImg = `${SITE}/og-image.png`;

  // Schema.org: Article + DefinedTerm for breed attributes. There is no
  // native dog-breed type, so we follow the AKC pattern (Article + plain
  // text body) and add a structured attribute set via PropertyValue.
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${breed.name} — Breed Guide & Stage Notes`,
    description: breed.metaDescription,
    image: ogImg,
    publisher: { '@type': 'Organization', name: 'The Dog Show', url: SITE },
    mainEntityOfPage: url,
    about: {
      '@type': 'Thing',
      name: breed.name,
      additionalProperty: Object.entries(breed.facts).map(([k, v]) => ({
        '@type': 'PropertyValue', name: k, value: v,
      })),
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Breeds', item: `${SITE}/breeds` },
      { '@type': 'ListItem', position: 3, name: breed.name, item: url },
    ],
  };

  const head = `<title>${esc(breed.name)} — Breed Guide & Stage Notes | The Dog Show</title>
<meta name="description" content="${esc(breed.metaDescription)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(breed.name)} — The Dog Show breed guide">
<meta property="og:description" content="${esc(breed.metaDescription)}">
<meta property="og:image" content="${esc(ogImg)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="The Dog Show">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(breed.name)} — The Dog Show breed guide">
<meta name="twitter:description" content="${esc(breed.metaDescription)}">
<meta name="twitter:image" content="${esc(ogImg)}">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`;

  const body = `<div class="wrap">
<div class="eyebrow"><a href="/breeds">Breeds</a> &middot; ${esc(breed.name)}</div>
<h1 class="breed-h1">${esc(breed.name)}</h1>
<div class="lede">${breed.lede}</div>

<aside class="live-widget" aria-label="The Dog Show is live now">
<span class="live-pip" aria-hidden="true"></span>
<div class="live-text"><strong>Live now</strong>Dogs are on stage at The Dog Show right now. Come and watch.</div>
<a class="live-btn" href="/show.html">Watch &rarr;</a>
</aside>

<div class="section spotlight">
<h2>${esc(breed.spotlightHeading)}</h2>
${breed.spotlight}
</div>

<div class="section facts">
<dl>${renderFactsHtml(breed.facts)}</dl>
</div>

<div class="section owner-fit">
<h2>${esc(breed.ownerFitHeading)}</h2>
${breed.ownerFit}
</div>

<div class="section famous">
<h2>${esc(breed.famousHeading)}</h2>
${breed.famous}
</div>

${renderUserDogsSection(userDogs, breed.name)}

<div class="cta-block">
<h2>Put your ${esc(breed.name)} in the show</h2>
<p>Upload a photo. Your dog appears on the live stage. Viewers around the world send bones. Pick "${esc(breed.name)}" in the breed picker.</p>
<a class="cta-btn" href="/#tiers">Enter Your Dog &rarr;</a>
<div class="cta-btn-sub">From $3.99 &middot; one-time</div>
</div>

<div class="section related">
<h2>Related breeds</h2>
<div class="related-breeds">${renderRelatedHtml(breed.relatedBreeds)}</div>
</div>

</div>`;

  return { head, body };
}

module.exports = async function handler(req, res) {
  const slug = (req.query && req.query.slug) ? String(req.query.slug).toLowerCase() : '';
  if (!slug) return sendNotFound(res, 'No breed specified.');

  const breed = BREEDS[slug];
  if (!breed) {
    return sendNotFound(res, "We don't have a page for that breed yet. Browse the ones we do have.");
  }
  // Inject slug for inner-linking
  breed.slug = slug;

  // Bonus user-dogs section — best-effort. PartyKit endpoint may not exist
  // yet (needs deploy). Render falls back to no section gracefully.
  const userDogs = await fetchUserDogs(breed.breedTagName || breed.name);

  const { head, body } = renderBreedPage(breed, userDogs);
  res.status(200);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Modest cache — content rarely changes, but the live-dogs section can.
  // s-maxage is what Vercel's edge respects.
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=600, stale-while-revalidate=86400');
  res.send(shell(head, body));
};
