const { test, expect } = require('@playwright/test');
async function injectAxe(page) {
  await page.addScriptTag({ path: require.resolve('axe-core') });
}

async function waitForCatalogue(page) {
  await expect(page.locator('#listCount')).toContainText(/dataset(s)? in view/);
}

async function expectNoCriticalA11yIssues(page) {
  await injectAxe(page);
  const results = await page.evaluate(async () => {
    return await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      rules: { 'color-contrast': { enabled: false } },
    });
  });
  const serious = results.violations.filter((v) => ['critical', 'serious'].includes(v.impact));
  expect(serious, serious.map((v) => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
}

test('core catalogue flows work and expose truthful status language', async ({ page }) => {
  await page.goto('/');
  await waitForCatalogue(page);
  await expect(page).toHaveTitle(/GeoIndia/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /geoindia-social\.png/);
  await expect(page.locator('.trustline')).toContainText('Underlying datasets are not re-hosted');
  await expect(page.getByText('latest link check')).toBeVisible();
  await expect(page.getByText('Live catalogue')).toBeVisible();
  await expect(page.getByText('Available via Nebula').first()).toBeVisible();
  await expect(page.getByText('Coming soon').first()).toBeVisible();

  await page.getByLabel('Search datasets').fill('building footprints');
  await expect(page.getByText(/dataset(s)? in view/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Ask GeoIndia' }).click();
  await expect(page.getByText(/Catalogue result for/)).toBeVisible();
  await expect(page.getByText('Browse matching catalogue')).toBeVisible();
  await page.getByRole('button', { name: 'Browse matching catalogue' }).click();
  await expect(page.locator('#activeBar')).toContainText('Ask');

  await page.getByRole('button', { name: /Inspect/ }).first().click();
  await expect(page.getByRole('dialog', { name: /./ })).toBeVisible();
  await expect(page.locator('#datasetDrawer')).toContainText('Direct dataset handoff');
  await page.keyboard.press('Escape');
  await expect(page.locator('#datasetDrawer')).toBeHidden();
});

test('global Ask query reports global coverage and keeps matched browse set', async ({ page }) => {
  await page.goto('/');
  await waitForCatalogue(page);
  await page.getByLabel('Search datasets').fill('global building datasets');
  await page.getByRole('button', { name: 'Ask GeoIndia' }).click();
  await expect(page.locator('#askBody')).toContainText('Global');
  await page.getByRole('button', { name: 'Browse matching catalogue' }).click();
  await expect(page.locator('#activeBar')).toContainText('Ask');
  await expect(page.locator('#datasetList')).toContainText(/Global|building/i);
});

test('geography filtering includes state, national and global context', async ({ page }) => {
  await page.goto('/');
  await waitForCatalogue(page);
  await page.getByLabel('Coverage (state/UT)').selectOption('Telangana');
  await expect(page.locator('#mapSub')).toContainText('national and applicable global sources');
  await expect(page.locator('#activeBar')).toContainText('Telangana');
  await expect(page.locator('#datasetList')).not.toContainText('No datasets match');
});

test('gap analysis and source comparison status language is launch-safe', async ({ page }) => {
  await page.goto('/');
  await waitForCatalogue(page);
  await expect(page.locator('#gapResult')).toContainText(/Potential data gap|Partial \/ constrained coverage|Coverage available/);
  await expect(page.locator('#compareResult')).toContainText('Studio-assisted generation');
  await expect(page.locator('#compareResult')).toContainText('Available via Nebula');
});

test('map container and portal assessment have interactive semantics', async ({ page }) => {
  await page.goto('/');
  await waitForCatalogue(page);
  await expect(page.locator('#map')).toHaveAttribute('role', 'region');
  await expect(page.locator('#map')).toHaveAttribute('tabindex', '0');
  const firstPortal = page.locator('#portalScores .pbar').first();
  await firstPortal.click();
  await expect(firstPortal).toHaveAttribute('aria-pressed', 'true');
});

test('desktop/mobile page has no serious axe violations', async ({ page }) => {
  await page.goto('/');
  await waitForCatalogue(page);
  await expectNoCriticalA11yIssues(page);
});

test('Civic Index regional architecture is truthful and non-routable', async ({ page }) => {
  await page.goto('/');
  await waitForCatalogue(page);
  const civic = page.locator('#civic-index');
  await expect(civic).toContainText('Civic Index across jurisdictions');
  await expect(civic).toContainText('India — GeoIndia');
  await expect(civic).toContainText('Live');
  await expect(civic).toContainText('Europe edition');
  await expect(civic).toContainText('Coming soon');
  await expect(civic).toContainText('United States edition');
  await expect(civic).toContainText('Build locally. Standardize globally.');
  await expect(civic.getByRole('link')).toHaveCount(0);
  await expect(civic).not.toContainText(/Europe indexed|US data available|worldwide catalogue|global coverage/i);

  const labs = page.locator('#labs');
  await expect(labs).toContainText('Nebula Civic Index');
  await expect(labs).toContainText('Other Public Good Labs initiatives');
  await expect(labs).toContainText('ClimateIndia');
  await expect(labs).toContainText('Exploring');
});
