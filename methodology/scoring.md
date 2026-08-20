# Scoring methodology

Portals are scored **0–100** from their catalogued records, then ranked. Each
record contributes to its portal's score on six weighted dimensions:

| Dimension | Weight | How it is measured |
|-----------|--------|--------------------|
| Open & free access | 20 | Share of records with access tier *Open* or *Open (Registration)*. |
| Download capability | 25 | Share of records that are directly downloadable. |
| GIS-ready formats | 15 | Share of records in machine-readable, GIS-usable formats. |
| API & OGC services | 15 | Portal advertises an API, else the share of records that are API-ready. |
| Data recency | 15 | Most recent *updated/published* year among the portal's records. |
| Link reliability | 10 | Share of checked links that resolve (live vs. dead/down). |

Records marked **Not specified** are excluded from a dimension rather than
assumed — the score reflects what is actually catalogued and evidenced.

## Per-dataset "Studio score"

Each dataset also carries a 0–100 usability score: machine-readable (25),
GIS-ready (25), downloadable (20), API available (15) and recency (15). This
drives the *Studio score* sort and the synthesized "Ask Studio" assessment.

## Caveats

- Scores are **not** a general quality judgement of a portal — they reflect
  only what is catalogued in this index.
- Link health is a point-in-time HTTP check, not a content guarantee.
- Access and licence are classified from source evidence, never treated as
  legal clearance.
