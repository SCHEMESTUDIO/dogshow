/**
 * ads-search1-google-ads-script.js — paste into Google Ads > Tools > Scripts.
 *
 * Pulls last-7-days + prior-7-days performance for the Search-1 campaign
 * (ID 23908637225) including the per-conversion-action split (generate_lead /
 * purchase), then POSTs the JSON to GitHub as a repository_dispatch event.
 * The dogshow repo workflow "ads-search1-report.yml" receives it, has Claude
 * write the insight layer, and delivers to Telegram.
 *
 * ONE-TIME SETUP (in the Google Ads UI, account 629-033-9684):
 *   1. Tools & settings > Bulk actions > Scripts > + > paste this file.
 *   2. Replace GITHUB_PAT below with a fine-grained PAT scoped to
 *      SCHEMESTUDIO/dogshow with "Contents: Read and write" permission
 *      (repository_dispatch requires write). Nothing else.
 *   3. Authorize the script when prompted (it only reads Ads data +
 *      calls api.github.com).
 *   4. Preview once to test, then set frequency: Weekly, Monday, 07:00.
 *
 * READ-ONLY with respect to the Ads account. It changes nothing.
 */

var GITHUB_PAT = 'PASTE_FINE_GRAINED_PAT_HERE';
var GITHUB_REPO = 'SCHEMESTUDIO/dogshow';
var CAMPAIGN_ID = '23908637225';

function main() {
  var tz = AdsApp.currentAccount().getTimeZone();
  var today = new Date();
  function fmt(d) { return Utilities.formatDate(d, tz, 'yyyy-MM-dd'); }
  function daysAgo(n) { var d = new Date(today); d.setDate(d.getDate() - n); return d; }

  // Windows: last 7 full days (yesterday back 7), prior 7 before that.
  var curStart = fmt(daysAgo(7)), curEnd = fmt(daysAgo(1));
  var priStart = fmt(daysAgo(14)), priEnd = fmt(daysAgo(8));

  var payload = {
    campaign_id: CAMPAIGN_ID,
    currency: AdsApp.currentAccount().getCurrencyCode(),
    current_window: { start: curStart, end: curEnd, totals: campaignTotals(curStart, curEnd), by_conversion_action: conversionSplit(curStart, curEnd) },
    prior_window: { start: priStart, end: priEnd, totals: campaignTotals(priStart, priEnd), by_conversion_action: conversionSplit(priStart, priEnd) },
    generated_at: fmt(today)
  };

  var resp = UrlFetchApp.fetch('https://api.github.com/repos/' + GITHUB_REPO + '/dispatches', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + GITHUB_PAT,
      'Accept': 'application/vnd.github+json'
    },
    payload: JSON.stringify({ event_type: 'ads-search1-weekly', client_payload: payload }),
    muteHttpExceptions: true
  });

  var code = resp.getResponseCode();
  if (code === 204) {
    Logger.log('Dispatched to GitHub OK.');
  } else {
    // Surface loudly in the script history; Google also emails on script failure.
    throw new Error('GitHub dispatch failed: HTTP ' + code + ' — ' + resp.getContentText());
  }
}

function campaignTotals(start, end) {
  var q = 'SELECT metrics.cost_micros, metrics.conversions, metrics.clicks, ' +
          'metrics.impressions FROM campaign WHERE campaign.id = ' + CAMPAIGN_ID +
          ' AND segments.date BETWEEN "' + start + '" AND "' + end + '"';
  var rows = AdsApp.search(q);
  var t = { cost: 0, conversions: 0, clicks: 0, impressions: 0 };
  while (rows.hasNext()) {
    var r = rows.next();
    t.cost += Number(r.metrics.costMicros || 0) / 1e6;
    t.conversions += Number(r.metrics.conversions || 0);
    t.clicks += Number(r.metrics.clicks || 0);
    t.impressions += Number(r.metrics.impressions || 0);
  }
  t.cost = Math.round(t.cost * 100) / 100;
  t.ctr = t.impressions ? Math.round(10000 * t.clicks / t.impressions) / 100 : 0;
  return t;
}

function conversionSplit(start, end) {
  var q = 'SELECT segments.conversion_action_name, metrics.all_conversions ' +
          'FROM campaign WHERE campaign.id = ' + CAMPAIGN_ID +
          ' AND segments.date BETWEEN "' + start + '" AND "' + end + '"';
  var rows = AdsApp.search(q);
  var split = {};
  while (rows.hasNext()) {
    var r = rows.next();
    var name = r.segments.conversionActionName || 'unknown';
    split[name] = (split[name] || 0) + Number(r.metrics.allConversions || 0);
  }
  return split;
}
