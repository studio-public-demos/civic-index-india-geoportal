# Nebula Civic Index — GeoIndia

**Find. Verify. Compare. Act.**

GeoIndia is an open intelligence layer for India's fragmented public geospatial data. It helps users discover public datasets, services and portals; assess access, licence signals, provenance, freshness and usability; compare authoritative and alternative sources; identify evidence gaps; and move from discovery into analysis with NebulaCloud Studio.

**Live site**: https://geoindia.nebulacloud.in/

**Technical hosting origin**: https://studio-public-demos.github.io/civic-index-india-geoportal/

> **Notice**
> This repository is a public product showcase created with NebulaCloud Studio. The catalogue metadata, schema, methodology and static website are published openly. Proprietary prompts, private execution workflows and internal Studio infrastructure are not included.

## What Problem It Solves

Public geospatial data for India is spread across national agencies, state geoportals, research repositories, community projects and international providers. A user often has to answer several questions before any GIS or analytics work can begin:

- Does relevant data appear to exist?
- Is there an authoritative government source?
- Is it openly accessible and downloadable?
- Is it GIS-ready or API/OGC accessible?
- Are community, global-open or Earth-observation alternatives available?
- If current indexed sources are insufficient, what should happen next?

GeoIndia is designed to answer those questions from catalogued evidence. It is a discovery and intelligence layer, not a data host. Every dataset record links to the source, and the source's terms govern the underlying data.

## Nebula Civic Index

Nebula Civic Index is an open public-data intelligence initiative by Nebula Cloud Public Good Labs. It helps make fragmented public datasets easier to discover, verify, compare and act on across jurisdictions.

GeoIndia is the first live regional edition. Europe and the United States are planned next, but they are not live products in this repository. The current repository remains specifically the India implementation.

The expansion principle is: **Build locally. Standardize globally.** Each regional edition should respect local institutions, licensing, standards, jurisdiction hierarchy, languages and data infrastructure while normalizing evidence into a shared intelligence model.

No Europe or United States datasets are currently served by this GeoIndia repository unless explicitly catalogued as global alternatives relevant to India.

## Regional Roadmap

### India

GeoIndia is live and remains focused on India's public geospatial data ecosystem.

### Europe

Coming soon. The Europe edition is expected to begin with EU-level infrastructure and selected national ecosystems, including sources such as EU open-data infrastructure, INSPIRE, Copernicus, Eurostat, the European Environment Agency, national mapping/open-data agencies and selected regional or local public-data infrastructure.

### United States

Coming soon. The United States edition is expected to begin with federal sources such as federal open data, USGS, Census, NOAA, NASA, FEMA, EPA, USDA and transport/infrastructure data before expanding into selected state GIS clearinghouses and county/city open-data portals.

## More Than A Directory

A conventional directory is a list of links. GeoIndia adds a structured intelligence layer:

- normalized themes, source classes, portals, organisations and geographies;
- access, licence, format, API/OGC, downloadability and link-health signals;
- evidence-based portal and dataset usability scoring;
- map-based state/UT exploration;
- gap analysis that distinguishes "not currently catalogued" from "does not exist";
- source comparison across government, open-community, global-open and Earth-observation alternatives.

The public catalogue remains free and open. Commercial value begins after discovery, through execution and managed intelligence services.

## Current Capabilities

- Interactive India map with state/UT filtering using MapLibre GL JS.
- Faceted catalogue search by theme, scope, provider type, source class, access tier, format and geography.
- **Ask GeoIndia**, a deterministic browser-side catalogue assistant that synthesizes indexed metadata for natural-language queries. It does not call a live LLM and does not execute Studio missions.
- GeoIndia portal assessment based on catalogued evidence.
- Dataset usability score based on machine readability, GIS readiness, downloadability, API availability and recency.
- Data availability gap analysis using careful catalogue-evidence wording.
- Source comparison across authoritative, community, global-open, Earth-observation and Studio-assisted generation paths.
- CSV export of the current filtered view, plus JSON catalogue files and JSON Schema.

## Product Model

GeoIndia follows the Civic Index launch model:

**Open Index -> Intelligence -> Execution -> Enterprise**

- **Open Index**: the catalogue metadata, schema and methodology stay open.
- **Intelligence**: GeoIndia helps users understand access, provenance, freshness, usability, alternatives and gaps.
- **Execution**: NebulaCloud Studio supports analysis, transformation, mapping, reporting and derived-data workflows after discovery.
- **Enterprise**: the same architecture can support private observatories, managed data readiness and organisation-specific source intelligence.

There are no paywalled catalogue records, no invented pricing tiers and no public-site claims that a Studio job or monitoring mission starts automatically.

## From Discovery To Studio

NebulaCloud Studio is the commercial execution layer connected to the GeoIndia journey. It can support:

- GIS/data/AI analysis workflows using discovered public datasets;
- data readiness and managed intelligence services;
- CRS, schema and format normalization;
- project or tender data-risk assessment;
- generation or derivation of selected missing assets, where source data and project conditions make that technically appropriate;
- private data observatories for internal and public datasets.

Studio website: https://nebulacloud.studio

## Data And Provenance

The current catalogue is an independently curated seed snapshot containing 101 dataset records across 29 portals, 23 organisations and 16 theme groups. These figures describe the current repository snapshot and should be treated as versioned catalogue state, not a claim of exhaustive national coverage.

Each dataset record carries source URL, access tier, licence classification, formats, coverage, source class, link health and verification timestamp where available. Link health is a point-in-time HTTP check. Some government portals block automated checks, so `unverified` is preserved as a valid state rather than treated as broken.

Licence and access classification is informational. Confirm source terms before production or commercial use.

## Architecture

The public application is deliberately static and dependency-light:

| Layer | Technology |
|-------|------------|
| Frontend | HTML, vanilla JavaScript, hand-tuned CSS |
| Map | MapLibre GL JS with CARTO/OSM basemap tiles |
| Boundary data | Natural Earth 10m Admin 1 boundaries, simplified |
| Catalogue | JSON data files and JSON Schema |
| Tooling | Python stdlib scripts plus optional boundary prep dependency |
| Hosting | GitHub Pages |

## Jurisdiction-Neutral Architecture Direction

The current GeoIndia JSON remains stable for launch. Conceptually, Civic Index is intended to evolve toward a jurisdiction-aware model:

```text
Country
-> Jurisdiction
-> Organisation
-> Portal
-> Catalogue
-> Dataset / Service / API
-> Geographic coverage
-> Licence
-> Access
-> Formats / protocols
-> Verification evidence
-> Quality / usability
-> Alternatives
-> Gaps
```

Jurisdiction should eventually represent scales such as India, Telangana, the European Union, Germany, Bavaria, the United States, California or Los Angeles County.

Jurisdiction-aware Civic Index intelligence can support future workflows such as project data feasibility, market research, infrastructure intelligence, tender/bid data assessment, public-data sourcing and geography-specific evidence gathering. These are architectural directions, not public-site features in this repository.

### Future Civic Intelligence API

Future API concepts may include:

```text
GET /jurisdictions
GET /datasets/search
GET /sources
GET /coverage
GET /quality
GET /provenance
GET /alternatives
GET /gaps
GET /availability
GET /changes
```

Potential query concepts:

```text
/datasets/search?theme=buildings&country=US&region=California
/gaps?theme=flood-risk&country=DE
```

These endpoints are not exposed by the current static GeoIndia site.

## Repository Structure

```text
civic-index-india-geoportal/
├── index.html
├── assets/
│   ├── css/styles.css
│   ├── js/app.js
│   └── data/
├── schemas/civic-index.schema.json
├── methodology/
├── tools/
├── ATTRIBUTIONS.md
├── LICENSE
└── README.md
```

## Scope And Limitations

- The catalogue is a seed public index, not an exhaustive inventory of every Indian geospatial dataset.
- Europe and United States editions are roadmap positioning only in this repository; no regional catalogues, maps, pipelines or cross-region search are implemented here.
- Ask GeoIndia is a deterministic client-side metadata synthesis feature, not a production AI agent.
- The public site does not re-host underlying datasets.
- The public site does not start live Studio missions, monitoring jobs, API subscriptions, alerts or authentication flows.
- Autonomous scheduled maintenance, endpoint/schema monitoring, saved geographies, alerts and machine-readable intelligence APIs are roadmap directions rather than current public-site features.

## Licensing

This repository is multi-licensed:

- **Code**: MIT.
- **Catalogue metadata** (`assets/data/*.json`, excluding boundary geometry): CC-BY 4.0.
- **Boundary geometry** (`assets/data/india-states.geojson`): public domain, from Natural Earth.
- **Third-party datasets**: remain under their respective source licences. GeoIndia links to sources and does not redistribute the underlying datasets.

See `LICENSE` and `ATTRIBUTIONS.md`.

## Public Good Labs

Nebula Civic Index — GeoIndia is an independent public-good initiative by Nebula Cloud Public Good Labs. It is not an official Government of India portal.

Nebula Civic Index is the public-data intelligence programme across jurisdictions: India is live through GeoIndia, while Europe and the United States are coming soon. Separately, Public Good Labs is exploring thematic initiatives such as ClimateIndia, UrbanIndia, AgriIndia and HeritageIndia. Those thematic initiatives are not presented as launched Civic Index regional editions in this repository.
