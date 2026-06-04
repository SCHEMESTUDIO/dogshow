/* ============================================================================
 * middleware.mjs — Vercel Edge Middleware: geo classification for consent
 * ----------------------------------------------------------------------------
 * Sets a strictly-necessary `dogshow_geo` cookie (EU | ROW) on page responses
 * so consent.js can decide whether a consent banner is legally required:
 *   • EEA + UK + Switzerland visitors  -> "EU"  -> banner shown, trackers gated
 *   • everyone else (US, etc.)         -> "ROW" -> trackers load, no banner
 *
 * Fail-safe: if Vercel can't determine the country (unknown / local dev), we
 * write "EU" so an unidentified visitor is treated as in-scope and prompted,
 * rather than silently tracked.
 *
 * ESM (.mjs) is used deliberately: package.json stays CommonJS so the existing
 * CJS serverless functions (api/dog.js, api/breed.js) keep working. Adding
 * "type":"module" would break them.
 *
 * NOTE: Vercel geolocation headers are only populated on deployed requests —
 * `geolocation()` returns undefined country in local dev, which (per the
 * fail-safe above) shows the banner locally. That's expected.
 * ==========================================================================*/
import { geolocation, next } from '@vercel/functions';

// EEA (EU-27 + Iceland, Liechtenstein, Norway) + UK + Switzerland.
const GDPR_COUNTRIES = new Set([
  // EU-27
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE',
  // EEA non-EU
  'IS', 'LI', 'NO',
  // UK GDPR + Swiss FADP (similar opt-in expectations)
  'GB', 'CH',
]);

export const config = {
  // Run on document routes only. Exclude:
  //   • /api/*            — serverless functions
  //   • anything.ext      — static assets (.js .css .png .ttf .svg .ico ...)
  // Clean URLs (/, /show, /privacy, /d/:slug, /breeds/:slug) have no extension
  // and so are matched; trackers/assets are not.
  matcher: ['/((?!api/|.*\\.[\\w]+$).*)'],
};

export default function middleware(request) {
  let country;
  try {
    country = geolocation(request).country;
  } catch (e) {
    country = undefined;
  }
  // Unknown country -> treat as EU (fail-safe).
  const region = country && !GDPR_COUNTRIES.has(country) ? 'ROW' : 'EU';

  return next({
    headers: {
      'Set-Cookie':
        `dogshow_geo=${region}; Path=/; Max-Age=86400; SameSite=Lax; Secure`,
    },
  });
}
