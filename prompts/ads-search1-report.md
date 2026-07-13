# Search-1 weekly insight report — CI edition

You are producing the weekly performance read on the Google Ads campaign "Search-1" (dogshow.lol), focused on whether the free-to-enter pivot (2026-06-23) is lowering the cost per free signup.

The raw numbers are in `.ci/ads-payload.json` — pushed by a Google Ads Script. Structure: `current_window` and `prior_window`, each with `{start, end, totals: {cost, conversions, clicks, impressions, ctr}, by_conversion_action: {action_name: count}}`. Currency field says which currency (budget is £19/day).

Write the report to `.ci/telegram-report.txt` (James's Telegram; his only view). James prefers brevity and insight density — no filler.

Report:
- Headline: last 7 days — Cost, total Conversions, and **cost per free signup** (Cost ÷ generate_lead count), with WoW direction (↑/↓) vs prior window.
- One line each: signup volume (generate_lead), purchases, CTR/clicks, spend pacing vs £19/day (£133/wk).
- The single most useful observation: is cost-per-signup falling since free-to-enter?
- If generate_lead is ZERO for the week: flag URGENT — that likely means the GA4 generate_lead event stopped firing (a tracking break), not zero signups.
- 1–2 concrete suggestions ONLY if the data warrants (pause a zero-converting keyword can't be seen at this granularity — suggest only what this data supports, e.g. budget moves on CPA trend).
- State explicitly if any number is missing from the payload rather than guessing.

Read-only: you have no Ads access and change nothing. Do not fabricate any number not present in the payload.
