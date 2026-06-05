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

    async function countOverlaps(page, selector) {
      const elements = await page.locator(selector).all();
      const boxes = [];

      for (const element of elements) {
        const box = await element.boundingBox();
        if (box) {
          boxes.push({
            id: `${await element.getAttribute('data-round')}-${await element.getAttribute('data-bout')}`,
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height
          });
        }
      }

      const overlaps = [];
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const p1 = boxes[i];
          const p2 = boxes[j];
          const xOverlap = p1.x < p2.x + p2.width && p2.x < p1.x + p1.width;
          const yOverlap = p1.y < p2.y + p2.height && p2.y < p1.y + p1.height;

          if (xOverlap && yOverlap) {
            overlaps.push(`${p1.id} overlaps ${p2.id}`);
          }
        }
      }

      return overlaps;
    }

    async function clickVisibleCompetitorWithoutScrollJump(page) {
      await page.evaluate(() => window.scrollTo(0, 650));
      await page.waitForTimeout(100);

      const targetIndex = await page.locator('.competitor:not(:disabled)').evaluateAll((buttons) => {
        return buttons.findIndex((button) => {
          const rect = button.getBoundingClientRect();
          return rect.top >= 100 && rect.bottom <= window.innerHeight - 40;
        });
      });

      if (targetIndex < 0) {
        throw new Error('Could not find a visible enabled competitor for scroll stability test');
      }

      const beforeScrollY = await page.evaluate(() => window.scrollY);
      await page.locator('.competitor:not(:disabled)').nth(targetIndex).click();
      await page.waitForTimeout(300);
      const afterScrollY = await page.evaluate(() => window.scrollY);

      return { beforeScrollY, afterScrollY, delta: Math.abs(afterScrollY - beforeScrollY) };
    }

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

    const mobileOverlaps = await countOverlaps(page, '.bout');
    console.log(`  ✅ Overlapping elements: ${mobileOverlaps.length}`);
    if (mobileOverlaps.length > 0) {
      throw new Error(`Mobile layout has overlapping bouts:\n${mobileOverlaps.join('\n')}`);
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

    // Test 4: Scroll Stability
    console.log('\nTest 4: Winner Click Scroll Stability');
    page = await browser.newPage({ viewport: { width: 1024, height: 500 } });
    await page.goto(HTML_FILE, { waitUntil: 'networkidle' });

    const desktopScroll = await clickVisibleCompetitorWithoutScrollJump(page);
    console.log(`  ✅ Desktop scroll delta after winner click: ${desktopScroll.delta}px`);
    if (desktopScroll.delta > 2) {
      throw new Error(`Desktop winner click changed scroll from ${desktopScroll.beforeScrollY} to ${desktopScroll.afterScrollY}`);
    }

    await page.close();

    page = await browser.newPage({ viewport: { width: 375, height: 500 } });
    await page.goto(HTML_FILE, { waitUntil: 'networkidle' });

    const mobileScroll = await clickVisibleCompetitorWithoutScrollJump(page);
    console.log(`  ✅ Mobile scroll delta after winner click: ${mobileScroll.delta}px`);
    if (mobileScroll.delta > 2) {
      throw new Error(`Mobile winner click changed scroll from ${mobileScroll.beforeScrollY} to ${mobileScroll.afterScrollY}`);
    }

    await page.close();

    // Test 5: Responsive Transition
    console.log('\nTest 5: Responsive Transition at 720px Breakpoint');
    page = await browser.newPage({ viewport: { width: 720, height: 800 } });
    await page.goto(HTML_FILE, { waitUntil: 'networkidle' });

    const connectorsAtBreakpoint = await page.isVisible('.connectors');
    console.log(`  ✅ At exactly 720px - connectors visible: ${connectorsAtBreakpoint}`);

    // Resize to just below breakpoint
    await page.setViewportSize({ width: 719, height: 800 });
    await page.waitForTimeout(500);

    const connectorsBelow = await page.isVisible('.connectors');
    console.log(`  ✅ At 719px - connectors hidden: ${!connectorsBelow}`);

    const transitionOverlaps = await countOverlaps(page, '.bout');
    const bracketInlineHeight = await page.locator('#bracket').evaluate((el) => el.style.height);
    const connectorInlineDisplay = await page.locator('.connectors').evaluate((el) => el.style.display);
    console.log(`  ✅ Post-resize overlapping elements: ${transitionOverlaps.length}`);
    console.log(`  ✅ Post-resize bracket inline height cleared: ${bracketInlineHeight === ''}`);
    console.log(`  ✅ Post-resize connector inline display cleared: ${connectorInlineDisplay === ''}`);

    if (transitionOverlaps.length > 0) {
      throw new Error(`Desktop-to-mobile resize has overlapping bouts:\n${transitionOverlaps.join('\n')}`);
    }
    if (bracketInlineHeight !== '') {
      throw new Error(`Desktop-to-mobile resize left inline bracket height: ${bracketInlineHeight}`);
    }
    if (connectorInlineDisplay !== '') {
      throw new Error(`Desktop-to-mobile resize left inline connector display: ${connectorInlineDisplay}`);
    }

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
