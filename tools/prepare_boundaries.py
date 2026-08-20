"""Prepare India state/UT boundaries for Nebula Civic Index.

Source: Natural Earth 10m admin-1 states/provinces (public domain).
Filter to India, simplify, round coordinates, normalise names, emit a compact
GeoJSON with a single canonical `name` + `type` (State / Union Territory).

Run:  python tools/prepare_boundaries.py <input_admin1.geojson> <out_dir>
"""
import json
import sys
from pathlib import Path

from shapely.geometry import shape, mapping
from shapely.ops import unary_union


def normalize(name: str, type_en: str) -> tuple[str, str]:
    """Return (canonical_name, kind)."""
    n = (name or "").strip()
    aliases = {
        "Andaman and Nicobar": "Andaman and Nicobar Islands",
        "Delhi": "Delhi (NCT)",
        "Jammu and Kashmir": "Jammu & Kashmir",
        "Dadra and Nagar Haveli and Daman and Diu": "Dadra & Nagar Haveli and Daman & Diu",
        "Puducherry": "Puducherry",
    }
    n = aliases.get(n, n)
    kind = "Union Territory" if (type_en or "").strip() == "Union Territory" else "State"
    return n, kind


def main() -> None:
    src = Path(sys.argv[1])
    out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("assets/data")
    out_dir.mkdir(parents=True, exist_ok=True)

    data = json.loads(src.read_text(encoding="utf-8"))

    feats = []
    for f in data["features"]:
        p = f["properties"]
        if p.get("admin") != "India" and p.get("adm0_a3") != "IND" and p.get("iso_a2") != "IN":
            continue
        geom = shape(f["geometry"])
        # Simplify ~1km at equator; Natural Earth 10m is already coarse.
        geom = geom.simplify(0.01, preserve_topology=True)
        name, kind = normalize(p.get("name_en") or p.get("name"), p.get("type_en"))
        feats.append(
            {
                "type": "Feature",
                "properties": {"name": name, "type": kind},
                "geometry": mapping(geom),
            }
        )

    # Sort by name for stable diffs.
    feats.sort(key=lambda f: f["properties"]["name"])

    out = {"type": "FeatureCollection", "features": feats}

    out_path = out_dir / "india-states.geojson"
    # Compact with 4-decimal rounding to keep the file small.
    raw = json.dumps(out, separators=(",", ":"))
    parsed = json.loads(raw)
    rounded = json.loads(
        json.dumps(
            parsed,
            default=lambda o: round(o, 4) if isinstance(o, float) else o,
            separators=(",", ":"),
        )
    )
    out_path.write_text(json.dumps(rounded, separators=(",", ":")), encoding="utf-8")

    size = out_path.stat().st_size
    print(f"Wrote {out_path} ({size/1024:.0f} KB, {len(feats)} features)")
    print("States/UTs:", ", ".join(f["properties"]["name"] for f in feats))


if __name__ == "__main__":
    main()
