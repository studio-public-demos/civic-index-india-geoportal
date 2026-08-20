# Agents

The Studio agent pipeline maintains this catalogue. The v0.1 seed maps each
agent's responsibility to a committed, reproducible script in `tools/`.

| Agent | Seed implementation (v0.1) | Production (Studio) |
|-------|---------------------------|---------------------|
| Discovery / Crawler | Curated portal list in `tools/build_catalog.py` | Autonomous portal & page discovery |
| Metadata extraction | Dataset entries in `tools/build_catalog.py` | Structured extraction from pages |
| Classification | Theme/scope/access normalisation in `build_catalog.py` | LLM-assisted normalisation + human review |
| Verification | `tools/verify_links.py` (HTTP checks) | Scheduled link + endpoint checks with evidence capture |
| Boundary preparation | `tools/prepare_boundaries.py` (Natural Earth) | Authoritative boundary ingestion |
| Publishing | `git push` to this repository | GitHub Actions + Pages deploy |

In production these run as Studio missions on a schedule; the committed scripts
document the schema and logic so the process is transparent and reproducible.
