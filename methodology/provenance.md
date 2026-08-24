# Provenance methodology

## Principle

Nebula Civic Index is a **provenance-first** index. No assertion is published
without recording where it came from, what evidence supports it, and when it was
last verified.

## What is recorded

For each dataset record:

- **Source URL** — the authoritative page the record points to.
- **Link health** — the result of the last HTTP check (`live`, `dead`, `down`,
  `unverified`).
- **Verified at** — the timestamp of the last verification pass.
- **Published / updated year** — as stated by the source.

For each portal:

- **Organisation** and **provider type** — who runs it.
- **OGC / API / STAC** capabilities — whether services are advertised.

The `audit-log.json` file carries an append-only trail of agent actions
(discovery, extraction, classification, verification, publishing) with a
timestamp and note for each.

## Independent assembly

This catalogue is assembled independently from **primary sources** — portal home
pages, open-data platforms, community repositories and international providers —
not by copying any third-party catalogue. Each record is traceable to a public
source.

## Human review

Records whose classification is uncertain (ambiguous licence, unresolvable
coverage, link that could not be verified) are flagged for human review rather
than silently resolved. The goal is honesty: "unverified" is a truthful state,
not a failure.

## Maintenance

The current catalogue combines Studio-assisted workflows with human review.
Autonomous scheduled maintenance, source monitoring and endpoint/schema change
detection are platform roadmap directions, not live public-site features.

## Reproducibility

The pipeline that produces the catalogue artefacts is committed in `tools/`:

- `prepare_boundaries.py` — derives state/UT boundaries from Natural Earth.
- `build_catalog.py` — emits `themes.json`, `organisations.json`, `portals.json`,
  `datasets.json` and `audit-log.json` from the curated source.
- `verify_links.py` — performs the link-health pass and stamps `verified_at`.
