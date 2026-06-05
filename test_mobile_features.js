#!/usr/bin/env node
/**
 * Test: Mobile-Specific Features
 *
 * Verifies mobile-specific layout requirements:
 * - Headings are centered
 * - Active bout indicators are visible and properly positioned
 * - Two-column grid layout is correct
 *
 * Run: node test_mobile_features.js
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  let passed = 0;
  let failed = 0;

  try {
    console.log('🧪 Testing Mobile Features...\n');

    const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
    await page.goto(`file://${process.cwd()}/index.html`);

    // Test 1: Headings Centered
    console.log('Test 1: Centered headings');
    const headingAlignment = await page.locator('.round-column').first().evaluate(el => {
      return window.getComputedStyle(el).textAlign;
    });

    if (headingAlignment === 'center') {
      console.log('  ✓ Round column text is centered');
      passed++;
    } else {
      console.log(`  ✗ Round column text-align is '${headingAlignment}' (expected 'center')`);
      failed++;
    }

    // Test 2: Bout Labels Centered
    console.log('\nTest 2: Bout labels centered');
    const boutLabelAlignment = await page.locator('.bout-label').first().evaluate(el => {
      return window.getComputedStyle(el).textAlign;
    });

    if (boutLabelAlignment === 'center') {
      console.log('  ✓ Bout labels are centered');
      passed++;
    } else {
      console.log(`  ✗ Bout label text-align is '${boutLabelAlignment}' (expected 'center')`);
      failed++;
    }

    // Test 3: Two-Column Grid Layout
    console.log('\nTest 3: Two-column grid layout');
    const columnLayout = await page.locator('.round-column').first().evaluate(el => {
      return window.getComputedStyle(el).display;
    });

    if (columnLayout === 'grid') {
      console.log('  ✓ Round columns use grid layout');
      passed++;
    } else {
      console.log(`  ✗ Round column display is '${columnLayout}' (expected 'grid')`);
      failed++;
    }

    // Test 4: Active Bout Indicator Visible
    console.log('\nTest 4: Active bout indicators');
    const hasActiveIndicator = await page.locator('.bout.is-active .bout-active-indicator').isVisible();

    if (hasActiveIndicator) {
      console.log('  ✓ Active bout indicator is visible');
      passed++;
    } else {
      console.log('  ✗ Active bout indicator should be visible');
      failed++;
    }

    // Test 5: Indicator Positioning in Date Row
    console.log('\nTest 5: Indicator positioning');
    const indicatorLayout = await page.locator('.bout.is-active .bout-date-container').first().evaluate(el => {
      const computed = window.getComputedStyle(el);
      const hasIndicator = el.querySelector('.bout-active-indicator') !== null;
      const hasDate = el.querySelector('.bout-date') !== null;
      return {
        display: computed.display,
        justifyContent: computed.justifyContent,
        flexDirection: computed.flexDirection,
        hasIndicator,
        hasDate
      };
    });

    if (indicatorLayout.display === 'flex' && indicatorLayout.justifyContent === 'center') {
      console.log('  ✓ Date container is centered flex layout');
      passed++;
    } else {
      console.log('  ✗ Date container should be centered flex');
      failed++;
    }

    if (indicatorLayout.hasIndicator && indicatorLayout.hasDate) {
      console.log('  ✓ Both indicator and date are present in date row');
      passed++;
    } else {
      console.log('  ✗ Date row missing indicator or date element');
      failed++;
    }

    // Test 6: No Position Absolute in Mobile
    console.log('\nTest 6: Bout positioning');
    const boutPosition = await page.locator('.bout').first().evaluate(el => {
      return window.getComputedStyle(el).position;
    });

    if (boutPosition === 'static') {
      console.log('  ✓ Bouts use static positioning on mobile');
      passed++;
    } else {
      console.log(`  ✗ Bout position is '${boutPosition}' (expected 'static')`);
      failed++;
    }

    // Test 7: Connectors Hidden
    console.log('\nTest 7: Connectors hidden on mobile');
    const connectorsDisplay = await page.locator('.connectors').evaluate(el => {
      return window.getComputedStyle(el).display;
    });

    if (connectorsDisplay === 'none') {
      console.log('  ✓ Connectors are hidden on mobile');
      passed++;
    } else {
      console.log(`  ✗ Connectors display is '${connectorsDisplay}' (expected 'none')`);
      failed++;
    }

    // Test 8: Final Bout is Centered
    console.log('\nTest 8: Final bout centering');
    const finalBoutAlignment = await page.locator('.bout[data-round="5"]').evaluate(el => {
      return window.getComputedStyle(el).textAlign;
    });

    if (finalBoutAlignment === 'center') {
      console.log('  ✓ Final bout is centered');
      passed++;
    } else {
      console.log(`  ✗ Final bout text-align is '${finalBoutAlignment}' (expected 'center')`);
      failed++;
    }

    await page.close();

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
