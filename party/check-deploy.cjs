/* Compares the LIVE PartyKit prod version (GET /version) against your local
 * repo HEAD, so you can tell at a glance whether prod has drifted from the repo.
 * Run with `npm run check-deploy` from the party/ directory. */
const { execSync } = require('child_process');

const ENDPOINT = 'https://dogshow.schemestudio.partykit.dev/party/dogshow-live/version';

let local = '?';
try { local = execSync('git rev-parse --short HEAD').toString().trim(); } catch { /* not a git repo */ }

fetch(ENDPOINT)
  .then((r) => r.json())
  .then((v) => {
    console.log('Local HEAD : ' + local);
    console.log('Live prod  : ' + (v.commit || 'unknown') +
      (v.dirty ? '  ⚠️ (deployed with uncommitted changes)' : '') +
      '   @ ' + (v.deployedAt || 'unknown'));
    const inSync = v.commit === local && !v.dirty;
    console.log(inSync
      ? '✅ In sync — prod matches your repo HEAD.'
      : '⚠️  OUT OF SYNC — deploy current code:  npm run deploy   (from party/)');
    process.exit(inSync ? 0 : 1);
  })
  .catch((e) => {
    console.error('check-deploy failed to reach ' + ENDPOINT + ' — ' + e.message);
    console.error('(If GET /version 404s, prod predates the deploy-stamp feature; deploy once to enable it.)');
    process.exit(2);
  });
