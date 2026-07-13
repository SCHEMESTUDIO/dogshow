#!/usr/bin/env python3
"""
track_free_to_enter.py — daily snapshot of dogshow.lol signup/dog velocity.

Cloud successor to the local dogshow-free-to-enter-tracker Cowork task.
Fetches /landing-stats from the PartyKit prod API, appends a row to
free-to-enter-tracking.csv, and prints a short summary (stdout is captured
by the workflow and sent to Telegram).

Stdlib only. Exits 1 on fetch failure WITHOUT appending a row (per the
original task rule: never write a blank row).
"""
import csv
import datetime
import json
import sys
import urllib.request

URL = "https://dogshow.schemestudio.partykit.dev/party/dogshow-live/landing-stats"
CSV_PATH = "free-to-enter-tracking.csv"

CAVEAT = ("Caveat: totalBones is NOT revenue — it's the sum of user balances, "
          "dominated by the free 50-bone signup grant. Purchases/revenue come "
          "from Stripe or /admin-audit, not this endpoint.")


def main() -> int:
    try:
        req = urllib.request.Request(
            URL, headers={"User-Agent": "SchemeOpsBot/1.0 (dogshow tracker)"})
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.load(r)
        assert data.get("ok"), f"API returned not-ok: {data}"
        fans, dogs = int(data["totalFans"]), int(data["totalDogs"])
        bones, watching = int(data["totalBones"]), int(data["watching"])
    except Exception as e:  # noqa: BLE001 — any failure means: don't append
        print(f"FETCH FAILED — no row appended. Error: {e}")
        return 1

    prev_fans = prev_dogs = None
    try:
        with open(CSV_PATH, newline="") as f:
            rows = [r for r in csv.reader(f) if r]
        last = rows[-1]
        prev_fans, prev_dogs = int(last[2]), int(last[3])
    except Exception as e:  # noqa: BLE001
        print(f"WARN: could not read previous row ({e}) — deltas unavailable")

    now = datetime.datetime.now(datetime.timezone.utc)
    with open(CSV_PATH, "a", newline="") as f:
        csv.writer(f).writerow(
            [now.strftime("%Y-%m-%d"), now.strftime("%H:%M"),
             fans, dogs, bones, watching, ""])

    if prev_fans is not None:
        d_fans, d_dogs = fans - prev_fans, dogs - prev_dogs
        print(f"Free-to-enter tracker — {now:%Y-%m-%d}\n"
              f"New signups: +{d_fans} (total {fans})\n"
              f"New dogs: +{d_dogs} (total {dogs})\n"
              f"Bones total: {bones} · Watching now: {watching}\n{CAVEAT}")
        if d_fans < 0 or d_dogs < 0:
            print("NOTE: negative delta — totals went DOWN vs last row; "
                  "worth a look (deleted dogs/accounts or an API blip).")
    else:
        print(f"Free-to-enter tracker — {now:%Y-%m-%d}\n"
              f"Totals: fans {fans}, dogs {dogs}, bones {bones}, "
              f"watching {watching} (no previous row for deltas)\n{CAVEAT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
