/* ============================================================================
 * consent.js — GDPR / ePrivacy cookie consent gate for dogshow.lol
 * ----------------------------------------------------------------------------
 * Loaded on every page BEFORE analytics.js. Non-essential trackers
 * (Google Analytics, Faurya, Bing UET, Microsoft Clarity) must NOT load until
 * the visitor explicitly accepts — analytics.js asks this module for permission
 * via window.dogshowConsent.onGrant(). Sentry (error tracking) is treated as
 * strictly-necessary and is loaded unconditionally in analytics.js.
 *
 * Behaviour: blocks trackers for ALL visitors until a choice is made. Accept
 * and Reject are equally prominent (GDPR requires reject to be as easy as
 * accept). The choice is remembered in localStorage; visitors can change it
 * later via window.dogshowConsent.reopen() (wired to any [data-cookie-settings]
 * element and to the "Cookie settings" link in the privacy policy).
 *
 * Public API (window.dogshowConsent):
 *   .status()    -> 'granted' | 'denied' | null   (null = undecided)
 *   .granted()   -> boolean
 *   .grant()     -> record acceptance + run queued onGrant callbacks
 *   .deny()      -> record rejection
 *   .reopen()    -> show the banner again (to change / withdraw consent)
 *   .onGrant(fn) -> run fn now if already granted, else when consent is given
 * ==========================================================================*/
(function () {
  'use strict';

  var KEY = 'dogshow_consent';        // 'granted' | 'denied'
  var KEY_AT = 'dogshow_consent_at';  // ISO timestamp of the decision
  var queue = [];                     // onGrant callbacks waiting for consent
  var grantedFlag = false;

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(v) {
    try {
      localStorage.setItem(KEY, v);
      localStorage.setItem(KEY_AT, new Date().toISOString());
    } catch (e) {}
  }
  function runQueue() {
    grantedFlag = true;
    while (queue.length) {
      try { (queue.shift())(); } catch (e) {}
    }
  }

  var API = {
    status: function () { return read(); },
    granted: function () { return read() === 'granted'; },
    onGrant: function (fn) {
      if (typeof fn !== 'function') return;
      if (grantedFlag || read() === 'granted') {
        try { fn(); } catch (e) {}
      } else {
        queue.push(fn);
      }
    },
    grant: function () { write('granted'); hideBanner(); runQueue(); },
    deny: function () { write('denied'); hideBanner(); },
    reopen: function () { showBanner(); }
  };
  window.dogshowConsent = API;

  if (read() === 'granted') grantedFlag = true;

  // ─── Banner UI ─────────────────────────────────────────────────────────────
  var STYLE_ID = 'dogshow-consent-style';
  var BANNER_ID = 'dogshow-consent-banner';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      '#' + BANNER_ID + '{position:fixed;left:0;right:0;bottom:0;z-index:2147483600;',
      'background:#1a1035;color:#f3efff;border-top:2px solid #FF8C42;',
      'box-shadow:0 -8px 30px rgba(0,0,0,0.45);',
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;",
      'padding:18px 20px;display:flex;align-items:center;gap:18px;flex-wrap:wrap;',
      'justify-content:center;line-height:1.45;}',
      '#' + BANNER_ID + ' .dc-text{flex:1 1 420px;min-width:260px;font-size:14px;color:#d9d2f0;}',
      '#' + BANNER_ID + ' .dc-text strong{color:#fff;}',
      '#' + BANNER_ID + ' .dc-text a{color:#FF8C42;text-decoration:underline;}',
      '#' + BANNER_ID + ' .dc-actions{display:flex;gap:12px;flex:0 0 auto;flex-wrap:wrap;}',
      '#' + BANNER_ID + ' .dc-btn{appearance:none;border:2px solid #FF8C42;border-radius:10px;',
      'padding:11px 22px;font-size:14px;font-weight:700;cursor:pointer;line-height:1;',
      'transition:transform .08s ease,filter .12s ease;white-space:nowrap;}',
      '#' + BANNER_ID + ' .dc-btn:hover{filter:brightness(1.08);}',
      '#' + BANNER_ID + ' .dc-btn:active{transform:translateY(1px);}',
      '#' + BANNER_ID + ' .dc-accept{background:#FF8C42;color:#1a1035;}',
      '#' + BANNER_ID + ' .dc-reject{background:transparent;color:#FF8C42;}',
      '@media (max-width:560px){#' + BANNER_ID + '{padding:16px;gap:12px;}',
      '#' + BANNER_ID + ' .dc-actions{width:100%;}',
      '#' + BANNER_ID + ' .dc-btn{flex:1 1 auto;text-align:center;}}'
    ].join('');
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  function buildBanner() {
    var bar = document.createElement('div');
    bar.id = BANNER_ID;
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookie consent');
    bar.setAttribute('aria-live', 'polite');

    var text = document.createElement('div');
    text.className = 'dc-text';
    text.innerHTML =
      '<strong>A quick word about cookies.</strong> ' +
      'We use a few to count visitors and measure how our ads are doing. ' +
      'They only switch on if you say so — essentials (keeping you signed in, ' +
      'remembering this choice) run either way. See our ' +
      '<a href="/privacy">privacy policy</a> for the full account.';

    var actions = document.createElement('div');
    actions.className = 'dc-actions';

    var reject = document.createElement('button');
    reject.type = 'button';
    reject.className = 'dc-btn dc-reject';
    reject.textContent = 'Reject all';
    reject.addEventListener('click', function () { API.deny(); });

    var accept = document.createElement('button');
    accept.type = 'button';
    accept.className = 'dc-btn dc-accept';
    accept.textContent = 'Accept all';
    accept.addEventListener('click', function () { API.grant(); });

    // Reject first in DOM order so it is never the "harder" option.
    actions.appendChild(reject);
    actions.appendChild(accept);
    bar.appendChild(text);
    bar.appendChild(actions);
    return bar;
  }

  function showBanner() {
    injectStyles();
    if (document.getElementById(BANNER_ID)) return;
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', showBanner);
      return;
    }
    document.body.appendChild(buildBanner());
  }

  function hideBanner() {
    var el = document.getElementById(BANNER_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  // Region signal set by the Vercel edge middleware (middleware.mjs).
  // 'EU'  -> EEA/UK/CH visitor, consent required (show banner, gate trackers)
  // 'ROW' -> outside that scope, consent not required (load trackers, no banner)
  // null  -> cookie missing (middleware not run / not deployed) -> treat as EU
  function readGeo() {
    try {
      var m = document.cookie.match(/(?:^|;\s*)dogshow_geo=(EU|ROW)/);
      return m ? m[1] : null;
    } catch (e) { return null; }
  }

  function wireSettingsLinks() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== document) {
        if (t.hasAttribute && t.hasAttribute('data-cookie-settings')) {
          e.preventDefault();
          API.reopen();
          return;
        }
        t = t.parentNode;
      }
    });
  }

  function init() {
    wireSettingsLinks();

    var stored = read();
    // An explicit choice always wins, everywhere (incl. when travelling).
    if (stored === 'granted') return; // grantedFlag set above; analytics fires
    if (stored === 'denied') return;  // stay off

    // No explicit choice yet — decide by region.
    if (readGeo() === 'ROW') {
      // Outside EEA/UK/CH: opt-in consent isn't required. Load trackers without
      // a banner. runQueue() flips grantedFlag on (in-memory, NOT persisted) so
      // analytics.js's onGrant fires whether it registered before or after this.
      runQueue();
      return;
    }

    // EEA/UK/CH, or region unknown (fail-safe) — require explicit consent.
    showBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
