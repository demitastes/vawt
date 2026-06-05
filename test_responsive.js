#!/usr/bin/env node

/**
 * Responsive Layout Test Suite
 *
 * Tests the bracket's responsive behavior at different viewport sizes.
 * Run with: node test_responsive.js
 *
 * This replaces manual ad-hoc testing and ensures consistent verification.
 */

const fs = require('fs');
const path = require('path');

const HTML_FILE = path.join(__dirname, 'index.html');

// Simple JSDOM-like test runner for checking computed styles
function testResponsiveLayout() {
  console.log('=== Responsive Layout Test Suite ===\n');

  // Read the HTML file
  const html = fs.readFileSync(HTML_FILE, 'utf8');
  let failures = 0;

  function check(condition, passMessage, failMessage) {
    if (condition) {
      console.log(`✅ ${passMessage}`);
    } else {
      failures += 1;
      console.log(`❌ ${failMessage}`);
    }
  }

  // Test 1: Check CSS media query exists
  console.log('Test 1: CSS Media Query');
  const hasMediaQuery = html.includes('@media (max-width: 719px)');
  check(hasMediaQuery, 'Media query found', 'Media query missing');

  // Test 2: Check mobile-specific CSS rules
  console.log('\nTest 2: Mobile CSS Rules');
  const mobileRules = [
    { rule: '.bracket', property: 'display: flex', hasRule: html.includes('display: flex') },
    { rule: '.bracket', property: 'flex-direction: column', hasRule: html.includes('flex-direction: column') },
    { rule: '.bout', property: 'position: static !important', hasRule: html.includes('position: static !important') },
    { rule: '.bout', property: 'top: auto !important', hasRule: html.includes('top: auto !important') },
    { rule: '.connectors', property: 'display: none', hasRule: html.includes('display: none') },
    { rule: '.round-column', property: 'display: grid', hasRule: html.includes('display: grid') },
    { rule: '.round-column', property: 'grid-template-columns: 1fr 1fr', hasRule: html.includes('grid-template-columns: 1fr 1fr') }
  ];

  mobileRules.forEach(({ rule, property, hasRule }) => {
    check(hasRule, `${rule} { ${property} }`, `${rule} { ${property} } missing`);
  });

  // Test 3: Check JavaScript mobile detection
  console.log('\nTest 3: JavaScript Mobile Detection');
  const hasMobileFunc = html.includes('function isMobile()');
  const checksMobileInRender = html.includes('if (isMobile())') || html.includes('const mobileLayout = isMobile()');
  check(hasMobileFunc, 'isMobile() function exists', 'isMobile() function missing');
  check(checksMobileInRender, 'render() checks isMobile()', 'render() does not check isMobile()');

  // Test 4: Check for conflicting absolute positioning
  console.log('\nTest 4: Positioning Overrides');
  const hasTopOverride = html.includes('top: auto !important');
  const hasTransformOverride = html.includes('transform: none !important');
  const hasLayoutReset = html.includes('function resetDesktopLayoutStyles()');
  check(hasTopOverride, 'top property reset on mobile', 'top property not reset');
  check(hasTransformOverride, 'transform property reset on mobile', 'transform not reset');
  check(hasLayoutReset, 'desktop inline layout reset exists', 'desktop inline layout reset missing');

  // Test 5: Check viewport meta tag
  console.log('\nTest 5: Viewport Configuration');
  const hasViewportMeta = html.includes('viewport');
  check(hasViewportMeta, 'Viewport meta tag present', 'Viewport meta tag missing');

  if (failures > 0) {
    console.log(`\n=== Static Checks Failed: ${failures} issue(s) ===`);
    process.exitCode = 1;
    return;
  }

  console.log('\n=== All Static Checks Passed ===');
  console.log('\nNext steps - Manual verification required:');
  console.log('1. Open index.html in a browser');
  console.log('2. Test Desktop (1024px):');
  console.log('   - Horizontal grid layout visible');
  console.log('   - SVG connectors visible');
  console.log('3. Test Mobile (375px):');
  console.log('   - Vertical stacking of bouts');
  console.log('   - No SVG connectors');
  console.log('   - No overlapping elements');
  console.log('4. Test Interactivity at both sizes:');
  console.log('   - Click competitor button → should highlight');
  console.log('   - Winner selection should cascade downstream');
  console.log('5. Test Responsive Transition:');
  console.log('   - Resize browser window past 720px breakpoint');
  console.log('   - Layout should cleanly switch between modes');
}

testResponsiveLayout();
