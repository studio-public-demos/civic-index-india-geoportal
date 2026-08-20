# Nebula Civic Index — GeoIndia

**An open public-data discovery and intelligence platform for India's geospatial data.**

**Live demo** → https://studio-public-demos.github.io/civic-index-india-geoportal/

> **Notice**
> This repository is a **public project showcase** created with NebulaCloud Studio.
> It is an open, independently assembled public-good initiative, not a private
> implementation repository. The catalogue data, schema, methodology and website
> are published openly; proprietary prompts and internal Studio workflows are
> intentionally not included.

---

## 1. Overview

**Nebula Civic Index — GeoIndia** is an open index of public geospatial datasets,
services and portals for India — *continuously discovered, verified and enriched
with Studio AI*.

The core promise: **Discover. Verify. Understand. Use.**

India's public geospatial data is scattered across hundreds of government,
research and community portals (Bhuvan, Bhoonidhi, India-WRIS, Survey of India,
data.gov.in, state SDIs and more). Finding a dataset is a multi-day manual hunt,
and even then it is hard to tell whether a link works, what licence governs it,
or whether it is "open" in practice. Civic Index turns that into one search away.

It is a **discovery layer, not a data host** — every record links out to the
authoritative source, and the source's terms govern.

## 2. What makes this different from a directory

A conventional catalogue is: *human research → catalogue → filters → links.*

Civic Index is: *public internet + portals → Studio agents → structured
catalogue → verification → geospatial intelligence → search / map / API.*

The catalogue is **autonomously assembled and validated**, with human review for
uncertain records. That makes it a live demonstration of Studio as an
intelligence/automation layer, not a hand-maintained list.

## 3. Studio agent pipeline

| Agent / mission | Function |
|-----------------|----------|
| Discovery | Finds candidate government & open-data portals. |
| Crawler | Traverses catalogues and dataset pages. |
| Metadata | Extracts title, agency, geography, theme, date, format. |
| GeoService | Detects WMS/WFS/WMTS/OGC API/STAC endpoints. |
| Licence | Identifies licence and usage restrictions. |
| Verification | Checks links and endpoints, records evidence. |
| Quality | Scores metadata completeness and usability. |
| Classification | Normalises themes, geographies and organisations. |
| Change | Detects portal and dataset changes. |
| Provenance | Stores source, evidence and date for every assertion. |
| Human review | Flags uncertain classifications for sign-off. |
| Publishing | Updates the open GitHub catalogue. |

The seed pipeline that emits this repository's artefacts is committed in
`tools/` (`prepare_boundaries.py`, `build_catalog.py`, `verify_links.py`).

## 4. Features

- **Interactive India map** (MapLibre GL JS) — choropleth of datasets by
  state/UT, click to filter, pan/zoom, tooltips.
- **Faceted search & filters** — theme, scope, provider type, source tier,
  access tier, format and state, all updating together.
- **Ask Studio** — plain-language queries return a synthesized capability table
  (datasets, portals, OGC services, APIs, formats, coverage, access, link health,
  freshness, assessment) instead of forcing 15 filters.
- **Portal assessment** — 0–100 scoring on open access, download capability,
  GIS-ready formats, recency, APIs and link reliability.
- **Data availability gap analysis** — pick a theme and a state to see
  authoritative vs open coverage and where the gaps are.
- **Source comparison** — authoritative vs open-community vs global-open vs
  Earth-observation vs Studio-generated for any asset class.
- **Open, downloadable catalogue** — CSV export, plus JSON data files and a JSON
  Schema, under CC-BY 4.0.
- **Provenance-first** — every assertion carries source, evidence and
  verification timestamp; link health is a real HTTP check.

## 5. Architecture

```
Government / Research / Open-data portals
                   ↓
              Studio agents
                   ↓
     discovery / extraction / verification
                   ↓
        structured catalogue repository
                   ↓
   ┌───────────────┼─────────────────┐
   ↓               ↓                 ↓
datasets.json  portals.json     audit-log.json
   ↓
static site build (no server)
   ↓
GitHub Pages
   ↓
Nebula Civic Index — GeoIndia
```

The public application is deliberately **static** (HTML + CSS + JS + JSON), so it
runs anywhere with near-zero operating cost.

### Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla JS (no framework), hand-tuned CSS design system |
| Map | MapLibre GL JS + CARTO/OSM basemap |
| Boundary data | Natural Earth 10m (public domain), simplified |
| Catalogue | JSON data files + JSON Schema (DCAT-inspired) |
| Automation seed | Python (`urllib`/`shapely`) in `tools/` |
| Hosting | GitHub Pages |

## 6. Repository layout

```
civic-index-india-geoportal/
├── index.html              # the application
├── assets/
│   ├── css/styles.css
│   ├── js/app.js
│   └── data/               # datasets.json, portals.json, organisations.json,
│                           # themes.json, audit-log.json, india-states.geojson
├── schemas/civic-index.schema.json
├── methodology/            # scoring.md, classification.md, provenance.md
├── tools/                  # prepare_boundaries.py, build_catalog.py, verify_links.py
├── ATTRIBUTIONS.md
├── LICENSE
└── README.md
```

## 7. Data

- **~100 datasets** across **29 portals**, **16 themes** and **23 agencies** in
  the v0.1 seed (independently curated from primary sources).
- Link health is verified by `tools/verify_links.py`; results are stamped back
  into the catalogue (`live` / `dead` / `down` / `unverified`).
- Catalogue data is **CC-BY 4.0**; boundaries are public domain (Natural Earth).

## 8. Intended users

- **Researchers & academics** finding data for a place or theme.
- **Government agencies** discovering what exists elsewhere and benchmarking
  openness.
- **NGOs, journalists & civil society** needing clear access/licence signals.
- **Private sector & geospatial startups** sourcing data and mapping providers.
- **Developers & data engineers** wanting machine-readable metadata.
- **International organisations & donors** needing a trustworthy index.

## 9. Public-good positioning

The catalogue is **free and open**. The commercial value sits above it: once a
user discovers a data gap, Civic Index becomes the entry point to an actual
geospatial workflow (imagery → extraction → comparison → analysis), with Studio
as the intelligence layer that can *generate* what is missing.

## 10. Scope of this v0.1

- Seed catalogue (~100 records, 29 portals) — the architecture is proven before
  scaling to thousands.
- Ask Studio is a client-side prototype (v0.1); production uses the agent
  pipeline.
- Link verification is an automated HTTP check; a subset of government portals
  block automated agents and are honestly marked `unverified`.

## 11. Built with NebulaCloud Studio

This project was planned, orchestrated and produced with **NebulaCloud Studio**.

- Website: https://nebulacloud.studio

## 12. Call to action

If this resonates with your organisation, Nebula Cloud Studio can help you stand
up a similar open-data index — or the intelligence layer that fills the gaps in
your own geography.

- **Explore the platform** → https://nebulacloud.studio
- **Live demo** → https://studio-public-demos.github.io/civic-index-india-geoportal/

---

*Nebula Civic Index — GeoIndia is an initiative of Nebula Cloud Public Good Labs.*
