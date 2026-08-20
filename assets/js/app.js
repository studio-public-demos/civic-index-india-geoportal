/* Nebula Civic Index — GeoIndia · front-end application (v0.1) */
'use strict';

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */
const SOURCE_CLASSES = {
  'authoritative':  { label: 'Government',        color: '#0e7490' },
  'open-community': { label: 'Open community',    color: '#1e7d4f' },
  'global-open':    { label: 'Global open',       color: '#6d28d9' },
  'eo-derived':     { label: 'Earth observation', color: '#b45309' },
};
const ACCESS_LABELS = {
  'Open': 'Open', 'Open (Registration)': 'Open (registration)',
  'Restricted': 'Restricted', 'Academic': 'Academic', 'Paid': 'Paid',
  'Mixed': 'Mixed', 'Not specified': 'Not specified',
};
const THEME_SYNONYMS = {
  'buildings': ['building', 'buildings', 'footprint', 'footprints', 'structure', 'house'],
  'land': ['land', 'land use', 'land cover', 'lulc', 'soil', 'geology', 'mineral'],
  'agriculture': ['agriculture', 'crop', 'crops', 'farm', 'farming', 'irrigation', 'soil health'],
  'water': ['water', 'river', 'groundwater', 'basin', 'watershed', 'reservoir', 'dam', 'hydrology', 'floodplain'],
  'climate': ['climate', 'weather', 'rain', 'rainfall', 'temperature', 'snow', 'glacier', 'air quality', 'atmosphere'],
  'disaster': ['disaster', 'flood', 'cyclone', 'drought', 'earthquake', 'tsunami', 'hazard', 'early warning'],
  'transport': ['transport', 'road', 'roads', 'rail', 'railway', 'port', 'mobility', 'highway'],
  'urban': ['urban', 'city', 'cities', 'municipal', 'town', 'amenities'],
  'forestry': ['forest', 'forestry', 'tree', 'biodiversity', 'biomass', 'vegetation', 'ecosystem'],
  'elevation': ['elevation', 'dem', 'dtm', 'terrain', 'contour', 'topography', 'slope', 'lidar'],
  'imagery': ['imagery', 'satellite', 'sentinel', 'landsat', 'scene', 'ortho', 'mosaic', 'multispectral', 'sar'],
  'boundaries': ['boundary', 'boundaries', 'district', 'administrative', 'tehsil', 'village', 'constituency'],
  'demographics': ['demographic', 'population', 'census', 'density', 'socio', 'statistics'],
  'infrastructure': ['infrastructure', 'telecom', 'facility', 'asset', 'dam', 'mgnrega'],
  'marine': ['marine', 'ocean', 'coastal', 'fishery', 'fishing', 'bathymetry', 'wave', 'current', 'sea'],
  'energy': ['energy', 'power', 'solar', 'wind', 'renewable', 'electricity'],
};

/* ------------------------------------------------------------------ */
/* State                                                              */
/* ------------------------------------------------------------------ */
const S = {
  data: null, portals: null, themes: null, orgs: null, statesGeo: null,
  q: '', mode: 'search',
  theme: null, scopes: [], providers: [], access: [], formats: [], srcClasses: [], state: null,
  sort: 'score', per: 20, page: 1,
  panel: null, map: null,
};
const BOUND = {};

const $ = (id) => document.getElementById(id);
const esc = (s) => (s == null ? '' : String(s)).replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function hl(text) {
  const t = esc(text);
  if (!S.q) return t;
  const n = S.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return t.replace(new RegExp('(' + n + ')', 'ig'), '<mark>$1</mark>');
}

/* ------------------------------------------------------------------ */
/* Derived helpers                                                    */
/* ------------------------------------------------------------------ */
function portalOf(id) { return S.portals.find((p) => p.id === id); }
function themeOf(id) { return S.themes.find((t) => t.id === id); }
function orgOf(id) { return S.orgs.find((o) => o.id === id); }

function datasetScore(d) {
  let s = 0;
  if (d.machine_readable) s += 25;
  if (d.gis_ready) s += 25;
  if (d.downloadable) s += 20;
  if (d.api || d.api_ready) s += 15;
  const y = d.updated_year || d.published_year || 0;
  if (y >= 2023) s += 15; else if (y >= 2020) s += 11; else if (y >= 2015) s += 7; else if (y > 0) s += 3;
  return s;
}

function filtered() {
  if (!S.data) return [];
  let out = S.data.slice();
  if (S.theme) out = out.filter((d) => d.theme === S.theme);
  if (S.state) out = out.filter((d) => d.state === S.state);
  if (S.scopes.length) out = out.filter((d) => S.scopes.includes(portalOf(d.portal).scope));
  if (S.providers.length) out = out.filter((d) => S.providers.includes(orgOf(portalOf(d.portal).organisation).type));
  if (S.access.length) out = out.filter((d) => S.access.includes(d.access_tier));
  if (S.formats.length) out = out.filter((d) => d.formats.some((f) => S.formats.includes(f)));
  if (S.srcClasses.length) out = out.filter((d) => S.srcClasses.includes(d.source_class));
  if (S.q) {
    const q = S.q.toLowerCase();
    out = out.filter((d) => {
      const hay = [d.title, d.description, d.portal, d.coverage, d.state, (d.keywords || []).join(' ')]
        .join(' ').toLowerCase();
      return q.split(/\s+/).every((tok) => hay.includes(tok));
    });
  }
  return out;
}

function sortData(list) {
  const by = S.sort;
  list = list.slice();
  if (by === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
  else if (by === 'portal') list.sort((a, b) => (portalOf(a.portal).name).localeCompare(portalOf(b.portal).name));
  else if (by === 'updated') list.sort((a, b) => (b.updated_year || b.published_year || 0) - (a.updated_year || a.published_year || 0));
  else list.sort((a, b) => datasetScore(b) - datasetScore(a) || a.title.localeCompare(b.title));
  return list;
}

function stateCounts(list) {
  const c = {};
  list.forEach((d) => { if (d.state) c[d.state] = (c[d.state] || 0) + 1; });
  return c;
}

/* ------------------------------------------------------------------ */
/* Boot                                                               */
/* ------------------------------------------------------------------ */
async function boot() {
  try {
    const [data, portals, themes, orgs, geo] = await Promise.all([
      fetch('assets/data/datasets.json').then((r) => r.json()),
      fetch('assets/data/portals.json').then((r) => r.json()),
      fetch('assets/data/themes.json').then((r) => r.json()),
      fetch('assets/data/organisations.json').then((r) => r.json()),
      fetch('assets/data/india-states.geojson').then((r) => r.json()),
    ]);
    S.data = data; S.portals = portals; S.themes = themes; S.orgs = orgs; S.statesGeo = geo;
    renderAll();
  } catch (err) {
    console.error(err);
    const msg = '<div class="dempty">This view could not be built. ' + esc(err.message) + '</div>';
    ['datasetList', 'portalScores', 'panel', 'gapResult', 'compareResult'].forEach((id) => {
      const el = $(id); if (el) el.innerHTML = msg;
    });
    if ($('listCount')) $('listCount').textContent = 'Data could not be loaded';
  }
}

function renderAll() {
  renderKPI();
  renderThemeChips();
  renderPills();
  renderStateSelect();
  renderList();
  renderMap();
  renderAssessment();
  renderGap();
  renderCompare();
  renderAgents();
  renderMethodology();
  renderActiveBar();
}

/* ------------------------------------------------------------------ */
/* KPI                                                               */
/* ------------------------------------------------------------------ */
function renderKPI() {
  $('kpiDatasets').textContent = S.data.length;
  $('kpiPortals').textContent = S.portals.length;
  $('kpiAgencies').textContent = S.orgs.length;
  $('kpiThemes').textContent = S.themes.length;
  const live = S.data.filter((d) => d.link_health === 'live').length;
  const total = S.data.length;
  $('kpiVerified').textContent = total ? Math.round((live / total) * 100) + '%' : '–';
}

/* ------------------------------------------------------------------ */
/* Theme chips                                                        */
/* ------------------------------------------------------------------ */
function renderThemeChips() {
  const el = $('themeChips');
  el.innerHTML = S.themes.map((t) => {
    const n = S.data.filter((d) => d.theme === t.id).length;
    return `<button class="tchip" data-theme="${t.id}" aria-pressed="${S.theme === t.id}" title="${esc(t.blurb)}">${esc(t.label)} <span class="n">${n}</span></button>`;
  }).join('');
  el.querySelectorAll('.tchip').forEach((b) => b.addEventListener('click', () => {
    S.theme = S.theme === b.dataset.theme ? null : b.dataset.theme;
    S.page = 1; renderThemeChips(); renderList(); renderMap(); renderActiveBar();
  }));
}

/* ------------------------------------------------------------------ */
/* Filter pills                                                       */
/* ------------------------------------------------------------------ */
function pills(rowId, values, selected, labels, onChange) {
  const el = $(rowId);
  el.innerHTML = values.map((v) =>
    `<button class="pill" data-v="${esc(v)}" aria-pressed="${selected.includes(v)}">${esc(labels ? labels[v] : v)}</button>`).join('');
  el.querySelectorAll('.pill').forEach((b) => b.addEventListener('click', () => {
    const v = b.dataset.v;
    if (selected.includes(v)) selected.splice(selected.indexOf(v), 1);
    else selected.push(v);
    S.page = 1; onChange(); renderPills(); renderList(); renderMap(); renderActiveBar();
  }));
}

function renderPills() {
  pills('scopeRow', ['India', 'Global', 'Regional'], S.scopes, { India: 'India', Global: 'Global', Regional: 'Regional' },
    () => {});
  const ptypes = [...new Set(S.orgs.map((o) => o.type))];
  pills('provRow', ptypes, S.providers, null, () => {});
  const srcClasses = Object.keys(SOURCE_CLASSES);
  pills('srcRow', srcClasses, S.srcClasses, Object.fromEntries(Object.entries(SOURCE_CLASSES).map(([k, v]) => [k, v.label])), () => {});
  pills('accessRow', ['Open', 'Open (Registration)', 'Restricted', 'Academic', 'Paid'], S.access, ACCESS_LABELS, () => {});
  const fmts = [...new Set(S.data.flatMap((d) => d.formats))].sort();
  pills('formatRow', fmts, S.formats, null, () => {});
}

function renderStateSelect() {
  const el = $('stateSelect');
  const states = S.statesGeo.features.map((f) => f.properties.name).sort();
  el.innerHTML = '<option value="">All India / any</option>' +
    states.map((s) => `<option value="${esc(s)}" ${S.state === s ? 'selected' : ''}>${esc(s)}</option>`).join('');
  if (!BOUND.stateSelect) {
    el.addEventListener('change', () => { S.state = el.value || null; S.page = 1; renderList(); renderMap(); renderActiveBar(); });
    BOUND.stateSelect = true;
  }
}

function renderActiveBar() {
  const parts = [];
  if (S.theme) parts.push({ k: 'Theme', v: themeOf(S.theme).label, clear: () => { S.theme = null; } });
  if (S.state) parts.push({ k: 'State', v: S.state, clear: () => { S.state = null; } });
  if (S.q) parts.push({ k: 'Search', v: S.q, clear: () => { S.q = ''; $('queryInput').value = ''; } });
  S.scopes.forEach((v) => parts.push({ k: 'Scope', v, clear: () => S.scopes.splice(S.scopes.indexOf(v), 1) }));
  S.providers.forEach((v) => parts.push({ k: 'Provider', v, clear: () => S.providers.splice(S.providers.indexOf(v), 1) }));
  S.access.forEach((v) => parts.push({ k: 'Access', v, clear: () => S.access.splice(S.access.indexOf(v), 1) }));
  S.formats.forEach((v) => parts.push({ k: 'Format', v, clear: () => S.formats.splice(S.formats.indexOf(v), 1) }));
  S.srcClasses.forEach((v) => parts.push({ k: 'Source', v: SOURCE_CLASSES[v].label, clear: () => S.srcClasses.splice(S.srcClasses.indexOf(v), 1) }));
  const el = $('activeBar');
  if (!parts.length) { el.innerHTML = ''; return; }
  el.innerHTML = '<span class="lead">Active filters</span>' + parts.map((p) =>
    `<button class="fchip" data-k="${esc(p.k)}"><span class="fk">${esc(p.k)}</span>${esc(p.v)} <span class="x">×</span></button>`).join('');
  el.querySelectorAll('.fchip').forEach((b) => b.addEventListener('click', () => {
    const p = parts[Array.from(el.children).indexOf(b) - 1];
    p.clear(); S.page = 1; renderAll();
  }));
}

/* ------------------------------------------------------------------ */
/* Dataset list                                                       */
/* ------------------------------------------------------------------ */
function renderList() {
  const list = sortData(filtered());
  $('listCount').textContent = `${list.length} dataset${list.length === 1 ? '' : 's'} in view`;
  const totalPages = Math.max(1, Math.ceil(list.length / S.per));
  if (S.page > totalPages) S.page = totalPages;
  const start = (S.page - 1) * S.per;
  const pageItems = list.slice(start, start + S.per);

  const el = $('datasetList');
  if (!pageItems.length) {
    el.innerHTML = '<div class="dempty">No datasets match the current filters. Relax one or more filters to see more.</div>';
  } else {
    el.innerHTML = pageItems.map((d) => {
      const p = portalOf(d.portal);
      const sc = SOURCE_CLASSES[d.source_class] || SOURCE_CLASSES.authoritative;
      const acc = ACCESS_LABELS[d.access_tier] || d.access_tier;
      return `<article class="ditem">
        <div>
          <h3><a href="#" data-open="${d.id}">${hl(d.title)}</a></h3>
          <div class="dportal">${esc(p.name)} · ${esc(orgOf(p.organisation).name)}</div>
          <p class="ddesc">${hl(d.description)}</p>
          <div class="dtags">
            <span class="dtag src-${esc(d.source_class)}">${esc(sc.label)}</span>
            <span class="dtag">${esc(themeOf(d.theme).label)}</span>
            <span class="dtag">${esc(d.coverage)}</span>
            <span class="tag ${accClass(d.access_tier)}">${esc(acc)}</span>
            ${d.formats.slice(0, 3).map((f) => `<span class="dtag">${esc(f)}</span>`).join('')}
            ${linkTag(d.link_health)}
          </div>
          <div class="secbtns">
            <a class="srcbtn" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">View source ↗</a>
            <button class="minbtn" data-open="${d.id}">Details</button>
            <button class="minbtn" data-map="${d.id}">Open in map</button>
          </div>
        </div>
      </article>`;
    }).join('');
    el.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); openDetail(b.dataset.open); }));
    el.querySelectorAll('[data-map]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); openInMap(b.dataset.map); }));
  }

  // pager
  const pg = $('pagerSlot');
  if (list.length > S.per) {
    pg.innerHTML = `<button ${S.page === 1 ? 'disabled' : ''} id="pgPrev">← Prev</button>
      <span>Page ${S.page} of ${totalPages}</span>
      <button ${S.page === totalPages ? 'disabled' : ''} id="pgNext">Next →</button>`;
    $('pgPrev').addEventListener('click', () => { S.page--; renderList(); });
    $('pgNext').addEventListener('click', () => { S.page++; renderList(); });
  } else pg.innerHTML = '';
}

function accClass(acc) {
  if (acc === 'Open' || acc === 'Open (Registration)') return 'open';
  if (acc === 'Paid') return 'paid';
  if (acc === 'Restricted') return 'restricted';
  if (acc === 'Academic') return 'academic';
  return 'neutral';
}
function linkTag(lh) {
  if (lh === 'live') return '<span class="tag live">Link live</span>';
  if (lh === 'dead' || lh === 'down') return '<span class="tag dead">Link broken</span>';
  return '<span class="tag neutral">Unverified</span>';
}

/* ------------------------------------------------------------------ */
/* Detail panel                                                       */
/* ------------------------------------------------------------------ */
function openDetail(id) {
  const d = S.data.find((x) => x.id === id);
  if (!d) return;
  const p = portalOf(d.portal);
  const o = orgOf(p.organisation);
  const sc = SOURCE_CLASSES[d.source_class];
  const score = datasetScore(d);
  S.panel = d;
  $('panel').innerHTML = `
    <div class="panel-head">
      <span class="eyebrow">Dataset</span>
      <h3>${esc(d.title)}</h3>
      <div class="meta">${esc(p.name)} · ${esc(o.name)}</div>
    </div>
    <div class="panel-body">
      <div class="defrow"><span class="k">Description</span><span class="v">${esc(d.description)}</span></div>
      <div class="defrow"><span class="k">Theme</span><span class="v">${esc(themeOf(d.theme).label)}</span></div>
      <div class="defrow"><span class="k">Coverage</span><span class="v">${esc(d.coverage)}</span></div>
      <div class="defrow"><span class="k">Formats</span><span class="v">${d.formats.map(esc).join(', ')}</span></div>
      <div class="defrow"><span class="k">Access tier</span><span class="v"><span class="tag ${accClass(d.access_tier)}">${esc(ACCESS_LABELS[d.access_tier] || d.access_tier)}</span></span></div>
      <div class="defrow"><span class="k">Licence</span><span class="v">${esc(d.licence)}</span></div>
      <div class="defrow"><span class="k">Source class</span><span class="v"><span class="dot" style="color:${sc.color}">●</span> ${esc(sc.label)}</span></div>
      <div class="defrow"><span class="k">Link health</span><span class="v">${linkTag(d.link_health)} ${d.verified_at ? '· verified ' + esc(d.verified_at.slice(0, 10)) : ''}</span></div>
      <div class="defrow"><span class="k">Published / updated</span><span class="v">${d.published_year || '—'} / ${d.updated_year || '—'}</span></div>
      <div class="defrow"><span class="k">OGC / API</span><span class="v">${d.ogc ? 'OGC services · ' : ''}${d.api || d.api_ready ? 'API' : 'None advertised'}</span></div>
      <div class="defrow"><span class="k">Studio score</span><span class="v"><b>${score}</b>/100 (machine-readable ${d.machine_readable ? '✓' : '✗'} · GIS-ready ${d.gis_ready ? '✓' : '✗'} · downloadable ${d.downloadable ? '✓' : '✗'})</span></div>
      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
        <a class="srcbtn" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">View source ↗</a>
        <button class="minbtn" data-map="${d.id}">Open in map</button>
        <a class="minbtn" href="https://nebulacloud.studio" target="_blank" rel="noopener noreferrer">Open in Studio ↗</a>
      </div>
    </div>`;
  $('panel').querySelector('[data-map]').addEventListener('click', () => openInMap(d.id));
  $('panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ------------------------------------------------------------------ */
/* Map (MapLibre)                                                     */
/* ------------------------------------------------------------------ */
function geojsonBBox(geom) {
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  const walk = (arr) => {
    if (typeof arr[0] === 'number') {
      const [x, y] = arr;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    } else arr.forEach(walk);
  };
  if (geom.type === 'Polygon') geom.coordinates.forEach(walk);
  else if (geom.type === 'MultiPolygon') geom.coordinates.forEach((p) => p.forEach(walk));
  return [[minX, minY], [maxX, maxY]];
}

function updateMapPaint() {
  S.map.setPaintProperty('states-fill', 'fill-color', fillExpr());
  S.map.setFilter('states-sel', ['==', ['get', 'name'], S.state || '__none__']);
}

function renderMap() {
  const list = filtered();
  const counts = stateCounts(list);
  const geo = JSON.parse(JSON.stringify(S.statesGeo));
  let max = 1;
  geo.features.forEach((f) => {
    const n = counts[f.properties.name] || 0;
    f.properties.count = n;
    if (n > max) max = n;
  });

  const container = $('map');
  if (!S.map) {
    S.map = new maplibregl.Map({
      container,
      style: {
        version: 8,
        sources: {
          base: { type: 'raster', tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', 'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', 'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'], tileSize: 256, attribution: '&copy; OpenStreetMap contributors &copy; CARTO' },
          states: { type: 'geojson', data: geo },
        },
        layers: [
          { id: 'base', type: 'raster', source: 'base' },
          { id: 'states-fill', type: 'fill', source: 'states', paint: { 'fill-color': fillExpr(), 'fill-opacity': 0.82 } },
          { id: 'states-line', type: 'line', source: 'states', paint: { 'line-color': '#ffffff', 'line-width': 0.7 } },
          { id: 'states-sel', type: 'line', source: 'states', filter: ['==', ['get', 'name'], '__none__'], paint: { 'line-color': '#f59e0b', 'line-width': 2.6 } },
        ],
      },
      center: [79.6, 22.8],
      zoom: 3.9,
      minZoom: 3,
      maxZoom: 9,
      attributionControl: { compact: true },
    });
    S.map.on('load', updateMapPaint);
    S.map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    S.map.on('mousemove', 'states-fill', (e) => showTip(e));
    S.map.on('mouseleave', 'states-fill', hideTip);
    S.map.on('click', 'states-fill', (e) => {
      const name = e.features[0].properties.name;
      S.state = S.state === name ? null : name;
      renderAll();
    });
  } else {
    S.map.getSource('states').setData(geo);
    if (S.map.loaded()) updateMapPaint();
  }
  $('mapSub').textContent = S.state ? `Filtered to ${S.state} — click again to clear.` : 'Shaded by count in view — click a state to filter.';
}

function fillExpr() {
  const list = filtered();
  const counts = stateCounts(list);
  let max = 1;
  Object.values(counts).forEach((n) => { if (n > max) max = n; });
  return ['interpolate', ['linear'], ['get', 'count'],
    0, '#eef2f7', max * 0.2, '#c9d8ea', max * 0.4, '#a2bcdb', max * 0.6, '#6f93bd', max * 0.8, '#3f6ba0', max, '#1f3b57'];
}

function showTip(e) {
  const f = e.features[0];
  const name = f.properties.name;
  const n = f.properties.count || 0;
  let tip = $('mapTip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'mapTip';
    tip.className = 'map-tip';
    document.body.appendChild(tip);
  }
  tip.innerHTML = `<div class="tip-name">${esc(name)}</div><div class="tip-n">${n} dataset${n === 1 ? '' : 's'}</div>`;
  tip.style.opacity = '1';
  tip.style.left = (e.originalEvent.clientX + 14) + 'px';
  tip.style.top = (e.originalEvent.clientY + 14) + 'px';
}
function hideTip() { const t = $('mapTip'); if (t) t.style.opacity = '0'; }

function openInMap(id) {
  const d = S.data.find((x) => x.id === id);
  if (!d) return;
  if (d.state) { S.state = d.state; renderAll(); }
  const feat = S.statesGeo.features.find((f) => f.properties.name === d.state);
  if (feat && S.map) {
    const bb = geojsonBBox(feat.geometry);
    S.map.fitBounds(bb, { padding: 40, duration: 600 });
  } else if (S.map) {
    S.map.flyTo({ center: [79.6, 22.8], zoom: 3.9, duration: 600 });
  }
  document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
}

/* ------------------------------------------------------------------ */
/* Portal assessment                                                  */
/* ------------------------------------------------------------------ */
function portalScore(p) {
  const ds = S.data.filter((d) => d.portal === p.id);
  if (!ds.length) return { score: 0, breakdown: [] };
  const open = ds.filter((d) => ['Open', 'Open (Registration)'].includes(d.access_tier)).length / ds.length;
  const dl = ds.filter((d) => d.downloadable).length / ds.length;
  const gis = ds.filter((d) => d.gis_ready).length / ds.length;
  const apiR = p.api ? 1 : ds.filter((d) => d.api || d.api_ready).length / ds.length;
  const yrs = ds.map((d) => d.updated_year || d.published_year || 0).filter((y) => y > 0);
  const rec = yrs.length ? Math.min(1, Math.max(0, (Math.max(...yrs) - 2010) / 14)) : 0.3;
  const checked = ds.filter((d) => d.link_health === 'live' || d.link_health === 'dead' || d.link_health === 'down');
  const link = checked.length ? ds.filter((d) => d.link_health === 'live').length / checked.length : 0.5;
  const parts = [
    ['Open & free access', open * 20, 20],
    ['Download capability', dl * 25, 25],
    ['GIS-ready formats', gis * 15, 15],
    ['API & OGC services', apiR * 15, 15],
    ['Data recency', rec * 15, 15],
    ['Link reliability', link * 10, 10],
  ];
  const score = Math.round(parts.reduce((a, b) => a + b[1], 0));
  return { score, parts };
}

function renderAssessment() {
  const el = $('portalScores');
  const rows = S.portals.map((p) => ({ p, s: portalScore(p) }))
    .filter((r) => r.s.score > 0)
    .sort((a, b) => b.s.score - a.s.score);
  el.innerHTML = rows.map(({ p, s }) => `
    <button class="pbar" data-p="${p.id}" aria-pressed="${S.panel && S.panel.portal === p.id}">
      <span class="pl">${esc(p.name)}</span>
      <span class="track"><i style="width:${s.score}%"></i></span>
      <span class="pn">${s.score}</span>
    </button>`).join('');
  el.querySelectorAll('.pbar').forEach((b) => b.addEventListener('click', () => openPortal(b.dataset.p)));
}

function openPortal(id) {
  const p = portalOf(id);
  const o = orgOf(p.organisation);
  const s = portalScore(p);
  const ds = S.data.filter((d) => d.portal === id);
  $('panel').innerHTML = `
    <div class="panel-head">
      <span class="eyebrow">Portal</span>
      <h3>${esc(p.name)}</h3>
      <div class="meta">${esc(o.name)} · ${esc(o.type)}</div>
    </div>
    <div class="panel-body">
      <div class="defrow"><span class="k">URL</span><span class="v"><a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.url)} ↗</a></span></div>
      <div class="defrow"><span class="k">Scope</span><span class="v">${esc(p.scope)}</span></div>
      <div class="defrow"><span class="k">Datasets</span><span class="v">${ds.length} catalogued</span></div>
      <div class="defrow"><span class="k">OGC / API / STAC</span><span class="v">${p.ogc ? 'OGC · ' : ''}${p.api ? 'API · ' : ''}${p.stac ? 'STAC' : '—'}</span></div>
      <h3 style="margin:14px 0 8px">Assessment — ${s.score}/100</h3>
      ${s.parts.map(([k, v, mx]) => `<div class="mixrow" style="display:grid;grid-template-columns:170px 1fr 40px;gap:10px;align-items:center;font-size:13px;margin:5px 0"><span>${esc(k)}</span><span class="track" style="height:8px;background:var(--page);border-radius:4px;position:relative"><i style="position:absolute;left:0;top:0;bottom:0;background:var(--primary);border-radius:4px;width:${Math.round(v / mx * 100)}%"></i></span><span style="text-align:right;font-family:var(--mono);font-size:12px">${v.toFixed(1)}</span></div>`).join('')}
      <div class="defrow" style="margin-top:12px"><span class="k">Description</span><span class="v">${esc(p.description)}</span></div>
    </div>`;
}

/* ------------------------------------------------------------------ */
/* Gap analysis                                                       */
/* ------------------------------------------------------------------ */
function renderGap() {
  const themeSel = $('gapTheme');
  const stateSel = $('gapState');
  if (!themeSel.options.length) {
    themeSel.innerHTML = S.themes.map((t) => `<option value="${t.id}">${esc(t.label)}</option>`).join('');
    const states = S.statesGeo.features.map((f) => f.properties.name).sort();
    stateSel.innerHTML = states.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
  }
  if (!BOUND.gap) {
    themeSel.addEventListener('change', computeGap);
    stateSel.addEventListener('change', computeGap);
    BOUND.gap = true;
  }
  computeGap();
}
function computeGap() {
  const theme = $('gapTheme').value;
  const state = $('gapState').value;
  const el = $('gapResult');
  const base = S.data.filter((d) => d.theme === theme);
  const scoped = base.filter((d) => !d.state || d.state === state);
  const gov = scoped.filter((d) => d.source_class === 'authoritative' || d.source_class === 'eo-derived');
  const open = scoped.filter((d) => d.access_tier === 'Open' || d.access_tier === 'Open (Registration)');
  const dlVector = scoped.filter((d) => d.downloadable && d.formats.some((f) => /geojson|shapefile|geotiff|topojson|csv/i.test(f)));
  const apis = scoped.filter((d) => d.api || d.api_ready);
  const ogc = scoped.filter((d) => d.ogc);
  const eo = scoped.filter((d) => d.source_class === 'eo-derived');
  const glob = scoped.filter((d) => d.source_class === 'global-open');
  const stats = [
    ['Government sources', gov.length], ['Open datasets', open.length],
    ['Downloadable (vector/raster)', dlVector.length], ['APIs', apis.length],
    ['OGC services', ogc.length], ['Earth-observation alternatives', eo.length],
    ['Global open alternatives', glob.length],
  ];
  el.innerHTML = `<div class="gapcard">
    <h3>${esc(themeOf(theme).label)} — ${esc(state)}</h3>
    <div class="gapgrid">${stats.map(([k, v]) => `<div class="gapstat"><b>${v}</b><span>${esc(k)}</span></div>`).join('')}</div>
    ${gapVerdict(dlVector.length, apis.length, ogc.length, open.length)}
  </div>`;
}
function gapVerdict(dl, api, ogc, open) {
  if (dl === 0 && api === 0 && ogc === 0) {
    return `<div class="gapverdict gap">Data gap — insufficient authoritative open coverage for this geography. Consider Earth-observation or global open alternatives, or generate the layer from imagery with Studio.</div>`;
  } else if (dl === 0 || (open === 0 && dl > 0)) {
    return `<div class="gapverdict partial">Partial coverage — data exists but is not openly downloadable (registration/restriction likely). Verify access at the source.</div>`;
  }
  return `<div class="gapverdict ok">Coverage available — ${dl} downloadable layer${dl === 1 ? '' : 's'}, ${api} API${api === 1 ? '' : 's'}, ${ogc} OGC service${ogc === 1 ? '' : 's'}.</div>`;
}

/* ------------------------------------------------------------------ */
/* Source comparison                                                  */
/* ------------------------------------------------------------------ */
function renderCompare() {
  const sel = $('compareTheme');
  if (!sel.options.length) {
    sel.innerHTML = S.themes.map((t) => `<option value="${t.id}" ${t.id === 'buildings' ? 'selected' : ''}>${esc(t.label)}</option>`).join('');
  }
  if (!BOUND.compare) {
    sel.addEventListener('change', computeCompare);
    BOUND.compare = true;
  }
  computeCompare();
}
function computeCompare() {
  const theme = $('compareTheme').value;
  const el = $('compareResult');
  const inTheme = S.data.filter((d) => d.theme === theme);
  const tiers = ['authoritative', 'open-community', 'global-open', 'eo-derived'];
  const rows = tiers.map((t) => {
    const ds = inTheme.filter((d) => d.source_class === t);
    const portals = [...new Set(ds.map((d) => d.portal))].map(portalOf).map((p) => p.name);
    return { tier: t, label: SOURCE_CLASSES[t].label, color: SOURCE_CLASSES[t].color, count: ds.length, portals, has: ds.length > 0 };
  });
  el.innerHTML = `<table class="comp">
    <thead><tr><th>Source tier</th><th>What's available</th><th>Coverage</th><th>Get it</th></tr></thead>
    <tbody>
    ${rows.map((r) => `<tr>
      <td><span class="tier"><span class="dot" style="background:${r.color}"></span>${esc(r.label)}</span></td>
      <td>${r.has ? `${r.count} dataset${r.count === 1 ? '' : 's'} — ${r.portals.slice(0, 3).map(esc).join(', ')}${r.portals.length > 3 ? '…' : ''}` : '<span style="color:var(--muted)">None catalogued</span>'}</td>
      <td>${r.has ? esc([...new Set(inTheme.filter((d) => d.source_class === r.tier).map((d) => d.coverage))].slice(0, 3).join(', ')) : '—'}</td>
      <td>${r.has ? '<button class="minbtn" data-tier="' + r.tier + '">Browse</button>' : '—'}</td>
    </tr>`).join('')}
    <tr>
      <td><span class="tier"><span class="dot" style="background:#f59e0b"></span>Studio-generated</span></td>
      <td>On-demand extraction (footprints, change detection, land cover) from imagery via the Studio Workbench.</td>
      <td>Any AOI</td>
      <td><a class="minbtn" href="https://nebulacloud.studio" target="_blank" rel="noopener noreferrer">Create with Studio ↗</a></td>
    </tr>
    </tbody></table>`;
  el.querySelectorAll('[data-tier]').forEach((b) => b.addEventListener('click', () => {
    S.theme = theme;
    S.providers = []; S.access = []; S.formats = []; S.scopes = []; S.state = null; S.q = '';
    S.srcClasses = [b.dataset.tier];
    $('queryInput').value = '';
    renderAll();
    document.getElementById('datasets').scrollIntoView({ behavior: 'smooth' });
  }));
}

/* ------------------------------------------------------------------ */
/* Ask Studio (natural-language, client-side v0.1)                    */
/* ------------------------------------------------------------------ */
function askStudio(query) {
  const q = query.toLowerCase();
  const themes = S.themes.filter((t) => {
    const keys = [t.label.toLowerCase(), ...(THEME_SYNONYMS[t.id] || [])];
    return keys.some((k) => q.includes(k));
  });
  const stateNames = S.statesGeo.features.map((f) => f.properties.name);
  const state = stateNames.find((s) => q.includes(s.toLowerCase()));
  let scope = null;
  if (/global|world/.test(q)) scope = 'Global';
  else if (/india|national/.test(q)) scope = null;

  let ds = S.data.slice();
  if (themes.length) ds = ds.filter((d) => themes.some((t) => t.id === d.theme));
  if (state) ds = ds.filter((d) => d.state === state || d.coverage === 'All India' || d.coverage === 'Global' || d.coverage === 'Regional');
  if (scope) ds = ds.filter((d) => portalOf(d.portal).scope === scope);
  const n = ds.length;

  const portals = [...new Set(ds.map((d) => d.portal))].map(portalOf);
  const ogcN = ds.filter((d) => d.ogc).length;
  const apiN = ds.filter((d) => d.api || d.api_ready).length;
  const fmts = [...new Set(ds.flatMap((d) => d.formats))];
  const open = ds.filter((d) => ['Open', 'Open (Registration)'].includes(d.access_tier)).length;
  const live = ds.filter((d) => d.link_health === 'live').length;
  const yrs = ds.map((d) => d.updated_year || d.published_year || 0).filter((y) => y > 0);

  const detected = [];
  if (themes.length) detected.push('theme: ' + themes.map((t) => t.label).join(', '));
  if (state) detected.push('geography: ' + state);
  if (scope) detected.push('scope: ' + scope);

  $('askResult').hidden = false;
  $('askTitle').textContent = `Result for “${query}”`;
  $('askBody').innerHTML = `
    ${detected.length ? `<p class="footnote" style="margin-bottom:12px">Detected ${detected.join(' · ')}</p>` : ''}
    <table class="cap-table">
      <tr><th>Datasets</th><td><b>${n}</b> relevant record${n === 1 ? '' : 's'}</td></tr>
      <tr><th>Portals</th><td>${portals.length ? portals.map((p) => esc(p.name)).join(', ') : '—'}</td></tr>
      <tr><th>OGC services</th><td>${ogcN}</td></tr>
      <tr><th>APIs</th><td>${apiN}</td></tr>
      <tr><th>Formats</th><td>${fmts.length ? fmts.map(esc).join(', ') : '—'}</td></tr>
      <tr><th>Coverage</th><td>${state || 'All India / national'}</td></tr>
      <tr><th>Access</th><td>${open} openly accessible · ${n - open} restricted/other</td></tr>
      <tr><th>Link health</th><td>${live} live · ${n - live} unverified</td></tr>
      <tr><th>Freshness</th><td>${yrs.length ? Math.max(...yrs) : 'not recorded'}</td></tr>
      <tr><th>Studio assessment</th><td>${ds.length ? Math.round(ds.reduce((a, d) => a + datasetScore(d), 0) / ds.length) : 0}/100 average</td></tr>
    </table>
    <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
      <button class="ghostbtn" id="askBrowse">Browse these ${n} results</button>
      <a class="ghostbtn" href="https://nebulacloud.studio" target="_blank" rel="noopener noreferrer">Analyse with Studio ↗</a>
    </div>`;
  $('askBrowse').addEventListener('click', () => {
    S.theme = themes.length === 1 ? themes[0].id : null;
    S.state = state || null;
    if (themes.length) S.theme = themes[0].id;
    S.q = '';
    $('queryInput').value = '';
    renderAll();
    document.getElementById('datasets').scrollIntoView({ behavior: 'smooth' });
  });
}

/* ------------------------------------------------------------------ */
/* Agents & methodology                                               */
/* ------------------------------------------------------------------ */
const AGENTS = [
  ['Discovery', 'Finds candidate government & open-data portals.'],
  ['Crawler', 'Traverses catalogues and dataset pages.'],
  ['Metadata', 'Extracts title, agency, geography, theme, date, format.'],
  ['GeoService', 'Detects WMS/WFS/WMTS/OGC API/STAC endpoints.'],
  ['Licence', 'Identifies licence and usage restrictions.'],
  ['Verification', 'Checks links and endpoints, records evidence.'],
  ['Quality', 'Scores metadata completeness and usability.'],
  ['Classification', 'Normalises themes, geographies and organisations.'],
  ['Change', 'Detects portal and dataset changes.'],
  ['Provenance', 'Stores source, evidence and date for every assertion.'],
  ['Human review', 'Flags uncertain classifications for sign-off.'],
  ['Publishing', 'Updates the open GitHub catalogue.'],
];
function renderAgents() {
  $('agentsGrid').innerHTML = AGENTS.map(([a, d]) => `<div class="agent"><b>${a}</b><span>${esc(d)}</span></div>`).join('');
}

const METHODOLOGY = [
  ['Scoring', 'Portals are scored 0–100 from catalogued records: open & free access (20), download capability (25), GIS-ready formats (15), API & OGC services (15), data recency (15), link reliability (10).'],
  ['Classification', 'Source classes are fixed: Government (authoritative), Open community (OSM/DataMeet), Global open (international), Earth observation (satellite-derived). Themes roll up to 16 fixed groups.'],
  ['Verification', 'Links are checked against HTTP status; live, redirects, broken and unverified are recorded with a timestamp. Access and licence are classified from source evidence, not legal review.'],
  ['Provenance', 'Every assertion carries its source and verification date. Uncertain records are flagged for human review before being published.'],
];
function renderMethodology() {
  $('methodologyGrid').innerHTML = METHODOLOGY.map(([h, p]) => `<div class="methcard"><h3>${h}</h3><p>${esc(p)}</p></div>`).join('');
}

/* ------------------------------------------------------------------ */
/* Download                                                           */
/* ------------------------------------------------------------------ */
function downloadCSV() {
  const cols = ['id', 'title', 'portal', 'agency', 'theme', 'coverage', 'state', 'formats', 'access_tier', 'licence', 'url', 'source_class', 'published_year', 'updated_year', 'link_health'];
  const head = cols.join(',');
  const rows = S.data.map((d) => {
    const p = portalOf(d.portal);
    return cols.map((c) => {
      let v;
      if (c === 'portal') v = p.name;
      else if (c === 'agency') v = orgOf(p.organisation).name;
      else if (c === 'theme') v = themeOf(d.theme).label;
      else if (c === 'formats') v = d.formats.join('; ');
      else v = d[c];
      return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    }).join(',');
  });
  const csv = '\uFEFF' + [head, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'nebula-civic-index-geoindia-datasets.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ------------------------------------------------------------------ */
/* Wiring                                                             */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  boot();

  const form = $('searchForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    S.q = $('queryInput').value.trim();
    if (S.mode === 'ask') { askStudio(S.q || 'India geospatial data'); S.q = ''; }
    else { S.page = 1; renderList(); renderMap(); renderActiveBar(); }
  });

  $('queryInput').addEventListener('input', () => {
    if (S.mode === 'search') {
      S.q = $('queryInput').value.trim();
      S.page = 1; renderList(); renderMap(); renderActiveBar();
    }
  });

  $('askBtn').addEventListener('click', () => setMode('ask'));
  document.querySelectorAll('.mode').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  function setMode(m) {
    S.mode = m;
    document.querySelectorAll('.mode').forEach((x) => x.classList.toggle('active', x.dataset.mode === m));
    document.querySelectorAll('.mode').forEach((x) => x.setAttribute('aria-selected', x.dataset.mode === m));
    $('askBtn').setAttribute('aria-pressed', m === 'ask');
    if (m === 'ask') {
      $('askResult').hidden = false;
      if (S.q) askStudio(S.q);
    } else {
      $('askResult').hidden = true;
    }
  }

  $('sortSelect').addEventListener('change', (e) => { S.sort = e.target.value; renderList(); });
  $('perSelect').addEventListener('change', (e) => { S.per = +e.target.value; S.page = 1; renderList(); });
  $('downloadBtn').addEventListener('click', downloadCSV);
  $('mapReset').addEventListener('click', () => { S.state = null; renderAll(); });
});
