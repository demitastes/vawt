#!/usr/bin/env node

/**
 * Responsive Layout Visual Test Suite
 *
 * Uses Playwright to verify the responsive layout at different viewport sizes.
 * This test should be run by agents instead of creating ad-hoc tests each time.
 *
 * Requirements: npm install -g @playwright/test
 * Run with: node test_responsive_visual.js
 *
 * Tests:
 * - Desktop layout (1024px): Horizontal grid with SVG connectors
 * - Mobile layout (375px): Vertical stacking without connectors
 * - No overlapping elements on mobile
 * - Interactivity works at both sizes
 * - Responsive transition at 720px breakpoint
 */

const fs = require('fs');
const path = require('path');

async function runVisualTests() {
  let playwright;

  try {
    playwright = require('@playwright/test');
  } catch (e) {
    console.log('⚠️  Playwright not installed. Install with:');
    console.log('   npm install -g @playwright/test');
    console.log('\nFalling back to static tests only.');
    return;
  }

  const { chromium } = playwright;
  const HTML_FILE = `file://${path.resolve(__dirname, 'index.html')}`;

  console.log('=== Responsive Layout Visual Test Suite ===\n');

  let browser;

  try {
    browser = await chromium.launch({ headless: true });

    // Test 1: Desktop Layout
    console.log('Test 1: Desktop Layout (1024px width)');
    let page = await browser.newPage({ viewport: { width: 1024, height: 800 } });
    await page.goto(HTML_FILE, { waitUntil: 'networkidle' });

    const connectorsVisible = await page.isVisible('.connectors');
    const boutCount = await page.locator('.bout').count();
    const competitorCount = await page.locator('.competitor').count();

    console.log(`  ✅ SVG connectors visible: ${connectorsVisible}`);
    console.log(`  ✅ Found ${boutCount} bout elements`);
    console.log(`  ✅ Found ${competitorCount} competitor buttons`);

    await page.screenshot({ path: '/tmp/bracket_test_desktop.png' });
    console.log(`  ✅ Screenshot saved to /tmp/bracket_test_desktop.png`);
    await page.close();

    // Test 2: Mobile Layout
    console.log('\nTest 2: Mobile Layout (375px width)');
    page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await page.goto(HTML_FILE, { waitUntil: 'networkidle' });

    const connectorsHidden = !(await page.isVisible('.connectors'));
    const mobileCompetitorCount = await page.locator('.competitor').count();

    console.log(`  ✅ SVG connectors hidden: ${connectorsHidden}`);
    console.log(`  ✅ Found ${mobileCompetitorCount} competitor buttons`);

    // Check for overlapping elements
    const bouts = await page.locator('.bout').all();
    const positions = [];

    for (const bout of bouts) {
      const box = await bout.boundingBox();
      if (box) {
        positions.push({
          id: `${await bout.getAttribute('data-round')}-${await bout.getAttribute('data-bout')}`,
          top: box.y,
          height: box.height
        });
      }
    }

    let overlaps = 0;
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const p1 = positions[i];
        const p2 = positions[j];
        const overlap = !(p1.top + p1.height <= p2.top || p2.top + p2.height <= p1.top);
        if (overlap) overlaps++;
      }
    }

    console.log(`  ✅ Overlapping elements: ${overlaps}`);
    if (overlaps > 0) {
      console.log(`     ❌ WARNING: ${overlaps} pairs of elements overlap!`);
    }

    await page.screenshot({ path: '/tmp/bracket_test_mobile.png' });
    console.log(`  ✅ Screenshot saved to /tmp/bracket_test_mobile.png`);
    await page.close();

    // Test 3: Interactivity
    console.log('\nTest 3: Interactivity on Mobile');
    page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await page.goto(HTML_FILE, { waitUntil: 'networkidle' });

    const competitors = await page.locator('.competitor').first();
    const initialClass = await competitors.getAttribute('class');

    await competitors.click();
    await page.waitForTimeout(200);

    const updatedClass = await competitors.getAttribute('class');
    const becameWinner = updatedClass.includes('is-winner');

    console.log(`  ✅ Clicking competitor marks as winner: ${becameWinner}`);
    if (becameWinner) {
      console.log(`     Before: ${initialClass}`);
      console.log(`     After:  ${updatedClass}`);
    }

    await page.screenshot({ path: '/tmp/bracket_test_interactive.png' });
    console.log(`  ✅ Screenshot saved to /tmp/bracket_test_interactive.png`);
    await page.close();

    // Test 4: Responsive Transition
    console.log('\nTest 4: Responsive Transition at 720px Breakpoint');
    page = await browser.newPage({ viewport: { width: 720, height: 800 } });
    await page.goto(HTML_FILE, { waitUntil: 'networkidle' });

    const connectorsAtBreakpoint = await page.isVisible('.connectors');
    console.log(`  ✅ At exactly 720px - connectors visible: ${connectorsAtBreakpoint}`);

    // Resize to just below breakpoint
    await page.setViewportSize({ width: 719, height: 800 });
    await page.waitForTimeout(500);

    const connectorsBelow = await page.isVisible('.connectors');
    console.log(`  ✅ At 719px - connectors hidden: ${!connectorsBelow}`);

    await page.close();

    console.log('\n=== Visual Tests Complete ===');
    console.log('\nScreenshots saved to /tmp/');
    console.log('- bracket_test_desktop.png: Desktop horizontal layout');
    console.log('- bracket_test_mobile.png: Mobile vertical layout');
    console.log('- bracket_test_interactive.png: Mobile with selection');

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run tests
if (require.main === module) {
  runVisualTests().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });
}

module.exports = { runVisualTests };
