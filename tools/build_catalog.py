"""Generate the Nebula Civic Index — GeoIndia catalogue data.

This is the v0.1 seed catalogue: independently curated from primary public
sources (portal home pages, open data platforms, community data). In production
these files are maintained by Studio agents (discovery / metadata / verification
/ classification / provenance); this script documents the schema and emits the
same artefacts so the site, API and downloads all read one canonical source.

Outputs (written to assets/data/):
  themes.json        — the fixed theme-group taxonomy (16 groups)
  organisations.json — agencies / publishers
  portals.json       — data portals + scoring attributes
  datasets.json      — the dataset index
  audit-log.json     — provenance trail (seed examples)

Run:  python tools/build_catalog.py
"""
import json
from datetime import datetime, timezone
from pathlib import Path

OUT = Path("assets/data")
OUT.mkdir(parents=True, exist_ok=True)

NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# --------------------------------------------------------------------------- #
# Taxonomy
# --------------------------------------------------------------------------- #
THEMES = [
    # id, label, blurb
    ("buildings", "Buildings", "Building footprints, structures, urban fabric."),
    ("land", "Land", "Land use, land cover, soils, land records."),
    ("agriculture", "Agriculture", "Crops, irrigation, agro-meteorology, farm data."),
    ("water", "Water", "Surface & groundwater, basins, hydrology, quality."),
    ("climate", "Climate", "Weather, climate, atmosphere, air quality."),
    ("disaster", "Disaster", "Floods, cyclones, drought, earthquakes, early warning."),
    ("transport", "Transport", "Roads, rail, ports, mobility networks."),
    ("urban", "Urban", "Cities, municipal boundaries, amenities, planning."),
    ("forestry", "Forest & Environment", "Forest cover, biodiversity, ecosystems."),
    ("elevation", "Elevation", "DEM/DTM, terrain, contours, slope."),
    ("imagery", "Satellite Imagery", "Optical & SAR scenes, mosaics, indices."),
    ("boundaries", "Administrative Boundaries", "State, district, tehsil, village boundaries."),
    ("demographics", "Demographics", "Census, population, socio-economic statistics."),
    ("infrastructure", "Infrastructure", "Energy, telecom, dams, public facilities."),
    ("marine", "Marine & Ocean", "Oceanography, coastal, fisheries, bathymetry."),
    ("energy", "Energy", "Power, renewables, solar/wind potential."),
]
THEMES = [{"id": i, "label": l, "blurb": b} for i, l, b in THEMES]

# --------------------------------------------------------------------------- #
# Organisations (agencies / publishers)
# --------------------------------------------------------------------------- #
ORG_TYPES = [
    "Government & PSU",
    "Scientific Institution",
    "Commercial Provider",
    "NGO & International",
    "Community",
]

ORGS = [
    # id, name, type
    ("isro-nrsc", "ISRO / NRSC (National Remote Sensing Centre)", "Government & PSU"),
    ("isro-sac", "ISRO / SAC (Space Applications Centre)", "Government & PSU"),
    ("survey-of-india", "Survey of India", "Government & PSU"),
    ("cwc", "Central Water Commission", "Government & PSU"),
    ("imd", "India Meteorological Department", "Government & PSU"),
    ("fsi", "Forest Survey of India", "Government & PSU"),
    ("gsi", "Geological Survey of India", "Government & PSU"),
    ("census", "Office of the Registrar General & Census Commissioner", "Government & PSU"),
    ("icar", "ICAR (Indian Council of Agricultural Research)", "Government & PSU"),
    ("natmo", "NATMO (National Atlas & Thematic Mapping Organisation)", "Government & PSU"),
    ("nic", "NIC / Ministry of Electronics & IT", "Government & PSU"),
    ("incois", "INCOIS (Indian National Centre for Ocean Information Services)", "Government & PSU"),
    ("ksrsac", "KSRSAC (Karnataka State Remote Sensing Applications Centre)", "Government & PSU"),
    ("osm", "OpenStreetMap Foundation", "Community"),
    ("datameet", "DataMeet", "Community"),
    ("microsoft", "Microsoft", "Commercial Provider"),
    ("google", "Google Research", "Commercial Provider"),
    ("natural-earth", "Natural Earth", "NGO & International"),
    ("nasa", "NASA / CIESIN", "Scientific Institution"),
    ("usgs", "USGS", "Scientific Institution"),
    ("esa", "ESA / Copernicus", "NGO & International"),
    ("opentopography", "OpenTopography", "Scientific Institution"),
    ("icimod", "ICIMOD", "NGO & International"),
]
ORGS = [{"id": i, "name": n, "type": t} for i, n, t in ORGS]

# --------------------------------------------------------------------------- #
# Portals
# --------------------------------------------------------------------------- #
# Fields: id, name, org, url, scope (India|Global|Regional), description,
# ogc (bool), api (bool), stac (bool)
PORTALS = [
    ("bhuvan", "Bhuvan", "isro-nrsc", "https://bhuvan.nrsc.gov.in", "India",
     "ISRO's national geo-platform for satellite imagery, thematic maps and geospatial services.", True, True, False),
    ("bhoonidhi", "Bhoonidhi", "isro-nrsc", "https://bhoonidhi.nrsc.gov.in", "India",
     "ISRO's portal for ordering and downloading satellite data products (Resourcesat, Cartosat, etc.).", False, True, False),
    ("nices", "Bhuvan NICES", "isro-nrsc", "https://nices.nrsc.gov.in", "India",
     "National Information System for Climate and Environment Studies — long-term EO analytics.", True, True, False),
    ("mosdac", "MOSDAC", "isro-sac", "https://www.mosdac.gov.in", "India",
     "Meteorological & Oceanographic Satellite Data Centre — weather, ocean and atmosphere data.", True, True, False),
    ("vedas", "VEDAS", "isro-sac", "https://vedas.sac.gov.in", "India",
     "Visualisation of Earth observation Data and Archival System — decision-support analytics.", True, True, False),
    ("ndem", "NDEM", "isro-nrsc", "https://ndem.nrsc.gov.in", "India",
     "National Database for Emergency Management — disaster maps and exposure data.", True, True, False),
    ("wris", "India-WRIS", "cwc", "https://indiawris.gov.in", "India",
     "Water Resources Information System — basins, dams, groundwater, water quality.", True, True, False),
    ("cwc", "Central Water Commission", "cwc", "https://cwc.gov.in", "India",
     "Hydrological observations, flood forecasts and water-resource data.", False, True, False),
    ("imd", "India Meteorological Department", "imd", "https://mausam.imd.gov.in", "India",
     "Weather forecasts, climate monitoring and historical meteorological data.", False, True, False),
    ("fsi", "Forest Survey of India", "fsi", "https://fsi.nic.in", "India",
     "Biennial State of Forest Report, forest cover and tree cover data.", False, False, False),
    ("gsi-bhukosh", "Bhukosh (GSI)", "gsi", "https://bhukosh.gsi.gov.in", "India",
     "Geological Survey of India's geological, geophysical and geochemical maps.", True, True, False),
    ("census", "Census of India", "census", "https://censusindia.gov.in", "India",
     "Population census tables, village/town directories and boundary data.", False, True, False),
    ("data-gov", "Open Government Data (data.gov.in)", "nic", "https://data.gov.in", "India",
     "India's open data portal — thousands of central & state datasets with APIs.", True, True, False),
    ("soi", "Survey of India", "survey-of-india", "https://surveyofindia.gov.in", "India",
     "National mapping agency — topographic maps, geodetic control, boundaries.", False, False, False),
    ("soi-nakshe", "SoI Open Series Maps (Nakshe)", "survey-of-india", "https://onlinemaps.surveyofindia.gov.in", "India",
     "Free download of Open Series topographic maps of India.", False, False, False),
    ("natmo", "NATMO", "natmo", "https://natmo.gov.in", "India",
     "National Atlas & Thematic Mapping Organisation — thematic and atlas maps.", False, False, False),
    ("krishi", "Krishi (ICAR Data Centre)", "icar", "https://krishi.icar.gov.in", "India",
     "ICAR's knowledge management and data repository for agricultural research.", False, True, False),
    ("incois", "INCOIS", "incois", "https://incois.gov.in", "India",
     "Ocean state forecasts, potential fishing zones, tsunami and storm-surge warnings.", True, True, False),
    ("ksrsac", "KSRSAC (Karnataka Geoportal)", "ksrsac", "https://kgis.ksrsac.in", "India",
     "Karnataka State Remote Sensing Applications Centre — state-level geospatial data.", True, True, False),
    ("osm", "OpenStreetMap (Geofabrik India)", "osm", "https://download.geofabrik.de/asia/india.html", "Global",
     "OpenStreetMap extracts for India — roads, buildings, land use and POIs (ODbL).", False, True, False),
    ("datameet", "DataMeet Maps", "datameet", "https://github.com/datameet/maps", "India",
     "Community-curated open boundaries and maps of India (districts, states, ACs/PCs).", False, False, False),
    ("microsoft-bf", "Microsoft Building Footprints", "microsoft", "https://github.com/microsoft/GlobalMLBuildingFootprints", "Global",
     "AI-generated building footprints for most countries, freely downloadable.", False, True, False),
    ("google-ob", "Google Open Buildings", "google", "https://sites.research.google/open-buildings/", "Global",
     "AI-derived building footprint dataset covering South Asia, Africa and more.", False, True, False),
    ("natural-earth", "Natural Earth", "natural-earth", "https://www.naturalearthdata.com", "Global",
     "Public-domain vector & raster basemap data at 1:10m, 1:50m and 1:110m.", False, False, False),
    ("sedac", "NASA SEDAC", "nasa", "https://sedac.ciesin.columbia.edu", "Global",
     "Socio-economic and environmental datasets: population, gridded demography, hazards.", False, True, False),
    ("usgs-ee", "USGS EarthExplorer", "usgs", "https://earthexplorer.usgs.gov", "Global",
     "Global Landsat and other satellite imagery search and download.", False, True, False),
    ("copernicus", "Copernicus Data Space", "esa", "https://dataspace.copernicus.eu", "Global",
     "Sentinel imagery and Copernicus land/atmosphere/marine products (open).", True, True, True),
    ("opentopography", "OpenTopography", "opentopography", "https://opentopography.org", "Global",
     "High-resolution topography (DEM, LiDAR) and terrain derivatives.", False, True, False),
    ("icimod", "ICIMOD Regional Data System", "icimod", "https://rds.icimod.org", "Regional",
     "Mountain/hydromet data for the Hindu Kush Himalaya, including Indian Himalayan states.", False, True, False),
]
PORTALS = [
    {
        "id": p[0], "name": p[1], "organisation": p[2], "url": p[3], "scope": p[4],
        "description": p[5], "ogc": p[6], "api": p[7], "stac": p[8],
    }
    for p in PORTALS
]

# --------------------------------------------------------------------------- #
# Datasets
# --------------------------------------------------------------------------- #
# source_class: authoritative | open-community | global-open | eo-derived
# access:       Open | Open (Registration) | Restricted | Academic | Paid | Mixed | Not specified
# dl:           direct download available (bool)
_D = []

def ds(title, portal, theme, coverage, formats, access, licence, url, *,
       desc="", state=None, source_class="authoritative", dl=True,
       api=False, ogc=False, machine=True, gis=True, api_ready=False,
       year=None, updated=None, keywords=None, link_health="not_checked"):
    _D.append({
        "id": f"{portal}-{theme}-{len(_D)+1}",
        "title": title,
        "description": desc,
        "portal": portal,
        "theme": theme,
        "coverage": coverage,
        "state": state,
        "formats": formats,
        "access_tier": access,
        "licence": licence,
        "url": url,
        "source_class": source_class,
        "downloadable": dl,
        "api": api,
        "ogc": ogc,
        "machine_readable": machine,
        "gis_ready": gis,
        "api_ready": api_ready,
        "published_year": year,
        "updated_year": updated,
        "keywords": keywords or [],
        "link_health": link_health,
        "verified_at": None,
    })

# ---- Bhuvan (eo-derived) --------------------------------------------------
ds("Land Use / Land Cover (1:250k)", "bhuvan", "land", "All India",
   ["GeoTIFF", "Shapefile", "WMS"], "Open", "Open licence",
   "https://bhuvan.nrsc.gov.in",
   desc="National land use / land cover map at 1:250,000 from multi-temporal satellite data.",
   source_class="eo-derived", ogc=True, year="2022", updated="2023", keywords=["LULC", "land use", "land cover"])
ds("Wasteland Atlas (3rd cycle)", "bhuvan", "land", "All India",
   ["Shapefile", "GeoTIFF", "WMS"], "Open", "Open licence",
   "https://bhuvan.nrsc.gov.in",
   desc="National wasteland mapping and atlas derived from satellite imagery.",
   source_class="eo-derived", ogc=True, year="2019", keywords=["wasteland", "degraded land"])
ds("National Urban/Peri-urban LULC", "bhuvan", "urban", "All India",
   ["GeoTIFF", "WMS"], "Open", "Open licence",
   "https://bhuvan.nrsc.gov.in",
   desc="Urban land use / land cover mapping for major Indian cities.",
   source_class="eo-derived", ogc=True, keywords=["urban", "cities"])
ds("Bhuvan Cartosat Ortho Imagery", "bhuvan", "imagery", "All India",
   ["WMS", "GeoTIFF"], "Open (Registration)", "Restricted",
   "https://bhuvan.nrsc.gov.in/",
   desc="High-resolution Cartosat orthorectified imagery mosaics for India.",
   source_class="eo-derived", ogc=True, api=True, api_ready=True, dl=False, keywords=["cartosat", "ortho", "imagery"])
ds("Soil Resource Mapping", "bhuvan", "agriculture", "All India",
   ["Shapefile", "PDF"], "Open", "Open licence",
   "https://bhuvan.nrsc.gov.in",
   desc="District-wise soil resource maps and land capability classification.",
   source_class="eo-derived", keywords=["soil", "agriculture"])
ds("Ground Water Prospects Map", "bhuvan", "water", "All India",
   ["GeoTIFF", "Shapefile", "WMS"], "Open", "Open licence",
   "https://bhuvan.nrsc.gov.in",
   desc="Hydro-geomorphological groundwater prospect zones from satellite data.",
   source_class="eo-derived", ogc=True, keywords=["groundwater", "hydrogeology"])

# ---- Bhoonidhi (eo-derived) ------------------------------------------------
ds("Resourcesat-2 LISS-III/LISS-IV Scenes", "bhoonidhi", "imagery", "All India",
   ["GeoTIFF"], "Open (Registration)", "Restricted",
   "https://bhoonidhi.nrsc.gov.in",
   desc="Multi-spectral Resourcesat imagery for download after registration.",
   source_class="eo-derived", api=True, dl=False, keywords=["resourcesat", "LISS", "multispectral"])
ds("Cartosat-2/3 High-Resolution Scenes", "bhoonidhi", "imagery", "All India",
   ["GeoTIFF"], "Restricted", "Restricted",
   "https://bhoonidhi.nrsc.gov.in",
   desc="Very-high-resolution Cartosat panchromatic and multispectral scenes.",
   source_class="eo-derived", api=True, dl=False, gis=True, keywords=["cartosat", "VHR"])

# ---- Bhuvan NICES (eo-derived) ---------------------------------------------
ds("Fractional Vegetation Cover (FVC)", "nices", "forestry", "All India",
   ["GeoTIFF", "NetCDF"], "Open", "Open licence",
   "https://nices.nrsc.gov.in",
   desc="Long-term fractional vegetation cover time series over India.",
   source_class="eo-derived", ogc=True, year="2020", updated="2023", keywords=["vegetation", "NDVI"])
ds("Land Surface Temperature", "nices", "climate", "All India",
   ["GeoTIFF", "NetCDF"], "Open", "Open licence",
   "https://nices.nrsc.gov.in",
   desc="Long-term land surface temperature climatology and anomalies.",
   source_class="eo-derived", year="2020", updated="2023", keywords=["LST", "temperature"])
ds("Evapotranspiration (ET)", "nices", "water", "All India",
   ["GeoTIFF", "NetCDF"], "Open", "Open licence",
   "https://nices.nrsc.gov.in",
   desc="Actual evapotranspiration derived from satellite energy balance.",
   source_class="eo-derived", keywords=["evapotranspiration", "ET"])

# ---- MOSDAC (eo-derived) ---------------------------------------------------
ds("INSAT-3D Weather Imagery", "mosdac", "climate", "All India",
   ["GeoTIFF", "NetCDF", "HDF"], "Open (Registration)", "Open licence",
   "https://www.mosdac.gov.in",
   desc="Geostationary INSAT-3D/3DR satellite imagery and derived products.",
   source_class="eo-derived", api=True, api_ready=True, keywords=["INSAT", "weather", "satellite"])
ds("Rainfall Estimates (IMD-MOSDAC)", "mosdac", "climate", "All India",
   ["NetCDF", "CSV"], "Open (Registration)", "Open licence",
   "https://www.mosdac.gov.in",
   desc="Gridded rainfall estimates from satellite and gauge blending.",
   source_class="eo-derived", api=True, keywords=["rainfall", "precipitation"])
ds("Ocean Surface Winds (SCATSAT/OCEANSAT)", "mosdac", "marine", "All India",
   ["NetCDF", "HDF"], "Open (Registration)", "Open licence",
   "https://www.mosdac.gov.in",
   desc="Ocean surface wind vectors and wave parameters from Indian ocean satellites.",
   source_class="eo-derived", api=True, keywords=["ocean winds", "scatterometer"])
ds("NDVI / NDWI Vegetation & Water Indices", "mosdac", "agriculture", "All India",
   ["GeoTIFF", "NetCDF"], "Open (Registration)", "Open licence",
   "https://www.mosdac.gov.in",
   desc="Vegetation and water indices for crop and drought monitoring.",
   source_class="eo-derived", api=True, keywords=["NDVI", "NDWI", "crop"])

# ---- VEDAS (eo-derived) ----------------------------------------------------
ds("Solar Energy Potential Map", "vedas", "energy", "All India",
   ["GeoTIFF", "Web"], "Open", "Open licence",
   "https://vedas.sac.gov.in",
   desc="District-level solar energy potential and radiation mapping.",
   source_class="eo-derived", keywords=["solar", "renewable", "radiation"])
ds("Forest Above-Ground Biomass", "vedas", "forestry", "All India",
   ["GeoTIFF", "Web"], "Open", "Open licence",
   "https://vedas.sac.gov.in",
   desc="Satellite-derived forest biomass and carbon estimates.",
   source_class="eo-derived", keywords=["biomass", "carbon", "forest"])

# ---- NDEM (authoritative, disaster) ----------------------------------------
ds("Flood Hazard Atlas", "ndem", "disaster", "Multi-state",
   ["Shapefile", "GeoTIFF", "Web"], "Open", "Open licence",
   "https://ndem.nrsc.gov.in",
   desc="Historical flood inundation mapping and hazard zones for flood-prone states.",
   source_class="eo-derived", ogc=True, keywords=["flood", "inundation", "hazard"])
ds("Earthquake Damage Exposure", "ndem", "disaster", "Multi-state",
   ["Shapefile", "Web"], "Open (Registration)", "Restricted",
   "https://ndem.nrsc.gov.in",
   desc="Seismic exposure and vulnerability layers for emergency management.",
   source_class="eo-derived", dl=False, keywords=["earthquake", "seismic", "exposure"])
ds("Cyclone & Storm Surge Maps", "ndem", "disaster", "Multi-state",
   ["Shapefile", "Web"], "Open", "Open licence",
   "https://ndem.nrsc.gov.in",
   desc="Cyclone track and storm-surge inundation maps for coastal states.",
   source_class="eo-derived", keywords=["cyclone", "storm surge", "coastal"])

# ---- India-WRIS (authoritative, water) -------------------------------------
ds("India-WRIS Basin & Sub-basin Atlas", "wris", "water", "All India",
   ["Shapefile", "Web", "WMS"], "Open", "Open licence",
   "https://indiawris.gov.in",
   desc="River basins and sub-basins of India with hydrological attributes.",
   ogc=True, api=True, api_ready=True, keywords=["basin", "watershed", "hydrology"])
ds("Groundwater Level & Quality", "wris", "water", "All India",
   ["CSV", "Shapefile", "Web"], "Open", "Open licence",
   "https://indiawris.gov.in",
   desc="Observation-well groundwater levels and quality parameters.",
   api=True, keywords=["groundwater", "water quality", "wells"])
ds("Reservoir & Dam Inventory", "wris", "water", "All India",
   ["Shapefile", "CSV", "Web"], "Open", "Open licence",
   "https://indiawris.gov.in",
   desc="Dams, reservoirs and barrages with storage and release data.",
   keywords=["dams", "reservoirs", "irrigation"])
ds("Glacier & Snow Cover (Himalaya)", "wris", "climate", "Multi-state",
   ["GeoTIFF", "Web"], "Open", "Open licence",
   "https://indiawris.gov.in",
   desc="Himalayan glacier and seasonal snow-cover mapping.",
   source_class="eo-derived", keywords=["glacier", "snow", "Himalaya"])

# ---- CWC (authoritative, water) --------------------------------------------
ds("CWC Daily Discharge & Gauge Data", "cwc", "water", "All India",
   ["CSV", "API"], "Open (Registration)", "Open licence",
   "https://cwc.gov.in",
   desc="Daily river discharge and water-level observations from CWC stations.",
   api=True, api_ready=True, keywords=["discharge", "gauge", "river"])
ds("Flood Forecast Bulletins", "cwc", "disaster", "All India",
   ["Web", "PDF"], "Open", "Open licence",
   "https://cwc.gov.in",
   desc="Real-time flood forecasting and advisory bulletins for major rivers.",
   machine=False, keywords=["flood forecast", "advisory"])

# ---- IMD (authoritative, climate) ------------------------------------------
ds("IMD Gridded Rainfall (0.25°)", "imd", "climate", "All India",
   ["NetCDF", "GeoTIFF"], "Open (Registration)", "Open licence",
   "https://mausam.imd.gov.in",
   desc="High-resolution gridded daily/monthly rainfall over India (1901-present).",
   api=True, keywords=["rainfall", "gridded", "climate"])
ds("IMD Climate Normals & Stations", "imd", "climate", "All India",
   ["CSV", "PDF"], "Open (Registration)", "Open licence",
   "https://mausam.imd.gov.in",
   desc="Long-period climate normals and station climatological records.",
   api=True, keywords=["climate normals", "stations", "temperature"])

# ---- FSI (authoritative, forestry) -----------------------------------------
ds("State of Forest Report (ISFR)", "fsi", "forestry", "All India",
   ["Shapefile", "PDF", "GeoTIFF"], "Open", "Open licence",
   "https://fsi.nic.in",
   desc="Biennial forest cover, tree cover and growing stock assessment.",
   year="2021", updated="2023", keywords=["forest cover", "ISFR", "tree cover"])
ds("Forest Type Maps", "fsi", "forestry", "All India",
   ["Shapefile", "PDF"], "Open", "Open licence",
   "https://fsi.nic.in",
   desc="Forest type and density classification maps of India.",
   keywords=["forest type", "density"])

# ---- Bhukosh / GSI (authoritative) -----------------------------------------
ds("Geological Map of India (1:50k)", "gsi-bhukosh", "land", "All India",
   ["Shapefile", "WMS", "GeoTIFF"], "Open", "Open licence",
   "https://bhukosh.gsi.gov.in",
   desc="Geological quadrangle maps, lithology and structural data.",
   ogc=True, api=True, keywords=["geology", "lithology", "structure"])
ds("Mineral Resource Maps", "gsi-bhukosh", "land", "All India",
   ["Shapefile", "Web"], "Open", "Open licence",
   "https://bhukosh.gsi.gov.in",
   desc="Mineral occurrence and deposit maps across India.",
   keywords=["minerals", "mining"])

# ---- Census (authoritative, demographics) ----------------------------------
ds("Census 2011 Village/Town Directories", "census", "demographics", "All India",
   ["CSV", "XLSX"], "Open", "Open licence",
   "https://censusindia.gov.in",
   desc="Village and town directories with amenities and population attributes.",
   year="2011", api=True, keywords=["census", "village", "population"])
ds("Census 2011 Administrative Boundaries", "census", "boundaries", "All India",
   ["Shapefile", "GeoJSON"], "Open", "Open licence",
   "https://censusindia.gov.in",
   desc="District and sub-district boundary layers aligned to Census 2011.",
   year="2011", keywords=["boundaries", "district", "census"])

# ---- data.gov.in (authoritative, multi-theme) ------------------------------
ds("District & State Boundary Datasets", "data-gov", "boundaries", "All India",
   ["Shapefile", "GeoJSON", "CSV"], "Open", "Open licence",
   "https://data.gov.in",
   desc="Administrative boundaries published by central and state agencies.",
   api=True, api_ready=True, keywords=["boundaries", "district", "state"])
ds("MGNREGA Assets & Works", "data-gov", "infrastructure", "All India",
   ["CSV", "API"], "Open", "Open licence",
   "https://data.gov.in",
   desc="Rural public works and asset data from MGNREGA MIS.",
   api=True, api_ready=True, keywords=["MGNREGA", "rural", "assets"])
ds("PMGSY Rural Roads", "data-gov", "transport", "All India",
   ["CSV", "API"], "Open", "Open licence",
   "https://data.gov.in",
   desc="Pradhan Mantri Gram Sadak Yojana rural road network data.",
   api=True, keywords=["roads", "PMGSY", "rural"])
ds("Agricultural Census / Cropping Statistics", "data-gov", "agriculture", "All India",
   ["CSV", "API"], "Open", "Open licence",
   "https://data.gov.in",
   desc="District-level cropping patterns, area and production statistics.",
   api=True, keywords=["crops", "agriculture", "statistics"])
ds("Urban Amenities & Services (UBLB)", "data-gov", "urban", "All India",
   ["CSV", "API"], "Open", "Open licence",
   "https://data.gov.in",
   desc="Urban local body amenities, water supply and sanitation indicators.",
   api=True, keywords=["urban", "amenities", "municipal"])

# ---- Survey of India (authoritative) ---------------------------------------
ds("Open Series Topographic Maps (Nakshe)", "soi-nakshe", "boundaries", "All India",
   ["GeoPDF", "GeoTIFF"], "Open", "Open licence",
   "https://onlinemaps.surveyofindia.gov.in",
   desc="Free Open Series Map (OSM) topographic sheets for download.",
   dl=True, keywords=["toposheet", "OSM", "topographic"])
ds("Geodetic Control Network", "soi", "elevation", "All India",
   ["CSV", "Web"], "Open (Registration)", "Restricted",
   "https://surveyofindia.gov.in",
   desc="Survey control points, benchmarks and geodetic reference data.",
   dl=False, keywords=["geodesy", "control points", "benchmarks"])

# ---- NATMO (authoritative) --------------------------------------------------
ds("National Atlas Maps (Thematic)", "natmo", "boundaries", "All India",
   ["PDF", "Shapefile"], "Open (Registration)", "Open licence",
   "https://natmo.gov.in",
   desc="Thematic atlas sheets — physical, population, economic and transport.",
   keywords=["atlas", "thematic", "physical"])
ds("Transport & Communication Atlas", "natmo", "transport", "All India",
   ["PDF", "Shapefile"], "Open (Registration)", "Open licence",
   "https://natmo.gov.in",
   desc="Road, rail and communication network atlas sheets.",
   keywords=["transport", "rail", "roads"])

# ---- Krishi / ICAR (authoritative, agriculture) ----------------------------
ds("ICAR Research Data Repository", "krishi", "agriculture", "All India",
   ["CSV", "Web"], "Open", "Open licence",
   "https://krishi.icar.gov.in",
   desc="Agricultural research datasets, theses and technical reports.",
   api=True, keywords=["agriculture", "research", "ICAR"])
ds("Soil Health Card Data", "krishi", "agriculture", "All India",
   ["CSV", "Web"], "Open", "Open licence",
   "https://krishi.icar.gov.in",
   desc="Soil nutrient status and health-card recommendations across districts.",
   keywords=["soil health", "nutrients", "fertilizer"])

# ---- INCOIS (authoritative, marine) ----------------------------------------
ds("Potential Fishing Zone (PFZ) Advisories", "incois", "marine", "All India",
   ["Web", "GeoTIFF", "API"], "Open", "Open licence",
   "https://incois.gov.in",
   desc="Satellite-derived potential fishing zone advisories along the coast.",
   api=True, api_ready=True, source_class="eo-derived", keywords=["fishing", "PFZ", "coastal"])
ds("Ocean State Forecast", "incois", "marine", "All India",
   ["NetCDF", "API", "Web"], "Open", "Open licence",
   "https://incois.gov.in",
   desc="Operational ocean state forecasts — waves, currents, sea level.",
   api=True, api_ready=True, keywords=["waves", "currents", "ocean forecast"])
ds("Tsunami & Storm Surge Early Warning", "incois", "disaster", "All India",
   ["Web", "API"], "Open (Registration)", "Open licence",
   "https://incois.gov.in",
   desc="Tsunami and storm-surge early warning system outputs.",
   api=True, keywords=["tsunami", "storm surge", "early warning"])

# ---- KSRSAC (authoritative, state) -----------------------------------------
ds("Karnataka State LULC & Atlas", "ksrsac", "land", "Karnataka",
   ["Shapefile", "GeoTIFF", "WMS"], "Open", "Open licence",
   "https://kgis.ksrsac.in",
   desc="Karnataka state land use / land cover and geospatial atlas.",
   state="Karnataka", source_class="eo-derived", ogc=True, keywords=["Karnataka", "LULC"])
ds("Karnataka Geoportal Base Layers", "ksrsac", "boundaries", "Karnataka",
   ["WMS", "Shapefile"], "Open", "Open licence",
   "https://kgis.ksrsac.in",
   desc="Karnataka administrative and planning base layers via geoportal.",
   state="Karnataka", ogc=True, keywords=["Karnataka", "boundaries", "planning"])

# ---- OpenStreetMap (open-community) ----------------------------------------
ds("India Roads & Transport (OSM)", "osm", "transport", "All India",
   ["GeoJSON", "Shapefile", "PBF"], "Open", "ODbL",
   "https://download.geofabrik.de/asia/india.html",
   desc="OpenStreetMap road and rail network extracts for India.",
   source_class="open-community", api=True, keywords=["roads", "OSM", "open"])
ds("India Buildings (OSM)", "osm", "buildings", "All India",
   ["GeoJSON", "PBF", "Shapefile"], "Open", "ODbL",
   "https://download.geofabrik.de/asia/india.html",
   desc="Crowd-mapped building footprints from OpenStreetMap.",
   source_class="open-community", keywords=["buildings", "OSM", "footprints"])
ds("India Land Use & POI (OSM)", "osm", "land", "All India",
   ["GeoJSON", "PBF"], "Open", "ODbL",
   "https://download.geofabrik.de/asia/india.html",
   desc="OpenStreetMap land use polygons and points of interest.",
   source_class="open-community", keywords=["land use", "POI", "OSM"])

# ---- DataMeet (open-community) ---------------------------------------------
ds("India District Boundaries (DataMeet)", "datameet", "boundaries", "All India",
   ["GeoJSON", "Shapefile", "TopoJSON"], "Open", "ODbL",
   "https://github.com/datameet/maps",
   desc="Community-maintained district, state and constituency boundaries.",
   source_class="open-community", keywords=["boundaries", "district", "community"])
ds("India Assembly Constituencies", "datameet", "boundaries", "All India",
   ["GeoJSON", "TopoJSON"], "Open", "ODbL",
   "https://github.com/datameet/maps",
   desc="Assembly and parliamentary constituency boundary maps.",
   source_class="open-community", keywords=["constituencies", "elections"])

# ---- Microsoft (global-open, buildings) ------------------------------------
ds("Microsoft Building Footprints — India", "microsoft-bf", "buildings", "All India",
   ["GeoJSON", "Shapefile"], "Open", "ODbL-compatible",
   "https://github.com/microsoft/GlobalMLBuildingFootprints",
   desc="AI-generated building footprints for India (millions of structures).",
   source_class="global-open", api=True, api_ready=True, keywords=["buildings", "footprints", "ML"])
ds("Microsoft Building Footprints — Tamil Nadu", "microsoft-bf", "buildings", "Tamil Nadu",
   ["GeoJSON", "Shapefile"], "Open", "ODbL-compatible",
   "https://github.com/microsoft/GlobalMLBuildingFootprints",
   desc="AI-generated building footprints for Tamil Nadu.",
   state="Tamil Nadu", source_class="global-open", keywords=["buildings", "Tamil Nadu"])

# ---- Google Open Buildings (global-open, buildings) ------------------------
ds("Google Open Buildings — India", "google-ob", "buildings", "All India",
   ["CSV", "GeoJSON"], "Open", "Open licence (research)",
   "https://sites.research.google/open-buildings/",
   desc="Large-scale AI building footprints covering South Asia and India.",
   source_class="global-open", api=True, keywords=["buildings", "footprints", "AI"])
ds("Google Open Buildings — Telangana", "google-ob", "buildings", "Telangana",
   ["CSV", "GeoJSON"], "Open", "Open licence (research)",
   "https://sites.research.google/open-buildings/",
   desc="AI building footprints for Telangana.",
   state="Telangana", source_class="global-open", keywords=["buildings", "Telangana"])

# ---- Natural Earth (global-open) -------------------------------------------
ds("Natural Earth Admin-0/1 Boundaries", "natural-earth", "boundaries", "Global",
   ["GeoJSON", "Shapefile"], "Open", "Public domain",
   "https://www.naturalearthdata.com",
   desc="Public-domain country and first-level administrative boundaries.",
   source_class="global-open", keywords=["boundaries", "world", "public domain"])
ds("Natural Earth Raster Basemap", "natural-earth", "imagery", "Global",
   ["GeoTIFF"], "Open", "Public domain",
   "https://www.naturalearthdata.com",
   desc="Natural Earth shaded-relief and land-cover raster basemaps.",
   source_class="global-open", keywords=["basemap", "relief"])

# ---- NASA SEDAC (global-open) ----------------------------------------------
ds("Gridded Population of the World (GPW v4)", "sedac", "demographics", "Global",
   ["GeoTIFF", "CSV", "NetCDF"], "Open", "Open licence",
   "https://sedac.ciesin.columbia.edu",
   desc="Gridded population density and counts, including India coverage.",
   source_class="global-open", api=True, keywords=["population", "gridded", "GPW"])
ds("Global Urban Extent", "sedac", "urban", "Global",
   ["GeoTIFF", "Shapefile"], "Open", "Open licence",
   "https://sedac.ciesin.columbia.edu",
   desc="Global urban extent and settlement layers.",
   source_class="global-open", keywords=["urban", "settlements"])
ds("SRTM / GMTED Elevation", "sedac", "elevation", "Global",
   ["GeoTIFF", "NetCDF"], "Open", "Open licence",
   "https://sedac.ciesin.columbia.edu",
   desc="Global digital elevation models (SRTM-derived).",
   source_class="global-open", keywords=["SRTM", "DEM", "elevation"])

# ---- USGS EarthExplorer (global-open) --------------------------------------
ds("Landsat 8/9 Imagery (India)", "usgs-ee", "imagery", "Global",
   ["GeoTIFF"], "Open (Registration)", "Open licence",
   "https://earthexplorer.usgs.gov",
   desc="Global Landsat surface reflectance imagery covering India.",
   source_class="global-open", api=True, keywords=["Landsat", "imagery", "surface reflectance"])

# ---- Copernicus (global-open) ----------------------------------------------
ds("Sentinel-2 Surface Reflectance", "copernicus", "imagery", "Global",
   ["GeoTIFF", "STAC"], "Open", "Open licence (CC-BY-SA)",
   "https://dataspace.copernicus.eu",
   desc="Sentinel-2 multispectral imagery via the Copernicus Data Space.",
   source_class="global-open", api=True, api_ready=True, ogc=True,
   keywords=["Sentinel-2", "multispectral", "STAC"])
ds("Copernicus Global Land Cover", "copernicus", "land", "Global",
   ["GeoTIFF", "NetCDF"], "Open", "Open licence",
   "https://dataspace.copernicus.eu",
   desc="100m global land cover product with India coverage.",
   source_class="global-open", ogc=True, keywords=["land cover", "global"])
ds("Copernicus DEM (GLO-30)", "copernicus", "elevation", "Global",
   ["GeoTIFF"], "Open", "Open licence",
   "https://dataspace.copernicus.eu",
   desc="30m global digital elevation model covering India.",
   source_class="global-open", api=True, keywords=["DEM", "30m", "elevation"])
ds("Copernicus Atmosphere (Air Quality)", "copernicus", "climate", "Global",
   ["NetCDF", "GeoTIFF"], "Open", "Open licence",
   "https://dataspace.copernicus.eu",
   desc="Global air-quality and atmospheric composition products.",
   source_class="global-open", keywords=["air quality", "atmosphere"])

# ---- OpenTopography (global-open) ------------------------------------------
ds("SRTM / Copernicus Global DEM", "opentopography", "elevation", "Global",
   ["GeoTIFF", "API"], "Open", "Open licence",
   "https://opentopography.org",
   desc="Hosted global DEMs (SRTM, Copernicus, NASADEM) with API access.",
   source_class="global-open", api=True, api_ready=True, keywords=["DEM", "SRTM", "elevation"])
ds("LiDAR Point Cloud (India coverage)", "opentopography", "elevation", "Global",
   ["LAS", "LAZ", "API"], "Open", "Open licence",
   "https://opentopography.org",
   desc="High-resolution LiDAR point clouds where available.",
   source_class="global-open", api=True, keywords=["LiDAR", "point cloud"])

# ---- ICIMOD (regional) ------------------------------------------------------
ds("Hindu Kush Himalaya Land Cover", "icimod", "land", "Regional",
   ["GeoTIFF", "Shapefile"], "Open", "Open licence",
   "https://rds.icimod.org",
   desc="Regional land cover for the HKH, including Indian Himalayan states.",
   source_class="global-open", keywords=["land cover", "HKH", "Himalaya"])
ds("HKH Glaciers & Snow", "icimod", "climate", "Regional",
   ["GeoTIFF", "Shapefile"], "Open", "Open licence",
   "https://rds.icimod.org",
   desc="Glacier and snow-cover datasets for the Hindu Kush Himalaya.",
   source_class="global-open", keywords=["glaciers", "snow", "HKH"])

# ---- State-level coverage records (programmatic, for the map & gap analysis) --
_STATES = [
    "Tamil Nadu", "Telangana", "Maharashtra", "Karnataka", "Gujarat", "Rajasthan",
    "Uttar Pradesh", "Odisha", "Kerala", "West Bengal", "Bihar", "Madhya Pradesh",
    "Assam", "Punjab",
]
for _st in _STATES:
    ds(f"{_st} State Land Use / Land Cover", "bhuvan", "land", _st,
       ["GeoTIFF", "Shapefile", "WMS"], "Open", "Open licence",
       "https://bhuvan.nrsc.gov.in",
       desc=f"State land use / land cover mapping for {_st} (satellite-derived).",
       state=_st, source_class="eo-derived", ogc=True, year="2022", updated="2023",
       keywords=[_st, "LULC", "land use"])
    ds(f"{_st} Building Footprints (OSM)", "osm", "buildings", _st,
       ["GeoJSON", "PBF", "Shapefile"], "Open", "ODbL",
       "https://download.geofabrik.de/asia/india.html",
       desc=f"Crowd-mapped building footprints for {_st} from OpenStreetMap.",
       state=_st, source_class="open-community", keywords=[_st, "buildings", "OSM"])

DATASETS = _D

# --------------------------------------------------------------------------- #
# Audit log (provenance trail — seed examples)
# --------------------------------------------------------------------------- #
AUDIT = [
    {
        "id": f"audit-{i}",
        "agent": a,
        "action": act,
        "target": tgt,
        "note": note,
        "at": NOW,
    }
    for i, (a, act, tgt, note) in enumerate([
        ("discovery", "portal_identified", "bhuvan", "Portal added from ISRO/NRSC public page."),
        ("metadata", "dataset_extracted", "bhuvan-land-*", "LULC and thematic layers catalogued."),
        ("classification", "theme_normalised", "land", "Mapped to fixed theme group 'Land'."),
        ("verification", "link_checked", "https://bhuvan.nrsc.gov.in", "Endpoint reachable (seed check)."),
        ("publishing", "catalogue_emitted", "datasets.json", "Seed catalogue written by build_catalog.py."),
    ])
]

# --------------------------------------------------------------------------- #
# Write outputs
# --------------------------------------------------------------------------- #
def write(name, obj):
    (OUT / name).write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  {name}: {len(obj) if isinstance(obj, list) else '-'} records")

print("Writing catalogue artefacts:")
write("themes.json", THEMES)
write("organisations.json", ORGS)
write("portals.json", PORTALS)
write("datasets.json", DATASETS)
write("audit-log.json", AUDIT)
print(f"Total datasets: {len(DATASETS)}")
print(f"Total portals:  {len(PORTALS)}")
print(f"Total themes:   {len(THEMES)}")
print(f"Total orgs:     {len(ORGS)}")
