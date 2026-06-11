/* Stamps the current git commit + dirty flag + timestamp into build-info.js so
 * each PartyKit deploy bakes its version into the bundle (served at GET /version).
 * Run automatically by `npm run deploy`. Safe to run by hand. */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sh = (cmd) => {
  try { return execSync(cmd, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim(); }
  catch { return ''; }
};

const commit = sh('git rev-parse --short HEAD') || 'unknown';
// "dirty" = uncommitted changes anywhere in the repo, ignoring the stamp file
// itself (which this script is about to rewrite).
const dirty = sh('git status --porcelain')
  .split('\n')
  .filter((line) => line && !line.includes('build-info.js'))
  .length > 0;

const info = { commit, dirty, deployedAt: new Date().toISOString() };
const out = path.join(__dirname, 'build-info.js');
fs.writeFileSync(
  out,
  '// Auto-stamped at deploy time by stamp-version.cjs — do NOT edit by hand.\n' +
  'export const BUILD_INFO = ' + JSON.stringify(info) + ';\n'
);
console.log('[stamp] build-info →', info);
if (dirty) {
  console.log('[stamp] ⚠️  WARNING: deploying with uncommitted changes — commit first so the stamp matches your repo.');
}
