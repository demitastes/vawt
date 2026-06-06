#!/usr/bin/env node

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const DISTILLERIES = [
  'bradys.html',
  'open-road.html',
  'deep-creek.html'
];

const DISTILLERY_DIR = path.join(__dirname, 'distilleries');

let passCount = 0;
let failCount = 0;

function log(message) {
  console.log(message);
}

function pass(testName) {
  passCount++;
  log(`  ✅ ${testName}`);
}

function fail(testName, reason) {
  failCount++;
  log(`  ❌ ${testName}: ${reason}`);
}

async function testFile(filePath) {
  const fileName = path.basename(filePath);
  log(`\n📄 Testing ${fileName}`);

  if (!fs.existsSync(filePath)) {
    fail(fileName, 'File not found');
    return;
  }

  const browser = await chromium.launch();

  try {
    // Test mobile (375px)
    log('  [Mobile: 375px]');
    const mobilePage = await browser.newPage({ viewport: { width: 375, height: 800 } });
    await mobilePage.goto(`file://${filePath}`);

    const mobileBadges = await mobilePage.locator('.spirit-badge').count();
    if (mobileBadges === 13) {
      pass('Spirit badges count (mobile)');
    } else {
      fail('Spirit badges count (mobile)', `Expected 13, got ${mobileBadges}`);
    }

    const mobileGridDisplay = await mobilePage.locator('.grid').evaluate(el => window.getComputedStyle(el).display);
    const mobileGridFlexDir = await mobilePage.locator('.grid').evaluate(el => window.getComputedStyle(el).flexDirection);
    if (mobileGridDisplay === 'flex' && mobileGridFlexDir === 'column-reverse') {
      pass('Mobile grid reordering (flex-direction: column-reverse)');
    } else {
      fail('Mobile grid reordering', `Expected flex + column-reverse, got ${mobileGridDisplay} + ${mobileGridFlexDir}`);
    }

    const boutsTdDisplay = await mobilePage.locator('.bouts-table td').first().evaluate(el => window.getComputedStyle(el).display);
    if (boutsTdDisplay === 'block') {
      pass('Mobile table stacking (TD display: block)');
    } else {
      fail('Mobile table stacking', `Expected block, got ${boutsTdDisplay}`);
    }

    // Check spirit types container
    const spiritTypesDisplay = await mobilePage.locator('.spirit-types').evaluate(el => window.getComputedStyle(el).display);
    if (spiritTypesDisplay === 'flex') {
      pass('Spirit types inline display (flex)');
    } else {
      fail('Spirit types display', `Expected flex, got ${spiritTypesDisplay}`);
    }

    // Check spirit type badges include labels
    const firstBadgeText = await mobilePage.locator('.spirit-types .spirit-badge').first().textContent();
    if (firstBadgeText && firstBadgeText.includes(':')) {
      pass('Spirit type badges include labels');
    } else {
      fail('Spirit type labels in badges', `Expected "Label: yes/no", got "${firstBadgeText}"`);
    }

    await mobilePage.close();

    // Test desktop (1024px)
    log('  [Desktop: 1024px]');
    const desktopPage = await browser.newPage({ viewport: { width: 1024, height: 800 } });
    await desktopPage.goto(`file://${filePath}`);

    const desktopGridDisplay = await desktopPage.locator('.grid').evaluate(el => window.getComputedStyle(el).display);
    const desktopGridCols = await desktopPage.locator('.grid').evaluate(el => window.getComputedStyle(el).gridTemplateColumns);
    // At desktop, grid should be 2 columns with second column ~320px
    const colParts = desktopGridCols.split(' ');
    if (desktopGridDisplay === 'grid' && colParts.length === 2 && colParts[1] === '320px') {
      pass('Desktop grid layout (2-column preserved)');
    } else {
      fail('Desktop grid layout', `Expected grid with 2 cols, got ${desktopGridDisplay} with cols: ${desktopGridCols}`);
    }

    // Check spirit types on desktop
    const desktopSpiritTypesDisplay = await desktopPage.locator('.spirit-types').evaluate(el => window.getComputedStyle(el).display);
    if (desktopSpiritTypesDisplay === 'flex') {
      pass('Spirit types display with flex on desktop');
    } else {
      fail('Spirit types on desktop', `Expected flex, got ${desktopSpiritTypesDisplay}`);
    }

    const desktopBadgeText = await desktopPage.locator('.spirit-types .spirit-badge').first().textContent();
    if (desktopBadgeText && desktopBadgeText.includes(':')) {
      pass('Spirit type badges visible on desktop with labels');
    } else {
      fail('Spirit type labels on desktop', `Expected "Label: yes/no", got "${desktopBadgeText}"`);
    }

    const desktopBadges = await desktopPage.locator('.spirit-badge').count();
    if (desktopBadges === 13) {
      pass('Spirit badges present on desktop');
    } else {
      fail('Spirit badges on desktop', `Expected 13, got ${desktopBadges}`);
    }

    await desktopPage.close();
  } finally {
    await browser.close();
  }
}

async function runTests() {
  log('🧪 Testing distillery profile mobile responsiveness...\n');

  for (const distillery of DISTILLERIES) {
    const filePath = path.join(DISTILLERY_DIR, distillery);
    await testFile(filePath);
  }

  log('\n' + '='.repeat(60));
  log(`\n📊 Results: ${passCount} passed, ${failCount} failed\n`);

  if (failCount > 0) {
    log('❌ Some tests failed.\n');
    process.exit(1);
  } else {
    log('✅ All mobile layout tests passed!\n');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
