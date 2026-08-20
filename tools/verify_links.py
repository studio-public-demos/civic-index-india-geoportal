"""Link-verification pass — emulates the Studio Verification agent for the seed.

Checks each distinct dataset URL over HTTP and records real link health
(live / dead / down / unverified) plus a verification timestamp back into
datasets.json.

Run:  python tools/verify_links.py
"""
import json
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

UA = {"User-Agent": "Mozilla/5.0 (Nebula Civic Index verification agent)"}


def check(url):
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            code = r.status
        if 200 <= code < 400:
            return "live"
        if code in (404, 410):
            return "dead"
        if 400 <= code < 500:
            return "live"  # reachable but gated (401/403)
        return "down"
    except urllib.error.HTTPError as e:
        return "dead" if e.code in (404, 410) else "down" if e.code >= 500 else "live"
    except Exception:
        return "unverified"


def main():
    out = Path("assets/data")
    ds_path = out / "datasets.json"
    data = json.loads(ds_path.read_text(encoding="utf-8"))

    urls = sorted({d["url"] for d in data})
    print(f"Checking {len(urls)} distinct URLs…")

    results = {}
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(check, u): u for u in urls}
        for i, fut in enumerate(as_completed(futs), 1):
            u = futs[fut]
            results[u] = fut.result()
            print(f"  [{i:2d}/{len(urls)}] {results[u]:>11}  {u}")

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    for d in data:
        d["link_health"] = results[d["url"]]
        d["verified_at"] = now

    ds_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    counts = {}
    for d in data:
        counts[d["link_health"]] = counts.get(d["link_health"], 0) + 1
    print("Summary:", counts)


if __name__ == "__main__":
    main()
