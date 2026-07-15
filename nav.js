/* ═══════════════════════════════════════════════
   Dog Show — Sitewide top nav (added 2026-07-15)
   Self-contained: injects its own styles + markup, no dependencies.
   Include with <script src="/nav.js" defer></script> on any page.
   Desktop: inline links. Mobile (<760px): hamburger dropdown.
   Inserted after .skip-link when present so skip-to-content stays first.
   ═══════════════════════════════════════════════ */
(function () {
  'use strict';

  var LINKS = [
    { href: '/show.html', label: 'Watch Live', match: ['/show.html', '/show'] },
    { href: '/leaderboard', label: 'Leaderboard', match: ['/leaderboard', '/leaderboard.html'] },
    { href: '/dogs', label: 'All Dogs', match: ['/dogs', '/dogs.html'] },
    { href: '/resources', label: 'Guides', match: ['/resources', '/resources.html'] },
    { href: '/breeds', label: 'Breeds', match: ['/breeds', '/breeds.html'] },
  ];
  var CTA = { href: '/?openModal=premium', label: 'Enter Your Dog' };

  var css = [
    '.site-nav{position:sticky;top:0;z-index:900;display:flex;align-items:center;gap:18px;padding:10px 18px;background:rgba(243,238,251,0.94);backdrop-filter:blur(8px);border-bottom:1px solid rgba(42,33,80,0.11);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}',
    '.site-nav-brand{font-family:"Yang Bagus","YangBagus",Georgia,serif;font-size:20px;color:#2a2150;text-decoration:none;line-height:1;flex-shrink:0;}',
    '.site-nav-links{display:flex;align-items:center;gap:16px;margin-left:auto;}',
    '.site-nav-links a{font-size:13px;font-weight:600;color:#2a2150;text-decoration:none;padding:6px 2px;}',
    '.site-nav-links a:hover{color:#5b46d6;}',
    '.site-nav-links a[aria-current="page"]{color:#5b46d6;border-bottom:2px solid #5b46d6;}',
    '.site-nav-cta{background:#FF8C42;color:#1a1035 !important;padding:8px 16px !important;border-radius:8px;font-weight:700 !important;}',
    '.site-nav-cta:hover{opacity:0.9;color:#1a1035 !important;}',
    '.site-nav-burger{display:none;margin-left:auto;background:none;border:1px solid rgba(42,33,80,0.25);border-radius:8px;padding:6px 10px;font-size:18px;line-height:1;color:#2a2150;cursor:pointer;}',
    '@media(max-width:760px){',
    '.site-nav{flex-wrap:wrap;}',
    '.site-nav-burger{display:block;}',
    '.site-nav-links{display:none;flex-direction:column;align-items:stretch;width:100%;gap:0;margin:8px 0 4px;}',
    '.site-nav.open .site-nav-links{display:flex;}',
    '.site-nav-links a{padding:12px 6px;border-bottom:1px solid rgba(42,33,80,0.07);font-size:15px;}',
    '.site-nav-links a[aria-current="page"]{border-bottom:1px solid rgba(42,33,80,0.07);}',
    '.site-nav-cta{margin-top:8px;text-align:center;border-bottom:none !important;}',
    '}',
  ].join('\n');

  function currentPath() {
    var p = location.pathname.replace(/\/+$/, '') || '/';
    return p;
  }

  function build() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.setAttribute('aria-label', 'Site');

    var brand = document.createElement('a');
    brand.className = 'site-nav-brand';
    brand.href = '/';
    brand.textContent = 'The Dog Show';
    nav.appendChild(brand);

    var burger = document.createElement('button');
    burger.className = 'site-nav-burger';
    burger.setAttribute('aria-label', 'Open menu');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-controls', 'siteNavLinks');
    burger.innerHTML = '&#9776;';
    nav.appendChild(burger);

    var wrap = document.createElement('div');
    wrap.className = 'site-nav-links';
    wrap.id = 'siteNavLinks';

    var here = currentPath();
    LINKS.forEach(function (l) {
      var a = document.createElement('a');
      a.href = l.href;
      a.textContent = l.label;
      if (l.match.indexOf(here) !== -1) a.setAttribute('aria-current', 'page');
      wrap.appendChild(a);
    });

    var cta = document.createElement('a');
    cta.className = 'site-nav-cta';
    cta.href = CTA.href;
    cta.textContent = CTA.label;
    wrap.appendChild(cta);

    nav.appendChild(wrap);

    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    // Keep skip-to-content first for a11y (audit cb89878).
    var skip = document.body.querySelector('.skip-link');
    if (skip && skip.parentNode === document.body) {
      skip.insertAdjacentElement('afterend', nav);
    } else {
      document.body.insertAdjacentElement('afterbegin', nav);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
