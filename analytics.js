/* ============================================================================
 * analytics.js — tracker loader (consent-gated) for dogshow.lol
 * ----------------------------------------------------------------------------
 * Loaded on every page AFTER consent.js. Two buckets:
 *
 *   ESSENTIAL (loads unconditionally):
 *     • Sentry — browser error tracking. In-memory, sets no cookies / device
 *       identifiers, so it sits outside ePrivacy cookie-consent. Justified as
 *       legitimate-interest stability/security monitoring; disclosed in the
 *       privacy policy. Keep PII scrubbing on (do not enable sendDefaultPii).
 *
 *   NON-ESSENTIAL (loads ONLY after the visitor accepts via consent.js):
 *     • Google Analytics 4 (gtag.js)
 *     • Faurya Analytics
 *     • Microsoft Advertising UET (Bing Ads conversion pixel)
 *     • Microsoft Clarity (heatmaps / session recording) — still gated by a
 *       blank CLARITY_ID below in addition to consent.
 *
 * Custom event helpers (window.trackEmailCapture / window.trackPurchase) are
 * defined unconditionally but no-op until gtag / uetq exist, i.e. until consent
 * is granted. All call sites already guard with `if (window.gtag)` etc.
 * ==========================================================================*/
(function () {
  'use strict';

  // ─── PASTE YOUR IDS HERE ───────────────────────────────────────────────────
  var GA_MEASUREMENT_ID = 'G-V830P7PPHQ';

  // Google Ads conversion tracking (Scheme Studio account 629-033-9684).
  // Loaded through the same consent gate as GA4: ROW visitors get it without a
  // banner, EEA/UK only after accept — Demand Gen targeting excludes EEA/UK.
  var ADS_ID = 'AW-18212544394';
  var ADS_SIGNUP_LABEL = 'KxqZCJvU09kcEIq_texD'; // dogshow_signup (count: One)
  var FAURYA_WEBSITE_ID = 'cmosekmvz000xl204a7bhm4cm';
  var FAURYA_DOMAIN = 'dogshow.lol';

  // UET tag ID: Microsoft Advertising → Tools → Conversion tracking → UET tag.
  var UET_TAG_ID = '97248525';

  // Reddit Ads pixel ID (ads.reddit.com → Events Manager → Reddit Pixel,
  // looks like "a2_xxxxxxxx"). Blank = pixel never loads, even with consent —
  // same kill-switch pattern as CLARITY_ID. Loaded through the consent gate;
  // Reddit campaign targeting excludes EEA/UK so ROW visitors get it bannerless.
  var REDDIT_PIXEL_ID = 'a2_jg65ublapy0p';

  // Clarity project ID: clarity.microsoft.com → project → Settings → Setup.
  // Leave blank to NOT load Clarity even with consent. Disclose session
  // recording in the privacy policy if enabled.
  var CLARITY_ID = '';
  // ───────────────────────────────────────────────────────────────────────────

  // ═══ ESSENTIAL: Sentry (loads regardless of consent) ═══════════════════════
  (function () {
    var s = document.createElement('script');
    s.src = 'https://js.sentry-cdn.com/0aee97f54d9301fd6c7a0c7316b7ae93.min.js';
    s.crossOrigin = 'anonymous';
    s.async = true;
    (document.head || document.documentElement).appendChild(s);
  })();

  // ═══ NON-ESSENTIAL: gated behind consent ══════════════════════════════════
  var loaded = false;

  function loadGatedTrackers() {
    if (loaded) return;
    loaded = true;

    // ── Google Analytics 4 (gtag.js) ──
    if (GA_MEASUREMENT_ID) {
      var ga = document.createElement('script');
      ga.async = true;
      ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
      (document.head || document.documentElement).appendChild(ga);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', GA_MEASUREMENT_ID);
      if (ADS_ID) {
        // Google Ads tag shares gtag.js with GA4 — one loader, two configs.
        window.gtag('config', ADS_ID, { allow_enhanced_conversions: true });
      }
    }

    // ── Faurya Analytics ──
    if (FAURYA_WEBSITE_ID) {
      var fa = document.createElement('script');
      fa.async = true;
      fa.defer = true;
      fa.src = 'https://www.faurya.com/js/script.js';
      fa.setAttribute('data-website-id', FAURYA_WEBSITE_ID);
      fa.setAttribute('data-domain', FAURYA_DOMAIN);
      (document.head || document.documentElement).appendChild(fa);
    }

    // ── Microsoft Advertising UET (Bing Ads conversion pixel) ──
    if (UET_TAG_ID) {
      (function (w, d, t, r, u) {
        var f, n, i;
        w[u] = w[u] || [];
        f = function () {
          var o = { ti: UET_TAG_ID, enableAutoSpaTracking: true };
          o.q = w[u];
          w[u] = new UET(o);
          w[u].push('pageLoad');
        };
        n = d.createElement(t);
        n.src = r;
        n.async = 1;
        n.onload = n.onreadystatechange = function () {
          var s = this.readyState;
          if (s && s !== 'loaded' && s !== 'complete') return;
          f();
          n.onload = n.onreadystatechange = null;
        };
        i = d.getElementsByTagName(t)[0];
        i.parentNode.insertBefore(n, i);
      })(window, document, 'script', '//bat.bing.net/bat.js', 'uetq');
    }

    // ── Reddit Ads pixel ──
    if (REDDIT_PIXEL_ID) {
      (function (w, d) {
        if (!w.rdt) {
          var p = (w.rdt = function () {
            p.sendEvent ? p.sendEvent.apply(p, arguments) : p.callQueue.push(arguments);
          });
          p.callQueue = [];
          var t = d.createElement('script');
          t.src = 'https://www.redditstatic.com/ads/pixel.js';
          t.async = true;
          var s = d.getElementsByTagName('script')[0];
          s.parentNode.insertBefore(t, s);
        }
      })(window, document);
      window.rdt('init', REDDIT_PIXEL_ID);
      window.rdt('track', 'PageVisit');
    }

    // ── Microsoft Clarity (heatmaps + session recordings) ──
    if (CLARITY_ID) {
      (function (c, l, a, r, i, t, y) {
        c[a] = c[a] || function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
        t = l.createElement(r);
        t.async = 1;
        t.src = 'https://www.clarity.ms/tag/' + i;
        y = l.getElementsByTagName(r)[0];
        y.parentNode.insertBefore(t, y);
      })(window, document, 'clarity', 'script', CLARITY_ID);
    }
  }

  // Ask the consent module for permission. It runs the callback immediately if
  // consent was already granted, or later when the visitor accepts. Defensive
  // fallback polls briefly in case consent.js loads after this file.
  function register() {
    if (window.dogshowConsent && typeof window.dogshowConsent.onGrant === 'function') {
      window.dogshowConsent.onGrant(loadGatedTrackers);
      return true;
    }
    return false;
  }
  if (!register()) {
    var tries = 0;
    var iv = setInterval(function () {
      if (register() || ++tries > 50) clearInterval(iv); // ~5s max
    }, 100);
  }

  // ─── Event helpers (no-op until trackers load) ─────────────────────────────
  window.trackEmailCapture = function (tier) {
    var label = tier || 'unknown';
    try {
      if (window.uetq) {
        window.uetq.push('event', 'email_captured', {
          event_category: 'lead',
          event_label: label,
        });
      }
    } catch (e) {}
    try {
      if (window.gtag) {
        window.gtag('event', 'generate_lead', {
          event_category: 'lead',
          event_label: label,
        });
      }
    } catch (e) {}
  };

  window.trackPurchase = function (tier, revenueUsd) {
    var label = tier || 'unknown';
    var value = Number(revenueUsd) || 0;
    try {
      if (window.uetq) {
        window.uetq.push('event', 'purchase', {
          revenue_value: value,
          currency: 'USD',
          event_category: 'conversion',
          event_label: label,
        });
      }
    } catch (e) {}
    try {
      if (window.gtag) {
        window.gtag('event', 'purchase', {
          value: value,
          currency: 'USD',
          items: [{ item_name: label, price: value, quantity: 1 }],
        });
      }
    } catch (e) {}
  };

  // Google Ads signup conversion (dogshow_signup). Fired from the SUCCESS path
  // of registration (the 50-bones moment) — index.html enterShow() and app.js
  // submitRegistration(). Enhanced conversions: hashed email via user_data.
  // localStorage guard stops repeat fires from the same browser; the action is
  // count-One server-side anyway.
  window.trackAdsSignup = function (email) {
    var cleanEmail = email ? String(email).trim().toLowerCase() : null;
    try {
      if (window.gtag && ADS_ID && !localStorage.getItem('dogshow_ads_signup_fired')) {
        if (cleanEmail) window.gtag('set', 'user_data', { email: cleanEmail });
        window.gtag('event', 'conversion', { send_to: ADS_ID + '/' + ADS_SIGNUP_LABEL });
        localStorage.setItem('dogshow_ads_signup_fired', '1');
      }
    } catch (e) {}
    // Reddit SignUp conversion — same success-moment call sites, its own
    // once-guard so adding Reddit later doesn't depend on the Google flag.
    try {
      if (window.rdt && REDDIT_PIXEL_ID && !localStorage.getItem('dogshow_rdt_signup_fired')) {
        window.rdt('track', 'SignUp', cleanEmail ? { email: cleanEmail } : {});
        localStorage.setItem('dogshow_rdt_signup_fired', '1');
      }
    } catch (e) {}
  };
})();
