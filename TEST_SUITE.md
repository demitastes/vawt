# VAWT Bracket Regression Test Suite

This directory contains automated tests for the VAWT bracket responsive layout and functionality.

## Quick Start

```bash
# Run all tests
node test_regression_suite.js

# Run individual test files
node test_responsive.js
node test_mobile_features.js
node test_responsive_reflow.js
node test_responsive_visual.js
```

## Test Files

### 1. `test_responsive.js` - Static Responsive Checks
**Purpose:** Verify CSS media queries and static responsive layout rules are in place.

**What it checks:**
- CSS media queries exist for mobile (max-width: 719px)
- Mobile classes have correct display properties (flex, grid, static)
- CSS rules for centered text and hidden elements

**Run:** `node test_responsive.js`

**When to run:** After modifying CSS, media queries, or responsive breakpoints.

---

### 2. `test_mobile_features.js` - Mobile Layout Features
**Purpose:** Verify mobile-specific layout features work correctly.

**What it checks:**
- Headings are centered in mobile view
- Bout labels are centered
- Two-column grid layout is active
- Active bout indicators are visible and properly positioned
- Bouts use static positioning (not absolute)
- Connectors are hidden on mobile
- Final bout is centered

**Run:** `node test_mobile_features.js`

**When to run:** After changes to mobile layouts, headings, or active indicators.

---

### 3. `test_responsive_reflow.js` - Responsive Reflow on Resize
**Purpose:** Verify layout reflows correctly when resizing between desktop and mobile viewports without overlaps.

**What it checks:**
- Desktop → Mobile reflow:
  - Grid layout switches to flex
  - No element overlaps after resize
  - Inline positioning styles are cleared
  - Layout settles within 1 second
- Mobile → Desktop reflow:
  - Flex layout switches back to grid
  - Connectors appear on desktop
- Reflow settlement speed (target: <1000ms)

**Run:** `node test_responsive_reflow.js`

**When to run:** After changes to the resize event handler, render() function, or media queries. **CRITICAL before merging.**

---

### 4. `test_responsive_visual.js` - Visual Rendering
**Purpose:** Verify actual visual rendering at different viewports using browser automation.

**What it checks:**
- Desktop layout (1024px):
  - Horizontal grid with SVG connectors visible
  - Proper competitor name formatting
  - Correct spacing and alignment
- Mobile layout (375px):
  - Two-column grid layout
  - No overlapping elements
  - Proper spacing and alignment
- Interactivity:
  - Clicking competitors works at both sizes
  - Cascading winners works correctly
- Responsive transition:
  - Layout switches cleanly at 720px breakpoint
  - Connectors disappear/appear correctly

**Run:** `node test_responsive_visual.js`

**When to run:** Before final merge, after visual changes, or to capture actual screenshots.

---

### 5. `test_regression_suite.js` - Complete Suite
**Purpose:** Run all tests together as a unified regression suite.

**Run:** `node test_regression_suite.js`

**When to run:** Before deploying, as part of CI/CD pipeline, or for comprehensive validation.

---

## Usage in CI/CD

Add to your CI pipeline:

```bash
# In .github/workflows/test.yml or similar
- name: Run responsive tests
  run: node test_regression_suite.js
```

Or with npm:

```json
{
  "scripts": {
    "test": "node test_regression_suite.js"
  }
}
```

Then run: `npm test`

---

## Debugging Test Failures

### If `test_responsive_reflow.js` fails:
1. Open `index.html` in a browser
2. Open DevTools → Responsive Design Mode
3. Resize from 1024px to 375px slowly
4. Watch for visual overlaps or layout shifts
5. Check Console for JavaScript errors
6. Check that media queries are applying (see computed styles)

### If `test_responsive_visual.js` fails:
1. Check the generated screenshots in `/tmp/`:
   - `/tmp/*-desktop.png`
   - `/tmp/*-mobile.png`
2. Look for overlapping text or misaligned elements
3. Verify CSS is correctly formatted
4. Check that flexbox/grid properties are inherited

### If `test_mobile_features.js` fails:
1. Open DevTools on mobile viewport (375px)
2. Inspect the `.round-column` element → check computed styles
3. Verify `text-align: center` is applied
4. Check that `.bout` elements don't have inline styles

---

## Performance Notes

- **Expected test runtime:** 30-60 seconds (mostly Playwright page loads)
- **Reflow settlement time:** Should be <200ms (verified by test_responsive_reflow.js)
- **Tests use Playwright** for browser automation and screenshot capture

---

## Key Assertions

| Test | Assertion | Purpose |
|------|-----------|---------|
| Reflow | No overlaps after resize | Ensure clean layout switch |
| Reflow | Settles in <1000ms | UX requirement for responsive feel |
| Mobile | Headings centered | Visual consistency |
| Mobile | Two-column grid | Proper mobile layout |
| Reflow | Bracket display changes grid→flex | Media query takes effect |
| Visual | Text readable at both sizes | Accessibility |

---

## Adding New Tests

To add a new test:

1. Create a new file: `test_feature_name.js`
2. Use Playwright for browser automation
3. Print results with ✓/✗ indicators
4. Exit with code 0 (success) or 1 (failure)
5. Add to `test_regression_suite.js` test array

Example:

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  let passed = 0, failed = 0;

  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
    await page.goto(`file://${process.cwd()}/index.html`);

    // Your test here
    const result = await page.locator('.selector').count();
    if (result > 0) {
      console.log('✓ Test passed');
      passed++;
    } else {
      console.log('✗ Test failed');
      failed++;
    }

    await page.close();
  } catch (error) {
    console.error('Error:', error);
    failed++;
  }

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
```
