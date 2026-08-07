#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// generate-article-heroes.mjs — generate a photoreal 16:9 hero image per
// ARTICLE page using the Google Gemini image model, saved to
// article-img/{slug}.{ext}. Sibling of generate-breed-heroes.mjs (breed hubs).
//
// USAGE (run from the repo root):
//   GEMINI_API_KEY=your_key node scripts/generate-article-heroes.mjs            # only missing
//   GEMINI_API_KEY=your_key node scripts/generate-article-heroes.mjs --force    # regenerate all
//   GEMINI_API_KEY=your_key node scripts/generate-article-heroes.mjs hound-dog-song  # specific slugs
//
// Env:
//   GEMINI_API_KEY        (required)
//   GEMINI_IMAGE_MODEL    (optional)  — defaults to "gemini-2.5-flash-image".
//
// The article pages reference /article-img/{slug}.jpg with an onerror fallback
// to .png and then graceful removal, so pages render fine before images exist.
// After generating, consider a compression pass (target <150 KB each — these
// sit at the top of the page and are usually the LCP element):
//   sips -Z 1280 -s format jpeg -s formatOptions 70 article-img/*.png --out article-img/
// ─────────────────────────────────────────────────────────────────────────
import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const OUT_DIR = join(REPO_ROOT, 'article-img');
const PROMPTS_FILE = join(__dirname, 'article-hero-prompts.json');

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NANO_BANANA_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Wide scene composition (vs. the breed pipeline's square head-and-chest
// portraits): the article hero slot is 16:9 with object-fit:cover, so we ask
// for landscape directly and also set aspectRatio in the request config.
// NOTE: the subject defines which/how many animals appear — some scenes have
// two dogs or none (origami) — so the guard list bans people/text, not animals.
const STYLE = (subject) =>
  `A photorealistic wide 16:9 landscape photograph of ${subject}. ` +
  `Natural, warm lighting with rich lifelike detail and anatomically accurate ` +
  `proportions. Composed so the main subject stays centered and survives edge ` +
  `cropping. No text, no watermark, no logo, no border, and no people.`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (p) => access(p).then(() => true).catch(() => false);

const EXT_BY_MIME = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp' };

async function generateOne(slug, subject, force) {
  if (!force) {
    for (const e of ['png', 'jpg', 'jpeg', 'webp']) {
      if (await exists(join(OUT_DIR, `${slug}.${e}`))) {
        console.log(`  skip   ${slug} (already exists — use --force to overwrite)`);
        return 'skipped';
      }
    }
  }
  const body = {
    contents: [{ parts: [{ text: STYLE(subject) }] }],
    generationConfig: { imageConfig: { aspectRatio: '16:9' } },
  };

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        // Older models may reject generationConfig.imageConfig — retry once without it.
        if (res.status === 400 && body.generationConfig) {
          console.log(`  note   ${slug} (HTTP 400 with imageConfig — retrying without; check aspect ratio in output)`);
          delete body.generationConfig;
          continue;
        }
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
      console.log(`  OK     ${slug} -> article-img/${slug}.${ext}`);
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
    console.error('ERROR: set GEMINI_API_KEY in the environment.');
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
  console.log(`Generating ${entries.length} image(s) into article-img/${force ? ' (force)' : ''}\n`);

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
