import playwright from 'playwright';

const browser = await playwright.chromium.launch({ headless: true });
const indexPath = new URL('index.html', import.meta.url);

function fail(message) {
  throw new Error(message);
}

async function selectedWinner(page, round, bout) {
  const winner = page.locator(`.bout[data-round="${round}"][data-bout="${bout}"] .competitor.is-winner`);
  if ((await winner.count()) === 0) return "";
  return winner.first().textContent();
}

async function clickCompetitor(page, round, bout, name) {
  await page.locator(`.bout[data-round="${round}"][data-bout="${bout}"] .competitor`, { hasText: name }).click();
  await page.waitForTimeout(100);
}

try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await page.goto(indexPath.href, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await clickCompetitor(page, 1, 1, "Open Road");
  await clickCompetitor(page, 1, 3, "KO Distilling");
  await clickCompetitor(page, 2, 1, "Open Road");
  await clickCompetitor(page, 1, 3, "Mean Spirits");

  const unaffectedWinner = await selectedWinner(page, 2, 1);
  if (unaffectedWinner !== "Open Road") {
    fail(`Expected R2B1 to keep unaffected winner Open Road, found "${unaffectedWinner}"`);
  }

  await page.locator('#reset-selections').click();
  await page.waitForTimeout(100);

  await clickCompetitor(page, 1, 1, "Open Road");
  await clickCompetitor(page, 1, 3, "KO Distilling");
  await clickCompetitor(page, 2, 1, "KO Distilling");
  await clickCompetitor(page, 1, 3, "Mean Spirits");

  const clearedWinner = await selectedWinner(page, 2, 1);
  if (clearedWinner) {
    fail(`Expected R2B1 to clear after advancing changed entrant, found "${clearedWinner}"`);
  }

  const r2Entrants = await page
    .locator('.bout[data-round="2"][data-bout="1"] .competitor')
    .evaluateAll((buttons) => buttons.map((button) => button.textContent));

  if (!r2Entrants.includes("Mean Spirits") || r2Entrants.includes("KO Distilling")) {
    fail(`Expected R2B1 entrants to replace KO Distilling with Mean Spirits, found ${JSON.stringify(r2Entrants)}`);
  }

  console.log('✓ downstream selections only clear when they advanced the changed entrant');
  await page.close();
} finally {
  await browser.close();
}
