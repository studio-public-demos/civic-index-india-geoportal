# Classification methodology

## Source class

Every dataset is assigned one of four source tiers, which power the
"authoritative vs alternatives" comparison:

| Tier | Meaning | Examples |
|------|---------|----------|
| **Government** (`authoritative`) | Published by a government agency or PSU. | Survey of India, CWC, Census of India. |
| **Open community** (`open-community`) | Crowd/community-maintained open data. | OpenStreetMap, DataMeet. |
| **Global open** (`global-open`) | International open-data providers with India coverage. | Microsoft, Google, NASA, ESA/Copernicus, Natural Earth. |
| **Earth observation** (`eo-derived`) | Satellite-derived products. | Bhuvan, NICES, MOSDAC, VEDAS, NDEM. |

A fifth row — **Studio-assisted generation** — is shown in the public comparison
table as a possible post-discovery pathway, not as a catalogued source. Where
suitable public data is unavailable, Studio workflows can derive selected
geospatial assets from imagery or other source data, subject to source
availability, quality and project requirements.

## Themes

Fine-grained themes are normalised into **16 fixed theme groups** (Buildings,
Land, Agriculture, Water, Climate, Disaster, Transport, Urban, Forest &
Environment, Elevation, Satellite Imagery, Administrative Boundaries,
Demographics, Infrastructure, Marine & Ocean, Energy). The chips, map and gap
analysis operate on these groups; the original fine-grained wording is retained
on each record's description and keywords.

## Coverage vs scope

- **Coverage** is *where* the data applies: All India, Global, Regional,
  Multi-state, or a single state/UT.
- **Scope** (on the portal) is *who* the publisher is: India vs Global vs
  Regional.

## Access tier vs licence

- **Access tier** is the practical gate: Open, Open (Registration), Restricted,
  Academic, Paid, Mixed, Not specified.
- **Licence** is the legal terms, recorded from source evidence.

## Provenance

Every assertion carries a source, evidence and verification date. Records whose
classification is uncertain are flagged for **human review** before publication.
