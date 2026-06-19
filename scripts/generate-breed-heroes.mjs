#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// generate-breed-heroes.mjs — generate a photoreal hero image per breed using
// the Google Gemini image model ("nano banana") and save to breeds-img/{slug}.png.
//
// USAGE (run from the repo root):
//   GEMINI_API_KEY=your_key node scripts/generate-breed-heroes.mjs            # only missing
//   GEMINI_API_KEY=your_key node scripts/generate-breed-heroes.mjs --force    # regenerate all
//   GEMINI_API_KEY=your_key node scripts/generate-breed-heroes.mjs bernedoodle cavapoo   # specific slugs
//
// Env:
//   GEMINI_API_KEY        (required)  — your nano banana / Gemini API key
//   GEMINI_IMAGE_MODEL    (optional)  — defaults to "gemini-2.5-flash-image".
//                                       Set this to whatever your headshots
//                                       project uses if it differs.
//
// Output lands in ./breeds-img/ which is inside the mounted repo, so the
// generated images can be reviewed in place. Requires Node 18+ (global fetch).
// ─────────────────────────────────────────────────────────────────────────
import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const OUT_DIR = join(REPO_ROOT, 'breeds-img');
const PROMPTS_FILE = join(__dirname, 'breed-hero-prompts.json');

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NANO_BANANA_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Shared photographic + framing style. Square (1:1) per the design decision;
// the hero CSS crops to 16:9 with object-fit:cover, so a centered head-and-chest
// composition survives the crop. Strong realism + "no text/people" guards.
const STYLE = (subject) =>
  `A photorealistic square 1:1 portrait photograph of ${subject}. ` +
  `A single dog only, centered, head and chest filling the frame, looking toward the camera ` +
  `with an alert, friendly expression. Soft natural studio lighting, shallow depth of field, ` +
  `a clean softly-blurred neutral background. Ultra-realistic with anatomically accurate breed ` +
  `proportions and lifelike fur detail. No text, no watermark, no logo, no border, no people, ` +
  `and no other animals.`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (p) => access(p).then(() => true).catch(() => false);

const EXT_BY_MIME = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp' };

async function generateOne(slug, subject, force) {
  // The model may return PNG or JPEG; the extension is set from the response
  // mimeType so the file's name matches its bytes (Vercel sets Content-Type
  // by extension). Skip-check looks for any existing image for this slug.
  if (!force) {
    for (const e of ['png', 'jpg', 'jpeg', 'webp']) {
      if (await exists(join(OUT_DIR, `${slug}.${e}`))) {
        console.log(`  skip   ${slug} (already exists — use --force to overwrite)`);
        return 'skipped';
      }
    }
  }
  const body = { contents: [{ parts: [{ text: STYLE(subject) }] }] };

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        // 429 / 5xx → backoff and retry; other codes → fail fast with the message.
        if ((res.status === 429 || res.status >= 500) && attempt < 3) {
          console.log(`  retry  ${slug} (HTTP ${res.status}, attempt ${attempt})`);
          await sleep(2000 * attempt);
          continue;
        }
        console.error(`  FAIL   ${slug} — HTTP ${res.status}: ${txt.slice(0, 300)}`);
        return 'failed';
      }
      const json = await res.json();
      const parts = json?.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find((p) => p.inlineData?.data);
      if (!imgPart) {
        const textPart = parts.find((p) => p.text)?.text || '(no parts returned)';
        console.error(`  FAIL   ${slug} — no image in response: ${String(textPart).slice(0, 200)}`);
        return 'failed';
      }
      const ext = EXT_BY_MIME[imgPart.inlineData.mimeType] || 'jpg';
      const outPath = join(OUT_DIR, `${slug}.${ext}`);
      await writeFile(outPath, Buffer.from(imgPart.inlineData.data, 'base64'));
      console.log(`  OK     ${slug} -> breeds-img/${slug}.${ext}`);
      return 'ok';
    } catch (e) {
      if (attempt < 3) {
        console.log(`  retry  ${slug} (${e.message}, attempt ${attempt})`);
        await sleep(2000 * attempt);
        continue;
      }
      console.error(`  FAIL   ${slug} — ${e.message}`);
      return 'failed';
    }
  }
  return 'failed';
}

async function main() {
  if (!API_KEY) {
    console.error('ERROR: set GEMINI_API_KEY (your nano banana key) in the environment.');
    process.exit(1);
  }
  const argv = process.argv.slice(2);
  const force = argv.includes('--force');
  const onlySlugs = argv.filter((a) => !a.startsWith('--'));

  const { prompts } = JSON.parse(await readFile(PROMPTS_FILE, 'utf8'));
  await mkdir(OUT_DIR, { recursive: true });

  let entries = Object.entries(prompts);
  if (onlySlugs.length) entries = entries.filter(([slug]) => onlySlugs.includes(slug));

  console.log(`Model: ${MODEL}`);
  console.log(`Generating ${entries.length} image(s) into breeds-img/${force ? ' (force)' : ''}\n`);

  const tally = { ok: 0, skipped: 0, failed: 0 };
  for (const [slug, subject] of entries) {
    const r = await generateOne(slug, subject, force);
    tally[r] = (tally[r] || 0) + 1;
    await sleep(1500); // be gentle on rate limits
  }

  console.log(`\nDone. ok=${tally.ok} skipped=${tally.skipped} failed=${tally.failed}`);
  if (tally.failed) process.exit(2);
}

main();
