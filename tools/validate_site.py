"""Validate GeoIndia catalogue and static-site integrity.

The checks are intentionally local and dependency-free. They do not re-check
external dataset URLs, because public-sector sites can block or throttle
automated requests and produce noisy CI failures.

Run:  python tools/validate_site.py
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "data"


class SiteHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: list[str] = []
        self.anchors: list[str] = []
        self.local_assets: list[str] = []
        self.external_blank_links: list[tuple[str, str]] = []
        self.meta: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = {k: v or "" for k, v in attrs}
        if "id" in a:
            self.ids.append(a["id"])
        if tag == "a" and a.get("href", "").startswith("#"):
            self.anchors.append(a["href"][1:])
        if tag == "link" and a.get("href") and not is_external(a["href"]):
            self.local_assets.append(a["href"])
        if tag == "script" and a.get("src") and not is_external(a["src"]):
            self.local_assets.append(a["src"])
        if tag == "meta":
            key = a.get("property") or a.get("name")
            content = a.get("content", "")
            if key:
                self.meta.append((key, content))
            if key in {"og:image", "twitter:image"} and content:
                parsed = urlparse(content)
                if parsed.scheme in {"http", "https"} and parsed.netloc == "studio-public-demos.github.io":
                    self.local_assets.append(parsed.path.removeprefix("/civic-index-india-geoportal/"))
        if tag == "a" and a.get("target") == "_blank" and is_external(a.get("href", "")):
            self.external_blank_links.append((a.get("href", ""), a.get("rel", "")))


def is_external(url: str) -> bool:
    return urlparse(url).scheme in {"http", "https", "mailto"}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def require_unique(records: list[dict], key: str, label: str, errors: list[str]) -> None:
    counts = Counter(str(r.get(key, "")) for r in records)
    dupes = sorted(k for k, n in counts.items() if n > 1)
    if dupes:
        errors.append(f"{label} duplicate {key}: {', '.join(dupes)}")


def validate_json(errors: list[str]) -> dict[str, object]:
    loaded = {}
    for path in sorted((ROOT / "assets").rglob("*.json")) + sorted((ROOT / "schemas").rglob("*.json")):
        try:
            loaded[str(path.relative_to(ROOT))] = load_json(path)
        except Exception as exc:  # noqa: BLE001 - validator should report all parse failures.
            errors.append(f"Invalid JSON: {path.relative_to(ROOT)} ({exc})")
    return loaded


def validate_catalog(errors: list[str]) -> None:
    datasets = load_json(DATA / "datasets.json")
    portals = load_json(DATA / "portals.json")
    orgs = load_json(DATA / "organisations.json")
    themes = load_json(DATA / "themes.json")

    require_unique(datasets, "id", "dataset", errors)
    require_unique(portals, "id", "portal", errors)
    require_unique(orgs, "id", "organisation", errors)
    require_unique(themes, "id", "theme", errors)

    portal_ids = {p["id"] for p in portals}
    org_ids = {o["id"] for o in orgs}
    theme_ids = {t["id"] for t in themes}

    for d in datasets:
        if d.get("portal") not in portal_ids:
            errors.append(f"Dataset {d.get('id')} references missing portal {d.get('portal')}")
        if d.get("theme") not in theme_ids:
            errors.append(f"Dataset {d.get('id')} references missing theme {d.get('theme')}")
        if not isinstance(d.get("formats"), list):
            errors.append(f"Dataset {d.get('id')} has non-list formats")
        if d.get("url") and is_external(str(d["url"])) is False:
            errors.append(f"Dataset {d.get('id')} has malformed external URL {d.get('url')}")
        if d.get("source_class") == "government":
            errors.append(f"Dataset {d.get('id')} uses deprecated source_class 'government'; use 'authoritative'")

    for p in portals:
        if p.get("organisation") not in org_ids:
            errors.append(f"Portal {p.get('id')} references missing organisation {p.get('organisation')}")
        if p.get("url") and is_external(str(p["url"])) is False:
            errors.append(f"Portal {p.get('id')} has malformed external URL {p.get('url')}")


def validate_html(errors: list[str]) -> None:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    parser = SiteHTMLParser()
    parser.feed(html)

    counts = Counter(parser.ids)
    dupes = sorted(k for k, n in counts.items() if n > 1)
    if dupes:
        errors.append(f"Duplicate HTML ids: {', '.join(dupes)}")

    ids = set(parser.ids)
    for anchor in parser.anchors:
        if anchor and anchor not in ids:
            errors.append(f"Missing internal anchor target: #{anchor}")

    for asset in parser.local_assets:
        if not (ROOT / asset).exists():
            errors.append(f"Missing local asset referenced by HTML: {asset}")

    for href, rel in parser.external_blank_links:
        tokens = set(rel.split())
        if not {"noopener", "noreferrer"}.issubset(tokens):
            errors.append(f"External _blank link missing rel='noopener noreferrer': {href}")

    metas = dict(parser.meta)
    for key in ("og:image", "twitter:image"):
        if key not in metas:
            errors.append(f"Missing social preview metadata: {key}")
    if "summary_large_image" != metas.get("twitter:card"):
        errors.append("Twitter card should use summary_large_image")
    if 'role="img"' in html:
        errors.append("Interactive map container must not use role='img'")
    for required in ("Live catalogue", "Available via Nebula", "Coming soon", "Exploring / planned"):
        if required not in html:
            errors.append(f"Missing launch status label: {required}")
    for required in (
        "India — GeoIndia",
        "Europe edition",
        "United States edition",
        "Build locally. Standardize globally.",
        "first live regional edition",
    ):
        if required not in html:
            errors.append(f"Missing Civic Index architecture text: {required}")
    for fake_route in ('href="/europe"', 'href="/us"', 'href="/india"', 'href="europe"', 'href="us"'):
        if fake_route in html:
            errors.append(f"Unexpected fake regional route exposed: {fake_route}")


def validate_app(errors: list[str]) -> None:
    app = (ROOT / "assets" / "js" / "app.js").read_text(encoding="utf-8")
    required_snippets = [
        "d.source_class === 'authoritative'",
        "Potential data gap.",
        "safeExternalUrl(p.url)",
        "safeExternalUrl(d.url)",
        "URL.createObjectURL(blob)",
        "coverageLabel = state || (scope === 'Global' ? 'Global'",
    ]
    for snippet in required_snippets:
        if snippet not in app:
            errors.append(f"Missing application invariant: {snippet}")


def main() -> int:
    errors: list[str] = []
    validate_json(errors)
    validate_catalog(errors)
    validate_html(errors)
    validate_app(errors)

    if errors:
        print("Validation failed:")
        for error in errors:
            print(f" - {error}")
        return 1

    print("Validation passed: JSON, catalogue references, HTML ids, anchors and local assets.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
