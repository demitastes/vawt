import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pages = [
  {
    label: 'distillery profile',
    url: `file://${path.resolve(__dirname, 'distilleries/open-road.html')}`,
    locator: '.bouts-table .bout-active-indicator',
    expectedParentClass: 'bout-indicator-cell',
    rowLocator: '.bouts-table .bout-row.is-active',
    expectedRowAlignment: 'center',
  },
  {
    label: 'distillery index',
    url: `file://${path.resolve(__dirname, 'distilleries/index.html')}`,
    locator: '.distillery-row .bout-active-indicator',
    expectedParentClass: 'distillery-indicator-cell',
    numberCellLocator: '.distillery-row.is-active td:nth-child(2)',
  },
];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 375, height: 667 },
});

let failures = 0;

async function checkIndicator({ label, url, locator, expectedParentClass }) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  const indicator = page.locator(locator).first();
  const count = await page.locator(locator).count();
  if (count === 0) {
    console.error(`FAIL ${label}: expected at least one active indicator`);
    failures++;
    await page.close();
    return;
  }

  await indicator.scrollIntoViewIfNeeded();
  const box = await indicator.boundingBox();
  const styles = await indicator.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      display: computed.display,
      width: computed.width,
      height: computed.height,
      borderRadius: computed.borderRadius,
    };
  });
  const parentClass = await indicator.evaluate((el) => el.parentElement?.className || '');

  const width = Number.parseFloat(styles.width);
  const height = Number.parseFloat(styles.height);
  const isCircle = styles.display === 'inline-block'
    && width >= 8
    && width === height
    && styles.borderRadius === '50%';
  const isInViewport = box && box.x >= 3 && box.x + box.width <= 375;

  if (!isCircle) {
    console.error(`FAIL ${label}: expected an inline-block circular indicator, got ${JSON.stringify(styles)}`);
    failures++;
  } else if (!isInViewport) {
    console.error(`FAIL ${label}: indicator overlaps the viewport edge at ${JSON.stringify(box)}`);
    failures++;
  } else if (!parentClass.split(/\s+/).includes(expectedParentClass)) {
    console.error(`FAIL ${label}: expected indicator parent cell class ${expectedParentClass}, got "${parentClass}"`);
    failures++;
  } else {
    console.log(`PASS ${label}: active indicator is a visible mobile dot in its own cell`);
  }

  await page.close();
}

async function checkRowAlignment({ label, url, rowLocator, expectedRowAlignment }) {
  if (!rowLocator) return;

  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  const row = page.locator(rowLocator).first();
  const alignment = await row.evaluate((el) => window.getComputedStyle(el).alignItems);

  if (alignment !== expectedRowAlignment) {
    console.error(`FAIL ${label}: expected row alignment ${expectedRowAlignment}, got ${alignment}`);
    failures++;
  } else {
    console.log(`PASS ${label}: active row contents are vertically centered`);
  }

  await page.close();
}

async function checkNumberCell({ label, url, numberCellLocator }) {
  if (!numberCellLocator) return;

  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  const text = (await page.locator(numberCellLocator).first().textContent())?.trim();

  if (!/^\d+$/.test(text || '')) {
    console.error(`FAIL ${label}: expected active row number cell to contain only a number, got "${text}"`);
    failures++;
  } else {
    console.log(`PASS ${label}: active row number text is isolated from the indicator`);
  }

  await page.close();
}

async function checkDesktopIndicatorCell() {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1024, height: 667 });
  await page.goto(`file://${path.resolve(__dirname, 'distilleries/three-crosses.html')}`, { waitUntil: 'networkidle' });

  const cell = page.locator('.bouts-table .bout-indicator-cell').first();
  const indicator = page.locator('.bouts-table .bout-active-indicator').first();
  const cellStyles = await cell.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      height: computed.height,
      verticalAlign: computed.verticalAlign,
      lineHeight: computed.lineHeight,
    };
  });
  const cellBox = await cell.boundingBox();
  const indicatorBox = await indicator.boundingBox();
  const cellCenter = cellBox.y + (cellBox.height / 2);
  const indicatorCenter = indicatorBox.y + (indicatorBox.height / 2);
  const centerDelta = Math.abs(cellCenter - indicatorCenter);

  if (cellStyles.height === '40px') {
    console.error(`FAIL desktop profile: indicator cell has unnecessary fixed 40px height`);
    failures++;
  } else if (cellStyles.verticalAlign !== 'middle') {
    console.error(`FAIL desktop profile: expected indicator cell vertical-align middle, got ${cellStyles.verticalAlign}`);
    failures++;
  } else if (centerDelta > 1) {
    console.error(`FAIL desktop profile: indicator is not vertically centered in its cell, delta ${centerDelta.toFixed(2)}px`);
    failures++;
  } else {
    console.log('PASS desktop profile: indicator cell is compact and vertically centered');
  }

  await page.close();
}

async function checkInactivePlaceholderCell() {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1024, height: 667 });
  await page.goto(`file://${path.resolve(__dirname, 'distilleries/three-crosses.html')}`, { waitUntil: 'networkidle' });

  const activeRow = page.locator('.bouts-table .bout-row', { hasText: 'R1B1' }).first();
  const inactiveRow = page.locator('.bouts-table .bout-row', { hasText: 'R2B1' }).first();
  const activeCell = activeRow.locator('.bout-indicator-cell');
  const inactiveCell = inactiveRow.locator('.bout-indicator-cell');

  const activeIndicatorCount = await activeCell.locator('.bout-active-indicator').count();
  const inactiveIndicatorCount = await inactiveCell.locator('.bout-active-indicator').count();
  const inactiveSpacerCount = await inactiveCell.locator('.bout-label-spacer').count();
  const activeMargin = await activeCell.locator('.bout-active-indicator').first().evaluate((el) => window.getComputedStyle(el).margin);
  const inactiveMargin = await inactiveCell.locator('.bout-label-spacer').first().evaluate((el) => window.getComputedStyle(el).margin);
  const activeBox = await activeCell.boundingBox();
  const inactiveBox = await inactiveCell.boundingBox();
  const activeCellIndex = await activeCell.evaluate((el) => el.cellIndex);
  const inactiveCellIndex = await inactiveCell.evaluate((el) => el.cellIndex);
  const widthDelta = Math.abs(activeBox.width - inactiveBox.width);

  if (activeIndicatorCount !== 1) {
    console.error('FAIL desktop profile: active bout row should render one active indicator');
    failures++;
  } else if (inactiveIndicatorCount !== 0) {
    console.error('FAIL desktop profile: inactive bout row should not render an active indicator');
    failures++;
  } else if (inactiveSpacerCount !== 1) {
    console.error('FAIL desktop profile: inactive bout row should render one placeholder spacer in the indicator cell');
    failures++;
  } else if (activeCellIndex !== inactiveCellIndex || activeCellIndex !== 0) {
    console.error(`FAIL desktop profile: indicator placeholder cells should be first cells, got ${activeCellIndex} and ${inactiveCellIndex}`);
    failures++;
  } else if (activeMargin !== '3px' || inactiveMargin !== '3px') {
    console.error(`FAIL desktop profile: active indicator and inactive spacer should both use 3px margin, got ${activeMargin} and ${inactiveMargin}`);
    failures++;
  } else if (widthDelta > 1) {
    console.error(`FAIL desktop profile: active and inactive indicator cells should match widths, delta ${widthDelta.toFixed(2)}px`);
    failures++;
  } else {
    console.log('PASS desktop profile: inactive bout row uses a matching empty indicator cell');
  }

  await page.close();
}

async function checkVoteLabelAndLinkCells() {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1024, height: 667 });
  await page.goto(`file://${path.resolve(__dirname, 'distilleries/three-crosses.html')}`, { waitUntil: 'networkidle' });

  const activeRow = page.locator('.bouts-table .bout-row', { hasText: 'R1B1' }).first();
  const inactiveRow = page.locator('.bouts-table .bout-row', { hasText: 'R2B1' }).first();
  const activeVoteCell = activeRow.locator('.bout-vote-label');
  const activeLinksCell = activeRow.locator('.bout-links');
  const inactiveVoteCell = inactiveRow.locator('.bout-vote-label');
  const inactiveLinksCell = inactiveRow.locator('.bout-links');

  const activeVoteText = (await activeVoteCell.textContent())?.trim();
  const activeLinkCount = await activeLinksCell.locator('.voting-link').count();
  const inactiveVotePlaceholderCount = await inactiveVoteCell.locator('.bout-links-placeholder').count();
  const inactiveLinksPlaceholderCount = await inactiveLinksCell.locator('.bout-links-placeholder').count();
  const activeVoteCellIndex = await activeVoteCell.evaluate((el) => el.cellIndex);
  const activeLinksCellIndex = await activeLinksCell.evaluate((el) => el.cellIndex);
  const inactiveVoteCellIndex = await inactiveVoteCell.evaluate((el) => el.cellIndex);
  const inactiveLinksCellIndex = await inactiveLinksCell.evaluate((el) => el.cellIndex);

  if (activeVoteText !== 'Vote') {
    console.error(`FAIL desktop profile: active row vote label cell should contain "Vote", got "${activeVoteText}"`);
    failures++;
  } else if (activeLinkCount === 0) {
    console.error('FAIL desktop profile: active row links cell should contain voting links');
    failures++;
  } else if (inactiveVotePlaceholderCount !== 1 || inactiveLinksPlaceholderCount !== 1) {
    console.error(`FAIL desktop profile: inactive row should have vote and links placeholders, got ${inactiveVotePlaceholderCount} and ${inactiveLinksPlaceholderCount}`);
    failures++;
  } else if (
    activeVoteCellIndex !== inactiveVoteCellIndex ||
    activeLinksCellIndex !== inactiveLinksCellIndex ||
    activeVoteCellIndex !== 3 ||
    activeLinksCellIndex !== 4
  ) {
    console.error(`FAIL desktop profile: vote/link cells should stay in columns 3/4, got active ${activeVoteCellIndex}/${activeLinksCellIndex} inactive ${inactiveVoteCellIndex}/${inactiveLinksCellIndex}`);
    failures++;
  } else {
    console.log('PASS desktop profile: vote label and link buttons render in separate stable cells');
  }

  await page.close();
}

for (const pageInfo of pages) {
  await checkIndicator(pageInfo);
  await checkRowAlignment(pageInfo);
  await checkNumberCell(pageInfo);
}

await checkDesktopIndicatorCell();
await checkInactivePlaceholderCell();
await checkVoteLabelAndLinkCells();

await browser.close();

if (failures > 0) {
  process.exit(1);
}
