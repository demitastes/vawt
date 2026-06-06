import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { promises as fsPromises } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TESTS = {
  bracket: {
    url: 'http://localhost:PORT/index.html',
    file: 'index.html',
    stylesheet: 'styles.css',
    name: 'Tournament Bracket Page',
    checks: [
      {
        selector: 'header',
        property: 'textAlign',
        expected: 'center',
        description: 'Header text alignment'
      },
      {
        selector: 'header',
        property: 'padding',
        expected: '28px 32px 10px',
        description: 'Header padding'
      },
      {
        selector: 'h1',
        property: 'fontSize',
        expected: '30px',
        description: 'h1 font size on bracket page'
      },
      {
        selector: 'h1',
        property: 'margin',
        expected: '0px',
        description: 'h1 margin'
      },
      {
        selector: '.site-nav a',
        property: 'borderRadius',
        expected: '6px',
        description: 'Site nav links border radius'
      },
      {
        selector: '.matchup',
        property: 'borderRadius',
        expected: '8px',
        description: 'Matchup box border radius'
      },
      {
        selector: '.competitor',
        property: 'minHeight',
        expected: '31px',
        description: 'Competitor button min height'
      }
    ]
  },
  distillery: {
    url: 'http://localhost:PORT/distilleries/bradys.html',
    file: 'distilleries/bradys.html',
    stylesheet: 'distillery-styles.css',
    name: 'Distillery Profile Page',
    checks: [
      {
        selector: '.page .hero',
        property: 'backgroundColor',
        expected: 'rgb(255, 253, 249)', // --panel
        description: '.page .hero background'
      },
      {
        selector: '.page .hero',
        property: 'padding',
        expected: '30px',
        description: '.page .hero padding (distillery)'
      },
      {
        selector: '.page .hero h1',
        property: 'fontSize',
        // clamp values vary by viewport, so we'll check it's between expected range
        expectedRange: ['32px', '54px'],
        description: 'Distillery h1 font size (should be clamp between 32px-54px)'
      },
      {
        selector: '.page .hero h1',
        property: 'lineHeight',
        expectedRange: ['45px', '60px'],
        description: 'Distillery h1 line height (unitless 1 computed as pixels)'
      },
      {
        selector: '.page h2',
        property: 'fontSize',
        expected: '18px',
        description: 'Page section h2 font size'
      },
      {
        selector: '.page section',
        property: 'backgroundColor',
        expected: 'rgb(255, 253, 249)', // --panel
        description: 'Section background'
      },
      {
        selector: '.page section',
        property: 'borderRadius',
        expected: '8px',
        description: 'Section border radius'
      },
      {
        selector: '.grid',
        property: 'display',
        expected: 'grid',
        description: 'Grid display'
      },
      {
        selector: '.spirit-badge',
        property: 'borderRadius',
        expected: '4px',
        description: 'Spirit badge border radius'
      },
      {
        selector: '.spirit-badge.no',
        property: 'color',
        expected: 'rgb(220, 38, 38)', // #dc2626
        description: 'Spirit badge no color'
      },
      {
        selector: '.link-button',
        property: 'backgroundColor',
        expected: 'rgb(142, 67, 29)', // --accent
        description: 'Link button background'
      }
    ]
  },
  distillery_mobile: {
    url: 'http://localhost:PORT/distilleries/bradys.html',
    file: 'distilleries/bradys.html',
    stylesheet: 'distillery-styles.css',
    viewport: { width: 375, height: 812 },
    name: 'Distillery Profile Page (Mobile)',
    checks: [
      {
        selector: '.bouts-table .bout-row',
        property: 'flexWrap',
        expected: 'wrap',
        description: 'Mobile bout row flex-wrap allows wrapping'
      },
      {
        selector: '.page h2',
        property: 'fontSize',
        expected: '18px',
        description: 'Mobile page heading size'
      }
    ]
  }
};

async function getComputedStyle(page, selector, property) {
  try {
    const value = await page.evaluate(({ selector: sel, property: prop }) => {
      const element = document.querySelector(sel);
      if (!element) return null;
      const computed = window.getComputedStyle(element);
      return computed.getPropertyValue(prop) || computed[prop] || '';
    }, { selector, property });

    return value;
  } catch (e) {
    console.error(`Error getting computed style for ${selector}.${property}:`, e.message);
    return null;
  }
}

function normalizeValue(value) {
  if (!value) return value;
  // Normalize whitespace and convert to lowercase for comparison
  return value.trim().toLowerCase();
}

function compareValues(actual, expected) {
  return normalizeValue(actual) === normalizeValue(expected);
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

      try {
        const content = await fsPromises.readFile(filePath);
        const ext = path.extname(filePath);
        const mimeTypes = {
          '.html': 'text/html',
          '.css': 'text/css',
          '.js': 'application/javascript',
          '.mjs': 'application/javascript',
          '.json': 'application/json'
        };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
        res.end(content);
      } catch (e) {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(0, 'localhost', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

async function runTests() {
  const { server, port } = await startServer();
  const browser = await chromium.launch();

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = [];

  for (const [key, testGroup] of Object.entries(TESTS)) {
    const filePath = path.join(__dirname, testGroup.file);
    const url = testGroup.url.replace('PORT', port);
    const viewport = testGroup.viewport || { width: 1024, height: 768 };

    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${testGroup.name}`);
    console.log(`File: ${testGroup.file}`);
    console.log(`URL: ${url}`);
    console.log(`${'='.repeat(60)}`);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${testGroup.file}`);
      failedTests.push({
        test: testGroup.name,
        error: `File not found: ${testGroup.file}`
      });
      continue;
    }

    try {
      await page.goto(url, { waitUntil: 'networkidle' });
    } catch (e) {
      console.error(`❌ Failed to load page: ${e.message}`);
      failedTests.push({
        test: testGroup.name,
        error: `Failed to load: ${e.message}`
      });
      continue;
    }

    for (const check of testGroup.checks) {
      totalTests++;
      const actual = await getComputedStyle(page, check.selector, check.property);

      let passed = false;
      let expectedDisplay = '';

      if (check.expectedRange) {
        // Parse the expected range values
        const [minStr, maxStr] = check.expectedRange;
        const min = parseInt(minStr);
        const max = parseInt(maxStr);
        const actualNum = parseInt(actual);

        passed = actualNum >= min && actualNum <= max;
        expectedDisplay = `${minStr} to ${maxStr}`;
      } else {
        passed = compareValues(actual, check.expected);
        expectedDisplay = check.expected;
      }

      if (passed) {
        passedTests++;
        console.log(`✅ ${check.description}`);
        console.log(`   Selector: ${check.selector}`);
        console.log(`   Property: ${check.property}`);
        console.log(`   Value: ${actual}`);
      } else {
        console.log(`❌ ${check.description}`);
        console.log(`   Selector: ${check.selector}`);
        console.log(`   Property: ${check.property}`);
        console.log(`   Expected: ${expectedDisplay}`);
        console.log(`   Actual: ${actual}`);
        failedTests.push({
          test: testGroup.name,
          check: check.description,
          selector: check.selector,
          property: check.property,
          expected: expectedDisplay,
          actual
        });
      }
    }

    await context.close();
  }

  await browser.close();
  server.close();

  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`Total checks: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests.length}`);

  if (failedTests.length > 0) {
    console.log(`\n${'='.repeat(60)}`);
    console.log('FAILURES');
    console.log(`${'='.repeat(60)}`);
    failedTests.forEach(fail => {
      console.log(`\n❌ ${fail.test}`);
      if (fail.error) {
        console.log(`   Error: ${fail.error}`);
      } else {
        console.log(`   ${fail.check}`);
        console.log(`   Selector: ${fail.selector}`);
        console.log(`   ${fail.property}: expected "${fail.expected}", got "${fail.actual}"`);
      }
    });
  }

  process.exit(failedTests.length > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
