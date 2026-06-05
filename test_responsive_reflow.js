#!/usr/bin/env node
/**
 * Test: Responsive Reflow on Viewport Resize
 *
 * Verifies that the bracket layout reflows correctly when resizing from
 * desktop to mobile and vice versa, without element overlaps or visual artifacts.
 *
 * Run: node test_responsive_reflow.js
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  let passed = 0;
  let failed = 0;

  try {
    console.log('🧪 Testing Responsive Reflow...\n');

    // Test 1: Desktop to Mobile Reflow
    console.log('Test 1: Desktop → Mobile reflow');
    const page1 = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    await page1.goto(`file://${process.cwd()}/index.html`);

    // Verify desktop layout
    const desktopBracketDisplay = await page1.locator('.bracket').evaluate(
      el => window.getComputedStyle(el).display
    );
    if (desktopBracketDisplay !== 'grid') {
      console.log('  ✗ Desktop: bracket should use grid layout');
      failed++;
    } else {
      console.log('  ✓ Desktop: grid layout active');
      passed++;
    }

    // Resize to mobile
    await page1.setViewportSize({ width: 375, height: 667 });
    await page1.waitForTimeout(200);

    // Verify mobile layout
    const mobileBracketDisplay = await page1.locator('.bracket').evaluate(
      el => window.getComputedStyle(el).display
    );
    if (mobileBracketDisplay !== 'flex') {
      console.log('  ✗ Mobile: bracket should use flex layout');
      failed++;
    } else {
      console.log('  ✓ Mobile: flex layout active');
      passed++;
    }

    // Check for overlapping bout elements
    const mobileOverlaps = await page1.evaluate(() => {
      const bouts = Array.from(document.querySelectorAll('.bout'));
      let overlapCount = 0;

      for (let i = 0; i < bouts.length; i++) {
        const rect1 = bouts[i].getBoundingClientRect();
        // Skip checking against items too far away to avoid false positives
        for (let j = i + 1; j < Math.min(i + 10, bouts.length); j++) {
          const rect2 = bouts[j].getBoundingClientRect();

          // Check for significant vertical overlap (more than 30px means actual overlap)
          if (rect1.left < rect2.right - 30 &&
              rect1.right > rect2.left + 30 &&
              rect1.top < rect2.bottom - 10 &&
              rect1.bottom > rect2.top + 10) {
            overlapCount++;
          }
        }
      }
      return overlapCount;
    });

    if (mobileOverlaps > 0) {
      console.log(`  ✗ Mobile: ${mobileOverlaps} element overlaps detected`);
      failed++;
    } else {
      console.log('  ✓ Mobile: no element overlaps');
      passed++;
    }

    // Verify no inline top styles on mobile
    const hasInlineTop = await page1.evaluate(() => {
      return Array.from(document.querySelectorAll('.bout'))
        .some(el => el.style.top);
    });

    if (hasInlineTop) {
      console.log('  ✗ Mobile: bout elements still have inline top styles');
      failed++;
    } else {
      console.log('  ✓ Mobile: no inline positioning styles');
      passed++;
    }

    await page1.close();

    // Test 2: Mobile to Desktop Reflow
    console.log('\nTest 2: Mobile → Desktop reflow');
    const page2 = await browser.newPage({ viewport: { width: 375, height: 667 } });
    await page2.goto(`file://${process.cwd()}/index.html`);

    const mobileStart = await page2.locator('.bracket').evaluate(
      el => window.getComputedStyle(el).display
    );
    if (mobileStart === 'flex') {
      console.log('  ✓ Mobile: flex layout at start');
      passed++;
    } else {
      console.log('  ✗ Mobile: expected flex layout at start');
      failed++;
    }

    // Resize to desktop
    await page2.setViewportSize({ width: 1024, height: 768 });
    await page2.waitForTimeout(200);

    const desktopAfter = await page2.locator('.bracket').evaluate(
      el => window.getComputedStyle(el).display
    );
    if (desktopAfter === 'grid') {
      console.log('  ✓ Desktop: grid layout active after resize');
      passed++;
    } else {
      console.log('  ✗ Desktop: expected grid layout after resize');
      failed++;
    }

    // Verify connectors appear on desktop
    const connectorsVisible = await page2.locator('.connectors path').count() > 0;
    if (connectorsVisible) {
      console.log('  ✓ Desktop: connectors rendered');
      passed++;
    } else {
      console.log('  ✗ Desktop: connectors should be visible');
      failed++;
    }

    await page2.close();

    // Test 3: Reflow Settlement Speed
    console.log('\nTest 3: Reflow settlement speed');
    const page3 = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    await page3.goto(`file://${process.cwd()}/index.html`);

    const startTime = Date.now();
    await page3.setViewportSize({ width: 375, height: 667 });

    // Check layout at different wait intervals
    let settledAt = null;
    for (let ms of [50, 100, 150, 200]) {
      await page3.waitForTimeout(ms - (settledAt ? ms : 0));

      const boutCount = await page3.locator('.bout').count();
      const hasOverlaps = await page3.evaluate(() => {
        const bouts = Array.from(document.querySelectorAll('.bout'));
        for (let i = 0; i < bouts.length; i++) {
          const rect1 = bouts[i].getBoundingClientRect();
          for (let j = i + 1; j < Math.min(i + 5, bouts.length); j++) {
            const rect2 = bouts[j].getBoundingClientRect();
            if (rect1.left < rect2.right - 30 &&
                rect1.right > rect2.left + 30 &&
                rect1.top < rect2.bottom - 10 &&
                rect1.bottom > rect2.top + 10) {
              return true;
            }
          }
        }
        return false;
      });

      if (!hasOverlaps && !settledAt) {
        settledAt = ms;
      }
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    if (settledAt && settledAt < 1000) {
      console.log(`  ✓ Layout settled in ${settledAt}ms (within 1s threshold)`);
      passed++;
    } else {
      console.log(`  ✗ Layout settlement took ${settledAt}ms (target: <1000ms)`);
      failed++;
    }

    await page3.close();

  } catch (error) {
    console.error('❌ Test error:', error.message);
    failed++;
  }

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  process.exit(failed > 0 ? 1 : 0);
})();
