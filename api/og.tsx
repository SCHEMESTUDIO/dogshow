// ─────────────────────────────────────────────────────────────────────────
// api/og.tsx — Vercel Edge function. Generates a 1200x630 (1.91:1, the
// Facebook / Twitter / LinkedIn optimal ratio) Open Graph image for a
// per-dog share. api/dog.js sets og:image / twitter:image to /api/og?slug=X
// so share crawlers fetch a properly-proportioned, on-brand preview instead
// of the user's raw uploaded photo (which Facebook would crop badly).
//
// Why a separate function: dog photos are uploaded at arbitrary aspect
// ratios at max 600px (good for the certificate page, bad for share cards).
// Using the same image for both would either compromise the certificate
// page (letterbox padding) or compromise the share preview (Facebook crop).
// ─────────────────────────────────────────────────────────────────────────
import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const PARTY = 'https://dogshow.schemestudio.partykit.dev/party/dogshow-live';
const SITE = 'https://dogshow.lol';

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get('slug') || '').trim();

  // Defaults so a bad / missing slug still produces a branded card rather
  // than an error response that breaks the crawler's preview.
  let dogName = 'A Good Dog';
  let breed = 'Mystery Breed';
  let imageUrl: string | null = null;
  let slotAt: number | null = null;
  let firstAppearedAt: number | null = null;

  if (slug) {
    try {
      const rr = await fetch(`${PARTY}/resolve-slug?slug=${encodeURIComponent(slug)}`);
      const rd: any = await rr.json();
      if (rd && rd.ok && rd.id) {
        const sr = await fetch(`${PARTY}/dog-stats?id=${encodeURIComponent(rd.id)}`);
        const sd: any = await sr.json();
        if (sd && sd.ok && sd.dog) {
          dogName = (sd.dog.dogName || dogName).slice(0, 32);
          breed = (sd.dog.breed || breed).slice(0, 40);
          imageUrl = sd.dog.imageUrl || null;
          slotAt = sd.dog.slotAt || null;
          firstAppearedAt = sd.dog.firstAppearedAt || null;
        }
      }
    } catch (e) {
      // Fall through to defaults — still return a branded image.
    }
  }

  // Phase 6: pre-show pages get an "event poster" variant — purple accent,
  // an "ON STAGE" eyebrow with the booked time, so a fan seeing the link in
  // their feed reads it as an invitation to a scheduled appearance, not as
  // a passive certificate.
  // Post-show (firstAppearedAt is set) keeps the orange certificate style.
  const isPreShow = !firstAppearedAt;
  const hasSlot = !!slotAt;
  const slotLabel = (isPreShow && hasSlot)
    ? new Date(slotAt!).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
        timeZone: 'America/New_York', timeZoneName: 'short',
      })
    : '';
  const accent = isPreShow ? '#7B68EE' : '#FF8C42';
  const eyebrowText = isPreShow
    ? (hasSlot ? 'On stage ' + slotLabel : 'Just entered')
    : 'The Dog Show';
  const subline = isPreShow
    ? (hasSlot ? 'Set a reminder so you don’t miss it' : 'Live in the show')
    : breed;

  // Load the brand font (best-effort). Fallback to system sans if it fails.
  let fonts: any[] | undefined;
  try {
    const fontRes = await fetch(`${SITE}/YangBagus.ttf`);
    if (fontRes.ok) {
      const fontData = await fontRes.arrayBuffer();
      fonts = [{ name: 'YangBagus', data: fontData, style: 'normal', weight: 400 }];
    }
  } catch (e) {
    // No font — system fallback. Looks plain but still renders.
  }

  try {
    return new ImageResponse(
      (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #1a1035 0%, #0f0a22 100%)',
          position: 'relative',
          padding: 48,
        }}>
          <div style={{
            display: 'flex',
            color: accent,
            fontSize: 24,
            letterSpacing: isPreShow ? 4 : 8,
            textTransform: 'uppercase',
            marginBottom: 28,
            fontFamily: isPreShow ? undefined : 'YangBagus',
            fontWeight: isPreShow ? 700 : 400,
          }}>
            {eyebrowText}
          </div>

          {imageUrl ? (
            <div style={{
              width: 340,
              height: 340,
              borderRadius: 24,
              border: `6px solid ${accent}`,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              marginBottom: 28,
              display: 'flex',
            }} />
          ) : (
            <div style={{
              width: 340,
              height: 340,
              borderRadius: 24,
              border: `6px solid ${accent}`,
              background: '#241a45',
              marginBottom: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 120,
            }}>
              🐕
            </div>
          )}

          <div style={{
            display: 'flex',
            color: '#e0d8f0',
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            // No fontFamily — uses the Edge runtime's default sans for
            // readability. Yang Bagus is reserved for the wordmark only
            // (the "The Dog Show" eyebrow above, in post-show mode).
            textAlign: 'center',
            maxWidth: 1080,
          }}>
            {dogName}
          </div>

          <div style={{
            display: 'flex',
            color: 'rgba(255,255,255,0.55)',
            fontSize: 24,
            marginTop: 10,
            letterSpacing: 1,
          }}>
            {subline}
          </div>

          <div style={{
            position: 'absolute',
            bottom: 28,
            right: 40,
            display: 'flex',
            color: 'rgba(255,255,255,0.45)',
            fontSize: 20,
            letterSpacing: 2,
            textTransform: 'lowercase',
          }}>
            dogshow.lol
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts,
        headers: {
          // Cache strategy:
          //   • Pre-show images can flip to post-show when the dog airs, so
          //     we shorten the CDN cache to let the next share scrape get
          //     the updated variant. Facebook will still cache by URL on
          //     their side (out of our control).
          //   • Post-show images are basically stable — long cache is fine.
          'Cache-Control': isPreShow
            ? 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600'
            : 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        },
      },
    );
  } catch (e) {
    // Last-resort fallback so crawlers never see a 500 — they'd then strip
    // the preview entirely. Redirect to the static branded image instead.
    return Response.redirect(`${SITE}/og-image.png`, 302);
  }
}
