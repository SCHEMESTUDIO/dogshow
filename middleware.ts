/* ============================================================================
 * middleware.ts — Vercel Edge Middleware: geo classification for consent
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
 * WHY .ts (not .mjs): Vercel detects the middleware entrypoint only by the
 * extensions ts/tsx/js/jsx. A `middleware.mjs` is NOT recognized — with
 * `outputDirectory: "."` it was simply served as a static file and never ran.
 * TypeScript is compiled by Vercel, supports the ESM import below, and avoids
 * adding "type":"module" to package.json (which would break the CommonJS
 * serverless functions api/dog.js + api/breed.js).
 *
 * NOTE: Vercel geolocation is only populated on deployed requests — locally
 * `geolocation()` returns an undefined country, which (per the fail-safe)
 * shows the banner. That's expected.
 * ==========================================================================*/
import { geolocation, next } from '@vercel/functions';

// EEA (EU-27 + Iceland, Liechtenstein, Norway) + UK + Switzerland.
const GDPR_COUNTRIES = new Set<string>([
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
  // Run on document routes only. Exclude /api/* and any extensioned path
  // (static assets). Clean URLs (/, /show, /privacy, /d/:slug, /breeds/:slug)
  // have no extension and so are matched.
  matcher: ['/((?!api/|.*\\.[\\w]+$).*)'],
};

export default function middleware(request: Request) {
  let country: string | undefined;
  try {
    country = geolocation(request).country;
  } catch {
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
