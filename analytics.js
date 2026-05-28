/* ============================================================================
 * analytics.js — Microsoft Advertising UET + Microsoft Clarity scaffold
 * ----------------------------------------------------------------------------
 * Loaded on every page of dogshow.lol. Nothing fires until the IDs below are
 * filled in. UET is for Bing Ads conversion tracking; Clarity is optional
 * session-recording / heatmaps.
 *
 * After creating your Microsoft Advertising account and (optionally) Clarity
 * project, paste the IDs into the constants below and redeploy.
 *
 * Custom event helpers (exposed on window):
 *   trackEmailCapture(tier)         — fire when email modal is submitted
 *   trackPurchase(tier, revenueUsd) — fire on success.html load (paid only)
 * ==========================================================================*/
(function () {
  'use strict';

  // ─── Sentry (browser error tracking — audit High-3) ────────────────────────
  // Injected here so it lands on every page that loads analytics.js. The
  // loader auto-captures unhandled errors + promise rejections.
  (function () {
    var s = document.createElement('script');
    s.src = 'https://js.sentry-cdn.com/0aee97f54d9301fd6c7a0c7316b7ae93.min.js';
    s.crossOrigin = 'anonymous';
    s.async = true;
    (document.head || document.documentElement).appendChild(s);
  })();

  // ─── PASTE YOUR IDS HERE ───────────────────────────────────────────────────
  // UET tag ID: find in Microsoft Advertising → Tools → Conversion tracking
  // → UET tag. Numeric, e.g. "123456789".
  var UET_TAG_ID = '97248525';

  // Clarity project ID: find in clarity.microsoft.com → your project →
  // Settings → Setup. Alphanumeric, e.g. "ab1cd2ef3g".
  // Leave blank to NOT load Clarity. Remember to disclose session recording
  // in your privacy policy if enabled.
  var CLARITY_ID = '';
  // ───────────────────────────────────────────────────────────────────────────

  // ─── UET (Bing Ads conversion pixel) ───────────────────────────────────────
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

  // ─── Microsoft Clarity (heatmaps + session recordings) ─────────────────────
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

  // ─── Event helpers ─────────────────────────────────────────────────────────
  // Fire when user submits the email modal with a valid email.
  // Tier can be 'free' | 'general' | 'premium'. Sends to UET + GA4.
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

  // Fire on success.html (Stripe redirect) for paid conversions only.
  // revenueUsd is the USD value of the purchase (1.99 or 3.99).
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
})();
