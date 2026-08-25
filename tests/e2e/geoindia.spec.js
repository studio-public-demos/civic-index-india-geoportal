const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '../..');
const PUBLIC_URL = 'https://geoindia.nebulacloud.in/';
const datasets = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/datasets.json'), 'utf8'));
const themes = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/themes.json'), 'utf8'));
const statesGeo = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/india-states.geojson'), 'utf8'));
const states = statesGeo.features.map((f) => f.properties.name).sort();

function relevantToState(d, state) {
  return d.state === state || d.coverage === state || d.coverage === 'All India' || d.coverage === 'Global';
}

function csvRows(text) {
  return text.trim().split(/\r?\n/).map((line) => {
    const cells = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"' && quoted && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = !quoted;
      else if (ch === ',' && !quoted) {
        cells.push(cell);
        cell = '';
      } else cell += ch;
    }
    cells.push(cell);
    return cells;
  });
}

async function waitForCatalogue(page) {
  await expect(page.locator('#listCount')).toContainText(/dataset(s)? in view/);
}

async function expectNoA11yIssues(page) {
  await page.addScriptTag({ path: require.resolve('axe-core') });
  const results = await page.evaluate(async () => window.axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  }));
  expect(results.violations, results.violations.map((v) => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page._qaErrors = { consoleErrors, pageErrors };
});

test.afterEach(async ({ page }) => {
  const errors = page._qaErrors || { consoleErrors: [], pageErrors: [] };
  const consoleErrors = page._allowConsoleResourceErrors
    ? errors.consoleErrors.filter((msg) => !msg.includes('Failed to load resource: net::ERR_FAILED'))
    : errors.consoleErrors;
  expect(errors.pageErrors, 'page errors').toEqual([]);
  expect(consoleErrors, 'console errors').toEqual([]);
});

test('hero, SEO, status vocabulary and global architecture stay launch-truthful', async ({ page }) => {
  await page.goto('/');
  await waitForCatalogue(page);
  await expect(page).toHaveTitle(/GeoIndia/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', PUBLIC_URL);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', PUBLIC_URL);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${PUBLIC_URL}assets/images/geoindia-social.png`);
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', `${PUBLIC_URL}assets/images/geoindia-social.png`);
  await expect(page.locator('.trustline')).toContainText('Underlying datasets are not re-hosted');
  await expect(page.getByText('latest link check')).toBeVisible();
  await expect(page.getByText('Live catalogue')).toBeVisible();
  await expect(page.getByText('Available via Nebula').first()).toBeVisible();
  await expect(page.getByText('Coming soon').first()).toBeVisible();
  await expect(page.locator('#civic-index')).toContainText('India — GeoIndia');
  await expect(page.locator('#civic-index')).toContainText('Europe edition');
  await expect(page.locator('#civic-index')).toContainText('United States edition');
  await expect(page.locator('#civic-index').getByRole('link')).toHaveCount(0);
  await expect(page.locator('#civic-index')).not.toContainText(/Europe indexed|US data available|worldwide catalogue|global coverage/i);
});

test('all filter families apply and active filter chips clear back to the full catalogue', async ({ page }) => {
  await page.goto('/');
  await waitForCatalogue(page);
  await page.locator('#themeChips').getByRole('button', { name: /Buildings/ }).click();
  await page.locator('#scopeRow').getByRole('button', { name: 'Global' }).click();
  await page.locator('#provRow').getByRole('button', { name: 'Scientific Institution' }).click();
  await page.locator('#srcRow').getByRole('button', { name: 'Global open' }).click();
  await page.locator('#accessRow').getByRole('button', { name: 'Open', exact: true }).click();
  await page.locator('#formatRow').getByRole('button', { name: 'GeoJSON' }).click();
  await page.getByLabel('Coverage (state/UT)').selectOption('Telangana');
  await expect(page.locator('#activeBar')).toContainText('Theme');
  await expect(page.locator('#activeBar')).toContainText('State');
  await expect(page.locator('#activeBar')).toContainText('Format');

  while (await page.locator('#activeBar .fchip').count()) {
    await page.locator('#activeBar .fchip').first().click();
  }
  await expect(page.locator('#activeBar')).toHaveText('');
  await expect(page.locator('#listCount')).toContainText(`${datasets.length} datasets in view`);
});

test('sorting, page sizes and pagination work without losing catalogue state', async ({ page }) => {
  await page.goto('/');
  await waitForCatalogue(page);
  await page.getByLabel('Sort').selectOption('title');
  const titles = await page.locator('#datasetList h3').evaluateAll((els) => els.map((el) => el.textContent.trim()));
  expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));

  await page.locator('#perSelect').selectOption('50');
  await expect(page.locator('#datasetList article')).toHaveCount(50);
  await expect(page.locator('#pagerSlot')).toContainText('Page 1');
  await page.getByRole('button', { name: /Next/ }).click();
  await expect(page.locator('#pagerSlot')).toContainText('Page 2');
  await page.getByRole('button', { name: /Prev/ }).click();
  await expect(page.locator('#pagerSlot')).toContainText('Page 1');
  await page.locator('#perSelect').selectOption('100');
  await expect(page.locator('#datasetList article')).toHaveCount(100);
});

test('CSV export downloads and parses the current filtered view', async ({ page }) => {
  await page.goto('/');
  await waitForCatalogue(page);
  await page.locator('#themeChips').getByRole('button', { name: /Buildings/ }).click();
  await page.getByLabel('Coverage (state/UT)').selectOption('Telangana');
  const expectedCount = Number((await page.locator('#listCount').textContent()).match(/\d+/)[0]);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download current view' }).click();
  const download = await downloadPromise;
  const text = fs.readFileSync(await download.path(), 'utf8').replace(/^\uFEFF/, '');
  const rows = csvRows(text);
  expect(download.suggestedFilename()).toBe('geoindia-current-view.csv');
  expect(rows[0]).toEqual(['id', 'title', 'portal', 'agency', 'theme', 'coverage', 'state', 'formats', 'access_tier', 'licence', 'url', 'source_class', 'published_year', 'updated_year', 'link_health']);
  expect(rows.length - 1).toBe(expectedCount);
  expect(rows.slice(1).every((row) => row[8])).toBeTruthy();
});

test('map and state select stay synchronized, including reset', async ({ page }) => {
  await page.goto('/');
  await waitForCatalogue(page);
  await page.getByLabel('Coverage (state/UT)').selectOption('Telangana');
  await expect(page.locator('#mapSub')).toContainText('Filtered to Telangana');
  await expect(page.locator('#activeBar')).toContainText('Telangana');
  await page.getByRole('button', { name: 'Reset map' }).click();
  await expect(page.getByLabel('Coverage (state/UT)')).toHaveValue('');
  await expect(page.locator('#activeBar')).not.toContainText('Telangana');
});

test('catalogue remains usable when MapLibre is blocked', async ({ page }) => {
  page._allowConsoleResourceErrors = true;
  await page.route('https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js', (route) => route.abort());
  await page.goto('/');
  await waitForCatalogue(page);
  await expect(page.locator('#map')).toContainText('Interactive map temporarily unavailable');
  await expect(page.locator('#datasetList article').first()).toBeVisible();
});

test('catalogue remains usable when CARTO basemap tiles are blocked', async ({ page }) => {
  page._allowConsoleResourceErrors = true;
  await page.route(/basemaps\.cartocdn\.com/, (route) => route.abort());
  await page.goto('/');
  await waitForCatalogue(page);
  await expect(page.locator('#map')).toHaveAttribute('role', 'region');
  await page.getByLabel('Coverage (state/UT)').selectOption('Telangana');
  await expect(page.locator('#datasetList article').first()).toBeVisible();
});

test('Ask GeoIndia covers empty, unknown, global and multi-theme prompts', async ({ page }) => {
  await page.goto('/');
  await waitForCatalogue(page);
  await page.getByRole('button', { name: 'Ask GeoIndia' }).click();
  await expect(page.locator('#askTitle')).toContainText('Ask GeoIndia about the catalogue');
  await expect(page.locator('#askBody')).toContainText('Building footprints for Telangana');

  await page.getByLabel('Search datasets').fill('banana procurement hallucination');
  await page.getByRole('button', { name: 'Ask GeoIndia' }).click();
  await expect(page.locator('#askTitle')).toContainText('could not identify');

  await page.getByLabel('Search datasets').fill('global building datasets');
  await page.getByRole('button', { name: 'Ask GeoIndia' }).click();
  await expect(page.locator('#askBody')).toContainText('Global');

  await page.getByLabel('Search datasets').fill('water and climate data for Karnataka');
  await page.getByRole('button', { name: 'Ask GeoIndia' }).click();
  await expect(page.locator('#askBody')).toContainText('Water');
  await expect(page.locator('#askBody')).toContainText('Climate');
  await expect(page.locator('#askBody')).toContainText('Karnataka');
  await page.getByRole('button', { name: 'Browse matching catalogue' }).click();
  await expect(page.locator('#activeBar')).toContainText('Ask');
});

test('dataset drawer traps focus and restores it on close', async ({ page }) => {
  await page.goto('/');
  await waitForCatalogue(page);
  const inspect = page.getByRole('button', { name: /Inspect/ }).first();
  await inspect.focus();
  await inspect.click();
  const drawer = page.locator('#datasetDrawer');
  await expect(drawer).toBeVisible();
  await expect(page.locator('#drawerClose')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(drawer.locator('a, button').last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#drawerClose')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(inspect).toBeFocused();
});

test('all themes render source comparison without missing Studio status', async ({ page }) => {
  await page.goto('/');
  await waitForCatalogue(page);
  for (const theme of themes) {
    await page.locator('#compareTheme').selectOption(theme.id);
    await expect(page.locator('#compareResult')).toContainText('Studio-assisted generation');
    await expect(page.locator('#compareResult')).toContainText('Available via Nebula');
    await expect(page.locator('#compareResult tbody tr')).toHaveCount(5);
  }
});

test('all theme and state combinations render gap analysis with authoritative government counts', async ({ page }) => {
  test.slow();
  await page.goto('/');
  await waitForCatalogue(page);
  for (const theme of themes) {
    await page.locator('#gapTheme').selectOption(theme.id);
    for (const state of states) {
      await page.locator('#gapState').selectOption(state);
      const expectedGov = datasets.filter((d) => d.theme === theme.id && relevantToState(d, state) && d.source_class === 'authoritative').length;
      await expect(page.locator('#gapResult h3')).toContainText(theme.label);
      await expect(page.locator('#gapResult h3')).toContainText(state);
      await expect(page.locator('[data-gap-stat="Government sources"] b')).toHaveText(String(expectedGov));
      await expect(page.locator('#gapResult')).toContainText(/Potential data gap|Partial \/ constrained coverage|Coverage available/);
    }
  }
});

test('gap generation CTA appears only for constrained gaps with alternatives', async ({ page }) => {
  await page.goto('/');
  await waitForCatalogue(page);
  let noAlternativeCase = null;
  let alternativeCase = null;
  for (const theme of themes) {
    for (const state of states) {
      const scoped = datasets.filter((d) => d.theme === theme.id && relevantToState(d, state));
      const usable = scoped.filter((d) => d.downloadable && d.gis_ready).length;
      const api = scoped.filter((d) => d.api || d.api_ready).length;
      const ogc = scoped.filter((d) => d.ogc).length;
      const alternatives = scoped.filter((d) => d.source_class === 'eo-derived' || d.source_class === 'global-open').length;
      if (!usable && !api && !ogc && alternatives && !alternativeCase) alternativeCase = { theme, state };
      if (!usable && !api && !ogc && !alternatives && !noAlternativeCase) noAlternativeCase = { theme, state };
    }
  }
  if (alternativeCase) {
    await page.locator('#gapTheme').selectOption(alternativeCase.theme.id);
    await page.locator('#gapState').selectOption(alternativeCase.state);
    await expect(page.locator('#gapResult')).toContainText('Explore Studio-assisted generation');
  }

  if (noAlternativeCase) {
    await page.locator('#gapTheme').selectOption(noAlternativeCase.theme.id);
    await page.locator('#gapState').selectOption(noAlternativeCase.state);
    await expect(page.locator('#gapResult')).not.toContainText('Explore Studio-assisted generation');
  } else {
    await expect(page.locator('#gapResult')).not.toContainText('Explore Studio-assisted generation');
  }
});

test('responsive and accessibility checks cover 360, 390, 768, 1024 and 1440 widths', async ({ page }) => {
  test.slow();
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 900 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await waitForCatalogue(page);
    await expect(page.locator('.masthead h1')).toBeVisible();
    await expect(page.locator('#datasetList article').first()).toBeVisible();
    await page.getByRole('link', { name: 'Civic Index' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('#civic-index h2')).toBeVisible();
    await expectNoA11yIssues(page);
  }
});
