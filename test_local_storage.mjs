import playwright from 'playwright';
import { readFileSync } from 'fs';

const browser = await playwright.chromium.launch({ headless: true });
const indexPath = new URL('index.html', import.meta.url);
const html = readFileSync(indexPath, 'utf8');

function fail(message) {
  throw new Error(message);
}

try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await page.goto(indexPath.href);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  const firstCompetitor = page.locator('.bout[data-round="1"][data-bout="3"] .competitor').first();
  const selectedName = await firstCompetitor.textContent();
  await firstCompetitor.click();
  await page.waitForTimeout(200);

  const storedSelections = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('vawt-2026-bracket-selections'));
  });

  if (!Array.isArray(storedSelections) || storedSelections.length !== 1) {
    fail(`Expected one saved selection, found ${JSON.stringify(storedSelections)}`);
  }

  if (storedSelections[0][0] !== 'r1b3' || storedSelections[0][1] !== selectedName) {
    fail(`Saved selection did not match clicked competitor: ${JSON.stringify(storedSelections[0])}`);
  }

  await page.reload({ waitUntil: 'networkidle' });

  const persistedWinner = await page.locator('.bout[data-round="1"][data-bout="3"] .competitor.is-winner').textContent();
  if (persistedWinner !== selectedName) {
    fail(`Expected persisted winner "${selectedName}", found "${persistedWinner}"`);
  }

  await page.locator('#reset-selections').click();
  await page.waitForTimeout(200);

  const winnerCountAfterReset = await page.locator('.competitor.is-winner').count();
  const storageAfterReset = await page.evaluate(() => localStorage.getItem('vawt-2026-bracket-selections'));

  if (winnerCountAfterReset !== 2) {
    fail(`Expected reset to clear user winners while preserving 2 organizer winners, found ${winnerCountAfterReset}`);
  }

  if (storageAfterReset !== null) {
    fail(`Expected reset to clear saved selections, found ${storageAfterReset}`);
  }

  await page.close();

  const organizerPage = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const htmlWithOrganizerResult = html;

  await organizerPage.setContent(htmlWithOrganizerResult, { waitUntil: 'networkidle' });

  const hardcodedWinnerBeforeReset = await organizerPage
    .locator('.bout[data-round="1"][data-bout="1"] .competitor.is-winner')
    .textContent();
  const hardcodedWinnerDisabled = await organizerPage
    .locator('.bout[data-round="1"][data-bout="1"] .competitor.is-winner')
    .isDisabled();
  const hardcodedWinnerClass = await organizerPage
    .locator('.bout[data-round="1"][data-bout="1"] .competitor.is-winner')
    .getAttribute('class');

  if (hardcodedWinnerBeforeReset !== '🏆 Three Crosses') {
    fail(`Expected hardcoded organizer winner before reset, found "${hardcodedWinnerBeforeReset}"`);
  }

  if (!hardcodedWinnerDisabled) {
    fail('Expected hardcoded organizer winner to be locked from user edits');
  }

  if (!hardcodedWinnerClass.includes('is-organizer-winner')) {
    fail(`Expected hardcoded organizer winner to have fixed-selection styling class, found "${hardcodedWinnerClass}"`);
  }

  await organizerPage.locator('#reset-selections').click();
  await organizerPage.waitForTimeout(200);

  const hardcodedWinnerAfterReset = await organizerPage
    .locator('.bout[data-round="1"][data-bout="1"] .competitor.is-winner')
    .textContent();

  if (hardcodedWinnerAfterReset !== '🏆 Three Crosses') {
    fail(`Expected reset to preserve hardcoded organizer winner, found "${hardcodedWinnerAfterReset}"`);
  }

  await organizerPage.close();

  console.log('✓ localStorage selections persist, reload, reset, and preserve organizer results');
} finally {
  await browser.close();
}
